import type { LogEvent } from "../types";

export type FacetSelection = Record<string, string[]>;

interface FacetDef {
	key: string;
	/** El valor bruto del evento, o `undefined` si el evento no lo tiene. */
	of: (event: LogEvent) => string | undefined;
}

const GENERIC_PROVIDERS = new Set(["API_REST", "N/A"]);

const detailsOf = (event: LogEvent) =>
	(event.details ?? {}) as Record<string, unknown>;

const str = (value: unknown): string | undefined => {
	if (value === undefined || value === null || value === "") return undefined;
	return String(value);
};

/** Las dimensiones por las que se puede acotar el lote. */
export const FACET_DEFS: FacetDef[] = [
	{
		key: "status",
		of: (e) => e.outcome?.status,
	},
	{
		key: "kind",
		of: (e) => (e.outcome?.isError ? e.outcome.kind : undefined),
	},
	{
		key: "provider",
		of: (e) => {
			const raw = e.correlation?.provider ?? str(detailsOf(e).provider);
			if (!raw || GENERIC_PROVIDERS.has(raw.toUpperCase())) return undefined;
			return raw;
		},
	},
	{
		key: "operation",
		of: (e) => e.correlation?.operation ?? str(detailsOf(e).operation),
	},
	{
		key: "transport",
		of: (e) => str(detailsOf(e).transport),
	},
	{
		key: "environment",
		// El simulador es la diferencia entre un rechazo del proveedor y algo que
		// nunca salió de casa, así que merece poder aislarse.
		of: (e) => {
			const sim = detailsOf(e).simulator;
			if (sim === true) return "SIMULADOR";
			if (sim === false) return "REAL";
			return undefined;
		},
	},
	{
		key: "phase",
		of: (e) => str(detailsOf(e).phase),
	},
	{
		key: "category",
		of: (e) => e.category,
	},
];

const DEFS_BY_KEY = new Map(FACET_DEFS.map((d) => [d.key, d]));

/** Disyunción dentro de cada faceta, conjunción entre facetas. */
export function matchesFacets(
	event: LogEvent,
	selection: FacetSelection,
	skipKey?: string,
): boolean {
	for (const [key, chosen] of Object.entries(selection)) {
		if (!chosen.length || key === skipKey) continue;
		const def = DEFS_BY_KEY.get(key);
		if (!def) continue;
		const value = def.of(event);
		if (value === undefined || !chosen.includes(value)) return false;
	}
	return true;
}

/** Añade o quita un valor, devolviendo una selección nueva. */
export function toggleFacet(
	selection: FacetSelection,
	key: string,
	value: string,
): FacetSelection {
	const current = selection[key] ?? [];
	const next = current.includes(value)
		? current.filter((v) => v !== value)
		: [...current, value];

	const result = { ...selection };
	if (next.length) result[key] = next;
	else delete result[key];
	return result;
}

export function countSelected(selection: FacetSelection): number {
	return Object.values(selection).reduce((total, v) => total + v.length, 0);
}
