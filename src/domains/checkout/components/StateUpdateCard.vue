<script setup lang="ts">
import { computed } from "vue";
import PayloadPeek from "../../../shared/components/PayloadPeek.vue";
import type { CheckoutDetails, LogEvent } from "../../../shared/types";
import {
	formatDuration,
	formatEventTime,
} from "../../../shared/ui/LogUIHelper";
import { summarizeStateUpdates } from "../composables/useStateUpdates";

const props = defineProps<{
	events: LogEvent[];
	isLogHighlighted: (event: LogEvent) => boolean;
}>();

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const summary = computed(() => summarizeStateUpdates(props.events));
const first = computed(() => props.events[0]);
const last = computed(() => props.events[props.events.length - 1]);

const isHighlighted = computed(() => props.events.some(props.isLogHighlighted));

const span = computed(() =>
	props.events.length > 1 && first.value && last.value
		? formatDuration(last.value.ts - first.value.ts)
		: null,
);

// El mismo criterio de color que el badge de resultado: pendiente en naranja,
// aprobado en verde, rechazado y fallido en rojo.
const TX_TONE: Record<string, string> = {
	APPROVED:
		"bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
	APPROVED_PARTIAL:
		"bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
	PENDING:
		"bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
	REJECTED:
		"bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400",
	FAILED: "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400",
};
const NEUTRAL =
	"bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-white/10";

const txTone = computed(
	() => TX_TONE[summary.value.transactionState ?? ""] ?? NEUTRAL,
);

// El título que la tarjeta suelta saca del mensaje; aquí hay ocho mensajes y
// ninguno vale por todos.
const title = computed(() =>
	summary.value.transaction.length || summary.value.transactionState
		? "Transaction update"
		: "Session update",
);

const timeOf = (event: LogEvent) => formatEventTime(event.ts, event.timestamp);
const payloadOf = (event: LogEvent) =>
	(event.details as { payload?: object }).payload ?? null;
const labelOf = (event: LogEvent) => {
	const d = event.details as CheckoutDetails;
	return d.step ? `${d.phase}: ${d.step}` : (d.rawTitle ?? event.message);
};

const ids = computed(() =>
	[
		{ label: "TX", value: summary.value.transactionId },
		{ label: "P2P ID", value: summary.value.placetopayId },
	].filter((c): c is { label: string; value: string } => Boolean(c.value)),
);
</script>

<template>
  <div
    class="relative bg-white dark:bg-[#161618] rounded-xl border overflow-hidden transition-all duration-300"
    :class="[
      isHighlighted
        ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-500/20 shadow-xl z-10'
        : 'border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
      { 'border-orange-300/50 dark:border-orange-500/30': summary.hasWarning && !isHighlighted },
    ]"
  >
    <div
      class="absolute left-0 top-0 bottom-0 w-1"
      :class="summary.hasWarning ? 'bg-orange-500' : isHighlighted ? 'bg-indigo-500' : 'bg-amber-500/30'"
    ></div>

    <div class="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 pl-5 sm:pl-6">
      <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20">
        State update
      </span>

      <span
        v-if="summary.transactionState"
        class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm"
        :class="txTone"
      >
        {{ summary.transactionState }}
      </span>

      <button
        v-for="id in ids"
        :key="id.label"
        @click.stop="emit('highlight-session', id.value)"
        :title="`Filter by ${id.label}`"
        class="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-indigo-500/10 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all shadow-sm"
      >
        <span class="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400">{{ id.label }}</span>
        <span class="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">{{ id.value }}</span>
      </button>

      <span v-if="summary.gateway" class="text-[9px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
        via {{ summary.gateway }}
      </span>

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
        <span class="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {{ events.length }} {{ events.length === 1 ? 'record' : 'records' }}
        </span>
      </div>
    </div>

    <h3 class="px-4 sm:px-5 pl-5 sm:pl-6 pb-2 font-bold text-[16px] sm:text-[18px] leading-snug text-slate-800 dark:text-slate-100">
      {{ title }}
    </h3>

    <!-- Las transiciones: lo único que estas líneas cuentan. -->
    <div class="flex flex-wrap items-center gap-2 px-4 sm:px-5 pb-3 pl-5 sm:pl-6">
      <div
        v-for="chain in [
          { label: 'Session', states: summary.session },
          { label: 'Transaction', states: summary.transaction },
        ]"
        :key="chain.label"
        v-show="chain.states.length"
        class="flex items-center gap-1.5 bg-slate-50 dark:bg-black/20 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 shadow-sm text-[9px]"
      >
        <span class="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{{ chain.label }}</span>
        <span class="w-px h-3 bg-slate-200 dark:bg-white/10"></span>
        <template v-for="(state, i) in chain.states" :key="i">
          <svg v-if="i > 0" class="w-3 h-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          <span class="font-mono font-bold uppercase" :class="i === chain.states.length - 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'">{{ state }}</span>
        </template>
      </div>

      <div
        v-if="summary.remaining"
        class="flex items-center gap-1.5 bg-slate-50 dark:bg-black/20 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 shadow-sm text-[9px]"
        title="Saldo pendiente de la sesión antes y después de la transacción"
      >
        <span class="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Remaining</span>
        <span class="w-px h-3 bg-slate-200 dark:bg-white/10"></span>
        <span class="font-mono font-bold text-slate-600 dark:text-slate-400">{{ summary.remaining.before }}</span>
        <svg class="w-3 h-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ summary.remaining.after }}</span>
      </div>
    </div>

    <!-- Una línea por registro, sin plegar, como la tarjeta de entrada. -->
    <ul class="divide-y divide-slate-100 dark:divide-white/5 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/20">
      <li
        v-for="row in summary.rows"
        :key="row.event.id"
        class="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-4 sm:px-5 py-2 pl-5 sm:pl-6"
        :class="{ 'text-orange-700 dark:text-orange-400': row.warning }"
      >
        <span class="font-mono text-[10px] text-slate-600 dark:text-slate-400 shrink-0 w-[88px]">{{ timeOf(row.event) }}</span>
        <span class="flex-1 text-[11px] font-bold min-w-0 truncate" :class="row.warning ? '' : 'text-slate-800 dark:text-slate-100'">
          {{ labelOf(row.event) }}
        </span>
        <span v-if="row.detail" class="font-mono text-[10px] text-slate-600 dark:text-slate-400 sm:ml-auto shrink-0 basis-full sm:basis-auto">
          {{ row.detail }}
        </span>

        <PayloadPeek :id="row.event.id" :payload="payloadOf(row.event)" />
      </li>
    </ul>
  </div>
</template>
