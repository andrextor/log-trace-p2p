import type { CheckoutSessionMetadata } from "../../../shared/types";
import type { SessionFunnelRow } from "../types";

export function useSessionFunnel() {
	const formatDuration = (ms: number): string => {
		if (ms < 0) return "";
		const h = Math.floor(ms / 3600000);
		const m = Math.floor((ms % 3600000) / 60000);
		const s = Math.floor((ms % 60000) / 1000);
		const cs = Math.floor((ms % 1000) / 10);

		const pad = (n: number) => n.toString().padStart(2, "0");
		return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
	};

	/**
	 * El embudo ya no se deduce aquí: `CheckoutMetadataExtractor` marca los ocho
	 * hitos y mide los tiempos sobre el lote completo. Esto solo lo recorta a las
	 * sesiones visibles y formatea las duraciones.
	 */
	const generateReport = (
		sessions: CheckoutSessionMetadata[],
		visibleSessionIds?: Set<string>,
	): SessionFunnelRow[] =>
		sessions
			.filter((s) => !visibleSessionIds || visibleSessionIds.has(s.sessionId))
			.map((s) => ({
				sessionId: s.sessionId,
				sessionType: s.sessionType,
				finalState: s.finalState,
				steps: s.steps,
				durations: {
					// Un hito que no ocurrió no tiene duración. Antes se pintaba un 0
					// que no distinguía «instantáneo» de «no pasó».
					timeToEntry:
						s.durations.timeToEntry === undefined
							? null
							: formatDuration(s.durations.timeToEntry),
					timeToShow:
						s.durations.timeToShow === undefined
							? null
							: formatDuration(s.durations.timeToShow),
				},
			}));

	return { generateReport, formatDuration };
}
