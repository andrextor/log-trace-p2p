<script setup lang="ts">
import { computed, ref } from "vue";
import { useLogStore } from "../../../store/logStore";
import { useCheckoutSessions } from "../composables/useCheckoutSessions";

import ParsingErrorsModal from "../../../shared/components/ParsingErrorsModal.vue";
import TimelineGroup from "../../../shared/components/timeline/TimelineGroup.vue";
import TimelineHeader from "../../../shared/components/timeline/TimelineHeader.vue";
import SessionExplorer from "./SessionExplorer.vue";
import SessionFocusPill from "./SessionFocusPill.vue";
import SessionFunnelReport from "./SessionFunnelReport.vue";

const store = useLogStore();
const showErrorsModal = ref(false);
const showFunnel = ref(false);
const showSessionPanel = ref(true);
const MAX_INITIAL_GROUPS = 40;

const { activeFilterInfo, isLogHighlighted, hasSessionFilter } =
	useCheckoutSessions();

const timelineGroups = computed(() => {
	const groups = store.groupedEvents ? Object.values(store.groupedEvents) : [];
	return groups.slice(0, MAX_INITIAL_GROUPS);
});

const handleSessionFromFunnel = (sessionId: string | number) => {
	store.highlightedSessionId = sessionId;
	store.search = "";
	showFunnel.value = false;
};
</script>

<template>
  <div class="flex h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden bg-slate-50/30 dark:bg-transparent rounded-2xl border border-slate-200/50 dark:border-white/5">
    
    <SessionExplorer v-model:show="showSessionPanel" />

    <button v-if="hasSessionFilter && !showSessionPanel" 
            @click="showSessionPanel = true"
            class="absolute top-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-[#161618]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:border-indigo-500/50 hover:shadow-indigo-500/20 transition-all hover:scale-105 group slide-in-from-left-4 animate-in">
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
          <div v-if="showFunnel" key="funnel" class="max-w-6xl mx-auto py-4">
            <SessionFunnelReport @filter-session="handleSessionFromFunnel" />
          </div>

          <div v-else key="timeline" class="relative max-w-5xl mx-auto py-4">
            <div class="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-white/10 to-transparent transform -translate-x-1/2 hidden md:block"></div>

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
              <span class="text-xs font-black uppercase tracking-[0.3em]">No matching traces</span>
            </div>
          </div>
        </transition>
      </div>

      <SessionFocusPill />
    </div>

    <ParsingErrorsModal 
      :is-open="showErrorsModal" 
      :errors="store.parsingErrors" 
      @close="showErrorsModal = false" 
    />
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