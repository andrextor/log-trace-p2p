<script setup lang="ts">
import { useLogStore, type AnalyzerType } from '../store/logStore';

const store = useLogStore();

const analyzers = [
  { id: 'checkout' as AnalyzerType, name: 'Checkout', icon: '🛒' },
  { id: 'micrositios' as AnalyzerType, name: 'Micrositios (Próximamente)', disabled: true, icon: '🌐' },
  { id: 'rest' as AnalyzerType, name: 'REST API (Próximamente)', disabled: true, icon: '💻' },
];
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-gray-500 ml-1">
      Elegir Analizador
    </label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="item in analyzers"
        :key="item.id"
        @click="!item.disabled && (store.currentAnalyzer = item.id)"
        :disabled="item.disabled"
        class="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-medium"
        :class="[
          store.currentAnalyzer === item.id
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
            : item.disabled 
              ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed opacity-60'
              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-500/50 cursor-pointer'
        ]"
      >
        <span class="text-base">{{ item.icon }}</span>
        {{ item.name }}
      </button>
    </div>
  </div>
</template>