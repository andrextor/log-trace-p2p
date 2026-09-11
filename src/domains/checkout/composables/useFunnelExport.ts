import { toast } from "vue-sonner";
import type {
	FunnelStats,
	FunnelStep,
	SessionFunnelRow,
	StepConfig,
} from "../types";

export function useFunnelExport() {
	const TOTAL_COLUMNS = 16;

	const formatRow = (cells: Array<string | number>) => {
		const row = [...cells];
		while (row.length < TOTAL_COLUMNS) row.push("");
		return row.join(";");
	};

	const exportToCSV = (
		data: SessionFunnelRow[],
		stats: FunnelStats | null,
		funnelSteps: FunnelStep[],
		stepConfig: StepConfig[],
	) => {
		try {
			if (!data.length || !stats) return;

			const headers = [
				"SESSION ID",
				"TYPE",
				"RESULT",
				"ABANDON STEP",
				...stepConfig.map((s) => s.label.toUpperCase()),
				"ENTRY DURATION",
				"SHOW DURATION",
				"PROCESS DURATION",
				"TOTAL DURATION",
			];

			const lines = [
				"sep=;",
				formatRow(["P2P CONVERSION REPORT"]),
				formatRow(["Generated", new Date().toLocaleString()]),
				formatRow(["Total Analyzed Sessions", stats.total]),
				formatRow(["Processed Sessions", stats.processed]),
				formatRow(["Approved Sessions", stats.approved]),
				formatRow([
					"Conversion (approved / total)",
					`${stats.conversionRate}%`,
				]),
				formatRow([]),
				formatRow(["RETENTION BY STEP"]),
				...funnelSteps.map((st) =>
					formatRow([st.full, `${st.percentage}%`, `${st.count} users`]),
				),
				formatRow([]),
				formatRow(["TECHNICAL DETAIL"]),
				formatRow(headers),
			];

			for (const row of data) {
				// El resultado y el paso de abandono los trae el parser; recalcularlos
				// aquí era la segunda copia de la misma regla.
				const abandonedAt =
					row.steps.process || !row.lastStep
						? "--"
						: (stepConfig.find((s) => s.key === row.lastStep)?.label ??
							row.lastStep);

				lines.push(
					formatRow([
						row.sessionId,
						row.sessionType,
						row.outcome,
						abandonedAt,
						...stepConfig.map((sc) =>
							row.steps[sc.key as keyof typeof row.steps] ? "OK" : "",
						),
						row.durations.timeToEntry || "",
						row.durations.timeToShow || "",
						row.durations.timeToProcess || "",
						row.durations.total || "",
					]),
				);
			}

			const csvContent = lines.join("\n");
			const blob = new Blob([`\uFEFF${csvContent}`], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `p2p-analysis-${new Date().getTime()}.csv`;
			link.click();
			URL.revokeObjectURL(url);

			toast.success("Report exported successfully");
		} catch (e) {
			console.error(e);
			toast.error("Error generating report");
		}
	};

	return { exportToCSV };
}
