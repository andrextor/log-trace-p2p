<script setup lang="ts">
import { APP_TYPES, ANALYZER_NAMES } from '../../logic/types';

defineProps<{
  activeTab: string;
  counts: Record<string, number>;
}>();

defineEmits(['change']);
</script>

<template>
  <div class="flex w-full items-center justify-center">
<div class="flex items-center p-1.5  justify-center  bg-slate-100/80 dark:bg-white/5 rounded-2xl w-fit border border-slate-200 dark:border-white/5">
    <button
      v-for="type in [APP_TYPES.CHECKOUT, APP_TYPES.REST]" :key="type"
      @click="$emit('change', type)"
      class="group relative px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center gap-3"
      :class="activeTab === type 
        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-slate-200 dark:ring-white/10' 
        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'"
    >
      <component :is="'svg'" class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path v-if="type === APP_TYPES.CHECKOUT" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </component>
      {{ ANALYZER_NAMES[type] }}
      <span v-if="counts[type] > 0"
            class="min-w-4.5 h-4.5 flex items-center justify-center text-[9px] rounded-md font-mono bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
        {{ counts[type] }}
      </span>
    </button>
  </div>
  </div>
  
</template>