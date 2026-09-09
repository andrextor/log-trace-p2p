import type { LogEvent } from "../types";
import { isFailure } from "./LogUIHelper";

export interface BatchSummary {
	total: number;
	failures: number;
	/** Epoch ms del primero y del último. Ausentes si el lote está vacío. */
	from?: number;
	to?: number;
	spanMs?: number;
}

/**
 * Qué acabo de cargar. `ParseStats` trae esto mismo, pero de **una** llamada al
 * parser: el store acumula varias subidas y las reparte por aplicación, así que
 * enseñar las del último lote describiría otra cosa. Aquí se cuenta sobre los
 * eventos ya parseados —usando el `ts` que el parser resolvió, sin volver a
 * interpretar fechas—, que es la pregunta que la pantalla hace de verdad.
 */
export function summarizeEvents(events: LogEvent[]): BatchSummary {
	let failures = 0;
	let from: number | undefined;
	let to: number | undefined;

	for (const event of events) {
		if (isFailure(event)) failures++;

		const ts = event.ts;
		if (typeof ts === "number" && Number.isFinite(ts)) {
			if (from === undefined || ts < from) from = ts;
			if (to === undefined || ts > to) to = ts;
		}
	}

	return {
		total: events.length,
		failures,
		from,
		to,
		spanMs: from !== undefined && to !== undefined ? to - from : undefined,
	};
}

/**
 * La ventana temporal de un lote va de milisegundos a horas, así que la unidad
 * se elige por magnitud: «940 ms» y «2h 05m» se leen, «7529431 ms» no.
 */
export function formatSpan(ms: number): string {
	if (ms < 1000) return `${ms} ms`;

	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
	if (minutes) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
	return `${seconds}s`;
}
