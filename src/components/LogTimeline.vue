<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLogStore } from '../store/logStore';
import { MapperFactory } from '../logic/mappers/MapperFactory';

// Sub-componentes
import TimelineHeader from './timeline/TimelineHeader.vue';
import TimelineGroup from './timeline/TimelineGroup.vue';
import ParsingErrorsModal from './ParsingErrorsModal.vue';

// --- 1. NUEVO: Importamos el reporte del funnel ---
import SessionFunnelReport from './funnels/SessionFunnelReport.vue';

const store = useLogStore();
const showErrorsModal = ref(false);
const showFunnel = ref(false); // <-- NUEVO: Variable para abrir/cerrar el panel
const MAX_INITIAL_GROUPS = 40;

const timelineGroups = computed(() => {
  const groups = store.groupedEvents ? Object.values(store.groupedEvents) : [];
  return groups.slice(0, MAX_INITIAL_GROUPS);
});

const activeFilterInfo = computed(() => {
  if (!store.highlightedSessionId) return null;
  const targetId = String(store.highlightedSessionId);
  const match = store.events.find(e => MapperFactory.getMapper(e.appType).isMatch(e, targetId));
  if (!match) return { label: 'ID', color: 'orange', value: targetId };

  const mapper = MapperFactory.getMapper(match.appType);
  const identity = mapper.getFilterIdentity(match, targetId);
  return { label: identity.label, color: identity.colorClass, value: targetId };
});

const isLogHighlighted = (event: any) => {
  if (!store.highlightedSessionId) return false;
  return MapperFactory.getMapper(event.appType).isMatch(event, String(store.highlightedSessionId));
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

    <transition name="slide-fade">
      <div v-if="showFunnel" class="mb-4 shrink-0">
        <SessionFunnelReport />
      </div>
    </transition>

    <div class="flex-1 overflow-y-auto px-2 md:px-4 custom-scrollbar scroll-smooth pb-20">
      <div class="relative max-w-5xl mx-auto py-4">
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
      </div>
    </div>

    <ParsingErrorsModal :is-open="showErrorsModal" :errors="store.parsingErrors" @close="showErrorsModal = false" />
  </div>
</template>

<style scoped>
/* Las animaciones de transición se mantienen aquí por ser globales del módulo */
.scale-enter-active, .scale-leave-active { transition: all 0.2s ease; }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.9); }

/* --- NUEVO: Animación para que el Funnel baje suavemente --- */
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
</style>