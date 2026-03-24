<script setup lang="ts">
import { APP_TYPES } from "../../../shared/types";
import type { ActiveFilterInfo } from "../../../shared/types";
import { useLogStore } from "../../../store/logStore";
import LogExporter from "../LogExporter.vue";

defineProps<{
	search: string;
	activeFilterInfo: ActiveFilterInfo | null;
	visibleCount: number;
	isFunnelVisible?: boolean;
}>();

const emit = defineEmits([
	"update:search",
	"clearSearch",
	"clearFilter",
	"toggleFunnel",
]);
const store = useLogStore();
</script>

<template>
  <header class="shrink-0 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-3 w-full md:w-auto flex-1">
      <div class="relative group flex-1 max-w-md">
        <span class="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input 
          :value="search"
          @input="e => emit('update:search', (e.target as HTMLInputElement).value)"
          placeholder="Search trace..." 
          class="w-full bg-white dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/10 pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm" 
        />
        <button v-if="search" @click="emit('clearSearch')" class="absolute right-3 top-3 text-slate-300 hover:text-slate-500">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <Transition name="scale">
        <div v-if="activeFilterInfo" 
             class="flex items-center h-10 px-4 rounded-xl border text-[11px] font-bold shadow-sm transition-all animate-in zoom-in duration-300"
             :class="activeFilterInfo.color === 'orange' 
                ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/5 dark:border-orange-500/20 dark:text-orange-400' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/5 dark:border-indigo-500/20 dark:text-indigo-400'">
          <span class="opacity-50 uppercase tracking-widest text-[9px] mr-2">{{ activeFilterInfo.label }}</span>
          <span class="font-mono text-xs">{{ activeFilterInfo.value }}</span>
          <button @click="emit('clearFilter')" class="ml-3 p-0.5 hover:bg-current/10 rounded-md transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </Transition>
    </div>

    <div class="flex items-center gap-6">
      <div class="flex flex-col items-end">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Results</span>
        <span class="text-sm font-mono font-bold text-slate-700 dark:text-indigo-400">{{ visibleCount.toLocaleString() }}</span>
      </div>
      
      <div class="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
      
      <div class="flex items-center gap-2">
        <button 
          v-if="store.activeTab === APP_TYPES.CHECKOUT && visibleCount > 0"
          @click="emit('toggleFunnel')"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/20 transition-all active:scale-95 group"
        >
          <svg class="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span class="text-xs font-bold uppercase tracking-tight">
            {{ isFunnelVisible ? 'Close Funnel' : 'View Funnel' }}
          </span>
        </button>

        <LogExporter />
      </div>
    </div>
  </header>
</template>