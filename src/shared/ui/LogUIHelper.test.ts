import { describe, expect, it } from "vitest";
import type { LogEvent } from "../types";
import {
	eventMatchesText,
	getStatusBadge,
	isFailure,
	toTimelineRows,
} from "./LogUIHelper";

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

describe("isFailure", () => {
	it("cuenta como fallo un rechazo que llega en nivel INFO", () => {
		const event = {
			level: "INFO",
			outcome: { isError: true, status: "REJECTED" },
		} as LogEvent;
		// Es el caso que rompia el contador: el boton decia doce y salian tres.
		expect(isFailure(event)).toBe(true);
	});

	it("cuenta como fallo el nivel ERROR aunque no haya outcome", () => {
		expect(isFailure({ level: "ERROR" } as LogEvent)).toBe(true);
		expect(isFailure({ level: "CRITICAL" } as LogEvent)).toBe(true);
	});

	it("no marca un evento correcto", () => {
		const event = {
			level: "INFO",
			outcome: { isError: false, status: "OK" },
		} as LogEvent;
		expect(isFailure(event)).toBe(false);
	});
});

describe("eventMatchesText", () => {
	const event = {
		id: "evt-1",
		message: "State update (session)",
		details: { endpoint: "/api/otp/generate", provider: "CREDIBANCO" },
		correlation: { reference: "REF-9912", bin: "455512" },
	} as unknown as LogEvent;

	it("encuentra por referencia y por BIN, que viven en correlation", () => {
		expect(eventMatchesText(event, "ref-9912")).toBe(true);
		expect(eventMatchesText(event, "455512")).toBe(true);
	});

	it("encuentra por endpoint y por proveedor", () => {
		expect(eventMatchesText(event, "/otp/")).toBe(true);
		expect(eventMatchesText(event, "crediban")).toBe(true);
	});

	it("sigue encontrando por mensaje, y no inventa coincidencias", () => {
		expect(eventMatchesText(event, "state update")).toBe(true);
		expect(eventMatchesText(event, "kount")).toBe(false);
	});

	it("un termino vacio no filtra nada", () => {
		expect(eventMatchesText(event, "")).toBe(true);
	});
});
