<script setup lang="ts">
import { useLogStore } from '../store/logStore';
import LogCard from './LogCard.vue';

const store = useLogStore();
const emit = defineEmits(['reset']);
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <div class="shrink-0 mb-6 bg-white dark:bg-[#0a0a0b] p-4 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm transition-colors">
      <div class="flex items-center gap-4 w-full md:w-auto">
        <div class="relative w-full">
          <span class="absolute left-3 top-2.5 text-slate-400 dark:text-gray-500">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            v-model="store.search" 
            placeholder="Filtrar por SID, Mensaje o ID..." 
            class="w-full md:w-80 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-10 py-2 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600" 
          />
        </div>
      </div>

      <div class="flex items-center gap-4">
        <span class="text-[10px] font-mono text-slate-500 dark:text-gray-500 uppercase tracking-widest">
          Eventos Filtrados: <b class="text-indigo-600 dark:text-indigo-400">{{ store.filteredEvents.length }}</b>
        </span>
        
        <button 
          @click="emit('reset')" 
          class="text-xs text-red-500 dark:text-red-400 font-mono hover:bg-red-500/10 px-4 py-2 rounded-lg border border-red-400/20 uppercase tracking-widest transition-all cursor-pointer active:scale-95 font-bold"
        >
          [ Limpiar logs ]
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-4 custom-scrollbar scroll-smooth">
      <div class="relative pl-8 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-linear-to-b before:from-indigo-500/40 before:via-indigo-500/10 dark:before:via-indigo-500/10 before:to-transparent">
        
        <div v-for="(data, timeKey) in store.groupedEvents" :key="timeKey" class="relative mb-12">
          
          <div class="absolute -left-8 mt-1.5 w-6 h-6 rounded-full bg-slate-50 dark:bg-[#0a0a0b] border-2 border-indigo-500 z-10 flex items-center justify-center shadow-sm">
            <div class="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse"></div>
          </div>
          
          <div class="flex flex-col gap-1 mb-6 sticky top-0 z-10 py-2 bg-slate-50/90 dark:bg-[#030304]/90 backdrop-blur-sm transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-[9px] font-black text-white bg-indigo-600 dark:bg-indigo-500 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">
                {{ data.label }}
              </span>
              
              <h3 class="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                {{ timeKey }}
              </h3>
              
              <div class="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
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
          No se encontraron eventos en la zona horaria local.
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
  background: rgba(99, 102, 241, 0.1);
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
}
</style>