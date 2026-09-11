import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { RestDetails } from "../types";
import RestBody from "./RestBody.vue";

/**
 * `action` es opcional en la librería de parseo. Una línea sin ella tumbaba el
 * render de la tarjeta —y con él la subida entera— al llamar a `.replace`.
 */
describe("RestBody", () => {
	const render = (details: Partial<RestDetails>) =>
		mount(RestBody, {
			props: {
				details: { provider: "N/A", ...details } as RestDetails,
				isHighlighted: false,
			},
		});

	it("dibuja la tarjeta aunque el evento no traiga accion", () => {
		expect(render({ action: null, payload: { id: "abc" } }).text()).toContain(
			"abc",
		);
	});

	it("enseña la accion cuando la hay", () => {
		expect(render({ action: "create-payment" }).text()).toContain(
			"create payment",
		);
	});
});
