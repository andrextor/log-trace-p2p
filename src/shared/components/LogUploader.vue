<script setup lang="ts">
import { P2PParserEngine } from "@andrextor_ia11012/p2p-log-parser";
import { computed, nextTick, ref, watch } from "vue";
import {
	ANALYZER_NAMES,
	APP_TYPES,
	type AnalyzerType,
} from "../../shared/types";
import { useLogStore } from "../../store/logStore";
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
const isOpeningDialog = ref(false);
const isReadingFile = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const showDeleteModal = ref(false);
const currentInputCount = ref(0);
const detectedFormat = ref<string | null>(null);
const detectedFormatName = ref<string | null>(null);

const engine = new P2PParserEngine();
const supportedFormats = engine.getSupportedFormats();

const availableFormats = computed(() => {
	return (
		supportedFormats[props.targetType as keyof typeof supportedFormats] || []
	);
});

function detectFormat(text: string) {
	if (!text.trim()) {
		detectedFormat.value = null;
		detectedFormatName.value = null;
		return;
	}

	const lines = text.split("\n").filter((l) => l.trim().length > 5);
	if (lines.length === 0) {
		detectedFormat.value = null;
		detectedFormatName.value = null;
		return;
	}

	// Try detection with the first few lines
	const sample = lines.slice(0, 5).join("\n");
	const result = engine.parse(sample, props.targetType);

	if (result.events.length > 0) {
		detectedFormat.value = "Formato compatible detectado";

		// Specific Detection Heuristics
		const sampleLower = sample.toLowerCase();
		const isJson =
			sample.trim().startsWith("{") || sample.trim().startsWith("[");

		if (props.targetType === "checkout") {
			if (sample.includes(',"{') && /^\d{4}-\d{2}-\d{2}/.test(sample)) {
				detectedFormatName.value = "AWS CSV Parser";
			} else if (
				isJson &&
				sample.includes("@timestamp") &&
				sample.includes("fields.message")
			) {
				detectedFormatName.value = "New Relic Parser";
			} else if (
				isJson &&
				sample.includes("session_id") &&
				sample.includes('"message"')
			) {
				detectedFormatName.value = "Insights Parser";
			} else if (isJson && sample.includes("level_name")) {
				detectedFormatName.value = "Local Parser";
			}
		} else if (props.targetType === "rest") {
			if (isJson && sample.includes("@timestamp")) {
				detectedFormatName.value = "Rest New Relic Parser";
			}
		}
	} else {
		detectedFormat.value = null;
		detectedFormatName.value = null;
	}
}

function processIncomingText(text: string) {
	const trimmed = text.trim();
	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				const formattedText = parsed
					.map((obj) => JSON.stringify(obj))
					.join("\n");
				raw.value = formattedText;
				detectFormat(formattedText);
				return;
			}
		} catch (e) {
			console.warn("JSON inválido.");
		}
	}
	raw.value = text;
	detectFormat(text);
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
	if (isReadingFile.value || store.isProcessing) return;
	isOpeningDialog.value = true;
	fileInput.value?.click();
	setTimeout(() => {
		isOpeningDialog.value = false;
	}, 1200);
}

async function handleFileSelect(e: Event) {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	if (file) {
		isReadingFile.value = true;
		try {
			const text = await file.text();
			processIncomingText(text);
			leftovers.value = [];
		} finally {
			target.value = "";
			isReadingFile.value = false;
		}
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
		isReadingFile.value = true;
		try {
			const text = await file.text();
			processIncomingText(text);
			leftovers.value = [];
		} finally {
			isReadingFile.value = false;
		}
	}
}

function clearEditor() {
	raw.value = "";
	leftovers.value = [];
	currentInputCount.value = 0;
	detectedFormat.value = null;
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
    
    <!-- COMPACT SUPPORTED FORMATS (TOP) -->
    <div class="animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
          <h4 class="text-[10px] font-bold text-slate-500 dark:text-slate-400">Formatos Soportados / {{ ANALYZER_NAMES[targetType] }}</h4>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="detectedFormatName" class="text-[9px] font-bold text-emerald-500 tracking-tight animate-pulse">Match Encontrado</span>
          <span class="text-[8px] font-medium text-slate-400">Motor v4.2</span>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-2">
        <div v-for="format in availableFormats" :key="format.name" 
             class="group/format relative flex flex-col px-4 py-2.5 rounded-2xl transition-all cursor-default overflow-hidden"
             :class="[
               detectedFormatName && format.name.includes(detectedFormatName) 
                 ? 'bg-emerald-500/10 border-2 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02] z-10' 
                 : detectedFormatName 
                   ? 'bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 opacity-40 grayscale-[0.5]' 
                   : 'bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-white/[0.05] shadow-sm'
             ]">
          
          <!-- Glossy effect for detected -->
          <div v-if="detectedFormatName && format.name.includes(detectedFormatName)" class="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent pointer-events-none"></div>
          
          <div class="flex items-center gap-2 mb-0.5 relative z-10">
            <span class="text-[10px] font-bold transition-colors"
                  :class="detectedFormatName && format.name.includes(detectedFormatName) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'">
              {{ format.name }}
            </span>
            <div v-if="detectedFormatName && format.name.includes(detectedFormatName)" class="flex h-1.5 w-1.5 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </div>
            <div v-else class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover/format:bg-indigo-400 group-hover/format:animate-ping transition-colors"></div>
          </div>
          
          <div class="text-[9px] font-medium leading-tight relative z-10 transition-all duration-300"
               :class="[
                 detectedFormatName && format.name.includes(detectedFormatName) 
                   ? 'text-emerald-600/80 dark:text-emerald-400/80 h-auto opacity-100' 
                   : 'text-slate-500 dark:text-slate-400 h-0 opacity-0 group-hover/format:h-auto group-hover/format:opacity-100 mt-1'
               ]">
            {{ detectedFormatName && format.name.includes(detectedFormatName) ? format.description : format.detectionRule }}
          </div>
        </div>
      </div>
    </div>
    
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

    <!-- MAIN UPLOADER AREA -->
    <div 
      class="group relative rounded-3xl border transition-all duration-500 overflow-hidden shadow-2xl shadow-indigo-500/5 bg-white dark:bg-[#161618]"
      :class="[
        isDragging ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10 scale-[1.01]' : 
        isOverLimit ? 'border-rose-500 bg-rose-500/5' : 
        'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
    >
      <!-- HEADER -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 rounded-full" :class="isOverLimit ? 'bg-rose-500' : 'bg-indigo-500 animate-pulse'"></div>
          <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">Ingestor Console</span>
        </div>
        
        <div class="px-3 py-1 bg-white dark:bg-black/20 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
          <span class="text-[10px] font-mono font-bold" :class="isOverLimit ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'">
            {{ totalAccumulatedLines.toLocaleString() }} <span class="opacity-40">/</span> {{ MAX_STORE_LIMIT.toLocaleString() }}
          </span>
        </div>
      </div>

      <!-- DETECTED FORMAT -->
      <div v-if="detectedFormat" class="px-6 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-left duration-300">
        <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
          Auto-Detection: {{ detectedFormat }}
        </span>
      </div>

      <!-- MAIN AREA -->
      <div class="relative w-full h-[400px]">
      
        <!-- EMPTY STATE (DROPZONE) -->
        <div v-if="!raw" 
             @click="openFilePicker" 
             class="absolute inset-0 flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors m-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 group/dropzone">
           
           <div class="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-500/20 group-hover/dropzone:scale-110 group-hover/dropzone:rotate-3 transition-transform duration-300 shadow-sm">
              <svg v-if="!isReadingFile" class="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <svg v-else class="w-10 h-10 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
           </div>
           
           <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3 tracking-tight">Sube o arrastra tus logs aquí</h3>
           <p class="text-sm font-medium text-slate-500 dark:text-slate-400 text-center max-w-sm leading-relaxed">
              Puedes pegar directamente (<kbd class="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded-md border border-slate-200 dark:border-white/5 font-mono text-[11px] text-slate-600 dark:text-slate-300 shadow-sm tracking-tighter">Ctrl+V</kbd>), arrastrar un archivo de texto, o <span class="text-indigo-500 font-bold underline decoration-indigo-200 dark:decoration-indigo-500/30 underline-offset-4">hacer clic para explorar</span>.
           </p>
        </div>

        <!-- RAW TEXTAREA -->
        <div v-else class="w-full h-full flex flex-col bg-slate-50/30 dark:bg-black/10">
           <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#131315]">
             <div class="flex items-center gap-2 px-2">
                <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">Datos Originales (Crudo)</span>
             </div>
           </div>
           <textarea
             class="flex-1 w-full h-[calc(100%-40px)] bg-transparent p-6 text-[13px] font-mono text-slate-800 dark:text-indigo-100/90 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none leading-relaxed custom-scrollbar selection:bg-indigo-500/30 focus:bg-white dark:focus:bg-[#1a1b1e] transition-colors"
             v-model="raw"
             @paste="onPaste"
             spellcheck="false"
           />
        </div>

        <!-- ANALYZING OVERLAY -->
        <div v-if="store.isProcessing" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#0a0a0b]/90 backdrop-blur-md z-10 animate-in fade-in duration-300">
           <div class="flex flex-col items-center gap-5">
              <div class="relative flex items-center justify-center">
                  <div class="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                  <span class="absolute text-[11px] font-black text-indigo-600 dark:text-indigo-400">{{ store.progress }}%</span>
              </div>
              <span class="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 animate-pulse">Analizando trazas...</span>
           </div>
        </div>
      </div>
    </div>

    <!-- ACTION BUTTONS -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-6 px-2 mt-6">
      <div class="w-full sm:w-auto">
        <button v-if="raw || leftovers.length > 0" 
          @click="clearEditor"
          class="group flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl text-rose-500/70 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-[10px] tracking-wide hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpiar editor
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <button 
          @click="openFilePicker" 
          :disabled="isOpeningDialog || isReadingFile || store.isProcessing"
          class="group flex items-center justify-center gap-2 flex-1 sm:flex-none px-6 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[10px] font-bold tracking-wide text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:active:scale-100"
        >
          <!-- Loader icon -->
          <svg v-if="isOpeningDialog || isReadingFile" class="w-4 h-4 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <!-- Input Icon -->
          <svg v-else class="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span class="w-[95px] inline-block text-center">{{ isReadingFile ? 'Leyendo...' : (isOpeningDialog ? 'Abriendo...' : 'Subir archivo') }}</span>
        </button>

        <button
          @click="triggerProcess"
          :disabled="!raw || isOverLimit || store.isProcessing"
          class="group relative flex items-center justify-center gap-3 flex-1 sm:px-10 py-3.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-bold tracking-wider shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/40 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ needsSplitting ? `Analizar lote 1` : 'Iniciar análisis' }}
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