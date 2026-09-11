<script setup lang="ts">
import { computed } from "vue";
import LogCardHeader from "../../../shared/components/LogCardHeader.vue";
import PayloadView from "../../../shared/components/PayloadView.vue";
import type { HighlightTheme, LogEvent } from "../../../shared/types";
import { isFailure } from "../../../shared/ui/LogUIHelper";
import { useLogStore } from "../../../store/logStore";
import type { RestDetails } from "../types";
import RestBody from "./RestBody.vue";

const props = defineProps<{
	log: LogEvent;
	isHighlighted: boolean;
}>();

const store = useLogStore();

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const isErrorState = computed(() => isFailure(props.log));
const payload = computed(
	() => (props.log.details as { payload?: object }).payload ?? null,
);

const activeTheme = computed<HighlightTheme | null>(() => {
	if (!props.isHighlighted) return null;

	const activeId = String(store.highlightedSessionId).toLowerCase();
	const details = props.log.details as Record<string, unknown>;
	const payload = (details?.payload || {}) as Record<string, unknown>;

	const isSessionId =
		details?.sessionId && String(details.sessionId).toLowerCase() === activeId;
	const isInterdinHash =
		payload?.id && String(payload.id).toLowerCase().includes(activeId);

	if (isSessionId || isInterdinHash) {
		return {
			ring: "ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-500/20",
			bg: "bg-indigo-500",
		};
	}

	return {
		ring: "ring-2 ring-orange-500 border-orange-500 shadow-orange-500/20",
		bg: "bg-orange-500",
	};
});
</script>

<template>
  <div
    class="relative bg-white dark:bg-[#161618] rounded-xl transition-all duration-300 group overflow-hidden border"
    :class="[
      isHighlighted ? (activeTheme?.ring + ' z-10 shadow-xl scale-[1.01]') : 'border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.05)]',
      { 'border-rose-300/50 shadow-sm dark:border-rose-500/30': isErrorState && !isHighlighted }
    ]"
  >
    <div class="absolute left-0 top-0 bottom-0 w-1 transition-colors"
         :class="isErrorState ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : (isHighlighted ? activeTheme?.bg : 'bg-transparent group-hover:bg-indigo-500/20')">
    </div>

    <!-- Información a la izquierda, payload a la derecha: la tarjeta suelta
         no tiene ida y vuelta que apilar. -->
    <div class="grid" :class="{ 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]': payload }">
    <div class="p-4 sm:p-5 pl-5 sm:pl-6 min-w-0">
      <LogCardHeader :log="log" />

      <RestBody
        class="mt-4"
        :details="log.details as RestDetails"
        :outcome="log.outcome"
        :is-highlighted="isHighlighted"
        @filter-id="id => emit('highlight-session', id)"
      />
    </div>

    <div v-if="payload" class="border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/20 p-4 sm:p-5 min-w-0">
      <PayloadView :payload="payload" />
    </div>
    </div>
  </div>
</template>
