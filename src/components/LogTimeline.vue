<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLogStore } from '../store/logStore';
import { MapperFactory } from '../logic/mappers/MapperFactory';

// Sub-componentes
import TimelineHeader from './timeline/TimelineHeader.vue';
import TimelineGroup from './timeline/TimelineGroup.vue';
import ParsingErrorsModal from './ParsingErrorsModal.vue';
import SessionFunnelReport from './funnels/SessionFunnelReport.vue';

const store = useLogStore();
const showErrorsModal = ref(false);
const showFunnel = ref(false); 
const MAX_INITIAL_GROUPS = 40;

/**
 * Agrupación de eventos para el Timeline técnico
 */
const timelineGroups = computed(() => {
  const groups = store.groupedEvents ? Object.values(store.groupedEvents) : [];
  return groups.slice(0, MAX_INITIAL_GROUPS);
});

/**
 * Información visual del filtro activo (Badge superior)
 */
const activeFilterInfo = computed(() => {
  if (!store.highlightedSessionId) return null;
  const targetId = String(store.highlightedSessionId);
  const match = store.events.find(e => MapperFactory.getMapper(e.appType).isMatch(e, targetId));
  
  if (!match) return { label: 'ID', color: 'orange', value: targetId };

  const mapper = MapperFactory.getMapper(match.appType);
  const identity = mapper.getFilterIdentity(match, targetId);
  return { label: identity.label, color: identity.colorClass, value: targetId };
});

/**
 * Determina si una card debe brillar
 */
const isLogHighlighted = (event: any) => {
  if (!store.highlightedSessionId) return false;
  return MapperFactory.getMapper(event.appType).isMatch(event, String(store.highlightedSessionId));
};

/**
 * NAVEGACIÓN INTELIGENTE:
 * Al seleccionar una sesión en el Funnel, activamos el rastro técnico
 * pero dejamos el buscador libre para palabras clave (error, json, etc).
 */
const handleSessionFromFunnel = (sessionId: string | number) => {
  // 1. Activamos el resaltado/filtro por ID de sesión en el store
  store.highlightedSessionId = sessionId;
  
  // 2. Limpiamos cualquier búsqueda previa para ver la sesión completa
  store.search = ''; 
  
  // 3. Cerramos el funnel para saltar automáticamente a los logs
  showFunnel.value = false;
};
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
    
    <TimelineHeader 
      v-model:search="store.search"
      :active-filter-info="activeFilterInfo"
      :visible-count="store.filteredEvents.length"
      :is-funnel-visible="showFunnel"
      @clearSearch="store.search = ''"
      @clearFilter="store.highlightedSessionId = null"
      @toggleFunnel="showFunnel = !showFunnel"
    />

    <div class="flex-1 overflow-y-auto px-2 md:px-4 custom-scrollbar scroll-smooth pb-20">
      
      <transition name="fade" mode="out-in">
        
        <div v-if="showFunnel" key="funnel" class="max-w-6xl mx-auto py-4">
          <SessionFunnelReport @filter-session="handleSessionFromFunnel" />
        </div>

        <div v-else key="timeline" class="relative max-w-5xl mx-auto py-4">
          <div class="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10 transform -translate-x-1/2 hidden md:block"></div>

          <TimelineGroup 
            v-for="(group, index) in timelineGroups" 
            :key="group.timeKey"
            :group="group"
            :index="index"
            :highlighted-id="store.highlightedSessionId"
            :is-log-highlighted="isLogHighlighted"
            @highlight-session="store.toggleHighlight"
          />
          
          <div v-if="timelineGroups.length === 0" class="flex flex-col items-center justify-center py-24 opacity-40">
            <svg class="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="text-xs font-black uppercase tracking-[0.3em]">Sin coincidencias en el rastro</span>
          </div>
        </div>

      </transition>
    </div>

    <ParsingErrorsModal 
      :is-open="showErrorsModal" 
      :errors="store.parsingErrors" 
      @close="showErrorsModal = false" 
    />
  </div>
</template>

<style scoped>
/* Transición suave para el cambio de vista */
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}

/* Scrollbar personalizado con el color índigo de la marca */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(99, 102, 241, 0.15); 
  border-radius: 10px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: rgba(99, 102, 241, 0.3); 
}
</style>