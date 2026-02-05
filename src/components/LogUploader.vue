<script setup lang="ts">
import { ref, computed } from "vue";

const raw = ref("");
const isDragging = ref(false);
const emit = defineEmits(['process']);

const charCount = computed(() => raw.value.length);
const lineCount = computed(() => raw.value.split('\n').filter(l => l.trim()).length);

function onPaste(e: ClipboardEvent) {
  const content = e.clipboardData?.getData("text") ?? "";
  raw.value = content;
}

async function handleFileDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) {
    const text = await file.text();
    raw.value = text;
  }
}

function clear() {
  raw.value = "";
}

function triggerProcess() {
  if (!raw.value) return;
  emit('process', raw.value);
}
</script>

<template>
  <div class="space-y-6">
    <div 
      class="group relative rounded-2xl border transition-all duration-300"
      :class="[
        isDragging 
          ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_-10px_rgba(79,70,229,0.5)]' 
          : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/2 hover:border-slate-300 dark:hover:border-white/20'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span class="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-gray-400">Editor de Logs</span>
        </div>
        <div class="flex gap-4">
          <span v-if="lineCount" class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400/80">{{ lineCount }} LÍNEAS</span>
          <span v-if="charCount" class="text-[10px] font-mono text-slate-400 dark:text-gray-500">{{ (charCount / 1024).toFixed(2) }} KB</span>
        </div>
      </div>

      <textarea
        class="w-full min-h-80 bg-transparent p-6 text-sm font-mono text-slate-800 dark:text-indigo-100/90 outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600 resize-y"
        placeholder="Pega los logs aquí o arrastra un archivo .txt / .log..."
        v-model="raw"
        @paste="onPaste"
      />

      <div v-if="isDragging" class="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-50/90 dark:bg-[#0a0a0b]/80 rounded-2xl backdrop-blur-sm z-50">
        <div class="text-center">
          <p class="text-indigo-600 dark:text-indigo-400 font-bold animate-bounce text-lg">Suelta para cargar los logs</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-mono">Detección automática de formato activa</p>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex gap-3 w-full sm:w-auto">
        <button
          @click="triggerProcess"
          type="button"
          :disabled="!raw"
          class="flex-1 sm:flex-none cursor-pointer group relative px-8 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <span class="relative z-10 flex items-center justify-center gap-2">
            Iniciar Análisis
            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>

        <button
          class="cursor-pointer px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
          type="button"
          @click="clear"
        >
          Limpiar
        </button>
      </div>
      
      <p class="text-[11px] text-slate-400 dark:text-slate-500 font-mono italic">
        Soporta JSON plano, CloudWatch logs y trazas de terminal.
      </p>
    </div>

    <div v-if="raw" class="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-linear-to-br dark:from-white/3 dark:to-transparent p-6 animate-fade-in shadow-xl">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-xs font-bold text-slate-500 dark:text-indigo-400 uppercase tracking-widest">Vista previa del rastro</p>
      </div>
      <div class="relative overflow-hidden rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5">
        <pre class="p-4 text-[11px] leading-relaxed text-slate-600 dark:text-indigo-300/60 overflow-x-auto font-mono whitespace-pre-wrap">{{ raw.slice(0, 1000) }}...</pre>
        <div class="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-white dark:from-black/80 to-transparent"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>