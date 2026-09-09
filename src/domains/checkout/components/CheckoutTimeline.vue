<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useLogStore } from "../../../store/logStore";
import { useCheckoutSessions } from "../composables/useCheckoutSessions";

import TimelineGroup from "../../../shared/components/timeline/TimelineGroup.vue";
import TimelineHeader from "../../../shared/components/timeline/TimelineHeader.vue";
import SessionExplorer from "./SessionExplorer.vue";
import SessionFocusPill from "./SessionFocusPill.vue";
import SessionFunnelReport from "./SessionFunnelReport.vue";

const store = useLogStore();
const showFunnel = ref(false);
// En movil el panel se comeria la mitad del ancho, asi que arranca cerrado y
// se abre superpuesto; en escritorio sigue fijo al lado de la linea de tiempo.
// Se sigue el cambio de tamano, no solo el arranque: encoger la ventana con el
// panel abierto dejaba la linea de tiempo en un canal de cien pixeles.
const showSessionPanel = ref(false);
const desktop = "(min-width: 768px)";
let media: MediaQueryList | null = null;
const syncPanel = (e: MediaQueryList | MediaQueryListEvent) => {
	showSessionPanel.value = e.matches;
};

onMounted(() => {
	media = window.matchMedia(desktop);
	syncPanel(media);
	media.addEventListener("change", syncPanel);
});

onUnmounted(() => media?.removeEventListener("change", syncPanel));
const BATCH_SIZE = 40;
const visibleGroups = ref(BATCH_SIZE);

const { activeFilterInfo, isLogHighlighted, hasSessionFilter } =
	useCheckoutSessions();

const allGroups = computed(() => {
	return store.groupedEvents ? Object.values(store.groupedEvents) : [];
});

const timelineGroups = computed(() => {
	return allGroups.value.slice(0, visibleGroups.value);
});

const remainingGroups = computed(() => {
	return Math.max(0, allGroups.value.length - visibleGroups.value);
});

const loadMore = () => {
	visibleGroups.value = Math.min(
		visibleGroups.value + BATCH_SIZE,
		allGroups.value.length,
	);
};

const handleSessionFromFunnel = (sessionId: string | number) => {
	store.highlightedSessionId = sessionId;
	store.search = "";
	showFunnel.value = false;
};
</script>

<template>
  <div class="flex h-full min-h-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden bg-slate-50/30 dark:bg-transparent rounded-2xl border border-slate-200/50 dark:border-white/5">
    
    <SessionExplorer v-model:show="showSessionPanel" />

    <div
      v-if="showSessionPanel"
      @click="showSessionPanel = false"
      class="absolute inset-0 z-20 bg-slate-900/40 md:hidden"
    ></div>

    <button v-if="!showSessionPanel" 
            @click="showSessionPanel = true"
            class="absolute bottom-4 left-4 md:top-4 md:bottom-auto z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-[#161618]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:border-indigo-500/50 hover:shadow-indigo-500/20 transition-all hover:scale-105 group slide-in-from-left-4 animate-in">
      <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
      Explorer
      <span class="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[9px]">{{ store.sessionIds.length }}</span>
    </button>

    <div class="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-transparent relative">
      <TimelineHeader 
        v-model:search="store.search"
        :active-filter-info="activeFilterInfo"
        :visible-count="store.filteredEvents.length"
        :is-funnel-visible="showFunnel"
        @clearSearch="store.search = ''"
        @clearFilter="store.highlightedSessionId = null"
        @toggleFunnel="showFunnel = !showFunnel"
      />

      <div class="flex-1 overflow-y-auto px-2 md:px-4 custom-scrollbar scroll-smooth pb-20 relative">
        <transition name="fade" mode="out-in">
          <div v-if="showFunnel" key="funnel" class="w-full py-4">
            <SessionFunnelReport @filter-session="handleSessionFromFunnel" />
          </div>

          <div v-else key="timeline" class="relative w-full py-4">

            <TimelineGroup 
              v-for="(group, index) in timelineGroups" 
              :key="group.timeKey"
              :group="group"
              :index="index"
              :highlighted-id="store.highlightedSessionId"
              :is-log-highlighted="isLogHighlighted"
              @highlight-session="store.toggleHighlight"
            />

            <div v-if="remainingGroups > 0" class="flex justify-center py-8">
              <button
                @click="loadMore"
                class="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                </svg>
                Load {{ Math.min(BATCH_SIZE, remainingGroups) }} More Blocks
                <span class="text-[10px] opacity-60">({{ remainingGroups }} remaining)</span>
              </button>
            </div>
            
            <div v-if="timelineGroups.length === 0" class="flex flex-col items-center justify-center py-24 opacity-40">
              <svg class="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span class="text-xs font-black uppercase tracking-[0.3em]">No matching traces</span>
            </div>
          </div>
        </transition>
      </div>

      <SessionFocusPill />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}

.slide-panel-enter-active, .slide-panel-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-panel-enter-from, .slide-panel-leave-to {
  opacity: 0;
  transform: translateX(-100%);
  margin-left: -16rem; /* w-64 equivalent roughly to collapse width */
}

.animate-in {
  animation: fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(99, 102, 241, 0.2); 
  border-radius: 10px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: rgba(99, 102, 241, 0.4); 
}
</style>