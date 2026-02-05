<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { toast, Toaster } from 'vue-sonner';
import "vue-sonner/style.css"; 
import { useLogStore } from '../store/logStore';
import LogCard from './LogCard.vue';
import LogUploader from './LogUploader.vue';

const store = useLogStore();

// Estado local para el reporte de diagnóstico
const parseErrors = ref<{ line: number; reason: string; content: string }[]>([]);
const showUploader = computed(() => store.events.length === 0);

/**
 * Procesa el rastro delegando el parseo al Store
 */
const handleLogProcess = async (payload: string) => {
  parseErrors.value = [];

  const promise = () => new Promise((resolve, reject) => {
    try {
      // El store devuelve { events, errors }
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

const handleReset = () => {
  store.clearLogs();
  parseErrors.value = []; 
  toast.info("Espacio de trabajo limpio");
};
</script>

<template>
  <Toaster position="top-right" richColors theme="dark" />

  <div class="max-w-6xl mx-auto px-6 py-10 min-h-screen">
    <transition name="fade" mode="out-in">
      
      <div v-if="showUploader" key="uploader" class="space-y-10">
        <LogUploader @process="handleLogProcess" />

        <div v-if="parseErrors.length > 0" class="animate-in fade-in slide-in-from-top-4 duration-500">
          <div class="flex items-center gap-3 mb-4 text-red-400">
            <div class="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 class="font-mono text-sm uppercase tracking-widest font-bold">Reporte de Parseo</h2>
          </div>
          
          <div class="bg-red-500/5 border border-red-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            <table class="w-full text-left font-mono text-[11px]">
              <thead class="bg-red-500/10 text-red-300/80 uppercase tracking-tighter text-[10px]">
                <tr>
                  <th class="px-6 py-3 border-b border-red-500/10 w-20">Línea</th>
                  <th class="px-6 py-3 border-b border-red-500/10">Descripción</th>
                  <th class="px-6 py-3 border-b border-red-500/10">Contenido</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-red-500/10">
                <tr v-for="err in parseErrors.slice(0, 10)" :key="err.line" class="hover:bg-red-500/[0.02] transition-colors">
                  <td class="px-6 py-3 text-red-400 font-bold">#{{ err.line }}</td>
                  <td class="px-6 py-3 text-red-200/60 italic">{{ err.reason }}</td>
                  <td class="px-6 py-3">
                    <code class="text-red-300/40 bg-red-950/30 px-2 py-0.5 rounded truncate block max-w-md">
                      {{ err.content }}
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else key="results" class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div class="sticky top-20 z-40 bg-[#0a0a0b]/80 backdrop-blur-md p-4 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="relative w-full">
              <span class="absolute left-3 top-2.5 text-gray-500">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input v-model="store.search" placeholder="Filtrar por SID, Mensaje o ID..." class="w-full md:w-80 bg-white/5 border border-white/10 px-10 py-2 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              Eventos: <b class="text-indigo-400">{{ store.filteredEvents.length }}</b>
            </span>
            <button @click="handleReset" class="text-xs text-red-400 font-mono hover:bg-red-500/10 px-4 py-2 rounded-lg border border-red-400/20 uppercase tracking-widest transition-all">
              [ Resetear ]
            </button>
          </div>
        </div>

        <div class="relative pl-8 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-linear-to-b before:from-indigo-500/40 before:via-indigo-500/10 before:to-transparent">
          <div v-for="(logs, timeBlock) in store.groupedEvents" :key="timeBlock" class="relative mb-12">
            <div class="absolute -left-8 mt-1.5 w-6 h-6 rounded-full bg-[#0a0a0b] border-2 border-indigo-500 z-10 flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
            </div>
            <div class="flex items-center gap-4 mb-6">
              <h3 class="text-[11px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20 tracking-widest uppercase">{{ timeBlock }}</h3>
              <div class="h-px flex-1 bg-white/5"></div>
            </div>
            <div class="grid grid-cols-1 gap-4">
              <LogCard v-for="(event, index) in logs" :key="event.id + index" :log="event" :is-highlighted="store.highlightedSessionId === event.details.sessionId" @highlight-session="store.toggleHighlight" />
            </div>
          </div>
        </div>
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