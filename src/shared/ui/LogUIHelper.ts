import { matchEvent } from "@andrextor_ia11012/p2p-log-parser";
import { APP_TYPES, type LogEvent } from "../types";

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

export interface StatusBadge {
	text: string;
	classes: string;
}

const HTTP_BADGE = (code: number) =>
	code >= 500
		? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
		: code >= 400
			? "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400"
			: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";

const STATUS_BADGE: Record<string, string> = {
	OK: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
	FAILED: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
	REJECTED:
		"bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
	PENDING:
		"bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
};

/**
 * El badge de la cabecera de una tarjeta. La v2 dejó de inventar `statusCode`:
 * donde antes había un 200 fabricado ahora no hay nada, así que se cae a
 * `outcome.status`, que sí es información derivada del log.
 */
export function getStatusBadge(event: LogEvent): StatusBadge | null {
	const code = Number(event.details?.statusCode);
	if (code && !Number.isNaN(code)) {
		return { text: String(code), classes: HTTP_BADGE(code) };
	}

	const status = event.outcome?.status;
	if (status) return { text: status, classes: STATUS_BADGE[status] };

	return null;
}

export interface Exchange {
	key: string;
	request: LogEvent;
	response: LogEvent;
}

export type TimelineRow = { single?: LogEvent; pair?: Exchange };

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

	return rows;
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
