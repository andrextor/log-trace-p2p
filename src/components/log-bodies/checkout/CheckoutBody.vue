<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CheckoutDetails } from '../../../logic/types';

const props = defineProps<{
  details: CheckoutDetails;
  isHighlighted: boolean;
}>();

const emit = defineEmits(['filter-id']);

const copiedPayload = ref(false);
const copiedEndpoint = ref(false);

async function copyToClipboard(text: string | undefined | null, stateRef: any) {
  if (!text) return;
  await navigator.clipboard.writeText(String(text));
  stateRef.value = true;
  setTimeout(() => stateRef.value = false, 2000);
}

const contextChips = computed(() => {
  const d = props.details;
  const p = d.payload || {};
  return [
    { label: 'Session ID', value: d.sessionId, filterable: true },
    { label: 'Transaction', value: d.transactionId, filterable: true },
    { label: 'Provider', value: d.provider, filterable: false },
    { label: 'Gateway', value: p.body?.gateway || p.gateway || null, filterable: false },
    { label: 'Trace ID', value: d.awsRequestId || d.aws_request_id, filterable: true },
  ].filter(c => c.value);
});

const stateTransition = computed(() => {
  const p = props.details.payload || {};
  const actual = p.actual_session_state || p.session_state;
  const target = p.state_to_update || p.new_state;
  if (!actual && !target) return null;
  return { actual: actual || 'START', target: target || actual };
});

const errorDetail = computed(() => {
  const p = props.details.payload || {};
  if (props.details.subType === 'request_not_valid' || p.exception || Number(props.details.statusCode) >= 400) {
    return {
      title: p.exception ? 'System Exception' : 'Validation Failed',
      message: p.exception?.message || p.message || 'Request rejected by validation layer.',
      code: props.details.statusCode || 'ERR',
      sub: p.exception ? `${p.exception.file}:${p.exception.line}` : (props.details.endpoint || 'Checkout Validator')
    };
  }
  return null;
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center gap-4 bg-slate-100/50 dark:bg-white/5 p-2 rounded-xl border border-slate-200/50 dark:border-white/5">
      <div class="flex items-center gap-2 px-2">
        <div class="w-1.5 h-1.5 rounded-full" :class="details.source === 'FRONTEND' ? 'bg-emerald-500' : 'bg-indigo-500'"></div>
        <span class="text-[10px] font-black uppercase tracking-tighter dark:text-slate-300">{{ details.source || 'BACKEND' }}</span>
      </div>
      <div class="h-4 w-px bg-slate-300 dark:bg-white/10"></div>
      <span class="text-[10px] font-mono font-bold text-slate-500 uppercase">{{ details.subType || 'General Event' }}</span>
    </div>

    <div v-if="contextChips.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-2">
      <div v-for="chip in contextChips" :key="chip.label" 
           class="group/chip flex items-center justify-between p-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-lg hover:border-indigo-500/30 transition-all">
        <div class="flex flex-col min-w-0">
          <span class="text-[7px] font-black text-slate-400 uppercase tracking-widest">{{ chip.label }}</span>
          <span class="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">{{ chip.value }}</span>
        </div>
        <button v-if="chip.filterable" @click.stop="emit('filter-id', chip.value)" 
                class="p-1 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 rounded transition-colors">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
      </div>
    </div>

    <div v-if="stateTransition" class="flex items-center justify-center gap-4 py-3 bg-indigo-500/[0.03] rounded-xl border border-indigo-500/10">
      <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-500">{{ stateTransition.actual }}</span>
      <svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      <span class="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-indigo-500 text-white shadow-sm">{{ stateTransition.target }}</span>
    </div>

    <div v-if="errorDetail" class="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
      <div class="flex items-center gap-2 text-rose-500 mb-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span class="text-[10px] font-black uppercase tracking-widest">{{ errorDetail.title }}</span>
      </div>
      <p class="text-xs font-bold text-rose-800 dark:text-rose-300 ml-6">{{ errorDetail.message }}</p>
    </div>

    <div v-if="details.endpoint" class="space-y-2">
      <div class="flex justify-between items-center">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Endpoint</span>
        <button @click="copyToClipboard(details.endpoint, copiedEndpoint)" 
                class="group relative flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all"
                :class="copiedEndpoint ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'">
          <Transition mode="out-in">
            <svg v-if="!copiedEndpoint" key="copy" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <svg v-else key="check" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
          </Transition>
          {{ copiedEndpoint ? 'Copied' : 'Copy URL' }}
        </button>
      </div>
      <div class="p-3 bg-slate-50 dark:bg-black/40 rounded-lg border border-slate-200 dark:border-white/5 font-mono text-[10px] break-all text-slate-600 dark:text-slate-400">
        {{ details.endpoint }}
      </div>
    </div>

    <div v-if="details.payload" class="space-y-2">
      <div class="flex justify-between items-center">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Payload</span>
        <button @click="copyToClipboard(JSON.stringify(details.payload, null, 2), copiedPayload)" 
                class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all"
                :class="copiedPayload ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'">
          <Transition mode="out-in">
            <svg v-if="!copiedPayload" key="copy" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <svg v-else key="check" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
          </Transition>
          {{ copiedPayload ? 'Copied JSON' : 'Copy Object' }}
        </button>
      </div>
      <div class="relative group/terminal">
        <pre class="p-4 bg-[#0d0d0e] rounded-xl text-[11px] text-emerald-400/90 overflow-x-auto border border-white/10 shadow-2xl max-h-80 custom-scrollbar font-mono leading-relaxed">{{ JSON.stringify(details.payload, null, 2) }}</pre>
        <div class="absolute top-2 right-3 text-[7px] font-bold text-white/5 tracking-[0.4em] uppercase pointer-events-none">Immutable Raw Output</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v-enter-active, .v-leave-active { transition: all 0.2s ease; }
.v-enter-from, .v-leave-to { opacity: 0; transform: scale(0.8); }

.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
</style>