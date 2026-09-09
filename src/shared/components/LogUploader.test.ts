import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { useLogStore } from "../../store/logStore";
import LogUploader from "./LogUploader.vue";

/**
 * El clic sobre la zona de arrastre tiene que disparar el `click()` del input
 * de fichero. Es la unica via para elegir un log con el raton, y falla en
 * silencio: `openFilePicker` sale sin avisar si algo lo bloquea.
 */
describe("LogUploader", () => {
	const mountUploader = () =>
		mount(LogUploader, {
			props: { targetType: "checkout" as const },
			global: {
				plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: false })],
			},
		});

	it("abre el explorador al pulsar la zona de arrastre", async () => {
		const wrapper = mountUploader();

		const input = wrapper.find('input[type="file"]');
		expect(input.exists()).toBe(true);

		const click = vi.spyOn(input.element as HTMLInputElement, "click");

		const dropzone = wrapper.find(".group\\/dropzone");
		expect(dropzone.exists()).toBe(true);
		await dropzone.trigger("click");

		expect(click).toHaveBeenCalledTimes(1);
	});

	it("tambien lo abre desde el boton de subir archivo", async () => {
		const wrapper = mountUploader();
		const input = wrapper.find('input[type="file"]');
		const click = vi.spyOn(input.element as HTMLInputElement, "click");

		const boton = wrapper
			.findAll("button")
			.find((b) => b.text().includes("Subir archivo"));
		expect(boton).toBeDefined();
		await boton?.trigger("click");

		expect(click).toHaveBeenCalledTimes(1);
	});
});

describe("cuando el explorador no abre", () => {
	it("un procesado en curso bloquea el clic, y lo hace en silencio", async () => {
		const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
		const wrapper = mount(LogUploader, {
			props: { targetType: "checkout" as const },
			global: { plugins: [pinia] },
		});

		const store = useLogStore();
		store.isProcessing = true;
		await wrapper.vm.$nextTick();

		const input = wrapper.find('input[type="file"]');
		const click = vi.spyOn(input.element as HTMLInputElement, "click");

		await wrapper.find(".group\\/dropzone").trigger("click");

		// `openFilePicker` sale sin avisar: es el unico modo conocido de que el
		// clic no haga nada, y no da ninguna pista al usuario.
		expect(click).not.toHaveBeenCalled();
	});
});
