<script setup lang="ts">
import { computed, ref } from "vue";
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

const hasData = computed(
	() =>
		Boolean(stateTransition.value || contextChips.value.length) ||
		Boolean(props.outcome?.isError || props.outcome?.status === "REJECTED"),
);

const copiedPayload = ref(false);

const handleCopyPayload = async () => {
	const json = JSON.stringify(props.details.payload, null, 2);
	if (!json) return;
	await navigator.clipboard.writeText(json);
	copiedPayload.value = true;
	setTimeout(() => {
		copiedPayload.value = false;
	}, 2000);
};
</script>

<template>
  <!-- Datos a un lado, payload al otro, cuando el ancho lo permite: el cuerpo
       de un intercambio es la mitad de la tarjeta y ahí se apilan. -->
  <div class="@container grid gap-4 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <div v-if="hasData" class="space-y-4 min-w-0">
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

    <div v-if="payload" class="min-w-0 flex flex-col" :class="{ '@3xl:col-span-2': !hasData }">
      <div class="flex justify-between items-center mb-2 px-1">
        <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <span class="text-[9px] font-black uppercase tracking-widest">Payload · {{ Object.keys(payload).length }} keys</span>
        </div>
        <button @click.stop="handleCopyPayload"
          class="flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-lg transition-all shadow-sm border uppercase bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:text-indigo-600 active:scale-95"
        >
          <svg v-if="!copiedPayload" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
          <svg v-else class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
          {{ copiedPayload ? 'Copied' : 'Copy' }}
        </button>
      </div>

      <pre class="p-4 overflow-x-auto bg-[#0d0d0e] rounded-2xl text-[10px] text-emerald-400/90 border border-white/5 shadow-2xl custom-scrollbar font-mono leading-relaxed ring-1 ring-white/5">{{ JSON.stringify(payload, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }
</style>
