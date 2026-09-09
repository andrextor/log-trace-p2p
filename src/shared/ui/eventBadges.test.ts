import { describe, expect, it } from "vitest";
import { APP_TYPES, type LogEvent } from "../types";
import { BADGE_BUDGET, getEventBadges } from "./eventBadges";

const ev = (partial: Record<string, unknown>) =>
	({ category: "GENERIC", appType: APP_TYPES.REST, ...partial }) as LogEvent;

const textOf = (e: LogEvent) => getEventBadges(e).map((b) => b.text);

describe("getEventBadges", () => {
	it("prefiere el statusCode real y cae a outcome.status cuando no lo hay", () => {
		expect(
			getEventBadges(ev({ details: { statusCode: 502 } }))[0],
		).toMatchObject({ text: "502", tone: "danger" });

		expect(
			getEventBadges(
				ev({ details: {}, outcome: { isError: false, status: "OK" } }),
			)[0],
		).toMatchObject({ text: "OK", tone: "ok" });
	});

	it("resume direccion y metodo en un solo badge", () => {
		expect(
			textOf(ev({ category: "HTTP_REQ_OUT", details: { method: "post" } })),
		).toContain("→ POST");
		expect(textOf(ev({ category: "HTTP_RES", details: {} }))).toContain(
			"← RES",
		);
	});

	it("el transporte manda sobre el metodo: SOAP dice mas que POST", () => {
		const badges = textOf(
			ev({
				category: "HTTP_REQ_OUT",
				details: { transport: "soap", method: "POST" },
			}),
		);
		expect(badges).toContain("SOAP");
		expect(badges).not.toContain("→ POST");
	});

	it("omite el proveedor generico y resuelve el canal cuando falta", () => {
		expect(textOf(ev({ details: { provider: "API_REST" } }))).not.toContain(
			"API_REST",
		);
		expect(textOf(ev({ details: { provider: "CREDIBANCO" } }))).toContain(
			"CREDIBANCO",
		);
	});

	it("el simulador gana a la fase: cambia como se lee un fallo", () => {
		const badges = getEventBadges(
			ev({
				appType: APP_TYPES.CHECKOUT,
				details: { simulator: true, phase: "PAYMENT" },
			}),
		);
		const sim = badges.find((b) => b.text === "SIM");
		expect(sim?.tone).toBe("alert");
		expect(badges.map((b) => b.text)).not.toContain("PAYMENT");
	});

	it("nunca pasa del presupuesto", () => {
		const badges = getEventBadges(
			ev({
				category: "HTTP_REQ_OUT",
				details: {
					statusCode: 200,
					method: "POST",
					provider: "CREDIBANCO",
					simulator: true,
					operation: "sale",
				},
			}),
		);
		expect(badges.length).toBeLessThanOrEqual(BADGE_BUDGET);
	});

	it("un evento sin nada no inventa badges", () => {
		expect(getEventBadges(ev({ details: {} }))).toEqual([]);
	});
});
