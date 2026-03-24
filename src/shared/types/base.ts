export const APP_TYPES = {
	CHECKOUT: "checkout",
	MICROSITIOS: "micrositios",
	REST: "rest",
} as const;

export type AnalyzerType = (typeof APP_TYPES)[keyof typeof APP_TYPES];

export const ANALYZER_NAMES: Record<AnalyzerType, string> = {
	[APP_TYPES.CHECKOUT]: "Checkout",
	[APP_TYPES.MICROSITIOS]: "Micrositios",
	[APP_TYPES.REST]: "API REST Core",
};

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type LogCategory =
	| "HTTP_REQ_OUT"
	| "HTTP_REQ_IN"
	| "HTTP_RES"
	| "DB_OP"
	| "NOTIFICATION"
	| "RETURN_NOTIFICATION"
	| "BROWSER_LOAD"
	| "USER_ACTION"
	| "BACKEND_LOG"
	| "APPLICATION_LOG"
	| "ERROR"
	| "PAYMENT"
	| "GENERIC";

export interface BaseDetails {
	method?: string | null;
	endpoint?: string | null;
	statusCode?: number | string | null;
	payload?: unknown;
	source?: string | null;
}

export interface LogEvent {
	id: string;
	timestamp: string;
	level: LogLevel;
	message: string;
	category: LogCategory;
	appType: AnalyzerType;
	details: BaseDetails;
	context: unknown;
	rawStream?: string;
}

export interface NormalizedLogData {
	timestamp: string;
	level: string;
	message: string;
	context: Record<string, unknown>;
	sourceType?: "AWS_CSV" | "LARAVEL_LOCAL" | "NEW_RELIC_JSON" | "UNKNOWN";
}
