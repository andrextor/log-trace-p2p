<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { Toaster, toast } from "vue-sonner";
import "vue-sonner/style.css";

import { ANALYZER_NAMES, APP_TYPES } from "../shared/types";
import type {
	AnalyzerType,
	FilterTheme,
	FiltersCacheEntry,
} from "../shared/types";
import { getFilterIdentity, isMatch } from "../shared/ui/LogUIHelper";
import { useLogStore } from "../store/logStore";

import CheckoutTimeline from "../domains/checkout/components/CheckoutTimeline.vue";
import RestTimeline from "../domains/rest/components/RestTimeline.vue";
import ConfirmationModal from "../shared/components/ConfirmationModal.vue";
import LogExporter from "../shared/components/LogExporter.vue";
import LogUploader from "../shared/components/LogUploader.vue";
import ThemeSelector from "../shared/components/ThemeSelector.vue";
import AnalysisProgress from "../shared/components/analyzer/AnalysisProgress.vue";
import AnalyzerControlBar from "../shared/components/analyzer/AnalyzerControlBar.vue";
import BatchSummary from "../shared/components/analyzer/BatchSummary.vue";
import FacetBar from "../shared/components/analyzer/FacetBar.vue";

const store = useLogStore();

const filtersCache = ref<Record<string, FiltersCacheEntry>>({
	[APP_TYPES.CHECKOUT]: {
		search: "",
		highlighted: null,
		outcome: "ALL",
		facets: {},
	},
	[APP_TYPES.REST]: {
		search: "",
		highlighted: null,
		outcome: "ALL",
		facets: {},
	},
});

const showUploadModal = ref(false);
const showClearModal = ref(false);

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
		(e) => e.appType === store.activeTab && isMatch(e, targetId),
	);
	if (!match) return null;
	const identity = getFilterIdentity(match, targetId);
	return { label: identity.label, color: identity.colorClass, value: targetId };
});

const formatNumber = (num: number) => {
	return num > 999 ? `${(num / 1000).toFixed(1)}k` : num;
};

const setTab = (newTab: AnalyzerType) => {
	if (store.activeTab === newTab) return;
	const oldTab = store.activeTab;
	filtersCache.value[oldTab] = {
		search: store.search,
		highlighted: store.highlightedSessionId,
		outcome: store.outcomeFilter,
		facets: store.facetFilters,
	};
	store.activeTab = newTab;
	store.sessionFilter = null;
	const cached = filtersCache.value[newTab] || {
		search: "",
		highlighted: null,
		outcome: "ALL",
		facets: {},
	};
	store.search = cached.search;
	store.highlightedSessionId = cached.highlighted;
	store.outcomeFilter = cached.outcome;
	store.facetFilters = cached.facets;
};

const resetFilters = () => {
	store.outcomeFilter = "ALL";
	store.search = "";
	store.highlightedSessionId = null;
	store.facetFilters = {};
};

const toggleErrorFilter = () => {
	if (store.outcomeFilter === "ERRORS") store.outcomeFilter = "ALL";
	else if (store.stats.errors > 0) store.outcomeFilter = "ERRORS";
	else toast.success("No failures in this application");
};

const handleClearContext = () => {
	const currentTab = store.activeTab as AnalyzerType;
	store.clearLogsByApp(currentTab);
	filtersCache.value[currentTab] = {
		search: "",
		highlighted: null,
		outcome: "ALL",
		facets: {},
	};
	store.search = "";
	store.outcomeFilter = "ALL";
	store.facetFilters = {};
	store.highlightedSessionId = null;
	showClearModal.value = false;
	toast.success(`${ANALYZER_NAMES[currentTab]} data cleared`);
};

const handleUploadComplete = async () => {
	await nextTick();
	showUploadModal.value = false;
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
          <div class="relative w-8 h-8 md:w-7 md:h-7 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center shadow-sm select-none">
            <span class="text-indigo-600 dark:text-indigo-400 font-black text-[11px] md:text-[10px]">P2P</span>
          </div>
          <div class="hidden md:flex flex-col cursor-default">
            <span class="font-mono font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight leading-none">P2P-log-trace</span>
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
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
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
             <div class="w-full">
               <AnalyzerControlBar 
                 :active-tab="store.activeTab" 
                 :active-filter-theme="activeFilterTheme"
                 :stats="store.stats"
                 :outcome-filter="store.outcomeFilter"
                 @toggle-errors="toggleErrorFilter"
                 @reset-filters="resetFilters"
                 @add-logs="showUploadModal = true"
                 @clear-data="showClearModal = true"
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
               <BatchSummary />
               <FacetBar />
             </div>
          </div>

          <div class="flex-1 w-full px-2 sm:px-6 py-4 custom-scrollbar">
            <div class="w-full pb-20">
              <CheckoutTimeline v-if="store.activeTab === APP_TYPES.CHECKOUT" />
              <RestTimeline v-else />
            </div>
          </div>
        </div>

        <div v-else key="uploader" class="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 animate-in fade-in slide-in-from-bottom-6 duration-700 w-full">
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
          </div>
          <LogUploader :target-type="(store.activeTab as AnalyzerType)" @viewResults="handleUploadComplete" />

          <footer class="mt-auto pt-8 pb-6 text-center w-full">
            <a
              href="https://github.com/andrextor"
              target="_blank"
              class="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-all duration-300"
            >
              P2P Log Trace  &copy; {{ new Date().getFullYear() }} — Iván Andrés López
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5-.73 1.02-1.08 2.25-1 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
            </a>
          </footer>
        </div>

      </transition>
    </main>
  </div>

  <!-- El store acumula y deduplica, asi que sumar un fichero no obliga a vaciar
       el anterior: es el caso normal al cruzar Checkout con REST. -->
  <Transition name="fade">
    <div v-if="showUploadModal" class="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div @click="showUploadModal = false" class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      <div class="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#0a0a0b] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-5 animate-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Add logs</h3>
            <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Se suman a {{ ANALYZER_NAMES[store.activeTab as keyof typeof ANALYZER_NAMES] }}. Los repetidos se descartan solos.
            </p>
          </div>
          <button @click="showUploadModal = false" aria-label="Close" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <LogUploader :target-type="(store.activeTab as AnalyzerType)" @viewResults="handleUploadComplete" />
      </div>
    </div>
  </Transition>

  <ConfirmationModal
    :is-open="showClearModal"
    title="Clear logs"
    :message="`Se borraran los eventos de ${ANALYZER_NAMES[store.activeTab as keyof typeof ANALYZER_NAMES]}. No se puede deshacer.`"
    @close="showClearModal = false"
    @confirm="handleClearContext"
  />
</template>

<style scoped>
.scale-enter-active, .scale-leave-active { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.9); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>