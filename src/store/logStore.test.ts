import { createTestingPinia } from "@pinia/testing";
import { setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogStore } from "./logStore";

const HEADER =
	'"Time","__log__grafana_internal__","__logstream__grafana_internal__","@message"';

/**
 * Dos peticiones con la misma marca de tiempo y la misma traza, cuyos mensajes
 * coinciden en los primeros 60 caracteres y solo se separan al final.
 * `validateMerchant` no tiene mensaje propio en el mapper, asi que el texto
 * original —donde esta la diferencia— sobrevive al parseo.
 */
const UNO =
	'2026-09-09 14:36:27,583550948756:/aws/lambda/x,2026/09/09/[867]a,"{""message"": ""Request trace POST /api/v4/session/3856691/aaaaaaaaaaaaaaaaaaaaaa/wallet/one"", ""context"": {""TENANT_DOMAIN"": ""checkout-test.placetopay.com"", ""session_id"": 1, ""action_method"": ""validateMerchant"", ""body"": [], ""aws_request_id"": ""t-1""}, ""level"": 200, ""level_name"": ""INFO"", ""channel"": ""test"", ""datetime"": ""2026-09-09T14:36:27.000000-05:00""}"';
const DOS =
	'2026-09-09 14:36:27,583550948756:/aws/lambda/x,2026/09/09/[867]a,"{""message"": ""Request trace POST /api/v4/session/3856691/aaaaaaaaaaaaaaaaaaaaaa/wallet/two"", ""context"": {""TENANT_DOMAIN"": ""checkout-test.placetopay.com"", ""session_id"": 1, ""action_method"": ""validateMerchant"", ""body"": [], ""aws_request_id"": ""t-1""}, ""level"": 200, ""level_name"": ""INFO"", ""channel"": ""test"", ""datetime"": ""2026-09-09T14:36:27.000000-05:00""}"';

const csv = (...rows: string[]) => [HEADER, ...rows].join("\n");

describe("deduplicacion de eventos", () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({ createSpy: vi.fn, stubActions: false }),
		);
	});

	it("descarta el mismo evento subido dos veces", async () => {
		const store = useLogStore();
		await store.processLogs(csv(UNO), "checkout");
		await store.processLogs(csv(UNO), "checkout");

		expect(store.events).toHaveLength(1);
	});

	it("conserva dos eventos que solo se diferencian pasados 60 caracteres", async () => {
		const store = useLogStore();
		// La huella anterior recortaba el mensaje a 60 caracteres, los daba por
		// iguales y perdia el segundo.
		await store.processLogs(csv(UNO, DOS), "checkout");

		expect(store.events).toHaveLength(2);
		expect(new Set(store.events.map((e) => e.id)).size).toBe(2);
	});

	it("al vaciar una aplicacion sus eventos se pueden volver a cargar", async () => {
		const store = useLogStore();
		await store.processLogs(csv(UNO), "checkout");
		expect(store.events).toHaveLength(1);

		store.clearLogsByApp("checkout");
		expect(store.events).toHaveLength(0);

		// Al vaciar hay que soltar tambien su huella, o el evento no volveria a entrar.
		await store.processLogs(csv(UNO), "checkout");
		expect(store.events).toHaveLength(1);
	});
});
