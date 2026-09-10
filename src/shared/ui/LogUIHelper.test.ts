import { describe, expect, it } from "vitest";
import type { LogEvent } from "../types";
import {
	eventMatchesText,
	formatDuration,
	formatEventTime,
	isFailure,
	toTimelineRows,
	truncateMiddle,
} from "./LogUIHelper";

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

describe("truncateMiddle", () => {
	it("deja intacto lo que cabe", () => {
		expect(truncateMiddle("/api/process", 44)).toBe("/api/process");
	});

	it("conserva la cola, que es lo que identifica una ruta", () => {
		const largo =
			"/api/v4/session/3856691/39d3f5fc647b8b605df787509e67c140/process";
		const corto = truncateMiddle(largo, 24);
		expect(corto).toHaveLength(24);
		expect(corto).toContain("…");
		expect(corto.endsWith("process")).toBe(true);
	});
});

describe("formatEventTime", () => {
	it("se queda con la hora, en la zona de los logs", () => {
		expect(formatEventTime(Date.parse("2026-09-09T14:36:49.407-05:00"))).toBe(
			"14:36:49.407",
		);
	});

	it("muestra el mismo instante igual venga en Z o con desfase", () => {
		// El bug: la línea del SDK traía -05:00 y la de http.log Z, así que la
		// misma traza mostraba un salto de cinco horas entre request y response.
		const conDesfase = Date.parse("2026-08-28T13:35:45.554-05:00");
		const enZulu = Date.parse("2026-08-28T18:35:45.554Z");
		expect(conDesfase).toBe(enZulu);
		expect(formatEventTime(conDesfase)).toBe(formatEventTime(enZulu));
		expect(formatEventTime(enZulu)).toBe("13:35:45.554");
	});

	it("cae al texto original cuando el evento llegó sin fecha", () => {
		expect(formatEventTime(Number.NaN, "sin hora")).toBe("sin hora");
		expect(formatEventTime(Number.NaN)).toBe("");
	});
});

describe("formatDuration", () => {
	it("pasa a segundos a partir del millar", () => {
		expect(formatDuration(940)).toBe("940 ms");
		expect(formatDuration(1240)).toBe("1.24 s");
	});

	it("sin duracion no inventa un cero", () => {
		expect(formatDuration(undefined)).toBeNull();
	});
});
