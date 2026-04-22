<script setup lang="ts">
import type { LogEvent } from "../../../shared/types";
import type { TimeGroup } from "../../../shared/types";
import LogCard from "../LogCard.vue";

defineProps<{
	group: TimeGroup;
	index: number;
	highlightedId: string | number | null;
	isLogHighlighted: (event: LogEvent) => boolean;
}>();

defineEmits(["highlight-session"]);
</script>

<template>
  <section 
    class="relative mb-12 flex flex-col group/block w-full"
  >
    <div class="sticky top-2 z-20 hidden md:block mb-6">
      <div class="bg-white/95 dark:bg-[#0a0a0b]/95 border border-slate-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md transition-transform group-hover/block:scale-105 inline-block">
        {{ group.label }} • <span class="font-mono">{{ group.timeDisplay }}</span>
      </div>
    </div>
    
    <div class="md:hidden w-full flex items-center gap-2 mb-6 sticky top-0 bg-white/95 dark:bg-[#161618]/95 backdrop-blur z-10 py-3 border-b border-slate-100 dark:border-white/5">
      <span class="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm">{{ group.label }}</span>
      <span class="text-xs font-mono font-bold text-slate-500">{{ group.timeDisplay }}</span>
    </div>
  
    <div class="w-full space-y-5 relative animate-in slide-in-from-bottom-6">
      <LogCard 
        v-for="event in group.events" 
        :key="event.id" 
        :log="event"
        :is-highlighted="isLogHighlighted(event)"
        @highlight-session="id => $emit('highlight-session', id)" 
      />
    </div>
  </section>
</template>