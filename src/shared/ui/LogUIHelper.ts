import { matchEvent } from "@andrextor_ia11012/p2p-log-parser";
import { APP_TYPES, type CheckoutDetails, type LogEvent } from "../types";

export interface FilterIdentity {
	label: string;
	colorClass: "indigo" | "orange";
}

// `matchEvent` vive en la librería: compara el id del evento, todos sus
// identificadores de correlación y la clave del intercambio. Antes esto era una
// lista de rutas escrita a mano que había que mantener en paralelo al parser.
export const isMatch = matchEvent;

/** Explica *por qué* un evento coincide, para etiquetar el filtro activo. */
export function getFilterIdentity(
	event: LogEvent,
	targetId: string,
): FilterIdentity {
	const { correlation } = event;
	const target = String(targetId).toLowerCase();
	const is = (value?: string | number) =>
		value !== undefined && String(value).toLowerCase() === target;

	if (is(correlation.sessionId)) {
		return { label: "Session", colorClass: "indigo" };
	}
	if (is(correlation.transactionId) || is(correlation.placetopayId)) {
		return { label: "Transaction", colorClass: "indigo" };
	}
	if (is(correlation.traceId)) {
		const label =
			event.appType === APP_TYPES.REST ? "Provider trace" : "AWS Request ID";
		return { label, colorClass: "indigo" };
	}
	if (is(correlation.reference) || is(correlation.internalReference)) {
		return { label: "Reference", colorClass: "indigo" };
	}

	return { label: "ID", colorClass: "orange" };
}

export interface Exchange {
	key: string;
	request: LogEvent;
	response: LogEvent;
}

export type TimelineRow = {
	single?: LogEvent;
	pair?: Exchange;
	/** Racha de registros de entrada al checkout, ya colapsada. */
	entry?: LogEvent[];
	/** Racha de actualizaciones de estado tras procesar una transacción. */
	stateUpdates?: LogEvent[];
};

/** `GET /api/v4/session/{id}/{token}` a secas: el SPA cargando la sesión. */
const SESSION_SHOW = /^\/api\/v4\/session\/[^/]+\/[^/]+$/;

/**
 * Lo que queda en el log cuando alguien abre el checkout: la creación de la
 * sesión, el GET del SPA, el evento `checkout.session.entry`, el HTML que se
 * le sirve y la carga de la sesión desde el SPA. Son siempre los mismos y por
 * separado no cuentan nada; en una sola tarjeta se lee quién entró, cuándo y
 * desde qué lado. Un fallo nunca se colapsa: dentro de la tarjeta compacta
 * perdería el borde rojo, que es justo lo que se busca al recorrer la traza.
 */
export function isSessionEntry(event: LogEvent): boolean {
	if (isFailure(event)) return false;
	const d = event.details as CheckoutDetails | undefined;
	const endpoint = d?.endpoint ?? "";
	return (
		d?.subType === "checkout.session.created" ||
		d?.subType === "checkout.session.entry" ||
		endpoint.startsWith("/spa/session/") ||
		(d?.method === "GET" && SESSION_SHOW.test(endpoint)) ||
		d?.rawTitle === "Fetching SPA index.html"
	);
}

/**
 * El registro con el que arranca cada carga de la página: el GET del SPA o,
 * si el export no lo trae, el propio evento `entry`.
 */
function startsEntry(event: LogEvent): boolean {
	const d = event.details as CheckoutDetails | undefined;
	return (
		Boolean(d?.endpoint?.startsWith("/spa/session/")) ||
		d?.subType === "checkout.session.entry"
	);
}

/**
 * Fases con que `redirection` etiqueta el cierre de una transacción
 * (`UpdateTransactionStateAction`, `DefineSessionStateAction`,
 * `UpdateSessionStateAction`). Once líneas para decir «tx PENDING → APPROVED,
 * sesión pending → finished»; en una tarjeta se lee de un vistazo.
 */
const STATE_UPDATE_PHASES = new Set([
	"Session state update",
	"Transaction update",
	"Session definition",
]);

export function isStateUpdate(event: LogEvent): boolean {
	if (isFailure(event)) return false;
	const d = event.details as CheckoutDetails | undefined;
	const title = d?.rawTitle ?? "";
	return (
		(d?.phase !== undefined && STATE_UPDATE_PHASES.has(d.phase)) ||
		title.startsWith("Calling updateSessionStateAction") ||
		title.startsWith("Transaction updating `last_resolve_data`")
	);
}

type RunKey = "entry" | "stateUpdates";

/**
 * Junta en una fila las rachas consecutivas de eventos que cumplen `matches`,
 * mientras `together` diga que el siguiente pertenece a la misma racha.
 */
function collapseRuns(
	rows: TimelineRow[],
	key: RunKey,
	matches: (event: LogEvent) => boolean,
	together: (run: LogEvent[], event: LogEvent) => boolean,
): TimelineRow[] {
	const out: TimelineRow[] = [];
	for (const row of rows) {
		const event = row.single;
		if (!event || !matches(event)) {
			out.push(row);
			continue;
		}
		const last = out[out.length - 1]?.[key];
		if (last && together(last, event)) {
			last.push(event);
		} else {
			out.push({ [key]: [event] });
		}
	}
	return out;
}

/**
 * Una fila por entrada: los registros consecutivos de la misma sesión, hasta
 * que arranca otra carga con distinta traza. Así una recarga del navegador
 * sale como segunda entrada y no se confunde con la primera. `created` se
 * pega a la entrada que le sigue; `show` se queda con la que lo provocó.
 */
function collapseSessionEntries(rows: TimelineRow[]): TimelineRow[] {
	return collapseRuns(rows, "entry", isSessionEntry, (run, event) => {
		const sameSession =
			run[0]?.correlation.sessionId === event.correlation.sessionId;
		const newVisit =
			startsEntry(event) &&
			run.some(
				(e) =>
					startsEntry(e) && e.correlation.traceId !== event.correlation.traceId,
			);
		return sameSession && !newVisit;
	});
}

/** Una fila por petición: el cierre de una transacción va en una sola traza. */
function collapseStateUpdates(rows: TimelineRow[]): TimelineRow[] {
	return collapseRuns(
		rows,
		"stateUpdates",
		isStateUpdate,
		(run, event) => run[0]?.correlation.traceId === event.correlation.traceId,
	);
}

/**
 * `pairKey` une la ida y la vuelta del mismo intercambio. Pintarlos como dos
 * eventos sueltos obligaba a buscar la respuesta a ojo. Los que se quedan sin
 * pareja —petición sin respuesta, export recortado, dos peticiones seguidas
 * sobre la misma traza— se devuelven sueltos: emparejar de más mentiría sobre
 * la duración.
 */
export function toTimelineRows(events: LogEvent[]): TimelineRow[] {
	const rows: TimelineRow[] = [];
	const open = new Map<string, number>();

	for (const event of events) {
		const key = event.pairKey;
		if (!key) {
			rows.push({ single: event });
			continue;
		}

		const at = open.get(key);
		const waiting = at === undefined ? undefined : rows[at];
		if (at !== undefined && waiting?.single && event.pairRole === "response") {
			rows[at] = { pair: { key, request: waiting.single, response: event } };
			open.delete(key);
			continue;
		}

		rows.push({ single: event });
		if (event.pairRole !== "response") open.set(key, rows.length - 1);
	}

	return collapseStateUpdates(collapseSessionEntries(rows));
}

/**
 * Único criterio de fallo de la aplicación. `level` no basta: un rechazo del
 * proveedor llega como INFO o WARNING y el parser lo resuelve en `outcome`.
 * Contarlo con un criterio y filtrarlo con otro hacía que el botón dijera doce
 * fallos y aparecieran tres.
 */
export function isFailure(event: LogEvent): boolean {
	return Boolean(
		event.outcome?.isError ||
			event.level === "ERROR" ||
			event.level === "CRITICAL",
	);
}

/**
 * Texto sobre el que busca el filtro libre. Antes solo miraba `message` e `id`,
 * así que pegar una referencia o un BIN —que el parser ya tiene resueltos en
 * `correlation`— no encontraba nada.
 */
export function eventMatchesText(event: LogEvent, term: string): boolean {
	if (!term) return true;

	const details = event.details as Record<string, unknown>;
	const haystack: Array<unknown> = [
		event.message,
		event.id,
		details?.endpoint,
		details?.operation,
		details?.provider,
		...Object.values(event.correlation ?? {}),
	];

	return haystack.some(
		(value) =>
			value !== undefined &&
			value !== null &&
			String(value).toLowerCase().includes(term),
	);
}

/**
 * Recorta por el centro, conservando el final. Una ruta se identifica por su
 * cola (`/process`, `/otp/generate`), así que truncar por la derecha —lo que
 * hace `truncate` de CSS— se lleva justo la parte que distingue una llamada de
 * otra.
 */
export function truncateMiddle(text: string, max = 44): string {
	if (text.length <= max) return text;
	const keep = max - 1;
	const head = Math.ceil(keep / 3);
	return `${text.slice(0, head)}…${text.slice(text.length - (keep - head))}`;
}

/**
 * Zona en la que se emiten los logs de producción de Placetopay.
 *
 * Se fija aquí en vez de dejar que cada navegador use la suya: dos personas
 * mirando la misma traza tienen que leer las mismas horas, y las que aparecen
 * en el log crudo son estas.
 */
export const LOG_TZ = "America/Bogota";

/**
 * La hora del evento, sin fecha ni desfase horario.
 *
 * Se rinde desde `ts` —el epoch, siempre en UTC— y no desde el texto
 * `timestamp`: ese trae la hora local de cada archivo de log, así que una
 * marca en `Z` y otra en `-05:00` se mostraban con cinco horas de diferencia
 * dentro de la misma traza. El texto solo se usa como respaldo cuando el
 * evento llegó sin fecha reconocible.
 */
export function formatEventTime(ts: number, fallback = ""): string {
	if (!Number.isFinite(ts)) return fallback;

	const time = new Date(ts).toLocaleTimeString("en-GB", {
		timeZone: LOG_TZ,
		hour12: false,
	});
	return `${time}.${String(((ts % 1000) + 1000) % 1000).padStart(3, "0")}`;
}

/** `durationMs` en la unidad que se lee de un vistazo. */
export function formatDuration(ms: number | undefined): string | null {
	if (ms === undefined) return null;
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;
}
