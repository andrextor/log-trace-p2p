import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import OutcomeAlert from "./OutcomeAlert.vue";

describe("OutcomeAlert", () => {
	it("no pinta nada para un fallo HTTP a secas: la cabecera ya lo dice", () => {
		const wrapper = mount(OutcomeAlert, {
			props: {
				outcome: {
					isError: true,
					status: "FAILED",
					kind: "http",
					httpStatus: 400,
					code: "400",
					message: "HTTP 400",
				},
			},
		});
		expect(wrapper.text()).toBe("");
	});

	it("sí pinta un rechazo del proveedor, que trae un motivo", () => {
		const wrapper = mount(OutcomeAlert, {
			props: {
				outcome: {
					isError: false,
					status: "REJECTED",
					kind: "business",
					code: "BR",
					message: "No se ha encontrado información",
				},
			},
		});
		expect(wrapper.text()).toContain("Provider Rejection");
		expect(wrapper.text()).toContain("No se ha encontrado información");
		expect(wrapper.text()).toContain("BR");
	});
});
