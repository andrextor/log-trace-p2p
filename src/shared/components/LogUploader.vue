<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useLogStore } from "../../store/logStore";
import {
	APP_TYPES,
	type AnalyzerType,
	ANALYZER_NAMES,
} from "../../shared/types";
import ConfirmationModal from "./ConfirmationModal.vue";

const props = defineProps<{
	targetType: AnalyzerType;
}>();

const store = useLogStore();
const emit = defineEmits(["viewResults"]);

// --- CONFIGURACIÓN ---
const MAX_STORE_LIMIT = 20000;
const BATCH_SIZE = 5000;

// --- ESTADO ---
const raw = ref("");
const leftovers = ref<string[]>([]);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const showDeleteModal = ref(false);
const currentInputCount = ref(0);

function processIncomingText(text: string) {
	const trimmed = text.trim();
	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				raw.value = parsed.map((obj) => JSON.stringify(obj)).join("\n");
				return;
			}
		} catch (e) {
			console.warn("JSON inválido.");
		}
	}
	raw.value = text;
}

watch(raw, (newVal) => {
	if (!newVal.trim()) {
		currentInputCount.value = 0;
		return;
	}
	currentInputCount.value = newVal
		.split("\n")
		.filter((l) => l.trim().length > 5).length;
});

const totalAccumulatedLines = computed(() => {
	const currentAppCount = store.counts[props.targetType] || 0;
	return currentAppCount + currentInputCount.value + leftovers.value.length;
});

const isOverLimit = computed(
	() => totalAccumulatedLines.value > MAX_STORE_LIMIT,
);
const needsSplitting = computed(() => currentInputCount.value > BATCH_SIZE);

// --- FUNCIONES DE CARGA ---

function openFilePicker() {
	fileInput.value?.click();
}

async function handleFileSelect(e: Event) {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	if (file) {
		const text = await file.text();
		processIncomingText(text);
		target.value = "";
		leftovers.value = [];
	}
}

function onPaste(e: ClipboardEvent) {
	const content = e.clipboardData?.getData("text") ?? "";
	processIncomingText(content);
	leftovers.value = [];
}

async function handleFileDrop(e: DragEvent) {
	isDragging.value = false;
	const file = e.dataTransfer?.files[0];
	if (file) {
		const text = await file.text();
		processIncomingText(text);
		leftovers.value = [];
	}
}

function clearEditor() {
	raw.value = "";
	leftovers.value = [];
	currentInputCount.value = 0;
}

function confirmClearAll() {
	store.clearLogsByApp(props.targetType);
	clearEditor();
	showDeleteModal.value = false;
}

// --- PROCESAMIENTO ---

async function triggerProcess() {
	if (!raw.value || isOverLimit.value || store.isProcessing) return;
	const allLines = raw.value.split("\n").filter((l) => l.trim().length > 5);

	if (allLines.length > BATCH_SIZE) {
		const firstBatch = allLines.slice(0, BATCH_SIZE).join("\n");
		leftovers.value = allLines.slice(BATCH_SIZE);
		await store.processLogs(firstBatch, props.targetType);
		raw.value = "";
	} else {
		await store.processLogs(raw.value, props.targetType);
		raw.value = "";
		leftovers.value = [];
	}
	await nextTick();
	emit("viewResults");
}

async function processRemaining() {
	if (leftovers.value.length === 0 || store.isProcessing) return;
	const nextBatch = leftovers.value.slice(0, BATCH_SIZE).join("\n");
	leftovers.value = leftovers.value.slice(BATCH_SIZE);
	await store.processLogs(nextBatch, props.targetType);
	if (leftovers.value.length === 0) emit("viewResults");
}
</script>

<template>
  <div class="space-y-6 w-full max-w-3xl mx-auto">
    <input type="file" ref="fileInput" class="hidden" accept=".log,.txt,.csv,.json" @change="handleFileSelect" />
    
    <div v-if="leftovers.length > 0" 
         class="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="flex h-2.5 w-2.5 relative">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </div>
        <p class="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
          {{ leftovers.length.toLocaleString() }} trazas en cola de espera
        </p>
      </div>
      <button @click="processRemaining" :disabled="store.isProcessing"
              class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50">
        Analizar Siguiente Lote
      </button>
    </div>

    <div 
      class="group relative rounded-3xl border transition-all duration-500 min-h-80 shadow-2xl shadow-indigo-500/5"
      :class="[
        isDragging ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10' : 
        isOverLimit ? 'border-red-500 bg-red-500/5' : 
        'border-slate-200 dark:border-white/10 bg-white dark:bg-white/2 hover:border-slate-300 dark:hover:border-white/20'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
        <div class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 rounded-full" :class="isOverLimit ? 'bg-red-500' : 'bg-indigo-500 animate-pulse'"></div>
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Ingestor Console</span>
        </div>
        
        <div class="px-3 py-1 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
          <span class="text-[10px] font-mono font-bold" :class="isOverLimit ? 'text-red-500' : 'text-slate-500'">
            {{ totalAccumulatedLines.toLocaleString() }} <span class="opacity-40">/</span> {{ MAX_STORE_LIMIT.toLocaleString() }}
          </span>
        </div>
      </div>

      <textarea
        class="w-full h-full min-h-68 bg-transparent p-8 text-sm font-mono text-slate-800 dark:text-indigo-100/90 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none leading-relaxed"
        :placeholder="`Pega las trazas de ${ANALYZER_NAMES[props.targetType]} aquí o arrastra un archivo...`"
        v-model="raw"
        @paste="onPaste"
      />

      <div v-if="store.isProcessing" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#0a0a0b]/90 backdrop-blur-md rounded-3xl z-10 animate-in fade-in duration-300">
         <div class="flex flex-col items-center gap-4">
            <div class="relative flex items-center justify-center">
                <div class="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <span class="absolute text-[10px] font-black text-indigo-600">{{ store.progress }}%</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Analizando Trazas...</span>
         </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
      <div class="w-full sm:w-auto">
        <button v-if="raw || leftovers.length > 0" 
          @click="clearEditor"
          class="group flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl text-red-500/70 hover:text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpiar Editor
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <button 
          @click="openFilePicker" 
          class="group flex items-center justify-center gap-2 flex-1 sm:flex-none px-6 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:border-indigo-500/50 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
        >
          <svg class="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Subir Archivo
        </button>

        <button
          @click="triggerProcess"
          :disabled="!raw || isOverLimit || store.isProcessing"
          class="group relative flex items-center justify-center gap-3 flex-1 sm:px-10 py-3.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/40 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ needsSplitting ? `Analizar Lote 1` : 'Iniciar Análisis' }}
        </button>
      </div>
    </div>

    <ConfirmationModal 
      :is-open="showDeleteModal"
      title="Reiniciar Memoria"
      message="Esto borrará solo los logs de la aplicación actual."
      @confirm="confirmClearAll"
      @close="showDeleteModal = false"
    />
  </div>
</template>