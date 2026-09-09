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
import { eventMatchesText, isFailure, isMatch } from "../shared/ui/LogUIHelper";

export type { ViewMode } from "../shared/types";

export const useLogStore = defineStore("logs", () => {
	const events = shallowRef<LogEvent[]>([]);
	const activeTab = ref<ViewMode>(APP_TYPES.CHECKOUT);
	const search = ref("");
	const outcomeFilter = ref<OutcomeFilter>("ALL");
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

	const filteredEvents = computed(() => {
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

	const groupedEvents = computed(() => {
		const groups: Record<string, TimeGroup> = {};
		let blockCounter = 1;

		const sorted = [...filteredEvents.value].sort(
			(a, b) =>
				new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
		);

		for (const event of sorted) {
			const date = new Date(event.timestamp);
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
					events: [],
				};
			}
			groups[timeKey].events.push(event);
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

				const msgStr = String(event.message || "");
				const fingerprint = `${event.timestamp}_${msgStr.slice(0, 60)}`;

				if (!processedHashes.has(fingerprint)) {
					newEvents.push(event);
					processedHashes.add(fingerprint);
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
			const fingerprint = `${e.timestamp}_${e.message.slice(0, 60)}`;
			processedHashes.add(fingerprint);
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
