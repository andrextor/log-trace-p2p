<script setup lang="ts">
import { computed } from "vue";
import PayloadPeek from "../../../shared/components/PayloadPeek.vue";
import type { LogEvent } from "../../../shared/types";
import {
	formatDuration,
	formatEventTime,
	truncateMiddle,
} from "../../../shared/ui/LogUIHelper";
import type { CheckoutDetails } from "../types";

const props = defineProps<{
	events: LogEvent[];
	isLogHighlighted: (event: LogEvent) => boolean;
}>();

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const first = computed(() => props.events[0]);
const last = computed(() => props.events[props.events.length - 1]);

const sessionId = computed(() => first.value?.correlation.sessionId);

const isHighlighted = computed(() => props.events.some(props.isLogHighlighted));

// Cuánto tardó el usuario en entrar desde que se creó la sesión. Con un solo
// registro no hay nada que medir.
const span = computed(() =>
	props.events.length > 1 && first.value && last.value
		? formatDuration(last.value.ts - first.value.ts)
		: null,
);

const timeOf = (event: LogEvent) => formatEventTime(event.ts, event.timestamp);

// Lo que distingue un registro de otro: el tipo del evento o la ruta pedida.
const detailOf = (event: LogEvent) => {
	const d = event.details as CheckoutDetails;
	return d.subType ?? (d.endpoint && d.endpoint !== "N/A" ? d.endpoint : null);
};

const payloadOf = (event: LogEvent) =>
	(event.details as { payload?: object }).payload ?? null;

const sourceOf = (event: LogEvent) =>
	String(event.details.source ?? "").toUpperCase();
</script>

<template>
  <div
    class="relative bg-white dark:bg-[#161618] rounded-xl border overflow-hidden transition-all duration-300"
    :class="isHighlighted
      ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-500/20 shadow-xl z-10'
      : 'border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'"
  >
    <div
      class="absolute left-0 top-0 bottom-0 w-1"
      :class="isHighlighted ? 'bg-indigo-500' : 'bg-indigo-500/20'"
    ></div>

    <div class="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 pl-5 sm:pl-6 border-b border-slate-100 dark:border-white/5">
      <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
        Session entry
      </span>

      <span class="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {{ events.length }} {{ events.length === 1 ? 'record' : 'records' }}
      </span>

      <button
        v-if="sessionId"
        @click="emit('highlight-session', sessionId)"
        title="Filter by session"
        class="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-indigo-500/10 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all shadow-sm"
      >
        <span class="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400">SID</span>
        <span class="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">{{ sessionId }}</span>
      </button>

      <div class="flex items-center gap-2 ml-auto">
        <span
          v-if="span"
          class="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-black"
          title="Tiempo entre el primer y el último registro"
        >
          {{ span }}
        </span>
        <span v-if="first" class="font-mono text-[11px] text-slate-600 dark:text-slate-400 tracking-tight">
          {{ timeOf(first) }}
        </span>
      </div>
    </div>

    <!-- Una línea por registro, sin plegar: la tarjeta entera es el resumen. -->
    <ul class="divide-y divide-slate-100 dark:divide-white/5">
      <li
        v-for="event in events"
        :key="event.id"
        class="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-4 sm:px-5 py-2 pl-5 sm:pl-6"
      >
        <span class="font-mono text-[10px] text-slate-600 dark:text-slate-400 shrink-0 w-[88px]">
          {{ timeOf(event) }}
        </span>

        <span
          class="flex items-center gap-1.5 shrink-0 w-[84px]"
          title="Event Source"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="sourceOf(event) === 'FRONTEND'
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'"
          ></span>
          <span class="text-[9px] font-black tracking-widest text-slate-600 dark:text-slate-400">
            {{ sourceOf(event) }}
          </span>
        </span>

        <span class="flex-1 text-[12px] font-bold text-slate-800 dark:text-slate-100 min-w-0 truncate">
          {{ event.message }}
        </span>

        <span
          v-if="detailOf(event)"
          class="font-mono text-[10px] text-slate-600 dark:text-slate-400 sm:ml-auto shrink-0 basis-full sm:basis-auto"
          :title="detailOf(event) ?? undefined"
        >
          {{ truncateMiddle(detailOf(event) ?? '') }}
        </span>

        <PayloadPeek :id="event.id" :payload="payloadOf(event)" />
      </li>
    </ul>
  </div>
</template>
