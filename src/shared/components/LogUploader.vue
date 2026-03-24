<script setup lang="ts">
import { ref } from "vue";
import type { AnalyzerType } from "../../shared/types";
import { useLogStore } from "../../store/logStore";
import { useLogUploader } from "../composables/useLogUploader";
import ConfirmationModal from "./ConfirmationModal.vue";
import UploaderActions from "./uploader/UploaderActions.vue";
import UploaderConsole from "./uploader/UploaderConsole.vue";
import UploaderFormats from "./uploader/UploaderFormats.vue";
import UploaderProcessing from "./uploader/UploaderProcessing.vue";
import UploaderStats from "./uploader/UploaderStats.vue";

const props = defineProps<{
	targetType: AnalyzerType;
}>();

const emit = defineEmits(["viewResults"]);
const store = useLogStore();
const fileInput = ref<HTMLInputElement | null>(null);
const showDeleteModal = ref(false);

const {
	raw,
	leftovers,
	isDragging,
	isOpeningDialog,
	isReadingFile,
	detectedFormat,
	detectedFormatName,
	availableFormats,
	totalAccumulatedLines,
	isOverLimit,
	needsSplitting,
	MAX_STORE_LIMIT,
	openFilePicker,
	handleFileSelect,
	onPaste,
	handleFileDrop,
	clearEditor,
	triggerProcess,
	processRemaining,
} = useLogUploader(props.targetType);

function confirmClearAll() {
	store.clearLogsByApp(props.targetType);
	clearEditor();
	showDeleteModal.value = false;
}

const handleViewResults = () => emit("viewResults");
</script>

<template>
  <div class="space-y-6 w-full max-w-3xl mx-auto">
    <input 
      type="file" 
      ref="fileInput" 
      class="hidden" 
      accept=".log,.txt,.csv,.json" 
      @change="handleFileSelect" 
    />
    
    <!-- SUPPORTED FORMATS -->
    <UploaderFormats 
      :target-type="targetType"
      :available-formats="availableFormats"
      :detected-format-name="detectedFormatName"
    />
    
    <!-- QUEUE NOTIFICATION -->
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
      <button 
        @click="processRemaining(handleViewResults)" 
        :disabled="store.isProcessing"
        class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50"
      >
        Analizar Siguiente Lote
      </button>
    </div>

    <!-- MAIN CONSOLE CONTAINER -->
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
      <UploaderStats 
        :total-accumulated-lines="totalAccumulatedLines"
        :max-store-limit="MAX_STORE_LIMIT"
        :is-over-limit="isOverLimit"
      />

      <div v-if="detectedFormat" class="px-6 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-left duration-300">
        <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
          Auto-Detection: {{ detectedFormat }}
        </span>
      </div>

      <UploaderConsole 
        v-model:raw="raw"
        :is-reading-file="isReadingFile"
        :is-dragging="isDragging"
        :is-over-limit="isOverLimit"
        :detected-format="detectedFormat"
        @open-file="openFilePicker(fileInput)"
        @paste="onPaste"
      >
        <template #overlay>
          <UploaderProcessing 
            :is-processing="store.isProcessing"
            :progress="store.progress"
          />
        </template>
      </UploaderConsole>
    </div>

    <!-- ACTIONS -->
    <UploaderActions 
      :raw="raw"
      :leftovers="leftovers"
      :is-over-limit="isOverLimit"
      :is-processing="store.isProcessing"
      :is-reading-file="isReadingFile"
      :is-opening-dialog="isOpeningDialog"
      :needs-splitting="needsSplitting"
      :detected-format-name="detectedFormatName"
      @clear="clearEditor"
      @open-file="openFilePicker(fileInput)"
      @process="triggerProcess(handleViewResults)"
    />

    <ConfirmationModal 
      :is-open="showDeleteModal"
      title="Reiniciar Memoria"
      message="Esto borrará solo los logs de la aplicación actual."
      @confirm="confirmClearAll"
      @close="showDeleteModal = false"
    />
  </div>
</template>