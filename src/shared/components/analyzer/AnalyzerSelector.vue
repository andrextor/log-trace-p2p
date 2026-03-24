<script setup lang="ts">
import { computed } from "vue";
// Importamos la configuración centralizada (Paso 1)
import { ANALYZER_NAMES, type AnalyzerType } from "../../../shared/types";
import { useLogStore } from "../../../store/logStore";

const store = useLogStore();

const availableAnalyzers = computed(() => {
	return Object.entries(ANALYZER_NAMES).map(([key, label]) => {
		const id = key as AnalyzerType;
		return {
			id,
			name: label,
			icon: id === "checkout" ? "🛒" : id === "micrositios" ? "🏢" : "💻",
			disabled: false,
		};
	});
});

function selectAnalyzer(id: AnalyzerType) {
	store.currentAnalyzer = id;
	store.clearLogs();
}
</script>

<template>
  <div class="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
    
    <label class="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-gray-500 ml-1 font-bold">
      Contexto del Análisis
    </label>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="item in availableAnalyzers"
        :key="item.id"
        @click="!item.disabled && selectAnalyzer(item.id)"
        :disabled="item.disabled"
        class="group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 text-xs font-bold uppercase tracking-wide"
        :class="[
          store.currentAnalyzer === item.id
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30 scale-105 z-10'
            : item.disabled 
              ? 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed opacity-60 grayscale'
              : 'bg-white dark:bg-[#0a0a0b] border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer active:scale-95'
        ]"
      >
        <div v-if="store.currentAnalyzer === item.id" class="absolute inset-0 rounded-xl ring-1 ring-white/20"></div>
        
        <span class="text-sm filter drop-shadow-sm">{{ item.icon }}</span>
        <span>{{ item.name }}</span>
        
        <span v-if="item.disabled" class="ml-1 text-[8px] bg-slate-200 text-slate-500 px-1 rounded">WIP</span>
      </button>
    </div>

    <p class="text-[10px] text-slate-400 dark:text-slate-500 italic ml-1 h-4">
      <span v-if="store.currentAnalyzer === 'checkout'">
        * Detecta flujos de pago, redirecciones bancarias y 3DSecure.
      </span>
      <span v-else-if="store.currentAnalyzer === 'micrositios'">
        * Especializado en recaudos masivos y consultas de facturas.
      </span>
      <span v-else-if="store.currentAnalyzer === 'rest'">
        * Análisis técnico de peticiones API crudas.
      </span>
    </p>

  </div>
</template>