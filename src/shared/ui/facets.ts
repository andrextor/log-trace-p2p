import { describeOperation } from "@andrextor_ia11012/p2p-log-parser";
import type { LogEvent } from "../types";

export type FacetSelection = Record<string, string[]>;

export interface FacetValue {
	value: string;
	label: string;
	count: number;
}

export interface Facet {
	key: string;
	label: string;
	values: FacetValue[];
}

interface FacetDef {
	key: string;
	label: string;
	/** El valor bruto del evento, o `undefined` si el evento no lo tiene. */
	of: (event: LogEvent) => string | undefined;
	/** Cómo se enseña ese valor. Por defecto, tal cual. */
	label_of?: (value: string) => string;
}

const GENERIC_PROVIDERS = new Set(["API_REST", "N/A"]);

const detailsOf = (event: LogEvent) =>
	(event.details ?? {}) as Record<string, unknown>;

const str = (value: unknown): string | undefined => {
	if (value === undefined || value === null || value === "") return undefined;
	return String(value);
};

/**
 * Las facetas se construyen sobre el lote, no sobre una lista fija: una faceta
 * sin valores no llega a pintarse. Así el mismo componente sirve para Checkout
 * y para REST sin saber nada de ninguno de los dos.
 */
export const FACET_DEFS: FacetDef[] = [
	{
		key: "status",
		label: "Resultado",
		of: (e) => e.outcome?.status,
	},
	{
		key: "kind",
		label: "Tipo de fallo",
		of: (e) => (e.outcome?.isError ? e.outcome.kind : undefined),
	},
	{
		key: "provider",
		label: "Proveedor",
		of: (e) => {
			const raw = e.correlation?.provider ?? str(detailsOf(e).provider);
			if (!raw || GENERIC_PROVIDERS.has(raw.toUpperCase())) return undefined;
			return raw;
		},
	},
	{
		key: "operation",
		label: "Operación",
		of: (e) => e.correlation?.operation ?? str(detailsOf(e).operation),
		label_of: describeOperation,
	},
	{
		key: "transport",
		label: "Transporte",
		of: (e) => str(detailsOf(e).transport),
	},
	{
		key: "environment",
		label: "Entorno",
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
		label: "Fase",
		of: (e) => str(detailsOf(e).phase),
	},
	{
		key: "category",
		label: "Categoría",
		of: (e) => e.category,
		label_of: (v) => v.replace(/_/g, " ").toLowerCase(),
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

/**
 * Los recuentos de cada faceta se calculan ignorando su propia selección pero
 * respetando las demás: es lo que evita que un valor anuncie cinco resultados y
 * al pulsarlo no aparezca ninguno.
 */
export function buildFacets(
	events: LogEvent[],
	selection: FacetSelection,
): Facet[] {
	const facets: Facet[] = [];

	for (const def of FACET_DEFS) {
		const counts = new Map<string, number>();

		for (const event of events) {
			if (!matchesFacets(event, selection, def.key)) continue;
			const value = def.of(event);
			if (value === undefined) continue;
			counts.set(value, (counts.get(value) ?? 0) + 1);
		}

		// Una faceta con un solo valor no permite elegir nada: es ruido.
		const chosen = selection[def.key] ?? [];
		if (counts.size < 2 && !chosen.length) continue;

		facets.push({
			key: def.key,
			label: def.label,
			values: [...counts.entries()]
				.map(([value, count]) => ({
					value,
					label: def.label_of ? def.label_of(value) : value,
					count,
				}))
				.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
		});
	}

	return facets;
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
