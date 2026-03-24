<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { Toaster, toast } from "vue-sonner";
import "vue-sonner/style.css";

import { useLogStore } from "../store/logStore";
import { APP_TYPES, ANALYZER_NAMES } from "../shared/types";
import type {
	AnalyzerType,
	FilterTheme,
	FiltersCacheEntry,
} from "../shared/types";
import { LogUIHelper } from "../shared/ui/LogUIHelper";

import AnalyzerControlBar from "../shared/components/analyzer/AnalyzerControlBar.vue";
import LogUploader from "../shared/components/LogUploader.vue";
import LogTimeline from "../shared/components/LogTimeline.vue";
import AnalysisProgress from "../shared/components/analyzer/AnalysisProgress.vue";
import LogExporter from "../shared/components/LogExporter.vue";
import ThemeSelector from "../shared/components/ThemeSelector.vue";

const store = useLogStore();

const filtersCache = ref<Record<string, FiltersCacheEntry>>({
	[APP_TYPES.CHECKOUT]: { search: "", highlighted: null, level: "ALL" },
	[APP_TYPES.REST]: { search: "", highlighted: null, level: "ALL" },
});

onMounted(() => {
	store.activeTab = APP_TYPES.CHECKOUT;
});

const hasEventsForCurrentTab = computed(() => {
	if (store.events.length === 0) return false;
	return store.events.some((e) => e.appType === store.activeTab);
});

const activeFilterTheme = computed<FilterTheme | null>(() => {
	if (!store.highlightedSessionId) return null;
	const targetId = String(store.highlightedSessionId);
	const match = store.events.find(
		(e) => e.appType === store.activeTab && LogUIHelper.isMatch(e, targetId),
	);
	if (!match) return null;
	const identity = LogUIHelper.getFilterIdentity(match, targetId);
	return { label: identity.label, color: identity.colorClass, value: targetId };
});

const formatNumber = (num: number) => {
	return num > 999 ? (num / 1000).toFixed(1) + "k" : num;
};

const setTab = (newTab: AnalyzerType) => {
	if (store.activeTab === newTab) return;
	const oldTab = store.activeTab;
	filtersCache.value[oldTab] = {
		search: store.search,
		highlighted: store.highlightedSessionId,
		level: store.levelFilter,
	};
	store.activeTab = newTab;
	store.sessionFilter = null;
	const cached = filtersCache.value[newTab] || {
		search: "",
		highlighted: null,
		level: "ALL",
	};
	store.search = cached.search;
	store.highlightedSessionId = cached.highlighted;
	store.levelFilter = cached.level;
};

const toggleErrorFilter = () => {
	if (store.levelFilter === "ERROR") store.levelFilter = "ALL";
	else {
		if (store.stats.errors > 0) store.levelFilter = "ERROR";
		else toast.success("No failures in this application");
	}
};

const handleClearContext = () => {
	const currentTab = store.activeTab as AnalyzerType;
	store.clearLogsByApp(currentTab);
	filtersCache.value[currentTab] = {
		search: "",
		highlighted: null,
		level: "ALL",
	};
	store.search = "";
	store.levelFilter = "ALL";
	store.highlightedSessionId = null;
	toast.success(`${ANALYZER_NAMES[currentTab]} data cleared`);
};

const handleUploadComplete = async () => {
	await nextTick();
	toast.success("Logs integrated successfully");
};
</script>

<template>
  <Toaster position="top-right" richColors theme="system" />
  
  <AnalysisProgress 
    v-if="store.isProcessing" 
    :is-processing="store.isProcessing" 
    :progress="store.progress" 
  />

  <div class="flex flex-col min-h-screen w-full font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
    
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 transition-colors">
      <div class="px-4 sm:px-6 h-14 flex items-center justify-between w-full">
        
        <div class="flex items-center gap-3 w-1/4">
          <button @click="handleClearContext" class="relative w-8 h-8 md:w-7 md:h-7 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center shadow-sm hover:scale-105 transition-transform group">
            <span class="text-indigo-600 dark:text-indigo-400 font-black text-[11px] md:text-[10px] group-hover:block">P2P</span>
          </button>
          <div class="hidden md:flex flex-col cursor-default">
            <span class="font-mono font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight leading-none">log-trace-analyzer</span>
            <span class="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Engine v4</span>
          </div>
        </div>

        <div class="flex-1 flex justify-center w-2/4">
          <div class="flex items-center p-1 bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl shadow-inner backdrop-blur-sm">
            <button
              v-for="type in [APP_TYPES.CHECKOUT, APP_TYPES.REST]" :key="type"
              @click="setTab(type)"
              class="relative px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300 flex items-center gap-2"
              :class="store.activeTab === type 
                ? 'bg-white dark:bg-[#1a1c23] text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
            >
              <component :is="'svg'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path v-if="type === APP_TYPES.CHECKOUT" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </component>
              <span class="hidden sm:inline">{{ ANALYZER_NAMES[type as keyof typeof ANALYZER_NAMES] }}</span>
              <transition name="scale">
                <span v-if="store.counts[type] > 0"
                      class="flex items-center justify-center px-1.5 h-4 min-w-[16px] text-[8px] rounded font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
                  {{ formatNumber(store.counts[type]) }}
                </span>
              </transition>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 sm:gap-4 w-1/4">
          <transition name="fade">
            <LogExporter v-if="hasEventsForCurrentTab" class="hidden sm:flex" />
          </transition>
          <ThemeSelector />
        </div>

      </div>
    </header>

    <main class="flex-1 w-full bg-slate-50/30 dark:bg-transparent relative">
      <transition name="fade" mode="out-in">
        
        <div v-if="hasEventsForCurrentTab" key="timeline" class="h-full flex flex-col">
          <div class="sticky top-14 z-40 bg-white/70 dark:bg-[#0a0a0b]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 py-3 px-4 sm:px-6 w-full shadow-sm">
             <div class="max-w-7xl mx-auto w-full">
               <AnalyzerControlBar 
                 :active-tab="store.activeTab" 
                 :active-filter-theme="activeFilterTheme"
                 :stats="store.stats"
                 :level-filter="store.levelFilter"
                 @toggle-errors="toggleErrorFilter"
                 @reset-filters="() => { store.levelFilter = 'ALL'; store.search = ''; store.highlightedSessionId = null; }"
                 @clear-data="handleClearContext"
               >
                 <template #filter-chip>
                   <Transition name="scale" mode="out-in">
                     <div v-if="activeFilterTheme" 
                         class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest bg-white dark:bg-white/5 shadow-sm"
                         :class="activeFilterTheme.color === 'orange' ? 'border-orange-500/20 text-orange-500' : 'border-indigo-500/20 text-indigo-500'">
                       {{ activeFilterTheme.label }}: <span class="font-mono text-[10px]">{{ activeFilterTheme.value }}</span>
                     </div>
                   </Transition>
                 </template>
               </AnalyzerControlBar>
             </div>
          </div>

          <div class="flex-1 w-full px-2 sm:px-6 py-4 custom-scrollbar">
            <div class="max-w-7xl mx-auto w-full pb-20">
              <LogTimeline />
            </div>
          </div>
        </div>

        <div v-else key="uploader" class="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 animate-in fade-in slide-in-from-bottom-6 duration-700 w-full max-w-7xl mx-auto">
          <div class="text-center mb-10 space-y-4">
            <div class="flex flex-col items-center justify-center gap-4">
              <div class="p-4 bg-indigo-500/10 rounded-2xl ring-1 ring-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/10">
                  <svg v-if="store.activeTab === APP_TYPES.CHECKOUT" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <svg v-else class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
              </div>
              <h1 class="text-3xl font-black uppercase tracking-tighter italic">
                  Analyzer <span class="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{{ ANALYZER_NAMES[store.activeTab as keyof typeof ANALYZER_NAMES] }}</span>
              </h1>
            </div>
            <p class="text-xs text-slate-500 max-w-md mx-auto font-bold uppercase tracking-[0.1em] leading-relaxed opacity-80 pt-2">
              <template v-if="store.activeTab === APP_TYPES.CHECKOUT">
                Upload checkout traces to analyze conversions and drop-offs.
              </template>
              <template v-else>
                Upload REST traces to debug 5xx and technical failures.
              </template>
            </p>
          </div>
          <LogUploader :target-type="store.activeTab" @viewResults="handleUploadComplete" />
        </div>

      </transition>
    </main>
  </div>
</template>

<style scoped>
.scale-enter-active, .scale-leave-active { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.9); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>