<script setup lang="ts">
import { computed, ref } from "vue";
import { useLogStore } from "../../../store/logStore";
import type { Exchange } from "../../ui/LogUIHelper";
import {
	formatDuration,
	formatEventTime,
	isFailure,
} from "../../ui/LogUIHelper";
import EventBadges from "../EventBadges.vue";
import LogBody from "../LogBody.vue";

const props = defineProps<{
	pair: Exchange;
	isLogHighlighted: (event: Exchange["request"]) => boolean;
}>();

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const store = useLogStore();
const isExpanded = ref(false);

// El resultado del intercambio es el de la respuesta: la ida siempre sale bien.
const isErrorState = computed(() => isFailure(props.pair.response));

const isHighlighted = computed(
	() =>
		props.isLogHighlighted(props.pair.request) ||
		props.isLogHighlighted(props.pair.response),
);

const duration = computed(() =>
	formatDuration(
		props.pair.response.durationMs ?? props.pair.request.durationMs,
	),
);

// El mismo formato que las tarjetas sueltas: dos relojes distintos en la misma
// pantalla obligan a traducir mentalmente entre uno y otro.
const timeOf = formatEventTime;

const hasBody = (event: Exchange["request"]) =>
	Boolean((event.details as { payload?: unknown })?.payload);
</script>

<template>
  <div
    class="relative bg-white dark:bg-[#161618] rounded-xl border overflow-hidden transition-all duration-300"
    :class="[
      isHighlighted
        ? 'border-indigo-500/40 shadow-xl z-10'
        : 'border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
      { 'border-rose-300/50 dark:border-rose-500/30': isErrorState && !isHighlighted },
    ]"
  >
    <div
      class="absolute left-0 top-0 bottom-0 w-1 transition-colors"
      :class="isErrorState ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-indigo-500/20'"
    ></div>

    <!-- Cabecera del intercambio: lo que comparten las dos mitades, para no
         repetir proveedor y operación una vez por lado. -->
    <div
      @click="isExpanded = !isExpanded"
      class="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 pl-5 sm:pl-6 border-b border-slate-100 dark:border-white/5 cursor-pointer select-none"
    >
      <EventBadges :log="pair.response" :only="['outcome', 'service', 'source', 'flow']" />

      <span class="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        Exchange
      </span>

      <div class="flex items-center gap-2 ml-auto">
        <span
          v-if="duration"
          class="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-black"
          title="Tiempo entre la petición y su respuesta"
        >
          {{ duration }}
        </span>
        <span class="font-mono text-[11px] text-slate-600 dark:text-slate-400 tracking-tight">
          {{ timeOf(pair.request.timestamp) }}
        </span>

        <button
          @click.stop="isExpanded = !isExpanded"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wide transition-all active:scale-95"
          :class="isExpanded
            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
            : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/40 hover:text-indigo-500'"
        >
          <svg
            class="w-3 h-3 transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
          </svg>
          {{ isExpanded ? 'Collapse' : 'Expand' }}
        </button>
      </div>
    </div>

    <!-- Las dos mitades, separadas por el propio borde de la rejilla en vez de
         por dos tarjetas anidadas. Se apilan por debajo de `xl`. -->
    <div class="grid xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-slate-100 dark:divide-white/5">
      <section
        v-for="side in [
          { key: 'request', event: pair.request, label: 'Request', arrow: 'M14 5l7 7-7 7M3 12h18' },
          { key: 'response', event: pair.response, label: 'Response', arrow: 'M10 19l-7-7 7-7M21 12H3' },
        ]"
        :key="side.key"
        class="min-w-0 p-4 sm:p-5 pl-5 sm:pl-6"
      >
        <div @click="isExpanded = !isExpanded" class="cursor-pointer select-none">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 border border-slate-300/60 dark:border-white/10 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-200">
            <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" :d="side.arrow" />
            </svg>
            {{ side.label }}
          </span>

          <EventBadges :log="side.event" :only="['transport']" />

          <span class="font-mono text-[10px] text-slate-600 dark:text-slate-400 ml-auto">
            {{ timeOf(side.event.timestamp) }}
          </span>
        </div>

        <h3
          class="font-bold text-[14px] sm:text-[15px] leading-tight text-slate-800 dark:text-slate-100"
          :class="{ 'text-rose-600 dark:text-rose-400': isFailure(side.event) }"
        >
          {{ side.event.message }}
        </h3>
        </div>

        <div
          class="grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          :style="{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }"
        >
          <div class="overflow-hidden">
            <div v-if="hasBody(side.event)" class="pt-4">
              <LogBody
                :log="side.event"
                :is-highlighted="isHighlighted"
                @filter-id="id => emit('highlight-session', id)"
              />
            </div>
            <p v-else class="pt-4 text-[10px] italic text-slate-600 dark:text-slate-400">
              Sin payload en este registro.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
