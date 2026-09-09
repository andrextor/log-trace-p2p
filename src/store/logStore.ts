import { P2PParserEngine } from "@andrextor_ia11012/p2p-log-parser";
import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import { APP_TYPES } from "../shared/types";
import type { AnalyzerType, LogEvent } from "../shared/types";
import type {
	CheckoutParseMetadata,
	OutcomeFilter,
	ParseMetadata,
	StoreStats,
	TimeGroup,
	ViewMode,
} from "../shared/types";
import {
	eventMatchesText,
	isFailure,
	isMatch,
	toTimelineRows,
} from "../shared/ui/LogUIHelper";
import { type FacetSelection, matchesFacets } from "../shared/ui/facets";

export type { ViewMode } from "../shared/types";

export const useLogStore = defineStore("logs", () => {
	const events = shallowRef<LogEvent[]>([]);
	const activeTab = ref<ViewMode>(APP_TYPES.CHECKOUT);
	const search = ref("");
	const outcomeFilter = ref<OutcomeFilter>("ALL");
	const facetFilters = ref<FacetSelection>({});
	const highlightedSessionId = ref<string | number | null>(null);
	const parsingErrors = ref<string[]>([]);
	const isProcessing = ref(false);
	const progress = ref(0);
	const sessionIds = ref<string[]>([]);
	const sessionFilter = ref<string | null>(null);
	const metadata = ref<ParseMetadata | null>(null);
	// Líneas que ninguna estrategia convirtió en evento. Es la señal directa de
	// «te equivocaste de aplicación» o «este formato no está soportado»: sin
	// mostrarla, el log simplemente sale vacío y el usuario no sabe por qué.
	const unrecognized = ref(0);

	const processedHashes = new Set<string>();

	const counts = computed(() => {
		const c: Record<string, number> = { ALL: events.value.length };
		for (const t of Object.values(APP_TYPES)) {
			c[t] = 0;
		}
		for (const e of events.value) {
			if (c[e.appType] !== undefined) c[e.appType]++;
		}
		return c;
	});

	const stats = computed<StoreStats>(() => {
		const filtered = filteredEvents.value;
		return {
			total: filtered.length,
			globalTotal: events.value.length,
			errors: filtered.filter(isFailure).length,
		};
	});

	/** Los eventos de la aplicación activa, sin filtrar: «qué tengo cargado». */
	const tabEvents = computed(() =>
		activeTab.value === "ALL"
			? events.value
			: events.value.filter((e) => e.appType === activeTab.value),
	);

	/**
	 * Todo menos las facetas. Es la base sobre la que se cuentan, para que un
	 * valor no anuncie resultados que luego no aparecen.
	 */
	const facetBaseEvents = computed(() => {
		const allEvents = events.value;
		if (allEvents.length === 0) return [];

		const searchTerm = search.value.toLowerCase().trim();
		const onlyFailures = outcomeFilter.value === "ERRORS";
		const currentTab = activeTab.value;

		return allEvents.filter((event) => {
			if (currentTab !== "ALL" && event.appType !== currentTab) return false;
			// Mismo predicado que `stats.errors`: el contador y el filtro no pueden
			// describir conjuntos distintos.
			if (onlyFailures && !isFailure(event)) return false;

			if (sessionFilter.value) {
				if (!isMatch(event, sessionFilter.value)) return false;
			}

			if (highlightedSessionId.value) {
				const targetId = String(highlightedSessionId.value);
				if (!isMatch(event, targetId)) return false;
			}

			return eventMatchesText(event, searchTerm);
		});
	});

	const filteredEvents = computed(() =>
		facetBaseEvents.value.filter((event) =>
			matchesFacets(event, facetFilters.value),
		),
	);

	const groupedEvents = computed(() => {
		const groups: Record<string, TimeGroup> = {};
		let blockCounter = 1;

		const sorted = [...filteredEvents.value].sort((a, b) => a.ts - b.ts);

		// Emparejar va antes de agrupar: los bloques son de un minuto, asi que
		// una peticion a las 12:04:59 y su respuesta a las 12:05:01 caian en
		// bloques distintos y no llegaban a juntarse nunca.
		for (const row of toTimelineRows(sorted)) {
			// La fila cuelga del minuto en que empieza el intercambio.
			const anchor = row.single ?? row.pair?.request;
			if (!anchor) continue;

			const date = new Date(anchor.timestamp);
			if (Number.isNaN(date.getTime())) continue;

			const timeKey = date.toLocaleString("es-CO", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});

			if (!groups[timeKey]) {
				groups[timeKey] = {
					label: `Block ${blockCounter++}`,
					timeDisplay: timeKey,
					timeKey: timeKey,
					rows: [],
				};
			}
			groups[timeKey].rows.push(row);
		}
		return groups;
	});

	async function processLogs(rawContent: string, type: AnalyzerType | "ALL") {
		if (!rawContent.trim()) return;

		isProcessing.value = true;
		progress.value = 0;

		try {
			const engine = new P2PParserEngine();

			await new Promise((resolve) => setTimeout(resolve, 50));

			const result = engine.parse(rawContent, type);
			const newEvents: LogEvent[] = [];
			const totalEvents = result.events.length;

			for (let i = 0; i < result.events.length; i++) {
				const event = result.events[i];

				progress.value =
					totalEvents > 0 ? Math.round((i / totalEvents) * 100) : 100;

				// Only auto-switch tab if no events are loaded yet (first upload)
				if (
					events.value.length === 0 &&
					activeTab.value !== event.appType &&
					activeTab.value !== "ALL"
				) {
					activeTab.value = event.appType;
				}

				// `event.id` deriva del contenido: la marca ya en epoch, el mensaje
				// **entero** y la traza. La huella anterior recortaba el mensaje a 60
				// caracteres, asi que dos llamadas seguidas a la misma ruta que solo
				// se diferencian por el identificador del final colisionaban y se
				// perdia una.
				if (!processedHashes.has(event.id)) {
					newEvents.push(event);
					processedHashes.add(event.id);
				}
			}

			if (result.metadata) {
				const meta = result.metadata;
				metadata.value = meta;

				if (type === APP_TYPES.CHECKOUT) {
					const checkoutMeta = meta as CheckoutParseMetadata;
					const existing = new Set(sessionIds.value);

					if (checkoutMeta.sessions?.length) {
						for (const sess of checkoutMeta.sessions) {
							if (!existing.has(sess.sessionId)) {
								sessionIds.value.push(sess.sessionId);
								existing.add(sess.sessionId);
							}
						}
					}
				}

				if (sessionIds.value.length > 1 && !sessionFilter.value) {
					sessionFilter.value = sessionIds.value[0];
				}
			}

			if (
				type === APP_TYPES.CHECKOUT ||
				activeTab.value === APP_TYPES.CHECKOUT
			) {
				const existing = new Set(sessionIds.value);
				// Fallback manual extraction from newEvents to ensure we capture untracked sessions (e.g. from generic JSON or Grafana formats)
				for (const e of newEvents) {
					const sid = e.correlation.sessionId;
					if (sid && !existing.has(sid)) {
						sessionIds.value.push(sid);
						existing.add(sid);
					}
				}
			}

			unrecognized.value += result.stats.unrecognized;

			if (result.errors && result.errors.length > 0) {
				for (const err of result.errors) {
					parsingErrors.value.push(
						`Line ${err.line}: ${err.reason} - ${err.content}`,
					);
				}
			}

			events.value = events.value.concat(newEvents);
		} catch (criticalError) {
			console.error("Critical failure in log engine:", criticalError);
		} finally {
			isProcessing.value = false;
			progress.value = 100;
		}
	}

	function clearLogsByApp(type: AnalyzerType) {
		events.value = events.value.filter((e) => e.appType !== type);

		processedHashes.clear();
		for (const e of events.value) {
			processedHashes.add(e.id);
		}

		if (type === APP_TYPES.CHECKOUT) {
			sessionIds.value = [];
			sessionFilter.value = null;
			metadata.value = null;
		}

		parsingErrors.value = [];
		unrecognized.value = 0;
	}

	function clearLogs() {
		events.value = [];
		parsingErrors.value = [];
		unrecognized.value = 0;
		processedHashes.clear();
		search.value = "";
		outcomeFilter.value = "ALL";
		facetFilters.value = {};
		highlightedSessionId.value = null;
		sessionIds.value = [];
		sessionFilter.value = null;
		metadata.value = null;
		progress.value = 0;
	}

	function toggleHighlight(id: string | number) {
		highlightedSessionId.value = highlightedSessionId.value === id ? null : id;
		if (highlightedSessionId.value) search.value = "";
	}

	return {
		events,
		activeTab,
		parsingErrors,
		search,
		outcomeFilter,
		facetFilters,
		facetBaseEvents,
		tabEvents,
		highlightedSessionId,
		isProcessing,
		progress,
		sessionIds,
		sessionFilter,
		metadata,
		unrecognized,
		stats,
		counts,
		filteredEvents,
		groupedEvents,
		currentAnalyzer: activeTab,
		processLogs,
		clearLogs,
		clearLogsByApp,
		toggleHighlight,
	};
});
