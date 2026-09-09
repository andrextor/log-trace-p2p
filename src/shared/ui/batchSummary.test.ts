import { describe, expect, it } from "vitest";
import { APP_TYPES, type LogEvent } from "../types";
import { formatSpan, summarizeEvents } from "./batchSummary";

const ev = (partial: Record<string, unknown>) =>
	({
		level: "INFO",
		category: "HTTP_RES",
		appType: APP_TYPES.REST,
		...partial,
	}) as LogEvent;

describe("summarizeEvents", () => {
	const lote = [
		ev({ ts: 1000, category: "HTTP_REQ_OUT" }),
		ev({ ts: 9000, category: "HTTP_RES", outcome: { isError: true } }),
		ev({ ts: 5000, category: "HTTP_RES", level: "WARNING" }),
	];

	it("mide la ventana con el primero y el ultimo, no con el orden de llegada", () => {
		const s = summarizeEvents(lote);
		expect(s.from).toBe(1000);
		expect(s.to).toBe(9000);
		expect(s.spanMs).toBe(8000);
	});

	it("cuenta los fallos con el mismo criterio que el resto de la aplicacion", () => {
		// El fallo llega en nivel INFO: contarlo por `level` daria cero.
		expect(summarizeEvents(lote).failures).toBe(1);
	});

	it("un lote vacio no inventa ventana", () => {
		const s = summarizeEvents([]);
		expect(s.total).toBe(0);
		expect(s.from).toBeUndefined();
		expect(s.spanMs).toBeUndefined();
	});

	it("ignora los eventos sin `ts` utilizable para la ventana", () => {
		const s = summarizeEvents([ev({ ts: Number.NaN }), ev({ ts: 4000 })]);
		expect(s.total).toBe(2);
		expect(s.from).toBe(4000);
		expect(s.to).toBe(4000);
	});
});

describe("formatSpan", () => {
	it("elige la unidad por magnitud", () => {
		expect(formatSpan(940)).toBe("940 ms");
		expect(formatSpan(8000)).toBe("8s");
		expect(formatSpan(501_000)).toBe("8m 21s");
		expect(formatSpan(7_529_000)).toBe("2h 05m");
	});
});
