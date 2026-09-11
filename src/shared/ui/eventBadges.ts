import {
	CHANNEL_PROVIDERS,
	describeOperation,
} from "@andrextor_ia11012/p2p-log-parser";
import { APP_TYPES, type LogEvent } from "../types";

export type BadgeTone = "danger" | "warn" | "ok" | "neutral" | "alert";

export interface Badge {
	slot: "outcome" | "transport" | "service" | "source" | "flow";
	text: string;
	/** Nombre largo, para el tooltip. Un badge corto no puede mentir. */
	title: string;
	tone: BadgeTone;
	mono?: boolean;
}

/**
 * Presupuesto de la tarjeta plegada. Un badge más no informa: satura, y hace
 * que se dejen de leer todos.
 */
export const BADGE_BUDGET = 4;

const GENERIC_PROVIDERS = new Set(["API_REST", "N/A", ""]);

// Pendiente en naranja, rechazado y fallido en rojo. El rechazo no es un
// error —no entra en el contador ni en el filtro—, pero se ve igual de lejos.
const STATUS_TONE: Record<string, BadgeTone> = {
	OK: "ok",
	FAILED: "danger",
	REJECTED: "danger",
	PENDING: "warn",
};

const KIND_LABEL: Record<string, string> = {
	exception: "excepción de transporte",
	business: "rechazo del proveedor",
	http: "fallo HTTP",
	validation: "petición inválida",
};

const TRANSPORT_LABEL: Record<string, string> = {
	soap: "SOAP",
	iso8583: "ISO8583",
	internal: "INTERNAL",
};

/** Categorías que no son un intercambio HTTP y describen otra cosa. */
const NON_HTTP_LABEL: Record<string, string> = {
	DB_OP: "DB",
	USER_ACTION: "USER",
	BROWSER_LOAD: "LOAD",
	NOTIFICATION: "NOTIFY",
	RETURN_NOTIFICATION: "RETURN",
};

/** Ranura 1 — el resultado. La única que lleva color por sí misma. */
function outcomeBadge(event: LogEvent): Badge | null {
	const { outcome } = event;
	const kind = outcome?.kind ? KIND_LABEL[outcome.kind] : null;
	const title = [kind, outcome?.message].filter(Boolean).join(": ");

	// Un resultado que no es OK manda sobre el código HTTP: un rechazo del
	// gateway viaja en un 200, y el «200» en verde escondía justo el rechazo.
	const status = outcome?.status;
	if (status && status !== "OK") {
		return {
			slot: "outcome",
			text: status,
			title: title || `Resultado: ${status}`,
			tone: STATUS_TONE[status] ?? "neutral",
		};
	}

	const code = Number(event.details?.statusCode);
	if (code && !Number.isNaN(code)) {
		return {
			slot: "outcome",
			text: String(code),
			title: title || `HTTP ${code}`,
			tone: code >= 500 ? "danger" : code >= 400 ? "warn" : "ok",
			mono: true,
		};
	}

	// La v2 dejó de inventar el código: donde no lo hay, `outcome.status` es el
	// dato real. Antes el badge simplemente desaparecía.
	if (!status) return null;
	return {
		slot: "outcome",
		text: status,
		title: title || `Resultado: ${status}`,
		tone: STATUS_TONE[status] ?? "neutral",
	};
}

/**
 * Ranura 2 — transporte y dirección, en un solo badge donde antes había tres
 * chips (categoría, método y nada sobre el transporte).
 */
function transportBadge(event: LogEvent): Badge | null {
	const details = event.details as { transport?: string; method?: string };

	// Saber que fue SOAP dice más que saber que fue POST.
	const transport = details?.transport;
	if (transport && transport !== "http") {
		const text = TRANSPORT_LABEL[transport] ?? transport.toUpperCase();
		return {
			slot: "transport",
			text,
			title: `Transporte: ${text}`,
			tone: "neutral",
		};
	}

	const method = details?.method ? String(details.method).toUpperCase() : null;
	const category = event.category;

	if (category === "HTTP_REQ_OUT") {
		return {
			slot: "transport",
			text: `→ ${method ?? "HTTP"}`,
			title: "Petición saliente",
			tone: "neutral",
			mono: true,
		};
	}
	if (category === "HTTP_REQ_IN") {
		return {
			slot: "transport",
			text: `← ${method ?? "HTTP"}`,
			title: "Petición entrante",
			tone: "neutral",
			mono: true,
		};
	}
	if (category === "HTTP_RES") {
		return {
			slot: "transport",
			text: "← RES",
			title: "Respuesta",
			tone: "neutral",
			mono: true,
		};
	}

	const label = NON_HTTP_LABEL[category];
	if (!label) return null;
	return {
		slot: "transport",
		text: label,
		title: category.replace(/_/g, " ").toLowerCase(),
		tone: "neutral",
	};
}

/** Ranura 3 — contra quién. El canal resuelve al proveedor cuando falta. */
function serviceBadge(event: LogEvent): Badge | null {
	const details = event.details as { provider?: string; channel?: string };

	const direct = details?.provider ?? event.correlation?.provider;
	if (direct && !GENERIC_PROVIDERS.has(String(direct).toUpperCase())) {
		return {
			slot: "service",
			text: String(direct),
			title: `Proveedor: ${direct}`,
			tone: "neutral",
		};
	}

	const channel = details?.channel;
	if (!channel) return null;
	const resolved = CHANNEL_PROVIDERS[channel];
	return {
		slot: "service",
		text: resolved ?? channel,
		title: resolved
			? `Proveedor ${resolved}, deducido del canal «${channel}»`
			: `Canal Monolog: ${channel}`,
		tone: "neutral",
	};
}

/**
 * De dónde salió el registro: `BACKEND` o `FRONTEND`. La tarjeta suelta ya lo
 * pintaba por su cuenta; el intercambio lo había perdido al unificar las dos
 * mitades en una sola cabecera.
 */
function sourceBadge(event: LogEvent): Badge | null {
	const source = (event.details as { source?: string })?.source;
	if (!source) return null;
	const text = String(source).toUpperCase();
	return { slot: "source", text, title: `Origen: ${text}`, tone: "neutral" };
}

/**
 * Ranura 4a — el simulador. Es la diferencia entre «el proveedor rechazó» y
 * «esto nunca salió de casa», así que gana a la fase del flujo y lleva color
 * propio pese a no ser un resultado.
 */
function simulatorBadge(event: LogEvent): Badge | null {
	const details = event.details as { simulator?: boolean };
	if (details?.simulator !== true) return null;
	return {
		slot: "flow",
		text: "SIM",
		title: "Corrió contra el simulador, no contra el proveedor real",
		tone: "alert",
	};
}

/** Ranura 4b — dónde estamos en el flujo. */
function flowBadge(event: LogEvent): Badge | null {
	const details = event.details as {
		phase?: string;
		step?: string;
		operation?: string;
		tag?: string;
	};

	if (event.appType === APP_TYPES.CHECKOUT) {
		if (!details?.phase) return null;
		return {
			slot: "flow",
			text: details.phase,
			title: details.step
				? `Fase ${details.phase}, paso ${details.step}`
				: `Fase ${details.phase}`,
			tone: "neutral",
		};
	}

	if (details?.operation) {
		return {
			slot: "flow",
			text: describeOperation(details.operation),
			title: `Operación: ${details.operation}`,
			tone: "neutral",
		};
	}
	if (details?.tag) {
		return {
			slot: "flow",
			text: details.tag,
			title: details.tag,
			tone: "neutral",
		};
	}
	return null;
}

/**
 * Los badges de la tarjeta plegada, en orden fijo y ya recortados. El orden no
 * depende de qué haya presente: las tres primeras ranuras siempre significan lo
 * mismo, así el ojo aprende dónde mirar en vez de releer cada tarjeta.
 */
export function getEventBadges(
	event: LogEvent,
	only?: Badge["slot"][],
): Badge[] {
	const badges = [
		outcomeBadge(event),
		transportBadge(event),
		serviceBadge(event),
		sourceBadge(event),
		simulatorBadge(event) ?? flowBadge(event),
	].filter((b): b is Badge => b !== null);

	// Un intercambio reparte las ranuras entre su cabecera y cada mitad, para no
	// repetir el proveedor y la operación una vez por lado. El presupuesto se
	// aplica después de filtrar: sin `only`, `source` compite por sitio como
	// cualquier otra y el corte deja fuera lo menos decisivo.
	const wanted = only ? badges.filter((b) => only.includes(b.slot)) : badges;
	return wanted.slice(0, BADGE_BUDGET);
}
