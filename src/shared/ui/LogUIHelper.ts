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
