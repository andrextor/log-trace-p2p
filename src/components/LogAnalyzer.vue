<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { toast, Toaster } from 'vue-sonner';
import "vue-sonner/style.css"; 
import { useLogStore } from '../store/logStore';
import AnalyzerSelector from './AnalyzerSelector.vue';
import LogUploader from './LogUploader.vue';
import LogTimeline from './LogTimeline.vue';

const store = useLogStore();

// Estado local para los errores encontrados durante el parseo
const parseErrors = ref<{ line: number; reason: string; content: string }[]>([]);

// Determinamos si mostramos el cargador o la línea de tiempo
const showUploader = computed(() => store.events.length === 0);

/**
 * Gestiona el procesamiento del log delegando al store
 */
const handleLogProcess = async (payload: string) => {
  parseErrors.value = [];

  const promise = () => new Promise((resolve, reject) => {
    try {
      const { events, errors } = store.setLogs(payload);
      parseErrors.value = errors; 

      if (events.length > 0) {
        resolve({ count: events.length, errorCount: errors.length });
      } else {
        reject("No se extrajeron eventos válidos.");
      }
    } catch (e) {
      reject(e);
    }
  });

  toast.promise(promise, {
    loading: 'Analizando rastro de logs...',
    success: (data: any) => {
      nextTick().then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      return data.errorCount > 0 
        ? `Cargados ${data.count} eventos (${data.errorCount} errores de línea).`
        : `¡Éxito! ${data.count} eventos cargados.`;
    },
    error: (err: any) => `Error: ${err}`,
  });
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
  toast.info("Espacio de trabajo limpio");
};
</script>

<template>
  <Toaster 
    position="top-right" 
    richColors 
    theme="system" 
  />

  <div class="max-w-6xl mx-auto px-6 py-10 min-h-screen transition-colors duration-500">
    <transition name="fade" mode="out-in">
      
      <div v-if="showUploader" key="uploader" class="space-y-10">
        <div class="text-center space-y-3 mb-12">
           <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Analizador de <span class="text-indigo-600 dark:text-indigo-400">Trazas P2P</span>
          </h1>
          <p class="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm sm:text-base italic">
            Configuración de mapeo optimizada para {{ currentAnalyzerName }}.
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
            <h2 class="font-mono text-sm uppercase tracking-widest font-bold">Reporte de Errores de Parseo</h2>
          </div>
          
          <div class="bg-white dark:bg-red-500/5 border border-slate-200 dark:border-red-500/10 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
            <table class="w-full text-left font-mono text-[11px]">
              <thead class="bg-slate-50 dark:bg-red-500/10 text-slate-500 dark:text-red-300/60 uppercase tracking-tighter text-[10px]">
                <tr>
                  <th class="px-6 py-3 border-b border-slate-100 dark:border-red-500/10 w-20">Línea</th>
                  <th class="px-6 py-3 border-b border-slate-100 dark:border-red-500/10">Descripción</th>
                  <th class="px-6 py-3 border-b border-slate-100 dark:border-red-500/10">Contenido Parcial</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-red-500/10">
                <tr v-for="err in parseErrors.slice(0, 10)" :key="err.line" class="hover:bg-slate-50 dark:hover:bg-red-500/2 transition-colors">
                  <td class="px-6 py-3 text-red-600 dark:text-red-400/80 font-bold">#{{ err.line }}</td>
                  <td class="px-6 py-3 text-slate-600 dark:text-red-200/50 italic">{{ err.reason }}</td>
                  <td class="px-6 py-3">
                    <code class="text-red-700 dark:text-red-300/30 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded truncate block max-w-md font-mono">
                      {{ err.content }}
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="parseErrors.length > 10" class="p-3 bg-slate-50 dark:bg-red-500/5 border-t border-slate-100 dark:border-red-500/10 text-center text-[10px] text-slate-400 dark:text-red-400/40 uppercase tracking-widest font-bold">
              + {{ parseErrors.length - 10 }} errores adicionales detectados
            </div>
          </div>
        </div>
      </div>

      <LogTimeline v-else key="results" @reset="handleReset" />

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