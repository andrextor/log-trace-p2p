<script setup lang="ts">
import { useLogStore } from '../store/logStore';
import LogCard from './LogCard.vue';

const store = useLogStore();

defineEmits(['reset']);
</script>

<template>
  <div class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="sticky top-20 z-40 bg-[#0a0a0b]/80 backdrop-blur-md p-4 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
      <div class="flex items-center gap-4 w-full md:w-auto">
        <div class="relative w-full">
          <span class="absolute left-3 top-2.5 text-gray-500">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            v-model="store.search" 
            placeholder="Filtrar por SID, Mensaje o ID..." 
            class="w-full md:w-80 bg-white/5 border border-white/10 px-10 py-2 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" 
          />
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          Eventos: <b class="text-indigo-400">{{ store.filteredEvents.length }}</b>
        </span>
        <button 
          @click="$emit('reset')" 
          class="text-xs text-red-400 font-mono hover:bg-red-500/10 px-4 py-2 rounded-lg border border-red-400/20 uppercase tracking-widest transition-all"
        >
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
      <p class="text-gray-500 font-mono text-sm italic">No se encontraron eventos que coincidan con los filtros.</p>
    </div>
  </div>
</template>