<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { toast, Toaster } from 'vue-sonner';
import "vue-sonner/style.css"; 
import { useLogStore } from '../store/logStore';
import AnalyzerSelector from './AnalyzerSelector.vue';
import LogUploader from './LogUploader.vue';
import LogTimeline from './LogTimeline.vue';
import AnalysisProgress from './AnalysisProgress.vue';

const store = useLogStore();

// Estado local para los errores de sintaxis encontrados por el parser
const parseErrors = ref<{ line: number; reason: string; content: string }[]>([]);

// UI: Determina si mostrar carga o resultados
const showUploader = computed(() => store.events.length === 0);

/**
 * Procesa los logs usando la acción asíncrona del store
 */
const handleLogProcess = async (payload: string) => {
  parseErrors.value = [];

  try {
    // Llamamos a la acción del store que maneja el progreso
    const result = await store.setLogs(payload);
    parseErrors.value = result.errors; 

    if (result.events.length > 0) {
      toast.success(`Análisis completo: ${result.events.length} eventos procesados.`);
      nextTick().then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    } else {
      toast.error("No se encontraron eventos válidos en el rastro.");
    }
  } catch (e) {
    toast.error("Ocurrió un error crítico durante el análisis.");
    console.error(e);
  }
};

const analyzerNames = {
  checkout: 'Checkout',
  micrositios: 'Micrositios',
  rest: 'REST API'
};

const currentAnalyzerName = computed(() => analyzerNames[store.currentAnalyzer]);

const handleReset = () => {
  store.clearLogs();
  parseErrors.value = []; 
  toast.info("Espacio de trabajo reiniciado");
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
            Configuración activa: <b>{{ currentAnalyzerName }}</b>.
          </p>
        </div>

        <div class="max-w-2xl mx-auto">
          <AnalyzerSelector />
        </div>
  
        <LogUploader @process="handleLogProcess" />

        <div v-if="parseErrors.length > 0" class="animate-in fade-in slide-in-from-top-4 duration-500">
          <div class="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400/80">
            <div class="p-2 bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 class="font-mono text-sm uppercase tracking-widest font-bold">Líneas no reconocidas</h2>
          </div>
          
          <div class="bg-white dark:bg-red-500/5 border border-slate-200 dark:border-red-500/10 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
            <table class="w-full text-left font-mono text-[11px]">
              <thead class="bg-slate-50 dark:bg-red-500/10 text-slate-500 dark:text-red-300/60 uppercase tracking-tighter text-[10px]">
                <tr>
                  <th class="px-6 py-3 border-b border-slate-100 dark:border-red-500/10 w-20">Línea</th>
                  <th class="px-6 py-3 border-b border-slate-100 dark:border-red-500/10">Error</th>
                  <th class="px-6 py-3 border-b border-slate-100 dark:border-red-500/10">Contenido</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-red-500/10">
                <tr v-for="err in parseErrors.slice(0, 10)" :key="err.line" class="hover:bg-slate-50 dark:hover:bg-red-500/2 transition-colors">
                  <td class="px-6 py-3 text-red-600 dark:text-red-400/80 font-bold">#{{ err.line }}</td>
                  <td class="px-6 py-3 text-slate-600 dark:text-red-200/50 italic">{{ err.reason }}</td>
                  <td class="px-6 py-3 text-xs opacity-60 truncate max-w-xs">{{ err.content }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else key="results" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            <p class="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-widest">Total Eventos</p>
            <p class="text-2xl font-black text-indigo-600 dark:text-indigo-400">{{ store.stats.total }}</p>
          </div>
          <div class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            <p class="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-widest">Errores</p>
            <p class="text-2xl font-black text-red-600 dark:text-red-400">{{ store.stats.errors }}</p>
          </div>
          <div class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            <p class="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-widest">Analizador Activo</p>
            <p class="text-2xl font-black text-slate-700 dark:text-slate-200">{{ currentAnalyzerName }}</p>
          </div>
        </div>

        <LogTimeline @reset="handleReset" />
      </div>

    </transition>
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