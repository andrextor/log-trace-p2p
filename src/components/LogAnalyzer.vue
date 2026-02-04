<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { useLogStore } from '../store/logStore';
import LogCard from './LogCard.vue';
import LogUploader from './LogUploader.vue';
import { parseP2PLogs } from '../logic/parser';

const store = useLogStore();

// Usamos computed para que la reactividad de la UI sea instantánea y confiable
const showUploader = computed(() => store.events.length === 0);

const handleLogProcess = async (payload: string) => {
  console.log("%c 🚀 EVENTO CAPTURADO ", "background: #4f46e5; color: white; padding: 5px; font-weight: bold; border-radius: 4px;");
  
  if (!payload) return;

  try {
    // 1. Validamos que el parseo sea exitoso antes de tocar el store
    const dataParsed = parseP2PLogs(payload);
    console.log(`📦 Parser: ${dataParsed.length} eventos detectados.`);
    
    if (dataParsed.length > 0) {
      // 2. Actualizamos el store
      store.setLogs(payload); 
      
      // 3. Opcional: Scroll suave hacia arriba al cargar
      await nextTick();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log("✅ Visualización lista.");
    } else {
      alert("No se encontraron eventos válidos en este archivo de log.");
    }
  } catch (error) {
    console.error("❌ Error procesando el rastro:", error);
    alert("Hubo un error al procesar el archivo. Revisa la consola.");
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-10 min-h-screen">
    
    <transition name="fade" mode="out-in">
      <div v-if="showUploader" key="uploader">
        <LogUploader @process="handleLogProcess" />
      </div>

      <div v-else key="results" class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div class="sticky top-20 z-40 bg-[#0a0a0b]/80 backdrop-blur-md p-4 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="relative w-full">
              <span class="absolute left-3 top-2.5 text-gray-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input 
                v-model="store.search" 
                placeholder="Filtrar por Session ID, Mensaje o ID..." 
                class="w-full md:w-80 bg-white/5 border border-white/10 px-10 py-2 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span class="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              Eventos: <b class="text-indigo-400">{{ store.filteredEvents.length }}</b>
            </span>
            <button 
              @click="store.clearLogs" 
              class="text-xs text-red-400 font-mono hover:bg-red-500/10 px-4 py-2 rounded-lg border border-red-400/20 uppercase tracking-widest transition-all cursor-pointer active:scale-95"
            >
              [ Resetear ]
            </button>
          </div>
        </div>

        <div class="relative pl-8 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-linear-to-b before:from-indigo-500/40 before:via-indigo-500/10 before:to-transparent">
          
          <div v-for="(logs, timeBlock) in store.groupedEvents" :key="timeBlock" class="relative mb-12">
            <div class="absolute -left-8 mt-1.5 w-6 h-6 rounded-full bg-[#0a0a0b] border-2 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] z-10 flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
            </div>
            
            <div class="flex items-center gap-4 mb-6">
              <h3 class="text-[11px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20 tracking-widest uppercase">
                {{ timeBlock }}
              </h3>
              <div class="h-px flex-1 bg-white/5"></div>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <LogCard 
                v-for="(event, index) in logs" 
                :key="event.id + index" 
                :log="event"
                :is-highlighted="store.highlightedSessionId === event.details.sessionId"
                @highlight-session="store.toggleHighlight"
              />
            </div>
          </div>
        </div>

        <div v-if="store.filteredEvents.length === 0" class="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
          <p class="text-gray-500 font-mono text-sm">No hay coincidencias para tu búsqueda.</p>
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