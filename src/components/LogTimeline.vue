<script setup lang="ts">
import { useLogStore } from '../store/logStore';
import LogCard from './LogCard.vue';

const store = useLogStore();

/**
 * @back: Regresa al uploader sin tocar los datos.
 * @clearAll: Borra todo el historial del store.
 */
const emit = defineEmits(['back', 'clearAll']);
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <div class="shrink-0 mb-6 bg-white dark:bg-[#0a0a0b] p-4 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm transition-colors">
      
      <div class="flex items-center gap-4 w-full md:w-auto">
        <button 
          @click="emit('back')" 
          class="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-500/20 transition-all active:scale-95 group"
          title="Añadir más logs al análisis actual"
        >
          <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="text-xs font-bold uppercase tracking-tight">Añadir más logs</span>
        </button>

        <div class="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

        <div class="relative w-full">
          <span class="absolute left-3 top-2.5 text-slate-400 dark:text-gray-500">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            v-model="store.search" 
            placeholder="Filtrar por mensaje, ID..." 
            class="w-full md:w-64 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 px-10 py-2 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all" 
          />
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div class="text-right hidden sm:block">
          <p class="text-[10px] font-mono text-slate-400 dark:text-gray-500 uppercase tracking-widest">Vista actual</p>
          <p class="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {{ store.filteredEvents.length }} <span class="text-[10px] font-normal text-slate-400 uppercase">eventos</span>
          </p>
        </div>
        
        <button 
          @click="emit('clearAll')"
          class="flex items-center gap-2 p-2 px-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
          title="Borrar todos los logs actuales"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span class="text-[10px] font-bold uppercase hidden lg:inline">Reset</span>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-4 custom-scrollbar scroll-smooth">
      <div class="relative pl-8 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-linear-to-b before:from-indigo-500/40 before:via-indigo-500/10 dark:before:via-indigo-500/10 before:to-transparent">
        
        <div v-for="(data, timeKey) in store.groupedEvents" :key="timeKey" class="relative mb-12">
          
          <div class="absolute -left-8 mt-1.5 w-6 h-6 rounded-full bg-white dark:bg-[#0a0a0b] border-2 border-indigo-500 z-10 flex items-center justify-center shadow-sm">
            <div class="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse"></div>
          </div>
          
          <div class="flex flex-col gap-1 mb-6 sticky top-0 z-20 py-2 bg-slate-50/90 dark:bg-[#030304]/90 backdrop-blur-sm transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-[9px] font-black text-white bg-indigo-600 dark:bg-indigo-500 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">
                {{ data.label }}
              </span>
              <h3 class="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                {{ timeKey }}
              </h3>
              <div class="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
              <span class="text-[9px] font-mono text-slate-400">{{ data.events.length }} ops</span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <LogCard 
              v-for="event in data.events" 
              :key="event.id" 
              :log="event" 
              :is-highlighted="store.highlightedSessionId === event.details.sessionId"
              @highlight-session="store.toggleHighlight"
            />
          </div>
        </div>
      </div>

      <div v-if="store.filteredEvents.length === 0" class="py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
        <p class="text-slate-400 dark:text-gray-500 font-mono text-sm italic">
          No se encontraron resultados para esta búsqueda.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.4);
}
</style>