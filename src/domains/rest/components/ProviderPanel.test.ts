import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { useLogStore } from "../../../store/logStore";
import ProviderPanel from "./ProviderPanel.vue";

const META = {
	totalEvents: 4,
	totalRequests: 4,
	requestsByProvider: { CREDIBANCO: 3, DINERS: 1 },
	totalOperations: 1,
	operations: ["sale"],
	providers: ["CREDIBANCO", "DINERS"],
	errors: [],
	slowest: [],
};

/**
 * El panel no estrena mecanismo de filtrado: acciona la faceta de proveedor que
 * ya existe. Si algun dia dejara de hacerlo, habria dos formas de filtrar lo
 * mismo y acabarian discrepando.
 */
describe("ProviderPanel", () => {
	const mountPanel = () => {
		const wrapper = mount(ProviderPanel, {
			global: {
				plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: false })],
			},
		});
		const store = useLogStore();
		store.activeTab = "rest";
		store.metadata = META as never;
		return { wrapper, store };
	};

	it("pulsar un proveedor enciende su faceta", async () => {
		const { wrapper, store } = mountPanel();
		await wrapper.vm.$nextTick();

		await wrapper.find("button").trigger("click"); // despliega el panel
		const fila = wrapper
			.findAll("button")
			.find((b) => b.text().includes("CREDIBANCO"));
		expect(fila).toBeDefined();

		await fila?.trigger("click");
		expect(store.facetFilters.provider).toEqual(["CREDIBANCO"]);
	});

	it("volver a pulsarlo lo apaga", async () => {
		const { wrapper, store } = mountPanel();
		await wrapper.vm.$nextTick();
		await wrapper.find("button").trigger("click");

		const fila = () =>
			wrapper.findAll("button").find((b) => b.text().includes("CREDIBANCO"));
		await fila()?.trigger("click");
		await fila()?.trigger("click");

		expect(store.facetFilters.provider).toBeUndefined();
	});

	it("no se pinta fuera de REST", async () => {
		const { wrapper, store } = mountPanel();
		store.activeTab = "checkout";
		await wrapper.vm.$nextTick();
		expect(wrapper.text()).toBe("");
	});
});
