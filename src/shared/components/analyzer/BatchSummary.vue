<script setup lang="ts">
import { computed } from "vue";
import { useLogStore } from "../../../store/logStore";
import { formatEventTime } from "../../ui/LogUIHelper";
import { formatSpan, summarizeEvents } from "../../ui/batchSummary";
import { toggleFacet } from "../../ui/facets";

const store = useLogStore();

/** Cuántas categorías se ven antes de resumir el resto en un «+N». */
const VISIBLE = 4;

const summary = computed(() => summarizeEvents(store.tabEvents));

const window = computed(() => {
	const { from, to, spanMs } = summary.value;
	if (from === undefined || to === undefined || spanMs === undefined)
		return null;
	const iso = (ms: number) =>
		formatEventTime(new Date(ms).toISOString()).slice(0, 8);
	return { from: iso(from), to: iso(to), span: formatSpan(spanMs) };
});

const hidden = computed(() =>
	Math.max(0, summary.value.byCategory.length - VISIBLE),
);

const isActive = (key: string) =>
	(store.facetFilters.category ?? []).includes(key);

// Igual que el panel de proveedores: acciona la faceta que ya existe en vez de
// estrenar un filtro propio.
const filterByCategory = (key: string) => {
	store.facetFilters = toggleFacet(store.facetFilters, "category", key);
};
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

    <div class="flex items-center gap-1.5 flex-wrap">
      <button
        v-for="c in summary.byCategory.slice(0, VISIBLE)"
        :key="c.key"
        @click="filterByCategory(c.key)"
        :title="isActive(c.key) ? `Quitar el filtro de ${c.label}` : `Filtrar por ${c.label}`"
        class="flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-colors"
        :class="isActive(c.key)
          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/30'"
      >
        <span class="uppercase tracking-wide font-bold">{{ c.label }}</span>
        <span class="font-mono opacity-60">{{ c.count }}</span>
      </button>
      <span v-if="hidden" class="text-slate-600 dark:text-slate-400" :title="summary.byCategory.slice(VISIBLE).map(c => `${c.label} ${c.count}`).join(' · ')">
        +{{ hidden }}
      </span>
    </div>
  </div>
</template>
