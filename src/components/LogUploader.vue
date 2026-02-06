<script setup lang="ts">
import { ref, computed } from "vue";
import { useLogStore } from "../store/logStore";
import ConfirmationModal from "./ConfirmationModal.vue"; // <--- Importar el Modal

const store = useLogStore();
const MAX_LINES = 3000;
const raw = ref("");
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// Estado para controlar el Modal
const showDeleteModal = ref(false);

const emit = defineEmits(['process', 'viewResults']);

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

function openFilePicker() {
  fileInput.value?.click();
}

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

function clearEditor() {
  raw.value = "";
}

// 1. Acción inicial: Abrir el modal en lugar de borrar directo
function requestClearAll() {
  showDeleteModal.value = true;
}

// 2. Acción confirmada: Ejecutar borrado
function confirmClearAll() {
  store.clearLogs();
  raw.value = "";
  showDeleteModal.value = false;
}

function triggerProcess() {
  if (!raw.value || isOverLimit.value) return;
  emit('process', raw.value);
  raw.value = ""; 
}
</script>

<template>
  <div class="space-y-6">
    <input 
      type="file" 
      ref="fileInput" 
      class="hidden" 
      accept=".log,.txt,.csv,.json"
      @change="handleFileSelect"
    />

    <div v-if="store.events.length > 0" class="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
      
      <div class="inline-flex rounded-full shadow-lg shadow-indigo-500/30 overflow-hidden group transition-transform active:scale-95">
        
        <button 
          @click="emit('viewResults')"
          type="button"
          class="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-sm font-bold border-r border-indigo-800/20"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Ver análisis ({{ store.events.length }})</span>
        </button>

        <button 
          @click="requestClearAll"
          type="button"
          class="px-3 py-2 bg-indigo-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center"
          title="Borrar logs actuales y reiniciar"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <p v-if="remainingSlots > 0" class="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
        Espacio disponible: <span class="text-indigo-500 font-bold">{{ remainingSlots.toLocaleString() }} líneas</span>
      </p>
    </div>

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
        
        <div class="flex gap-4 items-center text-right">
          <span 
            class="text-[10px] font-mono font-bold"
            :class="isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'"
          >
            Total Acumulado: {{ totalAccumulatedLines.toLocaleString() }} / {{ MAX_LINES.toLocaleString() }}
          </span>
        </div>
      </div>

      <textarea
        class="w-full min-h-80 bg-transparent p-6 text-sm font-mono text-slate-800 dark:text-indigo-100/90 outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600 resize-y"
        :class="{'text-red-400 opacity-60': isOverLimit}"
        placeholder="Pega nuevos logs aquí o arrastra un archivo..."
        v-model="raw"
        @paste="onPaste"
      />

      <div v-if="isOverLimit" class="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[2px] rounded-2xl">
        <div class="bg-red-600 text-white text-xs px-4 py-2 rounded-xl font-bold shadow-2xl flex flex-col items-center gap-1">
          <span>EXCESO DE CAPACIDAD</span>
          <span class="font-normal opacity-90 font-mono text-[10px]">Total: {{ totalAccumulatedLines }} líneas</span>
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
          {{ isOverLimit ? 'Límite excedido' : (store.events.length > 0 ? 'Añadir al análisis' : 'Iniciar Análisis') }}
        </button>

        <button
          class="flex items-center justify-center gap-2 cursor-pointer px-6 py-3 rounded-xl border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all active:scale-95"
          type="button"
          @click="openFilePicker"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Subir archivo
        </button>

        <button
          class="cursor-pointer px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
          type="button"
          @click="clearEditor"
        >
          Limpiar editor
        </button>
      </div>
      <p class="text-[11px] font-mono italic text-slate-400 dark:text-slate-500">
         Máximo global: 3,000 líneas.
      </p>
    </div>

    <ConfirmationModal 
      :is-open="showDeleteModal"
      title="¿Borrar historial?"
      message="Estás a punto de eliminar todos los eventos cargados y el contenido del editor. Esta acción no se puede deshacer."
      @close="showDeleteModal = false"
      @confirm="confirmClearAll"
    />

  </div>
</template>