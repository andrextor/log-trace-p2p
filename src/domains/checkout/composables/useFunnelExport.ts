import { toast } from "vue-sonner";
import type {
	SessionFunnelRow,
	FunnelStats,
	FunnelStep,
	StepConfig,
} from "../types";

export function useFunnelExport() {
	const TOTAL_COLUMNS = 12;

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
				"FINAL STATE",
				"ABANDON STEP",
				...stepConfig.map((s) => s.label.toUpperCase()),
				"ENTRY DURATION",
				"SHOW DURATION",
			];

			const lines = [
				"sep=;",
				formatRow(["P2P CONVERSION REPORT"]),
				formatRow(["Generated", new Date().toLocaleString()]),
				formatRow(["Total Analyzed Sessions", stats.total]),
				formatRow(["Successful Conversion", `${stats.conversionRate}%`]),
				formatRow([]),
				formatRow(["RETENTION BY STEP"]),
				...funnelSteps.map((st) =>
					formatRow([st.full, `${st.percentage}%`, `${st.count} users`]),
				),
				formatRow([]),
				formatRow(["TECHNICAL DETAIL"]),
				formatRow(headers),
			];

			data.forEach((row) => {
				let lastStepLabel = "None";
				for (const step of stepConfig) {
					if (row.steps[step.key as keyof typeof row.steps] === 1)
						lastStepLabel = step.label;
				}

				const isFinished = row.steps.process === 1;

				lines.push(
					formatRow([
						row.sessionId,
						row.sessionType,
						isFinished ? "COMPLETED" : "ABANDONED",
						isFinished ? "--" : lastStepLabel,
						...stepConfig.map((sc) =>
							row.steps[sc.key as keyof typeof row.steps] === 1 ? "OK" : "",
						),
						row.durations.timeToEntry || "",
						row.durations.timeToShow || "",
					]),
				);
			});

			const csvContent = lines.join("\n");
			const blob = new Blob(["\uFEFF" + csvContent], {
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
