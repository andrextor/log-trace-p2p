<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLogStore } from '../store/logStore';
import LogCard from './LogCard.vue';
import LogExporter from './LogExporter.vue';
import ParsingErrorsModal from './ParsingErrorsModal.vue';

const store = useLogStore();
const emit = defineEmits(['back', 'clearAll']);

const showErrorsModal = ref(false);

const timelineGroups = computed(() => {
  if (!store.groupedEvents) return [];
  return Object.keys(store.groupedEvents).map(key => ({
    timeKey: key,
    ...store.groupedEvents[key]
  }));
});
</script>

<template>
  <div
    class="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative"
  >
    <div
      class="shrink-0 mb-8 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-md p-4 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4 shadow-xl z-30 transition-all sticky top-0"
    >
      <div class="flex items-center gap-3 w-full lg:w-auto">
        <button
          @click="emit('back')"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-500/20 transition-all active:scale-95 group"
        >
          <svg
            class="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>

          <span class="text-xs font-bold uppercase tracking-tight"
            >Volver al inicio</span
          >
        </button>

        <div
          class="h-8 w-px bg-slate-200 dark:bg-white/10 hidden lg:block"
        ></div>

        <div class="relative flex-1 lg:w-80">
          <span class="absolute left-3 top-2.5 text-slate-400">
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            v-model="store.search"
            placeholder="Filtrar por ID, texto..."
            class="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 px-10 py-2 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div class="flex items-center justify-between w-full lg:w-auto gap-4">
        <LogExporter />

        <div class="text-right hidden sm:block">
          <p
            class="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none text-right"
          >
            Visibles
          </p>
          <p
            class="text-sm font-black text-indigo-600 dark:text-indigo-400 text-right"
          >
            {{ store.filteredEvents.length }}
          </p>
        </div>

        <div
          class="h-8 w-px bg-slate-200 dark:bg-white/10 hidden lg:block"
        ></div>

        <button
          @click="emit('clearAll')"
          class="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all active:scale-95"
          title="Borrar todo y reiniciar"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <div
      class="flex-1 overflow-y-auto px-4 custom-scrollbar scroll-smooth pb-20"
    >
      <div class="relative max-w-7xl mx-auto py-10">
        <div
          class="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10 transform -translate-x-1/2 hidden md:block"
        ></div>

        <div
          v-if="store.filteredEvents.length === 0"
          class="py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl mx-auto max-w-2xl bg-slate-50/50 dark:bg-white/5"
        >
          <p class="text-slate-400 dark:text-gray-500 font-mono text-sm italic">
            No se encontraron eventos con los filtros actuales.
          </p>
        </div>

        <div
          v-for="(group, index) in timelineGroups"
          :key="group.timeKey"
          class="relative mb-24 flex flex-col group/block"
          :class="[ (index % 2 === 0) ? 'md:items-start' : 'md:items-end' ]"
        >
          <div class="sticky top-28 z-20 hidden md:block self-center">
            <div
              class="bg-white dark:bg-[#0a0a0b] border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full shadow-sm whitespace-nowrap backdrop-blur-sm"
            >
              {{ group.label }} •
              <span class="font-mono">{{ group.timeKey.split(' ')[1] }}</span>
            </div>
          </div>

          <div
            class="md:hidden flex items-center gap-2 mb-4 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur z-10 py-2 border-b border-slate-100 dark:border-white/5"
          >
            <span
              class="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded"
              >{{ group.label }}</span
            >
            <span
              class="text-xs font-mono font-bold text-slate-500"
              >{{ group.timeKey }}</span
            >
          </div>

          <div
            class="w-full md:w-[45%] space-y-4 relative"
            :class="[ (index % 2 === 0) ? 'animate-in slide-in-from-left-4' : 'animate-in slide-in-from-right-4' ]"
          >
            <div
              class="absolute top-8 w-3 h-3 rounded-full border-2 border-white dark:border-[#030304] bg-slate-300 dark:bg-slate-600 group-hover/block:bg-indigo-500 group-hover/block:scale-125 transition-all duration-300 z-10 hidden md:block shadow-sm"
              :class="[ (index % 2 === 0) ? '-right-[11.11%] translate-x-1/2' : '-left-[11.11%] -translate-x-1/2' ]"
            ></div>

            <LogCard
              v-for="event in group.events"
              :key="event.id"
              :log="event"
              :is-highlighted="store.highlightedSessionId === event.details.sessionId"
              @highlight-session="store.toggleHighlight"
              class="hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
            />
          </div>
        </div>

        <div
          v-if="store.parsingErrors.length > 0"
          class="mt-20 border-t border-dashed border-red-200 dark:border-red-900/30 pt-10 text-center"
        >
          <p
            class="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4"
          >
            Reporte de Exclusiones
          </p>

          <button
            @click="showErrorsModal = true"
            class="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors group"
          >
            <div class="p-1.5 bg-white dark:bg-red-900/20 rounded-md shadow-sm">
              <svg
                class="w-4 h-4 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div class="text-left">
              <p class="text-xs font-bold text-red-700 dark:text-red-400">
                {{ store.parsingErrors.length }} líneas ignoradas
              </p>
              <p class="text-[10px] text-red-500/70 dark:text-red-400/50">
                Formato no reconocido o datos corruptos
              </p>
            </div>
            <svg
              class="w-4 h-4 text-red-300 group-hover:translate-x-1 transition-transform ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
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
.custom-scrollbar {
  background-image:
    linear-gradient(to right, rgba(226, 232, 240, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(226, 232, 240, 0.3) 1px, transparent 1px);
  background-size: 40px 40px;
}
.dark .custom-scrollbar {
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.4);
}
</style>
