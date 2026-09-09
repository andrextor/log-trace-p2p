import { describe, expect, it } from "vitest";
import type { LogEvent } from "../types";
import { getStatusBadge, toTimelineRows } from "./LogUIHelper";

const event = (partial: Partial<LogEvent>) => partial as LogEvent;

describe("getStatusBadge", () => {
	it("prefiere el statusCode real cuando el log lo trae", () => {
		const badge = getStatusBadge(
			event({
				details: { statusCode: 502 },
				outcome: { isError: true, status: "FAILED" },
			}),
		);
		expect(badge?.text).toBe("502");
		expect(badge?.classes).toContain("rose");
	});

	it("cae a outcome.status ahora que la v2 ya no inventa el código", () => {
		const badge = getStatusBadge(
			event({ details: {}, outcome: { isError: false, status: "OK" } }),
		);
		expect(badge?.text).toBe("OK");
		expect(badge?.classes).toContain("emerald");
	});

	it("no pinta badge cuando no hay ni código ni resultado", () => {
		expect(getStatusBadge(event({ details: {} }))).toBeNull();
	});
});

describe("toTimelineRows", () => {
	const ev = (
		id: string,
		pairKey?: string,
		pairRole?: "request" | "response",
	) => ({ id, pairKey, pairRole }) as LogEvent;

	it("une la peticion con su respuesta", () => {
		const rows = toTimelineRows([
			ev("req", "k1", "request"),
			ev("res", "k1", "response"),
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0].pair?.request.id).toBe("req");
		expect(rows[0].pair?.response.id).toBe("res");
	});

	it("deja suelta una peticion sin respuesta", () => {
		const rows = toTimelineRows([ev("req", "k1", "request")]);
		expect(rows).toEqual([{ single: rows[0].single }]);
		expect(rows[0].single?.id).toBe("req");
	});

	it("no empareja dos peticiones seguidas sobre la misma traza", () => {
		const rows = toTimelineRows([
			ev("req1", "k1", "request"),
			ev("req2", "k1", "request"),
		]);
		expect(rows).toHaveLength(2);
		expect(rows.every((r) => r.single)).toBe(true);
	});

	it("una respuesta huerfana no arrastra al evento anterior", () => {
		const rows = toTimelineRows([ev("otro"), ev("res", "k1", "response")]);
		expect(rows).toHaveLength(2);
		expect(rows.every((r) => r.single)).toBe(true);
	});

	it("los eventos sin pairKey pasan tal cual", () => {
		const rows = toTimelineRows([ev("a"), ev("b")]);
		expect(rows.map((r) => r.single?.id)).toEqual(["a", "b"]);
	});
});
