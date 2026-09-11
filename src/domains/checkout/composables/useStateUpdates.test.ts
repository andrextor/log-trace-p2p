import { P2PParserEngine } from "@andrextor_ia11012/p2p-log-parser";
import { describe, expect, it } from "vitest";
import { toTimelineRows } from "../../../shared/ui/LogUIHelper";
// Export real de una sesión aprobada de extremo a extremo (login anonimizado).
import approved from "../components/__fixtures__/checkout-approved-session.csv?raw";
import { summarizeStateUpdates } from "./useStateUpdates";

describe("cierre de una transacción", () => {
	const { events } = new P2PParserEngine().parse(approved, "checkout");
	const rows = toTimelineRows([...events].sort((a, b) => a.ts - b.ts));
	const runs = rows.filter((r) => r.stateUpdates).map((r) => r.stateUpdates);

	it("colapsa el cierre en dos rachas: antes y después del gateway", () => {
		// created → pending antes de llamar; el resto después de la respuesta.
		expect(runs.map((r) => r?.length)).toEqual([2, 9]);
		// El intercambio con el gateway se queda entre las dos.
		const runsAt = rows.flatMap((r, i) => (r.stateUpdates ? [i] : []));
		const process = rows.findIndex((r) =>
			r.pair?.request.details.endpoint?.endsWith("/process"),
		);
		expect(process).toBeGreaterThan(runsAt[0] ?? -1);
		expect(process).toBeLessThan(runsAt[1] ?? -1);
	});

	it("resume once líneas en dos transiciones y los ids", () => {
		const before = summarizeStateUpdates(runs[0] ?? []);
		expect(before.session).toEqual(["created", "pending"]);
		expect(before.transaction).toEqual([]);

		const after = summarizeStateUpdates(runs[1] ?? []);
		expect(after.session).toEqual(["pending", "finished"]);
		expect(after.transaction).toEqual(["PENDING", "APPROVED"]);
		expect(after.transactionState).toBe("APPROVED");
		expect(after.transactionId).toBe("3035122");
		expect(after.placetopayId).toBe("1599893053");
		expect(after.gateway).toBe("diners");
		expect(after.remaining).toEqual({ before: 11000, after: 0 });
		expect(after.hasWarning).toBe(false);
	});

	it("cada línea dice solo lo que cambia", () => {
		const details = summarizeStateUpdates(runs[1] ?? []).rows.map(
			(r) => r.detail,
		);
		expect(details).toContain("tx APPROVED · P2P 1599893053");
		expect(details).toContain("session pending → finished");
		expect(details).toContain("remaining 0 · partial no");
		// Los pasos sin dato quedan en blanco, no repiten el título.
		expect(details.filter((d) => d === "").length).toBe(2);
	});
});
