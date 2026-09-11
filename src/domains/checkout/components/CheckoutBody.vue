<script setup lang="ts">
import { ref } from "vue";
import OutcomeAlert from "../../../shared/components/OutcomeAlert.vue";
import type { Outcome } from "../../../shared/types";
import type { CheckoutDetails } from "../types";

const props = defineProps<{
	details: CheckoutDetails;
	outcome?: Outcome;
}>();

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
  <div class="space-y-5">
    <!-- Summary Bar -->
    <div class="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-white/2 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs">
      <div v-if="details.provider && details.provider !== 'API_REST'" class="flex flex-col">
        <span class="text-[8px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Provider</span>
        <span class="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
          {{ details.provider }}
        </span>
      </div>
      <div v-if="details.provider && details.provider !== 'API_REST' && details.subType" class="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
      <div v-if="details.subType" class="flex flex-col">
        <span class="text-[8px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Event Type</span>
        <span class="text-xs font-mono font-bold uppercase text-slate-700 dark:text-slate-200">
          {{ details.subType }}
        </span>
      </div>
      <div v-if="details.endpoint && details.endpoint !== 'N/A'" class="flex flex-col">
        <span class="text-[8px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Endpoint</span>
        <span class="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 truncate max-w-[300px]">
          {{ details.endpoint }}
        </span>
      </div>
    </div>

    <!-- State Pipeline (from payload) -->
    <div v-if="details.payload" class="flex flex-wrap items-center gap-2 px-1">
      <template v-for="(val, key) in (details.payload as Record<string, unknown>)" :key="key">
        <div v-if="['session_type', 'session_state', 'actual_session_state', 'state_to_update', 'new_state', 'new_status', 'payment_type', 'collect_type'].includes(String(key)) && val"
             class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 shadow-sm text-[9px]">
          <span class="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{{ String(key).replace(/_/g, " ") }}</span>
          <span class="w-px h-3 bg-slate-200 dark:bg-white/10"></span>
          <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">{{ val }}</span>
        </div>
      </template>
    </div>

    <OutcomeAlert :outcome="outcome" />

    <!-- JSON Payload -->
    <div v-if="details.payload" class="relative">
      <div class="flex justify-between items-center mb-2 px-1">
        <div class="flex items-center gap-2">
          <svg class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <span class="text-[9px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Payload</span>
        </div>
        <button @click.stop="handleCopyPayload"
          class="flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-lg transition-all shadow-sm border uppercase bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:text-indigo-600 active:scale-95"
        >
          <svg v-if="!copiedPayload" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
          <svg v-else class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
          {{ copiedPayload ? 'Copied' : 'Copy' }}
        </button>
      </div>

      <pre class="p-4 bg-[#0d0d0e] rounded-2xl text-[10px] text-emerald-400/90 overflow-x-auto border border-white/5 shadow-2xl custom-scrollbar font-mono leading-relaxed ring-1 ring-white/5">{{ JSON.stringify(details.payload, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }
</style>
