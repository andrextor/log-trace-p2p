<script setup lang="ts">
import { computed, ref } from "vue";
import type { ActiveFilterInfo, LogEvent } from "../../../shared/types";
import { getFilterIdentity, isMatch } from "../../../shared/ui/LogUIHelper";
import { useLogStore } from "../../../store/logStore";

import TimelineGroup from "../../../shared/components/timeline/TimelineGroup.vue";
import TimelineHeader from "../../../shared/components/timeline/TimelineHeader.vue";

const store = useLogStore();
const BATCH_SIZE = 40;
const visibleGroups = ref(BATCH_SIZE);

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
</script>

<template>
  <div class="flex h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden bg-slate-50/30 dark:bg-transparent rounded-2xl border border-slate-200/50 dark:border-white/5">
    
    <!-- MAIN CONTENT AREA -->
    <div class="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-transparent relative">
      <TimelineHeader 
        v-model:search="store.search"
        :active-filter-info="activeFilterInfo"
        :visible-count="store.filteredEvents.length"
        @clearSearch="store.search = ''"
        @clearFilter="store.highlightedSessionId = null"
      />

      <div class="flex-1 overflow-y-auto px-2 md:px-4 custom-scrollbar scroll-smooth pb-20 relative">
        <transition name="fade" mode="out-in">
          <div key="timeline" class="relative w-full py-4">

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
