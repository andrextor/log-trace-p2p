import type { FacetSelection } from "../ui/facets";
import type { AnalyzerType, LogEvent } from "./base";

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
	outcome: OutcomeFilter;
	facets: FacetSelection;
}

export interface CategoryStyle {
	label: string;
	classes: string;
}

export interface HighlightTheme {
	ring: string;
	bg: string;
}

/**
 * El filtro de resultado sustituye al de nivel: `level` no describe el
 * resultado de la operación, solo la severidad con que el emisor la registró.
 */
export type OutcomeFilter = "ALL" | "ERRORS";
