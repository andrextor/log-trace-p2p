<script setup lang="ts">
import { type Ref, computed, ref } from "vue";
import type { CheckoutDetails } from "../types";

const props = defineProps<{
	details: CheckoutDetails;
	isHighlighted: boolean;
}>();

const emit = defineEmits<(e: "filter-id", id: string | number) => void>();

const copiedPayload = ref(false);
const copiedEndpoint = ref(false);

async function copyToClipboard(
	text: string | undefined | null,
	stateRef: Ref<boolean>,
) {
	if (!text) return;
	await navigator.clipboard.writeText(String(text));
	stateRef.value = true;
	setTimeout(() => {
		stateRef.value = false;
	}, 2000);
}

const contextChips = computed(() => {
	const d = props.details;
	const p = (d.payload || {}) as Record<string, unknown>;
	const body = (p.body || {}) as Record<string, unknown>;
	return [
		{ label: "Session ID", value: d.sessionId, filterable: true },
		{ label: "Transaction", value: d.transactionId, filterable: true },
		{ label: "Provider", value: d.provider, filterable: false },
		{
			label: "Gateway",
			value: body?.gateway || p.gateway || null,
			filterable: false,
		},
		{
			label: "Trace ID",
			value: d.awsRequestId || d.aws_request_id,
			filterable: true,
		},
	].filter((c) => c.value);
});

const stateTransition = computed(() => {
	const p = (props.details.payload || {}) as Record<string, unknown>;
	const actual = (p.actual_session_state || p.session_state) as
		| string
		| undefined;
	const target = (p.state_to_update || p.new_state) as string | undefined;
	if (!actual && !target) return null;
	return { actual: actual || "START", target: target || actual };
});

const errorDetail = computed(() => {
	const p = (props.details.payload || {}) as Record<string, unknown>;
	const exception = p.exception as Record<string, unknown> | undefined;
	if (
		props.details.subType === "request_not_valid" ||
		exception ||
		Number(props.details.statusCode) >= 400
	) {
		return {
			title: exception ? "System Exception" : "Validation Failed",
			message:
				(exception?.message as string) ||
				(p.message as string) ||
				"Request rejected by validation layer.",
			code: props.details.statusCode || "ERR",
			sub: exception
				? `${exception.file}:${exception.line}`
				: props.details.endpoint || "Checkout Validator",
		};
	}
	return null;
});
const handleCopyEndpoint = () =>
	copyToClipboard(props.details.endpoint, copiedEndpoint);
const handleCopyPayload = () =>
	copyToClipboard(
		JSON.stringify(props.details.payload, null, 2),
		copiedPayload,
	);
</script>

<template>
  <div class="flex flex-col gap-6 w-full max-w-full font-sans">
    <!-- Header / Identification -->
    <div class="flex items-center justify-between bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 bg-slate-50 dark:bg-black/20 px-2.5 py-1 rounded-md border border-slate-100 dark:border-white/5">
          <div class="w-2 h-2 rounded-full animate-pulse" :class="details.source === 'FRONTEND' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]'"></div>
          <span class="text-[10px] font-black tracking-widest text-slate-600 dark:text-slate-300">{{ details.source || 'BACKEND' }}</span>
        </div>
        <div class="w-px h-5 bg-slate-200 dark:bg-white/10"></div>
        <span class="text-[11px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          {{ details.subType || 'General Event' }}
        </span>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="errorDetail" class="relative overflow-hidden bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 sm:p-5 shadow-sm">
      <div class="absolute top-0 left-0 w-1 h-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]"></div>
      <div class="flex gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div>
          <h4 class="text-[11px] sm:text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1.5">{{ errorDetail.title }}</h4>
          <p class="text-[13px] sm:text-sm font-medium text-rose-800 dark:text-rose-300 leading-relaxed">{{ errorDetail.message }}</p>
          <div class="mt-3 text-[10px] font-mono font-bold text-rose-500/80 bg-rose-500/10 inline-block px-2.5 py-1 rounded border border-rose-500/20">
            Source: {{ errorDetail.sub }}
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Section: Context -->
      <div class="space-y-3" v-if="contextChips.length > 0">
        <div class="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h4 class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Execution Context</h4>
        </div>
        <div class="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl divide-y divide-slate-100 dark:divide-white/5 shadow-sm overflow-hidden">
          <div v-for="chip in contextChips" :key="chip.label" 
               class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 group/chip hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors gap-2 sm:gap-4">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full sm:w-1/3 shrink-0">{{ chip.label }}</span>
            <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-2/3">
              <span class="text-[11px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 truncate font-semibold select-all" :title="String(chip.value)">{{ chip.value }}</span>
              <button v-if="chip.filterable" @click.stop="emit('filter-id', chip.value as string | number)" 
                      class="shrink-0 p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg transition-all shadow-sm group/btn"
                      title="Filter by this ID">
                <svg class="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Flow -->
      <div class="space-y-3" v-if="stateTransition">
        <div class="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <h4 class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">State Pipeline</h4>
        </div>
        <div class="h-[calc(100%-2.25rem)] min-h-[140px] bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm flex flex-col items-center justify-center p-6 gap-4">
           <!-- Pipeline UI Structure -->
           <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-3 w-full lg:max-w-xs">
             <div class="w-full sm:flex-1 text-center bg-slate-50 dark:bg-white/5 py-4 px-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner">
               <div class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">From</div>
               <div class="text-[11px] sm:text-xs font-mono font-bold text-slate-600 dark:text-slate-300 truncate">
                 {{ stateTransition.actual }}
               </div>
             </div>
             
             <div class="shrink-0 flex items-center justify-center transform sm:rotate-0 rotate-90 my-2 sm:my-0">
                <div class="w-10 sm:w-12 h-0.5 bg-indigo-500/30 relative">
                   <div class="absolute top-1/2 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] -translate-y-1/2"></div>
                   <div class="absolute right-0 top-1/2 -ml-1 w-2.5 h-2.5 border-t-2 border-r-2 border-indigo-500 rotate-45 -translate-y-1/2"></div>
                </div>
             </div>

             <div class="w-full sm:flex-1 text-center bg-indigo-500 py-4 px-3 rounded-xl border border-indigo-400 shadow-[0_6px_16px_rgba(99,102,241,0.3)]">
               <div class="text-[9px] font-black uppercase text-indigo-200 tracking-widest mb-1.5">To Target</div>
               <div class="text-[11px] sm:text-xs font-mono font-bold text-white truncate">
                 {{ stateTransition.target }}
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Section: Raw Data -->
    <div class="space-y-5 pt-4">
      <!-- Target Endpoint Box -->
      <div v-if="details.endpoint" class="space-y-3">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            <h4 class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Network Target</h4>
          </div>
          <button @click="handleCopyEndpoint" 
                  class="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 shadow-sm"
                  :class="copiedEndpoint ? 'text-emerald-500 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-500 hover:text-indigo-600 hover:border-indigo-500/30'">
            <Transition mode="out-in">
              <svg v-if="!copiedEndpoint" key="copy" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <svg v-else key="check" class="w-3.5 h-3.5 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
            </Transition>
            {{ copiedEndpoint ? 'Copied URL' : 'Copy URL' }}
          </button>
        </div>
        <div class="p-4 bg-slate-50 dark:bg-[#131315] rounded-xl border border-slate-200 dark:border-white/5 font-mono text-[11px] sm:text-xs break-all text-slate-600 dark:text-slate-400 hover:border-indigo-500/40 transition-colors shadow-inner selection:bg-indigo-500/30">
          {{ details.endpoint }}
        </div>
      </div>

      <!-- JSON Payload Tool -->
      <div v-if="details.payload" class="space-y-3">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            <h4 class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data Payload Container</h4>
          </div>
          <button @click="handleCopyPayload" 
                  class="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 shadow-sm"
                  :class="copiedPayload ? 'text-emerald-500 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-500 hover:text-indigo-600 hover:border-indigo-500/30'">
            <Transition mode="out-in">
              <svg v-if="!copiedPayload" key="copy" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <svg v-else key="check" class="w-3.5 h-3.5 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
            </Transition>
            {{ copiedPayload ? 'Copied Object' : 'Copy JSON' }}
          </button>
        </div>
        
        <!-- Mac-style Window for JSON -->
        <div class="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-xl group/terminal">
          <div class="flex items-center px-4 py-2.5 bg-slate-100 dark:bg-[#1a1b1e] border-b border-slate-200 dark:border-white/5">
             <div class="flex gap-1.5 shrink-0">
               <div class="w-3 h-3 rounded-full bg-rose-400 border border-black/10"></div>
               <div class="w-3 h-3 rounded-full bg-amber-400 border border-black/10"></div>
               <div class="w-3 h-3 rounded-full bg-emerald-400 border border-black/10"></div>
             </div>
             <div class="w-full text-center text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase pr-10">Application / JSON</div>
          </div>
          <pre class="p-4 sm:p-5 bg-slate-50/50 dark:bg-[#0d0d0e] text-[11px] sm:text-xs text-slate-800 dark:text-emerald-400/90 overflow-x-auto max-h-[450px] custom-scrollbar font-mono leading-relaxed selection:bg-emerald-500/30">{{ JSON.stringify(details.payload, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v-enter-active, .v-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.v-enter-from, .v-leave-to { opacity: 0; transform: scale(0.95); }

.animate-in {
  animation: in 0.2s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes in {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(156, 163, 175, 0.3); 
  border-radius: 10px; 
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.15);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>