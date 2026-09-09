<script setup lang="ts">
import { computed, ref } from "vue";
import { APP_TYPES, type RestParseMetadata } from "../../../shared/types";
import { useLogStore } from "../../../store/logStore";

const store = useLogStore();
const isOpen = ref(false);

// `RestMetadataExtractor` ya agrega latencia y fallos por proveedor sobre el
// lote completo. Recalcularlo aquí sobre `filteredEvents` daría otro número y
// dos verdades: el panel describe el lote, no el filtro activo.
const meta = computed<RestParseMetadata | null>(() => {
	const m = store.metadata;
	if (store.activeTab !== APP_TYPES.REST || !m) return null;
	return "requestsByProvider" in m ? (m as RestParseMetadata) : null;
});

const providers = computed(() => {
	const byProvider = meta.value?.requestsByProvider ?? {};
	const rows = Object.entries(byProvider).sort((a, b) => b[1] - a[1]);
	const max = rows[0]?.[1] ?? 0;
	return rows.map(([name, count]) => ({
		name,
		count,
		pct: max > 0 ? Math.round((count / max) * 100) : 0,
	}));
});

const formatMs = (ms: number) =>
	ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;
</script>

<template>
  <div v-if="meta && providers.length" class="px-2 md:px-4 pt-3">
    <div class="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f0f11] shadow-sm overflow-hidden">
      <button
        @click="isOpen = !isOpen"
        class="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        <div class="flex items-center gap-2.5">
          <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
            Providers
          </span>
          <span class="text-[9px] font-mono font-bold text-slate-400">
            {{ meta.totalRequests }} req · {{ providers.length }} prov
            <template v-if="meta.errors.length"> · {{ meta.errors.length }} err</template>
          </span>
        </div>
        <svg class="w-4 h-4 text-slate-400 transition-transform" :class="isOpen && 'rotate-180'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" /></svg>
      </button>

      <div v-if="isOpen" class="grid gap-5 p-4 pt-1 border-t border-slate-100 dark:border-white/5 md:grid-cols-3">
        <div class="space-y-1.5">
          <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">Requests</span>
          <div v-for="p in providers" :key="p.name" class="space-y-0.5">
            <div class="flex justify-between text-[10px]">
              <span class="font-mono font-bold text-slate-600 dark:text-slate-300 truncate">{{ p.name }}</span>
              <span class="font-mono text-slate-400">{{ p.count }}</span>
            </div>
            <div class="h-1 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
              <div class="h-full rounded-full bg-indigo-500/60" :style="{ width: `${p.pct}%` }"></div>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">Slowest</span>
          <p v-if="!meta.slowest.length" class="text-[10px] text-slate-400 italic">Sin duraciones emparejadas.</p>
          <div v-for="(x, i) in meta.slowest" :key="`${x.provider}-${x.operation}-${i}`"
               class="flex justify-between gap-2 text-[10px]">
            <span class="font-mono text-slate-600 dark:text-slate-300 truncate">
              {{ x.provider }} · {{ x.operation }}
            </span>
            <span class="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">{{ formatMs(x.durationMs) }}</span>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">Failures</span>
          <p v-if="!meta.errors.length" class="text-[10px] text-slate-400 italic">Ningún fallo en el lote.</p>
          <div v-for="(e, i) in meta.errors" :key="`${e.provider}-${e.ts}-${i}`"
               class="text-[10px] leading-tight">
            <div class="flex gap-1.5">
              <span class="font-mono font-bold text-rose-500 shrink-0">{{ e.code ?? '—' }}</span>
              <span class="font-mono text-slate-600 dark:text-slate-300 truncate">{{ e.provider }} · {{ e.operation }}</span>
            </div>
            <p class="text-slate-400 truncate">{{ e.message }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
