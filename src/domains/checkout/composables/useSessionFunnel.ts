import { APP_TYPES } from "../../../shared/types";
import type { LogEvent } from "../../../shared/types";
import type { CheckoutDetails, SessionFunnelRow } from "../types";

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

	const generateReport = (events: LogEvent[]): SessionFunnelRow[] => {
		const sessionMap = new Map<string, SessionFunnelRow>();
		const sortedEvents = [...events].sort(
			(a, b) =>
				new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
		);

		for (const ev of sortedEvents) {
			if (ev.appType !== APP_TYPES.CHECKOUT) continue;

			const details = ev.details as CheckoutDetails;
			const sessionId = details?.sessionId;
			if (!sessionId) continue;

			const sid = String(sessionId);
			if (!sessionMap.has(sid)) {
				sessionMap.set(sid, {
					sessionId: sid,
					sessionType: "UNKNOWN",
					steps: {
						created: 0,
						entry: 0,
						show: 0,
						information: 0,
						interest: 0,
						generateOtp: 0,
						threeDS: 0,
						process: 0,
					},
					_rawTimestamps: { created: null, entry: null, show: null },
					durations: { timeToEntry: null, timeToShow: null },
				});
			}

			const row = sessionMap.get(sid);
			if (!row) continue;
			const time = new Date(ev.timestamp).getTime();
			const endpoint = details.endpoint || "";
			const ctx = ev.context as Record<string, unknown>;
			const action = String(ctx?.action_method || "");
			const subType = details.subType || "";
			const msg = ev.message || "";

			if (
				subType === "checkout.session.created" ||
				action === "createSession"
			) {
				row.steps.created = 1;
				if (!row._rawTimestamps.created) row._rawTimestamps.created = time;
			}
			if (action === "entry" || subType === "checkout.session.entry") {
				row.steps.entry = 1;
				if (!row._rawTimestamps.entry) row._rawTimestamps.entry = time;
			}
			if (action === "show") {
				row.steps.show = 1;
				if (!row._rawTimestamps.show) row._rawTimestamps.show = time;
			}
			if (endpoint.includes("/information")) row.steps.information = 1;
			if (endpoint.includes("/interest")) row.steps.interest = 1;
			if (
				endpoint.includes("/otp/generate") ||
				endpoint.includes("/otp/validate") ||
				endpoint.includes("/wallet/otp") ||
				action === "checkOtp" ||
				action === "walletOtpGenerate" ||
				action === "walletOtpValidate"
			)
				row.steps.generateOtp = 1;
			if (endpoint.includes("/mpi/lookup") || msg.includes("3DS"))
				row.steps.threeDS = 1;
			if (
				action === "process" ||
				endpoint.includes("/process") ||
				endpoint.includes("/collect")
			)
				row.steps.process = 1;
		}

		return Array.from(sessionMap.values()).map((row) => {
			if (row.steps.entry || row.steps.show) {
				row.sessionType = "PAYMENT";
			} else if (row.steps.process && !row.steps.entry && !row.steps.show) {
				row.sessionType = "COLLECT";
			}

			if (row._rawTimestamps.created) {
				if (row._rawTimestamps.entry) {
					row.durations.timeToEntry = formatDuration(
						row._rawTimestamps.entry - row._rawTimestamps.created,
					);
				}
				if (row._rawTimestamps.show) {
					row.durations.timeToShow = formatDuration(
						row._rawTimestamps.show - row._rawTimestamps.created,
					);
				}
			}

			return row;
		});
	};

	return { generateReport, formatDuration };
}
