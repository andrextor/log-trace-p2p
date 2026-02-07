<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLogStore } from '../store/logStore';
import { MapperFactory } from '../logic/mappers/MapperFactory';
import LogCard from './LogCard.vue';
import LogExporter from './LogExporter.vue';
import ParsingErrorsModal from './ParsingErrorsModal.vue';

const store = useLogStore();
const showErrorsModal = ref(false);

const MAX_INITIAL_GROUPS = 40;

const timelineGroups = computed(() => {
  const groups = store.groupedEvents ? Object.values(store.groupedEvents) : [];
  return groups.slice(0, MAX_INITIAL_GROUPS);
});

/**
 * Lógica para identificar el tipo de filtro activo y mostrarlo en el header
 */
const activeFilterInfo = computed(() => {
  if (!store.highlightedSessionId) return null;
  
  const targetId = String(store.highlightedSessionId);
  const match = store.events.find(e => 
    MapperFactory.getMapper(e.appType).isMatch(e, targetId)
  );

  if (!match) return { label: 'ID', color: 'orange' };

  const mapper = MapperFactory.getMapper(match.appType);
  const identity = mapper.getFilterIdentity(match, targetId);
  
  return {
    label: identity.label,
    color: identity.colorClass,
    value: targetId
  };
});

const clearSearch = () => { store.search = ''; };
const clearIdentityFilter = () => { store.highlightedSessionId = null; };

const isLogHighlighted = (event: any) => {
  if (!store.highlightedSessionId) return false;
  const mapper = MapperFactory.getMapper(event.appType);
  return mapper.isMatch(event, String(store.highlightedSessionId));
};
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
    
    <header class="shrink-0 mb-6 bg-white/90 dark:bg-[#0a0a0b]/90 backdrop-blur-md p-3 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm z-30 sticky top-0 transition-all">
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="flex flex-wrap items-center gap-2 flex-1 md:w-auto">
          <div class="relative group min-w-60">
            <span class="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input v-model="store.search" placeholder="Filtrar eventos..." class="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 pl-9 pr-8 py-2 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all" />
            <button v-if="store.search" @click="clearSearch" class="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <Transition name="scale">
            <div v-if="activeFilterInfo" 
                 class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all shadow-sm"
                 :class="activeFilterInfo.color === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'">
              <span class="opacity-70 uppercase tracking-tighter text-[9px]">{{ activeFilterInfo.label }}:</span>
              <span class="font-mono truncate max-w-30">{{ activeFilterInfo.value }}</span>
              <button @click="clearIdentityFilter" class="hover:scale-110 transition-transform ml-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <LogExporter />
        <div class="text-right">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Visibles</p>
          <p class="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ store.filteredEvents.length }}</p>
        </div>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto px-2 md:px-4 custom-scrollbar scroll-smooth pb-20">
      <div class="relative max-w-5xl mx-auto py-4">
        
        <div class="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10 transform -translate-x-1/2 hidden md:block"></div>

        <section 
          v-for="(group, index) in timelineGroups"  :key="group.timeKey"
          class="relative mb-20 flex flex-col group/block"
          :class="[ index % 2 === 0 ? 'md:items-start' : 'md:items-end' ]"
        >
          <div class="sticky top-2 z-20 hidden md:block self-center mb-8">
            <div class="bg-white/95 dark:bg-[#0a0a0b]/95 border border-slate-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md transition-transform group-hover/block:scale-105">
              {{ group.label }} • <span class="font-mono">{{ group.timeDisplay }}</span>
            </div>
          </div>
          
          <div class="md:hidden w-full flex items-center gap-2 mb-6 sticky top-0 bg-white/95 dark:bg-[#161618]/95 backdrop-blur z-10 py-3 border-b border-slate-100 dark:border-white/5">
            <span class="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm">{{ group.label }}</span>
            <span class="text-xs font-mono font-bold text-slate-500">{{ group.timeDisplay }}</span>
          </div>

          <div class="w-full md:w-[46%] space-y-5 relative"
               :class="[ index % 2 === 0 ? 'animate-in slide-in-from-left-6' : 'animate-in slide-in-from-right-6' ]">
            
            <div class="absolute top-10 w-4 h-4 rounded-full border-4 border-white dark:border-[#030304] bg-slate-200 dark:bg-slate-800 group-hover/block:bg-indigo-500 group-hover/block:scale-125 transition-all z-10 hidden md:block"
              :class="[ index % 2 === 0 ? '-right-[8.7%] translate-x-1/2' : '-left-[8.7%] -translate-x-1/2' ]">
            </div>

            <LogCard v-for="event in group.events" :key="event.id" :log="event"
              :is-highlighted="isLogHighlighted(event)"
              @highlight-session="store.toggleHighlight" />
          </div>
        </section>
      </div>
    </div>

    <ParsingErrorsModal :is-open="showErrorsModal" :errors="store.parsingErrors" @close="showErrorsModal = false" />
  </div>
</template>

<style scoped>
/* Animación para que la chip aparezca suavemente */
.scale-enter-active, .scale-leave-active { transition: all 0.2s ease; }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.9); }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
</style>