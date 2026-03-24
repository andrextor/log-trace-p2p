import { computed, ref } from "vue";
import { APP_TYPES } from "../../../shared/types";
import type {
	ActiveFilterInfo,
	CheckoutParseMetadata,
	CheckoutSessionMetadata,
	LogEvent,
} from "../../../shared/types";
import { getFilterIdentity, isMatch } from "../../../shared/ui/LogUIHelper";
import { useLogStore } from "../../../store/logStore";

export function useCheckoutSessions() {
	const store = useLogStore();
	const sessionSearch = ref("");

	const hasSessionFilter = computed(() => {
		return (
			store.activeTab === APP_TYPES.CHECKOUT && store.sessionIds.length > 1
		);
	});

	const setSessionFilter = (sessionId: string | null) => {
		store.sessionFilter = sessionId;
		store.highlightedSessionId = null;
		store.search = "";
	};

	const checkoutMetadata = computed(() => {
		if (store.activeTab === APP_TYPES.CHECKOUT && store.metadata) {
			return store.metadata as CheckoutParseMetadata;
		}
		return null;
	});

	const getSessionMetadata = (
		sid: string,
	): CheckoutSessionMetadata | undefined => {
		return checkoutMetadata.value?.sessions?.find(
			(s: CheckoutSessionMetadata) => s.sessionId === sid,
		);
	};

	const filteredSessionIds = computed(() => {
		if (!sessionSearch.value.trim()) return store.sessionIds;
		const term = sessionSearch.value.toLowerCase();
		return store.sessionIds.filter((sid) => {
			const meta = getSessionMetadata(sid);
			return (
				sid.toLowerCase().includes(term) ||
				meta?.sessionType?.toLowerCase().includes(term) ||
				meta?.finalState?.toLowerCase().includes(term) ||
				meta?.reference?.toLowerCase().includes(term)
			);
		});
	});

	const currentSessionIndex = computed(() => {
		if (!store.sessionFilter) return -1;
		return store.sessionIds.indexOf(store.sessionFilter);
	});

	const navigateSession = (direction: "prev" | "next") => {
		const idx = currentSessionIndex.value;
		if (direction === "prev" && idx > 0) {
			setSessionFilter(store.sessionIds[idx - 1]);
		} else if (direction === "next" && idx < store.sessionIds.length - 1) {
			setSessionFilter(store.sessionIds[idx + 1]);
		}
	};

	const sessionEventCount = (sid: string) => {
		return store.events.filter((e) => {
			const details = e.details as Record<string, unknown>;
			return String(details?.sessionId) === sid;
		}).length;
	};

	const getSessionTypeColor = (type: string) => {
		switch (type?.toUpperCase()) {
			case "PAYMENT":
				return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
			case "SUBSCRIPTION":
				return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
			case "COLLECT":
				return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
			case "AUTOPAY":
				return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
			default:
				return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
		}
	};

	const activeFilterInfo = computed<ActiveFilterInfo | null>(() => {
		if (!store.highlightedSessionId) return null;
		const targetId = String(store.highlightedSessionId);
		const match = store.events.find((e) => isMatch(e, targetId));

		if (!match) return { label: "ID", color: "orange", value: targetId };

		const identity = getFilterIdentity(match, targetId);
		return {
			label: identity.label,
			color: identity.colorClass,
			value: targetId,
		};
	});

	const isLogHighlighted = (event: LogEvent) => {
		if (!store.highlightedSessionId) return false;
		return isMatch(event, String(store.highlightedSessionId));
	};

	return {
		store,
		sessionSearch,
		hasSessionFilter,
		setSessionFilter,
		getSessionMetadata,
		filteredSessionIds,
		currentSessionIndex,
		navigateSession,
		sessionEventCount,
		getSessionTypeColor,
		activeFilterInfo,
		isLogHighlighted,
	};
}
