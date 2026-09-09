import { describe, expect, it } from "vitest";
import { APP_TYPES, type LogEvent } from "../types";
import { buildFacets, matchesFacets, toggleFacet } from "./facets";

const ev = (partial: Record<string, unknown>) =>
	({ category: "HTTP_RES", appType: APP_TYPES.REST, ...partial }) as LogEvent;

const batch = [
	ev({
		outcome: { isError: false, status: "OK" },
		details: { provider: "CREDIBANCO", simulator: false },
	}),
	ev({
		outcome: { isError: true, status: "REJECTED", kind: "business" },
		details: { provider: "CREDIBANCO", simulator: false },
	}),
	ev({
		outcome: { isError: false, status: "OK" },
		details: { provider: "DINERS", simulator: true },
	}),
	ev({
		outcome: { isError: true, status: "FAILED", kind: "http" },
		details: { provider: "DINERS", simulator: false },
	}),
];

const facet = (facets: ReturnType<typeof buildFacets>, key: string) =>
	facets.find((f) => f.key === key);

describe("buildFacets", () => {
	it("solo ofrece facetas que permiten elegir algo", () => {
		const facets = buildFacets(batch, {});
		expect(facet(facets, "provider")?.values.map((v) => v.value)).toEqual([
			"CREDIBANCO",
			"DINERS",
		]);
		// Una sola categoria en el lote: no hay nada que elegir.
		expect(facet(facets, "category")).toBeUndefined();
	});

	it("ordena por recuento", () => {
		expect(facet(buildFacets(batch, {}), "status")?.values[0]).toMatchObject({
			value: "OK",
			count: 2,
		});
	});

	it("los recuentos se afinan con las otras facetas", () => {
		const sinFiltrar = facet(buildFacets(batch, {}), "provider");
		expect(sinFiltrar?.values).toEqual([
			{ value: "CREDIBANCO", label: "CREDIBANCO", count: 2 },
			{ value: "DINERS", label: "DINERS", count: 2 },
		]);

		// DINERS tiene dos eventos, pero solo uno es trafico real.
		const soloReal = facet(
			buildFacets(batch, { environment: ["REAL"] }),
			"provider",
		);
		expect(soloReal?.values).toEqual([
			{ value: "CREDIBANCO", label: "CREDIBANCO", count: 2 },
			{ value: "DINERS", label: "DINERS", count: 1 },
		]);
	});

	it("una faceta ignora su propia seleccion, o no habria forma de cambiarla", () => {
		const facets = buildFacets(batch, { provider: ["DINERS"] });
		expect(facet(facets, "provider")?.values).toEqual([
			{ value: "CREDIBANCO", label: "CREDIBANCO", count: 2 },
			{ value: "DINERS", label: "DINERS", count: 2 },
		]);
	});

	it("retira la faceta que se queda sin eleccion posible", () => {
		// Con el simulador aislado solo queda un proveedor: ofrecerlo no filtra.
		const facets = buildFacets(batch, { environment: ["SIMULADOR"] });
		expect(facet(facets, "provider")).toBeUndefined();
	});

	it("no anuncia valores que al pulsarlos no devuelven nada", () => {
		const selection = { status: ["REJECTED"] };
		const facets = buildFacets(batch, selection);

		for (const value of facet(facets, "provider")?.values ?? []) {
			const hits = batch.filter((e) =>
				matchesFacets(e, { ...selection, provider: [value.value] }),
			);
			expect(hits).toHaveLength(value.count);
		}
	});

	it("aisla el simulador del trafico real", () => {
		const soloReal = batch.filter((e) =>
			matchesFacets(e, { environment: ["REAL"] }),
		);
		expect(soloReal).toHaveLength(3);
	});
});

describe("matchesFacets", () => {
	it("es disyuncion dentro de la faceta y conjuncion entre facetas", () => {
		const event = batch[1];
		expect(matchesFacets(event, { status: ["OK", "REJECTED"] })).toBe(true);
		expect(
			matchesFacets(event, { status: ["REJECTED"], provider: ["DINERS"] }),
		).toBe(false);
	});

	it("un evento sin el dato queda fuera si la faceta esta activa", () => {
		expect(matchesFacets(ev({ details: {} }), { provider: ["DINERS"] })).toBe(
			false,
		);
	});

	it("sin seleccion no filtra nada", () => {
		expect(matchesFacets(batch[0], {})).toBe(true);
		expect(matchesFacets(batch[0], { provider: [] })).toBe(true);
	});
});

describe("toggleFacet", () => {
	it("anade, quita y borra la clave cuando se vacia", () => {
		let sel = toggleFacet({}, "status", "OK");
		expect(sel).toEqual({ status: ["OK"] });
		sel = toggleFacet(sel, "status", "FAILED");
		expect(sel.status).toEqual(["OK", "FAILED"]);
		sel = toggleFacet(sel, "status", "OK");
		expect(sel.status).toEqual(["FAILED"]);
		sel = toggleFacet(sel, "status", "FAILED");
		expect(sel).toEqual({});
	});
});
