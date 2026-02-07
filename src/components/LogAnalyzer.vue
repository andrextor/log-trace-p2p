<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Toaster, toast } from 'vue-sonner';
import "vue-sonner/style.css";

// Store & Types
import { useLogStore } from '../store/logStore';
import { APP_TYPES, ANALYZER_NAMES } from '../logic/types';

// Componentes
import LogUploader from './LogUploader.vue';
import LogTimeline from './LogTimeline.vue';
import AnalysisProgress from './AnalysisProgress.vue';
import ParsingErrorsModal from './ParsingErrorsModal.vue';
import ConfirmationModal from './ConfirmationModal.vue';

const store = useLogStore();
const showErrorsModal = ref(false);
const showClearModal = ref(false);

// Forzamos que inicie en checkout al montar si no hay nada seleccionado
onMounted(() => {
  if (store.activeTab === 'ALL') {
    store.activeTab = APP_TYPES.CHECKOUT;
  }
});

// --- LÓGICA DE VISUALIZACIÓN INTELIGENTE ---

const hasEventsForCurrentTab = computed(() => {
  if (store.events.length === 0) return false;
  // Ya no evaluamos 'ALL', filtramos estrictamente por tipo
  return store.events.some(e => e.appType === store.activeTab);
});

const totalMemoryCount = computed(() => store.events.length);

const setTab = (tab: any) => {
  // Evitamos que se seleccione el tab deshabilitado
  if (tab === APP_TYPES.REST) return;
  store.activeTab = tab;
  store.highlightedSessionId = null; 
};

// --- ACCIONES DE LIMPIEZA ---

const handleClearContext = () => {
  showClearModal.value = true;
};

const executeClear = () => {
  store.clearLogs();
  store.search = "";
  store.levelFilter = "ALL";
  store.highlightedSessionId = null;
  // Al limpiar, mantenemos el tab actual en lugar de volver a 'ALL'
  showClearModal.value = false;
  toast.success("Historial y filtros reiniciados");
};

// --- ACCIONES DE FILTRADO ---

const filterByErrors = () => {
  if (store.stats.errors > 0) {
    store.levelFilter = 'ERROR';
    toast.warning("Filtro activo: Solo errores críticos.");
  }
};

const resetFilter = () => {
  store.levelFilter = 'ALL';
  store.search = ""; 
  store.highlightedSessionId = null;
  toast.info("Mostrando todos los eventos.");
};
</script>

<template>
  <Toaster position="top-right" richColors theme="system" />
  
  <AnalysisProgress 
    v-if="store.isProcessing"
    :is-processing="store.isProcessing" 
    :progress="store.progress" 
  />

  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-screen font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
    
    <div class="mb-8 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight italic">
            Log Trace <span class="text-indigo-600 dark:text-indigo-400 font-black">Viewer</span>
          </h1>
        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight opacity-80">
          Trazabilidad y depuración inteligente de flujos transaccionales
        </p>
        </div>
        
        <div class="flex gap-4 text-xs font-mono">
           <div class="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-2">
             <span class="text-slate-400 uppercase tracking-tighter text-[9px] font-bold">Memoria:</span> 
             <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ totalMemoryCount }}</span>
           </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 no-scrollbar overflow-x-auto">
        
        <button 
          @click="setTab(APP_TYPES.CHECKOUT)"
          class="px-4 py-2 text-sm font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap flex items-center gap-2"
          :class="store.activeTab === APP_TYPES.CHECKOUT 
            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm' 
            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'"
        >
          {{ ANALYZER_NAMES[APP_TYPES.CHECKOUT] }}
          <span v-if="store.counts[APP_TYPES.CHECKOUT] > 0" 
                class="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300">
            {{ store.counts[APP_TYPES.CHECKOUT] }}
          </span>
        </button>

        <button 
          disabled
          class="px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 border-transparent text-slate-400 dark:text-slate-600 cursor-not-allowed flex items-center gap-2 opacity-60"
        >
          {{ ANALYZER_NAMES[APP_TYPES.REST] }}
          <span class="text-[9px] uppercase tracking-widest font-black">(próximamente)</span>
        </button>

        </div>
    </div>

    <transition name="fade" mode="out-in">
      <div v-if="hasEventsForCurrentTab" key="timeline" class="space-y-6">
        <div class="flex flex-wrap justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-top-2 gap-4">
           <div class="flex items-center gap-3">
              <div class="flex h-3 w-3 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span class="text-sm font-bold text-slate-700 dark:text-slate-200">
                Visualizando: {{ ANALYZER_NAMES[store.activeTab as keyof typeof ANALYZER_NAMES] }}
              </span>
              
              <div class="flex items-center gap-2 ml-4">
                <button 
                  v-if="store.stats.errors > 0"
                  @click="filterByErrors"
                  class="text-[10px] font-bold px-3 py-1 rounded-full transition-all bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200"
                  :class="store.levelFilter === 'ERROR' ? 'ring-2 ring-red-500' : ''"
                >
                  {{ store.stats.errors }} ERRORES
                </button>
                
                <button 
                  v-if="store.levelFilter !== 'ALL' || store.search !== '' || store.highlightedSessionId !== null"
                  @click="resetFilter"
                  class="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300 flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  LIMPIAR FILTROS
                </button>
              </div>
           </div>

           <button 
             @click="handleClearContext"
             class="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm"
           >
             Borrar Historial
           </button>
        </div>

        <LogTimeline />
      </div>

      <div v-else key="uploader" class="flex flex-col items-center py-10 animate-in fade-in slide-in-from-bottom-2">
        <div class="text-center mb-8">
           <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 mb-4 shadow-inner ring-4 ring-slate-50 dark:ring-[#161618]">
              <svg v-if="store.activeTab === APP_TYPES.CHECKOUT" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <svg v-else class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
           </div>
           <p class="text-sm text-slate-500 max-w-sm mx-auto mt-2">
             Carga un archivo de logs para el contexto <span class="font-bold text-indigo-500">{{ ANALYZER_NAMES[store.activeTab as keyof typeof ANALYZER_NAMES] }}</span>.
           </p>
        </div>

        <LogUploader 
          :target-type="store.activeTab as any"
          @viewResults="() => {}"
        />

        <div v-if="store.parsingErrors.length > 0" class="mt-8 text-center animate-in fade-in">
          <button @click="showErrorsModal = true" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 underline decoration-slate-200 underline-offset-4 transition-all flex items-center gap-2 mx-auto">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Ver {{ store.parsingErrors.length }} líneas descartadas anteriormente
          </button>
        </div>
      </div>
    </transition>

    <ParsingErrorsModal :is-open="showErrorsModal" :errors="store.parsingErrors" @close="showErrorsModal = false" />
    <ConfirmationModal :is-open="showClearModal" @close="showClearModal = false" @confirm="executeClear" />
  </div>
</template>