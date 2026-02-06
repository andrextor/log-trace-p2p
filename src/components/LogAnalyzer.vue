<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { toast, Toaster } from 'vue-sonner';
import "vue-sonner/style.css"; 
import { useLogStore } from '../store/logStore';

// Imports
import AnalyzerSelector from './AnalyzerSelector.vue';
import LogUploader from './LogUploader.vue';
import LogTimeline from './LogTimeline.vue';
import AnalysisProgress from './AnalysisProgress.vue';
import ParsingErrorsModal from './ParsingErrorsModal.vue';

const store = useLogStore();
const showErrorsModal = ref(false);
const isViewingResults = ref(false);

const showUploader = computed(() => store.events.length === 0 || !isViewingResults.value);

watch(() => store.events.length, (newCount) => {
  if (newCount === 0) isViewingResults.value = false;
});

const handleLogProcess = async (payload: string) => {
  try {
    await store.setLogs(payload);

    if (store.events.length > 0) {
      isViewingResults.value = true;
      toast.success(`Análisis completado. ${store.events.length} eventos cargados.`);
      
      if (store.parsingErrors.length > 0) {
        console.log(`Info: ${store.parsingErrors.length} líneas ignoradas.`);
      }
      
      nextTick().then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    } else {
      if (store.parsingErrors.length > 0) {
        toast.error(`No se encontraron eventos. Hay ${store.parsingErrors.length} líneas no reconocidas.`);
        showErrorsModal.value = true;
      } else {
        toast.info("El archivo parece vacío.");
      }
    }
  } catch (e) {
    toast.error("Error crítico en el análisis.");
    console.error(e);
  }
};

const currentAnalyzerName = computed(() => {
  const names: Record<string, string> = {
    checkout: 'Checkout (PlacetoPay)',
    micrositios: 'Micrositios',
    rest: 'API REST Core'
  };
  return names[store.currentAnalyzer] || store.currentAnalyzer;
});

// --- ACCIONES DE FILTRADO RÁPIDO ---
const filterByErrors = () => {
  if (store.stats.errors > 0) {
    store.levelFilter = 'ERROR';
  }
};

const resetFilter = () => {
  store.levelFilter = 'ALL';
};

const handleViewResults = () => { isViewingResults.value = true; };
const handleGoBack = () => { isViewingResults.value = false; };

const handleResetTotal = () => {
  store.clearLogs();
  isViewingResults.value = false;
};
</script>

<template>
  <Toaster position="top-right" richColors theme="system" />

  <AnalysisProgress 
    :is-processing="store.isProcessing" 
    :progress="store.progress" 
  />

  <div class="max-w-6xl mx-auto px-6 py-10 min-h-screen transition-colors duration-500">
    <transition name="fade" mode="out-in">
      
      <div v-if="showUploader" key="uploader" class="space-y-10">
        <div class="text-center space-y-3 mb-12">
           <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Analizador de <span class="text-indigo-600 dark:text-indigo-400">Trazas P2P</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm sm:text-base italic">
            Configuración activa: <span class="font-bold text-slate-700 dark:text-slate-300">{{ currentAnalyzerName }}</span>
          </p>
        </div>

        <div class="max-w-2xl mx-auto">
          <AnalyzerSelector />
        </div>
  
        <LogUploader 
          @process="handleLogProcess" 
          @viewResults="handleViewResults"
        />
        
        <div v-if="store.parsingErrors.length > 0" class="text-center animate-in fade-in">
          <button @click="showErrorsModal = true" class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline decoration-slate-200 underline-offset-4 transition-all">
            Ver {{ store.parsingErrors.length }} líneas ignoradas anteriormente
          </button>
        </div>
      </div>

      <div v-else key="results" class="space-y-6">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
          
          <div 
            @click="resetFilter"
            class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all active:scale-[0.98] group"
          >
            <p class="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-widest text-center md:text-left group-hover:text-indigo-500 transition-colors">Total Eventos</p>
            <p class="text-2xl font-black text-indigo-600 dark:text-indigo-400 text-center md:text-left">{{ store.stats.total }}</p>
          </div>

          <div 
            @click="filterByErrors"
            class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all"
            :class="[
              store.stats.errors > 0 
                ? 'cursor-pointer hover:border-red-300 dark:hover:border-red-500/50 hover:shadow-md active:scale-[0.98] group' 
                : 'opacity-60 cursor-default'
            ]"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-widest text-center md:text-left group-hover:text-red-500 transition-colors">Logs Críticos</p>
                <p class="text-2xl font-black text-slate-700 dark:text-slate-200 text-center md:text-left">
                  <span :class="store.stats.errors > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-300 dark:text-slate-600'">
                    {{ store.stats.errors }}
                  </span>
                </p>
              </div>
              
              <div v-if="store.stats.errors > 0" class="opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-[9px] font-bold px-2 py-1 rounded">
                FILTRAR
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            <p class="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-widest text-center md:text-left">Fuente</p>
            <p class="text-lg font-bold text-slate-700 dark:text-slate-300 text-center md:text-left truncate mt-1">
              {{ currentAnalyzerName }}
            </p>
          </div>
        </div>

        <div v-if="store.parsingErrors.length > 0" class="flex justify-end px-2 mb-6 animate-in fade-in">
          <button 
            @click="showErrorsModal = true"
            class="group flex items-center gap-2 text-[10px] font-mono text-red-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/20"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-red-300 group-hover:bg-red-400"></span>
            Se ocultaron {{ store.parsingErrors.length }} líneas con formato inválido
          </button>
        </div>

        <LogTimeline 
          @back="handleGoBack" 
          @clearAll="handleResetTotal" 
        />
      </div>

    </transition>

    <ParsingErrorsModal 
      :is-open="showErrorsModal"
      :errors="store.parsingErrors"
      @close="showErrorsModal = false"
    />

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>