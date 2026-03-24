import type { AnalyzerType, LogEvent, LogLevel } from "./base";

export type ViewMode = AnalyzerType | "ALL";

export interface TimeGroup {
	label: string;
	timeDisplay: string;
	timeKey: string;
	events: LogEvent[];
}

export interface StoreStats {
	total: number;
	globalTotal: number;
	errors: number;
}

export interface ActiveFilterInfo {
	label: string;
	color: "indigo" | "orange";
	value: string;
}

export interface FilterTheme {
	label: string;
	color: "indigo" | "orange";
	value: string;
}

export interface FiltersCacheEntry {
	search: string;
	highlighted: string | number | null;
	level: string;
}

export interface CategoryStyle {
	label: string;
	classes: string;
}

export interface HighlightTheme {
	ring: string;
	bg: string;
}

export type LevelFilter = LogLevel | "ALL";
