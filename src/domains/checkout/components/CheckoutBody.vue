<script setup lang="ts">
import { computed } from "vue";
import OutcomeAlert from "../../../shared/components/OutcomeAlert.vue";
import type { Outcome } from "../../../shared/types";
import type { CheckoutDetails } from "../types";

const props = defineProps<{
	details: CheckoutDetails;
	outcome?: Outcome;
}>();

const payload = computed(
	() => (props.details.payload || null) as Record<string, unknown> | null,
);

// De dónde a dónde pasa la sesión. Las cinco claves de estado del payload
// cuentan una sola transición, así que se pintan como una.
const stateTransition = computed(() => {
	const p = payload.value ?? {};
	const actual = (p.actual_session_state || p.session_state) as
		| string
		| undefined;
	const target = (p.state_to_update || p.new_state || p.new_status) as
		| string
		| undefined;
	if (!actual && !target) return null;
	return { actual: actual || "START", target: target || actual };
});

const CONTEXT_KEYS = ["session_type", "payment_type", "collect_type"];

const contextChips = computed(() =>
	CONTEXT_KEYS.filter((key) => payload.value?.[key]).map((key) => ({
		label: key.replace(/_/g, " "),
		value: String(payload.value?.[key]),
	})),
);
</script>

<template>
  <!-- Solo los datos; el payload lo pinta `PayloadView` donde la tarjeta decida.
       `empty:hidden` evita el hueco cuando no hay nada que contar. -->
  <div class="space-y-4 empty:hidden">
    <div v-if="stateTransition || contextChips.length" class="flex flex-wrap items-center gap-2">
      <div v-if="stateTransition" title="State Pipeline" class="flex items-center gap-1.5 bg-slate-50 dark:bg-black/20 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 shadow-sm">
        <span class="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-400 truncate max-w-[100px]">{{ stateTransition.actual }}</span>
        <svg class="w-3 h-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        <span class="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[100px]">{{ stateTransition.target }}</span>
      </div>

      <div v-for="chip in contextChips" :key="chip.label"
           class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 shadow-sm text-[9px]">
        <span class="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{{ chip.label }}</span>
        <span class="w-px h-3 bg-slate-200 dark:bg-white/10"></span>
        <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">{{ chip.value }}</span>
      </div>
    </div>

    <OutcomeAlert :outcome="outcome" />
  </div>
</template>

