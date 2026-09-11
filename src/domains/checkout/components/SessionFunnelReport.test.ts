import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import { setActivePinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import { useLogStore } from "../../../store/logStore";
import SessionFunnelReport from "./SessionFunnelReport.vue";
// Export real de una sesión aprobada de extremo a extremo (el mismo fixture
// que la librería). El embudo tiene que decir «aprobada», no solo «procesó».
import approved from "./__fixtures__/checkout-approved-session.csv?raw";

describe("SessionFunnelReport", () => {
	it("pinta el resultado de la sesión y la conversión sobre aprobadas", async () => {
		setActivePinia(
			createTestingPinia({ createSpy: vi.fn, stubActions: false }),
		);
		const store = useLogStore();
		await store.processLogs(approved, "checkout");

		const text = mount(SessionFunnelReport).text();
		expect(text).toContain("APPROVED");
		expect(text).toContain("100.0%");
		expect(text).not.toContain("ABANDONED");
	});
});
