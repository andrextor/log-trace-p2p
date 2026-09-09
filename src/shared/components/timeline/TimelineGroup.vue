<script setup lang="ts">
import { computed, ref } from "vue";
import type { LogEvent } from "../../../shared/types";
import type { TimeGroup } from "../../../shared/types";
import { type Exchange, toTimelineRows } from "../../ui/LogUIHelper";
import LogCard from "../LogCard.vue";

const props = defineProps<{
	group: TimeGroup;
	index: number;
	highlightedId: string | number | null;
	isLogHighlighted: (event: LogEvent) => boolean;
}>();

defineEmits(["highlight-session"]);

const sectionRef = ref<HTMLElement | null>(null);

const rows = computed(() => toTimelineRows(props.group.events));

// Un intercambio se abre y se cierra entero: son las dos mitades de lo mismo.
const openPairs = ref(new Set<string>());
const isPairOpen = (key: string) => openPairs.value.has(key);
const setPairOpen = (key: string, open: boolean) => {
	const next = new Set(openPairs.value);
	open ? next.add(key) : next.delete(key);
	openPairs.value = next;
};

const durationOf = (pair: Exchange) => {
	const ms = pair.response.durationMs ?? pair.request.durationMs;
	if (ms === undefined) return null;
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;
};

const scrollToGroup = () => {
	sectionRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
};
</script>

<template>
  <section 
    ref="sectionRef"
    class="relative mb-12 flex flex-col group/block w-full scroll-mt-24"
  >
    <div class="sticky top-2 z-20 hidden md:block mb-6">
      <button 
        @click="scrollToGroup"
        title="Scroll to start of this block"
        class="bg-white/95 dark:bg-[#0a0a0b]/95 border border-slate-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 hover:border-indigo-500/50 hover:shadow-indigo-500/20 group/btn flex items-center gap-2 cursor-pointer"
      >
        <svg class="w-3 h-3 -translate-y-px opacity-0 group-hover/btn:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7 7 7" />
        </svg>
        {{ group.label }} • <span class="font-mono">{{ group.timeDisplay }}</span>
      </button>
    </div>
    
    <div class="md:hidden w-full flex items-center gap-3 mb-6 sticky top-0 bg-white/95 dark:bg-[#161618]/95 backdrop-blur z-10 py-3 border-b border-slate-100 dark:border-white/5 -ml-8 pl-8">
      <div class="w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
      <div class="flex items-center gap-2">
        <span class="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm">{{ group.label }}</span>
        <span class="text-xs font-mono font-bold text-slate-500">{{ group.timeDisplay }}</span>
      </div>
    </div>
  
    <div class="w-full space-y-5 relative animate-in slide-in-from-bottom-6">
      <template v-for="row in rows" :key="row.single?.id ?? row.pair?.key">
        <LogCard
          v-if="row.single"
          :log="row.single"
          :is-highlighted="isLogHighlighted(row.single)"
          @highlight-session="id => $emit('highlight-session', id)"
        />

        <div v-else-if="row.pair" class="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/40 dark:bg-white/2 p-2">
          <button
            @click="setPairOpen(row.pair.key, !isPairOpen(row.pair.key))"
            class="w-full flex items-center gap-2 px-2 py-1 text-left hover:opacity-80 transition-opacity"
          >
            <svg class="w-3 h-3 text-slate-400 transition-transform shrink-0" :class="isPairOpen(row.pair.key) && 'rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
            <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">Exchange</span>
            <span v-if="durationOf(row.pair)" class="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-mono font-black">
              {{ durationOf(row.pair) }}
            </span>
            <span class="text-[9px] text-slate-400 ml-auto">
              {{ isPairOpen(row.pair.key) ? 'Collapse both' : 'Expand both' }}
            </span>
          </button>

          <!-- Ida y vuelta en paralelo. Los badges de cada tarjeta ya dicen cual
               es cual (`→ POST` frente a `← RES`), asi que no hacen falta
               rotulos. Se apilan cuando no caben dos columnas. -->
          <div class="grid gap-2 items-start lg:grid-cols-2">
            <LogCard
              :log="row.pair.request"
              :expanded="isPairOpen(row.pair.key)"
              @update:expanded="open => setPairOpen(row.pair!.key, open)"
              :is-highlighted="isLogHighlighted(row.pair.request)"
              @highlight-session="id => $emit('highlight-session', id)"
            />
            <LogCard
              :log="row.pair.response"
              :expanded="isPairOpen(row.pair.key)"
              @update:expanded="open => setPairOpen(row.pair!.key, open)"
              :is-highlighted="isLogHighlighted(row.pair.response)"
              @highlight-session="id => $emit('highlight-session', id)"
            />
          </div>
        </div>

      </template>
    </div>
  </section>
</template>