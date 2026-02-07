<script setup lang="ts">
import { ANALYZER_NAMES } from '../../logic/types';

defineProps<{
  activeTab: string;
  activeFilterTheme: any;
  stats: any;
  levelFilter: string;
}>();

defineEmits(['toggle-errors', 'reset-filters', 'clear-data']);
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between bg-white/40 dark:bg-[#0a0a0b]/40 backdrop-blur-md p-2 pl-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm gap-4"
  >
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2.5">
        <div class="relative flex h-2 w-2">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
          ></span>
          <span
            class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
          ></span>
        </div>
        <span
          class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]"
        >
          {{ ANALYZER_NAMES[activeTab as keyof typeof ANALYZER_NAMES] }}
        </span>
      </div>

      <slot name="filter-chip"></slot>
    </div>

    <div class="flex items-center gap-3">
      <div
        class="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5"
      >
        <button
          v-if="stats.errors > 0 || levelFilter === 'ERROR'"
          @click="$emit('toggle-errors')"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border"
          :class="levelFilter === 'ERROR' 
    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 ring-4 ring-red-500/5' 
    : 'bg-transparent text-red-500 border-transparent hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-100 dark:hover:border-red-500/20'"
        >
          <div class="relative flex h-1.5 w-1.5">
            <span
              v-if="levelFilter === 'ERROR'"
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-1.5 w-1.5"
              :class="levelFilter === 'ERROR' ? 'bg-red-500' : 'bg-red-400/50'"
            ></span>
          </div>

          <span>
            <template v-if="levelFilter === 'ERROR'">
              Mostrando fallos
            </template>
            <template v-else>
              {{ stats.errors === 1 ? '1 Fallo crítico' : `${stats.errors} Fallos críticos` }}
            </template>
          </span>
        </button>

        <button
          v-if="levelFilter !== 'ALL' || activeFilterTheme"
          @click="$emit('reset-filters')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Limpiar
        </button>
      </div>

      <div class="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

      <button
        @click="$emit('clear-data')"
        class="px-3 py-2 text-[10px] font-bold uppercase tracking-tight text-slate-400 hover:text-red-500 transition-colors"
      >
        Limpiar Logs
      </button>
    </div>
  </div>
</template>
