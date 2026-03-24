<script setup lang="ts">
import { computed, ref } from "vue";
import { APP_TYPES } from "../../shared/types";
import type { ActiveFilterInfo, LogEvent } from "../../shared/types";
import { getFilterIdentity, isMatch } from "../../shared/ui/LogUIHelper";
import { useLogStore } from "../../store/logStore";

import SessionFunnelReport from "../../domains/checkout/components/SessionFunnelReport.vue";
import ParsingErrorsModal from "./ParsingErrorsModal.vue";
import TimelineGroup from "./timeline/TimelineGroup.vue";
import TimelineHeader from "./timeline/TimelineHeader.vue";

const store = useLogStore();
const showErrorsModal = ref(false);
const showFunnel = ref(false);
const showSessionPanel = ref(true);
const MAX_INITIAL_GROUPS = 40;

const timelineGroups = computed(() => {
	const groups = store.groupedEvents ? Object.values(store.groupedEvents) : [];
	return groups.slice(0, MAX_INITIAL_GROUPS);
});

const activeFilterInfo = computed<ActiveFilterInfo | null>(() => {
	if (!store.highlightedSessionId) return null;
	const targetId = String(store.highlightedSessionId);
	const match = store.events.find((e) => isMatch(e, targetId));

	if (!match) return { label: "ID", color: "orange", value: targetId };

	const identity = getFilterIdentity(match, targetId);
	return { label: identity.label, color: identity.colorClass, value: targetId };
});

const isLogHighlighted = (event: LogEvent) => {
	if (!store.highlightedSessionId) return false;
	return isMatch(event, String(store.highlightedSessionId));
};

const handleSessionFromFunnel = (sessionId: string | number) => {
	store.highlightedSessionId = sessionId;
	store.search = "";
	showFunnel.value = false;
};

const hasSessionFilter = computed(() => {
	return store.activeTab === APP_TYPES.CHECKOUT && store.sessionIds.length > 1;
});

const setSessionFilter = (sessionId: string | null) => {
	store.sessionFilter = sessionId;
	store.highlightedSessionId = null;
	store.search = "";
};

const currentSessionIndex = computed(() => {
	if (!store.sessionFilter) return -1;
	return store.sessionIds.indexOf(store.sessionFilter);
});

const navigateSession = (direction: "prev" | "next") => {
	const idx = currentSessionIndex.value;
	if (direction === "prev" && idx > 0) {
		setSessionFilter(store.sessionIds[idx - 1]);
	} else if (direction === "next" && idx < store.sessionIds.length - 1) {
		setSessionFilter(store.sessionIds[idx + 1]);
	}
};

const sessionEventCount = (sid: string) => {
	return store.events.filter((e) => {
		const details = e.details as Record<string, unknown>;
		return String(details?.sessionId) === sid;
	}).length;
};
</script>

<template>
  <div class="flex h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden bg-slate-50/30 dark:bg-transparent rounded-2xl border border-slate-200/50 dark:border-white/5">
    
    <!-- EXPLORER SIDEBAR (LEFT) -->
    <transition name="slide-panel">
      <aside v-if="hasSessionFilter && showSessionPanel" 
             class="w-64 shrink-0 border-r border-slate-200 dark:border-white/5 bg-[#fafafa]/90 dark:bg-[#0a0a0b]/90 backdrop-blur-xl flex flex-col overflow-hidden z-20 shadow-[4px_0_24px_rgba(0,0,0,0.03)]">
        
        <div class="flex items-center justify-between px-4 py-4 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span class="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">Session Explorer</span>
          </div>
          <button @click="showSessionPanel = false" class="p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 relative">
          <button 
            @click="setSessionFilter(null)"
            class="w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-between shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            :class="!store.sessionFilter
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
              : 'bg-white dark:bg-[#131315] text-slate-500 border-slate-200 dark:border-white/5 hover:border-indigo-400/50 hover:bg-slate-50 dark:hover:bg-[#1a1b1e]'"
          >
            <span>All Sessions</span>
            <span class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-black/30 text-[9px] font-bold border border-slate-200 dark:border-white/5" :class="!store.sessionFilter ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'">{{ store.sessionIds.length }}</span>
          </button>

          <div class="h-px bg-slate-200/50 dark:bg-white/5 my-3 mx-2"></div>

          <button
            v-for="sid in store.sessionIds" :key="sid"
            @click="setSessionFilter(sid)"
            class="w-full text-left p-3.5 rounded-xl transition-all border group/sid relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            :class="store.sessionFilter === sid 
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-indigo-400 scale-[1.02] z-10'
              : 'bg-white dark:bg-[#131315] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-indigo-400/50 hover:shadow-md shadow-sm'"
          >
            <div class="flex items-center justify-between relative z-10">
              <span class="font-mono text-xs font-bold truncate w-2/3">{{ sid }}</span>
              <span class="text-[9px] font-black shrink-0 px-2 py-0.5 rounded-lg transition-colors border"
                    :class="store.sessionFilter === sid ? 'bg-indigo-400/30 text-white border-white/20' : 'bg-slate-100/50 dark:bg-black/30 text-slate-400 border-slate-200/50 dark:border-white/5 group-hover/sid:bg-indigo-50 dark:group-hover/sid:bg-indigo-500/10 group-hover/sid:text-indigo-500 group-hover/sid:border-indigo-500/20'">
                {{ sessionEventCount(sid) }}
              </span>
            </div>
          </button>
        </div>
      </aside>
    </transition>

    <!-- FAB TO OPEN SIDEBAR -->
    <button v-if="hasSessionFilter && !showSessionPanel" 
            @click="showSessionPanel = true"
            class="absolute top-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-[#161618]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:border-indigo-500/50 hover:shadow-indigo-500/20 transition-all hover:scale-105 group slide-in-from-left-4 animate-in">
      <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
      Explorer
      <span class="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[9px]">{{ store.sessionIds.length }}</span>
    </button>

    <!-- MAIN CONTENT AREA -->
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
        
        <!-- STICKY ACTIVE SESSION PILL -->
        <div v-if="hasSessionFilter && store.sessionFilter" 
             class="sticky top-6 left-0 right-0 mx-auto w-max z-30 flex items-center gap-4 px-2 py-1.5 bg-white/80 dark:bg-[#161618]/80 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.08)] border border-slate-200 dark:border-white/10 mb-8 animate-in slide-in-from-top-4">
          
          <div class="flex items-center">
            <button @click="navigateSession('prev')" :disabled="currentSessionIndex <= 0"
                    class="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>

          <div class="flex items-center gap-2.5 px-2">
            <div class="flex h-2 w-2 relative">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
               <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:block">Session Focus:</span>
            <span class="font-mono text-[13px] font-bold text-indigo-600 dark:text-indigo-400 tracking-tight select-all">{{ store.sessionFilter }}</span>
            <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-[10px] text-slate-500 font-bold ml-1 border border-slate-200 dark:border-white/5">
              {{ currentSessionIndex + 1 }} / {{ store.sessionIds.length }}
            </span>
          </div>

          <div class="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-2">
            <button @click="navigateSession('next')" :disabled="currentSessionIndex >= store.sessionIds.length - 1"
                    class="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button @click="setSessionFilter(null)" 
                    class="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/30 text-[9px] font-black uppercase tracking-widest text-slate-500 transition-all active:scale-95 border border-transparent mr-1">
              Clear
            </button>
          </div>
        </div>

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