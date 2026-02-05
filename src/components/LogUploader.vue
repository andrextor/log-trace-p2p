<script setup lang="ts">
import { ref, computed } from "vue";

const MAX_LINES = 3000;
const raw = ref("");
const isDragging = ref(false);
const emit = defineEmits(['process']);

const charCount = computed(() => raw.value.length);
const lineCount = computed(() => {
  if (!raw.value) return 0;
  // Contamos líneas no vacías para ser precisos con el volumen real de logs
  return raw.value.split('\n').filter(l => l.trim() !== "").length;
});

const isOverLimit = computed(() => lineCount.value > MAX_LINES);

/**
 * Generador de Mock para pruebas de límite (3,000 líneas exactas)
 */
function loadStressMock() {
  const levels = ['INFO', 'ERROR', 'WARN'];
  const baseTime = new Date();
  let result = "";
  for (let i = 0; i < 3000; i++) {
    const timestamp = new Date(baseTime.getTime() + i * 1000).toISOString();
    const level = levels[Math.floor(Math.random() * levels.length)];
    result += `[${timestamp}] ${level}: {"message": "Log de prueba sistema línea ${i+1}", "details": {"sessionId": "SID-99", "statusCode": 200}}\n`;
  }
  raw.value = result;
}

/**
 * Maneja el pegado de texto directamente en el textarea
 */
function onPaste(e: ClipboardEvent) {
  const content = e.clipboardData?.getData("text") ?? "";
  raw.value = content;
  // La validación de lineCount se dispara automáticamente por reactividad
}

/**
 * Maneja la subida de archivos por Drag & Drop
 */
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

/**
 * Dispara el evento hacia LogAnalyzer solo si cumple las reglas
 */
function triggerProcess() {
  if (!raw.value || isOverLimit.value) return;
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
          : isOverLimit 
            ? 'border-red-500 bg-red-500/5' 
            : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/2 hover:border-slate-300 dark:hover:border-white/20'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" :class="isOverLimit ? 'bg-red-500' : 'bg-indigo-500 animate-pulse'"></div>
          <span class="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-gray-400">Editor de Logs</span>
        </div>
        
        <div class="flex gap-4 items-center">
          <button 
            @click="loadStressMock"
            type="button"
            class="text-[9px] px-2 py-1 bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 rounded hover:bg-slate-500/20 transition-all font-bold uppercase"
          >
            Cargar 3k líneas
          </button>
          
          <div class="flex flex-col items-end">
            <span 
              class="text-[10px] font-mono font-bold"
              :class="isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'"
            >
              {{ lineCount.toLocaleString() }} / {{ MAX_LINES.toLocaleString() }} LÍNEAS
            </span>
          </div>
        </div>
      </div>

      <textarea
        class="w-full min-h-80 bg-transparent p-6 text-sm font-mono text-slate-800 dark:text-indigo-100/90 outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600 resize-y"
        :class="{'text-red-400 opacity-60': isOverLimit}"
        placeholder="Pega los logs aquí o arrastra un archivo .csv / .log..."
        v-model="raw"
        @paste="onPaste"
      />

      <div v-if="isOverLimit" class="absolute bottom-4 right-6 animate-in slide-in-from-bottom-2 duration-300">
        <div class="bg-red-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-xl flex items-center gap-2">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
          CAPACIDAD EXCEDIDA
        </div>
      </div>

      <div v-if="isDragging" class="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-50/90 dark:bg-[#0a0a0b]/80 rounded-2xl backdrop-blur-sm z-50">
        <div class="text-center">
          <p class="text-indigo-600 dark:text-indigo-400 font-bold animate-bounce text-lg">Suelta para cargar</p>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex gap-3 w-full sm:w-auto">
        <button
          @click="triggerProcess"
          type="button"
          :disabled="!raw || isOverLimit"
          class="flex-1 sm:flex-none cursor-pointer group relative px-8 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg active:scale-95"
        >
          <span class="relative z-10 flex items-center justify-center gap-2">
            {{ isOverLimit ? 'Reducir tamaño' : 'Iniciar Análisis' }}
            <svg v-if="!isOverLimit" class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>

        <button
          class="cursor-pointer px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
          type="button"
          @click="clear"
        >
          Limpiar
        </button>
      </div>
      
      <p class="text-[11px] font-mono italic" :class="isOverLimit ? 'text-red-500 font-bold' : 'text-slate-400 dark:text-slate-500'">
        {{ isOverLimit ? 'Error: El sistema no soporta más de 3,000 líneas por seguridad.' : 'Límite de seguridad: 3,000 líneas.' }}
      </p>
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