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
  <div class="flex h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
    
    <div class="flex-1 flex flex-col min-w-0">
      <TimelineHeader 
        v-model:search="store.search"
        :active-filter-info="activeFilterInfo"
        :visible-count="store.filteredEvents.length"
        :is-funnel-visible="showFunnel"
        @clearSearch="store.search = ''"
        @clearFilter="store.highlightedSessionId = null"
        @toggleFunnel="showFunnel = !showFunnel"
      />

      <div v-if="hasSessionFilter && store.sessionFilter" class="flex items-center justify-between px-4 py-1.5 bg-indigo-500/5 dark:bg-indigo-500/10 border-b border-indigo-500/10">
        <div class="flex items-center gap-3">
          <button @click="navigateSession('prev')" :disabled="currentSessionIndex <= 0"
                  class="p-1 rounded hover:bg-indigo-500/10 text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div class="flex items-center gap-2">
            <span class="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Session</span>
            <span class="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{{ store.sessionFilter }}</span>
            <span class="text-[9px] text-slate-400 font-bold">({{ currentSessionIndex + 1 }}/{{ store.sessionIds.length }})</span>
          </div>
          <button @click="navigateSession('next')" :disabled="currentSessionIndex >= store.sessionIds.length - 1"
                  class="p-1 rounded hover:bg-indigo-500/10 text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <button @click="setSessionFilter(null)" class="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">
          Show All
        </button>
      </div>

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
              <span class="text-xs font-black uppercase tracking-[0.3em]">No matching traces</span>
            </div>
          </div>

        </transition>
      </div>
    </div>

    <transition name="slide-panel">
      <aside v-if="hasSessionFilter && showSessionPanel" 
             class="w-52 shrink-0 border-l border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#0a0a0b]/50 backdrop-blur-sm flex flex-col overflow-hidden">
        
        <div class="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-white/5">
          <div class="flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sessions</span>
          </div>
          <button @click="showSessionPanel = false" class="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          <button 
            @click="setSessionFilter(null)"
            class="w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all border"
            :class="!store.sessionFilter
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
              : 'text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'"
          >
            All Sessions
            <span class="ml-1 opacity-60">({{ store.sessionIds.length }})</span>
          </button>

          <button
            v-for="sid in store.sessionIds" :key="sid"
            @click="setSessionFilter(sid)"
            class="w-full text-left px-3 py-2 rounded-lg transition-all border group/sid"
            :class="store.sessionFilter === sid 
              ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/20'
              : 'text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/10'"
          >
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-bold truncate">{{ sid }}</span>
              <span class="text-[8px] font-bold shrink-0 ml-1 px-1.5 py-0.5 rounded-md"
                    :class="store.sessionFilter === sid ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'">
                {{ sessionEventCount(sid) }}
              </span>
            </div>
          </button>
        </div>
      </aside>
    </transition>

    <button v-if="hasSessionFilter && !showSessionPanel" 
            @click="showSessionPanel = true"
            class="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 shadow-md text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:border-indigo-500/30 transition-all">
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      {{ store.sessionIds.length }}
    </button>

    <ParsingErrorsModal 
      :is-open="showErrorsModal" 
      :errors="store.parsingErrors" 
      @close="showErrorsModal = false" 
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}

.slide-panel-enter-active, .slide-panel-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-panel-enter-from, .slide-panel-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(99, 102, 241, 0.15); 
  border-radius: 10px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: rgba(99, 102, 241, 0.3); 
}
</style>