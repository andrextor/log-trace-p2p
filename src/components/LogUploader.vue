<script setup lang="ts">
import { ref, computed } from "vue";
import { useLogStore } from "../store/logStore";
// Importamos el tipo para la prop, ya no necesitamos APP_TYPES aquí para iterar
import type { AnalyzerType } from "../logic/types"; 
import ConfirmationModal from "./ConfirmationModal.vue";

// 1. NUEVO: Recibimos el tipo de log que vamos a subir desde el padre
const props = defineProps<{
  targetType: AnalyzerType | 'ALL'; 
}>();

const store = useLogStore();
const MAX_LINES = 3000;
const raw = ref("");
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const showDeleteModal = ref(false);

const emit = defineEmits(['viewResults']);

// (Eliminamos const uploadType = ref(...) porque usamos props.targetType)

// --- COMPUTADOS ---
const currentInputLineCount = computed(() => {
  if (!raw.value) return 0;
  return raw.value.split('\n').filter(l => l.trim() !== "").length;
});

const totalAccumulatedLines = computed(() => {
  return store.events.length + currentInputLineCount.value;
});

const isOverLimit = computed(() => totalAccumulatedLines.value > MAX_LINES);
const remainingSlots = computed(() => Math.max(0, MAX_LINES - store.events.length));

// --- FUNCIONES ---

function openFilePicker() { fileInput.value?.click(); }

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const text = await file.text();
    raw.value = text;
    target.value = '';
  }
}

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

function clearEditor() { raw.value = ""; }

function requestClearAll() { showDeleteModal.value = true; }

function confirmClearAll() {
  store.clearLogs();
  raw.value = "";
  showDeleteModal.value = false;
}

// 3. PROCESAMIENTO
async function triggerProcess() {
  if (!raw.value || isOverLimit.value) return;
  
  // Determinamos qué tipo usar. 
  // Si estamos en la pestaña 'ALL', asumimos 'checkout' por defecto (o podrías poner un selector solo para este caso raro).
  // Si estamos en una pestaña específica, usamos esa.
  const typeToUse = props.targetType === 'ALL' ? 'checkout' : props.targetType;

  // Pasamos el tipo correcto al store
  await store.processLogs(raw.value, typeToUse as AnalyzerType);
  
  raw.value = ""; 
  emit('viewResults');
}
</script>
<template>
  <div class="space-y-6 w-full max-w-3xl mx-auto">
    <input type="file" ref="fileInput" class="hidden" accept=".log,.txt,.csv,.json" @change="handleFileSelect" />
    <div 
      class="group relative rounded-2xl border transition-all duration-300 min-h-75"
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
        
        <div class="flex gap-4 items-center text-right">
          <span 
            class="text-[10px] font-mono font-bold"
            :class="isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'"
          >
            {{ totalAccumulatedLines.toLocaleString() }} / {{ MAX_LINES.toLocaleString() }} líneas
          </span>
        </div>
      </div>

      <textarea
        class="w-full h-full min-h-62.5 bg-transparent p-6 text-sm font-mono text-slate-800 dark:text-indigo-100/90 outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600 resize-y"
        :class="{'text-red-400 opacity-60': isOverLimit}"
        placeholder="Pega las trazas aquí..."
        v-model="raw"
        @paste="onPaste"
      />

      <div v-if="store.isProcessing" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-[2px] rounded-2xl z-10">
         <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">Procesando {{ store.progress }}%...</span>
         </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      
      <div class="flex items-center gap-3 w-full sm:w-auto justify-start">
        <button 
          v-if="store.events.length > 0"
          @click="emit('viewResults')"
          class="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors px-2"
        >
          ← Ver resultados actuales
        </button>

        <button
          v-if="raw"
           class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-200 dark:border-red-500/20 text-red-600 dark:red-indigo-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-50"
          type="button"
          @click="clearEditor"
          :disabled="store.isProcessing"
        >
          Limpiar Editor
        </button>
      </div>

      <div class="flex gap-3 w-full sm:w-auto justify-end">
        <button
          class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all active:scale-95 disabled:opacity-50"
          type="button"
          @click="openFilePicker"
          :disabled="store.isProcessing"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Subir archivo
        </button>

        <button
          @click="triggerProcess"
          type="button"
          :disabled="!raw || isOverLimit || store.isProcessing"
          class="flex-1 sm:flex-none px-10 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold transition-all hover:bg-indigo-500 disabled:opacity-30 shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          {{ isOverLimit ? 'Límite excedido' : 'Analizar Logs' }}
        </button>
      </div>
    </div>

    <div v-if="store.events.length > 0" class="pt-10 flex justify-center">
        <button 
          @click="requestClearAll"
          class="text-[9px] uppercase tracking-[0.2em] font-black text-slate-300 hover:text-red-500 transition-colors"
        >
          Reiniciar aplicación y borrar memoria
        </button>
    </div>

    <ConfirmationModal 
      :is-open="showDeleteModal"
      title="¿Reiniciar análisis?"
      message="Esto borrará todos los eventos cargados en memoria y el contenido del editor. ¿Deseas continuar?"
      @close="showDeleteModal = false"
      @confirm="confirmClearAll"
    />
  </div>
</template>