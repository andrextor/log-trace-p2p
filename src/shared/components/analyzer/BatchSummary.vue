<script setup lang="ts">
import { computed } from "vue";
import { useLogStore } from "../../../store/logStore";
import { formatEventTime } from "../../ui/LogUIHelper";
import { formatSpan, summarizeEvents } from "../../ui/batchSummary";

const store = useLogStore();

const summary = computed(() => summarizeEvents(store.tabEvents));

const window = computed(() => {
	const { from, to, spanMs } = summary.value;
	if (from === undefined || to === undefined || spanMs === undefined)
		return null;
	const iso = (ms: number) => formatEventTime(ms).slice(0, 8);
	return { from: iso(from), to: iso(to), span: formatSpan(spanMs) };
});
</script>

<template>
  <div v-if="summary.total" class="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-[10px]">
    <div v-if="window" class="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-400">
      <svg class="w-3 h-3 text-slate-600 dark:text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {{ window.from }} → {{ window.to }}
      <span class="text-slate-600 dark:text-slate-400">·</span>
      <span class="font-bold">{{ window.span }}</span>
    </div>

    <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
      <span><span class="font-mono font-bold">{{ summary.total }}</span> eventos</span>
      <span v-if="summary.failures" class="text-rose-600 dark:text-rose-400">
        <span class="font-mono font-bold">{{ summary.failures }}</span> con fallo
      </span>
      <span v-if="store.unrecognized" class="text-amber-600 dark:text-amber-400">
        <span class="font-mono font-bold">{{ store.unrecognized }}</span> sin reconocer
      </span>
    </div>
  </div>
</template>
