import { APP_TYPES, type LogEvent } from "../types";

export interface FilterIdentity {
	label: string;
	colorClass: "indigo" | "orange";
}

export function isMatch(event: LogEvent, targetId: string): boolean {
	const tId = String(targetId).toLowerCase();
	const ctx = (event.context || {}) as Record<string, unknown>;
	const details = event.details as Record<string, unknown>;

	if (event.appType === APP_TYPES.CHECKOUT) {
		return (
			String(event.id).toLowerCase() === tId ||
			String(details?.sessionId).toLowerCase() === tId ||
			String(details?.transactionId).toLowerCase() === tId ||
			String(details?.awsRequestId).toLowerCase() === tId ||
			String(details?.aws_request_id).toLowerCase() === tId ||
			String(ctx?.aws_request_id).toLowerCase() === tId ||
			String(
				(ctx?.payload as Record<string, unknown>)?.session_id,
			).toLowerCase() === tId
		);
	}

	if (event.appType === APP_TYPES.REST) {
		return (
			String(event.id).toLowerCase() === tId ||
			String(details?.awsRequestId).toLowerCase() === tId ||
			String(ctx?.awsRequestId).toLowerCase() === tId ||
			String(
				(details?.payload as Record<string, unknown>)?.id,
			).toLowerCase() === tId ||
			String((ctx?.payload as Record<string, unknown>)?.id).toLowerCase() ===
				tId ||
			String(ctx?.id).toLowerCase() === tId
		);
	}

	return String(event.id).toLowerCase() === tId;
}

export function getFilterIdentity(
	event: LogEvent,
	targetId: string,
): FilterIdentity {
	const details = event.details as Record<string, unknown>;
	const ctx = (event.context || {}) as Record<string, unknown>;

	if (event.appType === APP_TYPES.CHECKOUT) {
		if (details?.sessionId && String(details.sessionId) === targetId) {
			return { label: "Session", colorClass: "indigo" };
		}
		return { label: "Trace / ID", colorClass: "orange" };
	}

	if (event.appType === APP_TYPES.REST) {
		if (details?.awsRequestId && String(details.awsRequestId) === targetId) {
			return { label: "AWS Request ID", colorClass: "indigo" };
		}
		if (
			((details?.payload as Record<string, unknown>)?.id &&
				String((details.payload as Record<string, unknown>).id) === targetId) ||
			(ctx?.id && String(ctx.id) === targetId)
		) {
			return { label: "Interdin ID", colorClass: "indigo" };
		}
		return { label: "Hash", colorClass: "orange" };
	}

	return { label: "ID", colorClass: "orange" };
}
