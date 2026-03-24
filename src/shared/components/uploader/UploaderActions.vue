<script setup lang="ts">
defineProps<{
	raw: string;
	leftovers: string[];
	isOverLimit: boolean;
	isProcessing: boolean;
	isReadingFile: boolean;
	isOpeningDialog: boolean;
	needsSplitting: boolean;
	detectedFormatName: string | null;
}>();

const emit = defineEmits<{
	(e: "clear"): void;
	(e: "open-file"): void;
	(e: "process"): void;
}>();
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-6 px-2 mt-6">
    <div class="w-full sm:w-auto">
      <button v-if="raw || leftovers.length > 0" 
        @click="emit('clear')"
        class="group flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl text-rose-500/70 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-[10px] tracking-wide hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Limpiar editor
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
      <button 
        @click="emit('open-file')" 
        :disabled="isOpeningDialog || isReadingFile || isProcessing"
        class="group flex items-center justify-center gap-2 flex-1 sm:flex-none px-6 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[10px] font-bold tracking-wide text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:active:scale-100"
      >
        <svg v-if="isOpeningDialog || isReadingFile" class="w-4 h-4 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span class="w-[95px] inline-block text-center">{{ isReadingFile ? 'Leyendo...' : (isOpeningDialog ? 'Abriendo...' : 'Subir archivo') }}</span>
      </button>

      <button
        @click="emit('process')"
        :disabled="!raw || isOverLimit || isProcessing"
        class="group relative flex items-center justify-center gap-3 flex-1 sm:px-10 py-3.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-bold tracking-wider shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/40 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {{ needsSplitting ? `Analizar lote 1` : 'Iniciar análisis' }}
      </button>
    </div>
  </div>
</template>
