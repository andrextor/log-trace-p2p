<script setup lang="ts">
import { computed, ref } from "vue";
import { useLogStore } from "../../../store/logStore";
import { buildFacets, countSelected, toggleFacet } from "../../ui/facets";

const store = useLogStore();

/** Cuántos valores se ven antes de tener que desplegar la faceta. */
const VISIBLE = 5;

const expanded = ref(new Set<string>());

const facets = computed(() =>
	buildFacets(store.facetBaseEvents, store.facetFilters),
);

const selectedCount = computed(() => countSelected(store.facetFilters));

const isOn = (key: string, value: string) =>
	(store.facetFilters[key] ?? []).includes(value);

const shownValues = (key: string, values: unknown[]) =>
	expanded.value.has(key) ? values : values.slice(0, VISIBLE);

const toggle = (key: string, value: string) => {
	store.facetFilters = toggleFacet(store.facetFilters, key, value);
};

const toggleExpand = (key: string) => {
	const next = new Set(expanded.value);
	next.has(key) ? next.delete(key) : next.add(key);
	expanded.value = next;
};
</script>

<template>
  <div v-if="facets.length" class="flex flex-wrap items-start gap-x-5 gap-y-2 pt-2">
    <div v-for="facet in facets" :key="facet.key" class="flex items-center gap-1.5 flex-wrap">
      <span class="text-[8px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 mr-0.5">
        {{ facet.label }}
      </span>

      <button
        v-for="v in shownValues(facet.key, facet.values)"
        :key="v.value"
        @click="toggle(facet.key, v.value)"
        :title="`${v.label} — ${v.count}`"
        class="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border transition-all"
        :class="isOn(facet.key, v.value)
          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/30 hover:text-indigo-500'"
      >
        <span class="max-w-[140px] truncate">{{ v.label }}</span>
        <span class="font-mono opacity-60">{{ v.count }}</span>
      </button>

      <button
        v-if="facet.values.length > VISIBLE"
        @click="toggleExpand(facet.key)"
        class="px-1.5 py-0.5 text-[9px] font-black text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-colors"
      >
        {{ expanded.has(facet.key) ? '−' : `+${facet.values.length - VISIBLE}` }}
      </button>
    </div>

    <button
      v-if="selectedCount"
      @click="store.facetFilters = {}"
      class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
    >
      Clear {{ selectedCount }}
    </button>
  </div>
</template>
