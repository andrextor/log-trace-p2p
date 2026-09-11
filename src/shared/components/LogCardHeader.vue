<script setup lang="ts">
import { computed, ref } from "vue";
import type { LogEvent } from "../types";
import {
	formatDuration,
	formatEventTime,
	isFailure,
	truncateMiddle,
} from "../ui/LogUIHelper";
import EventBadges from "./EventBadges.vue";

const props = defineProps<{
	log: LogEvent;
}>();

const isErrorState = computed(() => isFailure(props.log));
const time = computed(() => formatEventTime(props.log.ts, props.log.timestamp));
const duration = computed(() => formatDuration(props.log.durationMs));

const endpoint = computed(() => {
	const raw = (props.log.details as { endpoint?: string })?.endpoint;
	return raw && raw !== "N/A" ? raw : null;
});

const rawTitle = computed(() => {
	const raw = (props.log.details as { rawTitle?: string })?.rawTitle;
	return raw && raw !== props.log.message ? raw : null;
});

const copiedRawLog = ref(false);
const copyRawLog = async () => {
	if (!rawTitle.value) return;
	await navigator.clipboard.writeText(rawTitle.value);
	copiedRawLog.value = true;
	setTimeout(() => {
		copiedRawLog.value = false;
	}, 2000);
};
</script>

<template>
  <!-- Fila de identificación: qué resultó y cuándo. Deliberadamente tenue,
       para que no compita con el mensaje. -->
  <div class="flex flex-wrap sm:flex-nowrap justify-between items-start sm:items-center gap-3 mb-2.5">
    <div class="flex items-center gap-2 flex-wrap">
      <EventBadges :log="log" />
    </div>

    <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 shrink-0">
      <span
        v-if="duration"
        class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-mono text-[9px] font-bold text-slate-600 dark:text-slate-400"
        title="Tiempo entre la petición y su respuesta"
      >
        {{ duration }}
      </span>
      <span class="font-mono text-[10px] sm:text-[11px] tracking-tight">{{ time }}</span>
    </div>
  </div>

  <!-- El mensaje manda: es lo que se lee al recorrer la linea de tiempo. -->
  <h3
    class="font-bold text-[16px] sm:text-[18px] leading-snug text-slate-800 dark:text-slate-100 transition-colors"
    :class="isErrorState
      ? 'text-rose-600 dark:text-rose-400'
      : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'"
  >
    {{ log.message }}
  </h3>

  <!-- Contexto: la ruta recortada por el centro, que conserva la cola. -->
  <div v-if="endpoint" class="flex items-center gap-1.5 mt-1 text-slate-600 dark:text-slate-400">
    <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    <span class="font-mono text-[10px]" :title="endpoint">{{ truncateMiddle(endpoint) }}</span>
  </div>

  <div
    v-if="rawTitle"
    class="mt-2 px-2 py-1 bg-slate-100 dark:bg-white/5 rounded border border-slate-200 dark:border-white/5 w-fit flex items-center gap-2 group/raw"
  >
    <p class="font-mono text-[9px] text-slate-600 dark:text-slate-400 break-all leading-relaxed tracking-tighter">
      raw log: {{ rawTitle }}
    </p>
    <button
      @click.stop="copyRawLog"
      class="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-all opacity-0 group-hover/raw:opacity-100"
      :class="{ 'opacity-100 text-emerald-500': copiedRawLog }"
      title="Copy Raw Log"
    >
      <svg v-if="!copiedRawLog" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      <svg v-else class="w-3 h-3 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
    </button>
  </div>
</template>
