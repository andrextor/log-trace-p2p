<script setup lang="ts">
import { ref } from "vue";
import type { LogEvent } from "../../../shared/types";
import type { TimeGroup } from "../../../shared/types";
import LogCard from "../LogCard.vue";
import ExchangeCard from "./ExchangeCard.vue";

const props = defineProps<{
	group: TimeGroup;
	index: number;
	highlightedId: string | number | null;
	isLogHighlighted: (event: LogEvent) => boolean;
}>();

defineEmits(["highlight-session"]);

const sectionRef = ref<HTMLElement | null>(null);

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
    
    <div class="md:hidden w-full flex items-center gap-3 mb-6 sticky top-0 bg-white/95 dark:bg-[#161618]/95 backdrop-blur z-10 py-3 border-b border-slate-100 dark:border-white/5">
      <div class="w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
      <div class="flex items-center gap-2">
        <span class="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm">{{ group.label }}</span>
        <span class="text-xs font-mono font-bold text-slate-500">{{ group.timeDisplay }}</span>
      </div>
    </div>
  
    <div class="w-full space-y-5 relative animate-in slide-in-from-bottom-6">
      <template v-for="row in group.rows" :key="row.single?.id ?? row.pair?.key">
        <LogCard
          v-if="row.single"
          :log="row.single"
          :is-highlighted="isLogHighlighted(row.single)"
          @highlight-session="id => $emit('highlight-session', id)"
        />

        <ExchangeCard
          v-else-if="row.pair"
          :pair="row.pair"
          :is-log-highlighted="isLogHighlighted"
          @highlight-session="id => $emit('highlight-session', id)"
        />

      </template>
    </div>
  </section>
</template>