import type { LogEvent } from "../types";
import { getStatusBadge } from "./LogUIHelper";

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
