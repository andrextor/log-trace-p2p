<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { Toaster, toast } from 'vue-sonner';
import "vue-sonner/style.css";

import { useLogStore } from '../store/logStore';
import { APP_TYPES, ANALYZER_NAMES } from '../logic/types';
import { MapperFactory } from '../logic/mappers/MapperFactory';

// Sub-componentes
import AnalyzerHeader from './analyzer/AnalyzerHeader.vue';
import AnalyzerTabs from './analyzer/AnalyzerTabs.vue';
import AnalyzerControlBar from './analyzer/AnalyzerControlBar.vue';
import LogUploader from './LogUploader.vue';
import LogTimeline from './LogTimeline.vue';
import AnalysisProgress from './analyzer/AnalysisProgress.vue';
import LogExporter from './LogExporter.vue'; // <-- Importamos tu botón original de JSON

const store = useLogStore();

/**
 * 1. MEMORIA DE FILTROS POR APLICACIÓN
 */
const filtersCache = ref({
  [APP_TYPES.CHECKOUT]: { search: '', highlighted: null as any, level: 'ALL' },
  [APP_TYPES.REST]: { search: '', highlighted: null as any, level: 'ALL' }
});

onMounted(() => { store.activeTab = APP_TYPES.CHECKOUT; });

// --- LÓGICA DE VISUALIZACIÓN ---

const hasEventsForCurrentTab = computed(() => {
  if (store.events.length === 0) return false;
  return store.events.some(e => e.appType === store.activeTab);
});

const activeFilterTheme = computed(() => {
  if (!store.highlightedSessionId) return null;
  const targetId = String(store.highlightedSessionId);
  const match = store.events.find(e => e.appType === store.activeTab && MapperFactory.getMapper(e.appType).isMatch(e, targetId));
  if (!match) return null;
  const identity = MapperFactory.getMapper(match.appType).getFilterIdentity(match, targetId);
  return { label: identity.label, color: identity.colorClass, value: targetId };
});

/**
 * 2. CAMBIO DE PESTAÑA SIN CRUCE
 */
const setTab = (newTab: any) => {
  const oldTab = store.activeTab as keyof typeof filtersCache.value;
  filtersCache.value[oldTab] = { search: store.search, highlighted: store.highlightedSessionId, level: store.levelFilter };
  store.activeTab = newTab;
  const cached = filtersCache.value[newTab as keyof typeof filtersCache.value];
  store.search = cached.search; store.highlightedSessionId = cached.highlighted; store.levelFilter = cached.level;
};

// --- ACCIONES ---

const toggleErrorFilter = () => {
  if (store.levelFilter === 'ERROR') store.levelFilter = 'ALL';
  else {
    if (store.stats.errors > 0) store.levelFilter = 'ERROR';
    else toast.success("No hay fallos en esta aplicación");
  }
};

const handleClearContext = () => {
  const currentTab = store.activeTab as keyof typeof filtersCache.value;
  store.clearLogsByApp(currentTab);
  filtersCache.value[currentTab] = { search: '', highlighted: null, level: 'ALL' };
  store.search = ""; store.levelFilter = "ALL"; store.highlightedSessionId = null;
  toast.success(`Data de ${ANALYZER_NAMES[currentTab]} borrada`);
};

const handleUploadComplete = async () => { await nextTick(); toast.success("Logs integrados correctamente"); };
</script>

<template>
  <Toaster position="top-right" richColors theme="system" />

  <AnalysisProgress 
    v-if="store.isProcessing" 
    :is-processing="store.isProcessing" 
    :progress="store.progress" 
  />

  <div class="max-w-7xl mx-auto px-4 sm:px-6  py-2 min-h-screen font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
    
    <AnalyzerHeader :total-events="store.events.length" class="mb-10">
      <template #actions v-if="hasEventsForCurrentTab">
         <LogExporter />
      </template>
    </AnalyzerHeader>

    <AnalyzerTabs :active-tab="store.activeTab" :counts="store.counts" @change="setTab" class="mb-10" />

    <transition name="fade" mode="out-in">
      <div v-if="hasEventsForCurrentTab" key="timeline" class="space-y-6">
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
                  class="flex items-center gap-2 px-5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest animate-in zoom-in"
                  :class="activeFilterTheme.color === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'">
                {{ activeFilterTheme.label }}: <span class="font-mono text-xs">{{ activeFilterTheme.value }}</span>
              </div>
            </Transition>
          </template>
        </AnalyzerControlBar>

        <LogTimeline />
      </div>

      <div v-else key="uploader" class="flex flex-col items-center py-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div class="text-center mb-12 space-y-6">
          
          <div class="flex items-center justify-center gap-4">
            <div class="text-indigo-600 dark:text-indigo-400">
                <svg v-if="store.activeTab === APP_TYPES.CHECKOUT" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <svg v-else class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            </div>
            <h2 class="text-2xl font-black uppercase tracking-tighter">
                Analizador <span class="text-indigo-600 dark:text-indigo-400">{{ ANALYZER_NAMES[store.activeTab as keyof typeof ANALYZER_NAMES] }}</span>
            </h2>
          </div>
          
          <p class="text-[11px] text-slate-500 max-w-md mx-auto font-bold uppercase tracking-[0.15em] leading-relaxed opacity-70 border-t border-slate-100 dark:border-white/5 pt-4">
            <template v-if="store.activeTab === APP_TYPES.CHECKOUT">
              Analiza flujos de <span class="text-indigo-600">Checkout</span>. Identifica abandonos, errores de sesión y comportamiento del usuario.
            </template>
            <template v-else>
              Analiza respuestas de <span class="text-indigo-600">Proveedores</span>. Depura fallos, errores 5xx y trazabilidad técnica de la API REST.
            </template>
          </p>
        </div>

        <LogUploader :target-type="store.activeTab" @viewResults="handleUploadComplete" />
      </div>
    </transition>
  </div>
</template>

<style scoped>

.scale-enter-active, .scale-leave-active { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.9); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>