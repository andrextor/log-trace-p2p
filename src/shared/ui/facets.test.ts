import { describe, expect, it } from "vitest";
import { APP_TYPES, type LogEvent } from "../types";
import { matchesFacets, toggleFacet } from "./facets";

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

describe("matchesFacets", () => {
	it("aisla el simulador del trafico real", () => {
		const soloReal = batch.filter((e) =>
			matchesFacets(e, { environment: ["REAL"] }),
		);
		expect(soloReal).toHaveLength(3);
	});

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
