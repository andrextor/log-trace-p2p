<script setup lang="ts">
import { type Ref, computed, ref } from "vue";
import type { CheckoutDetails } from "../types";

const props = defineProps<{
	details: CheckoutDetails;
	isHighlighted: boolean;
}>();

const emit = defineEmits<(e: "filter-id", id: string | number) => void>();

const copiedPayload = ref(false);

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

const errorDetail = computed(() => {
	const p = (props.details.payload || {}) as Record<string, unknown>;
	const exception = p.exception as Record<string, unknown> | undefined;
	if (
		props.details.subType === "request_not_valid" ||
		exception ||
		Number(props.details.statusCode) >= 400
	) {
		const title = exception ? "System Exception" : "Validation Failed";
		const message =
			(exception?.message as string) ||
			(p.message as string) ||
			"Request rejected by validation layer.";
		const sub = exception
			? `${exception.file}:${exception.line}`
			: props.details.endpoint || "Checkout Validator";

		if (title === "Validation Failed" && !props.details.endpoint) {
			return null;
		}

		return {
			title,
			message,
			code: props.details.statusCode || "ERR",
			sub,
		};
	}
	return null;
});
const handleCopyPayload = () =>
	copyToClipboard(
		JSON.stringify(props.details.payload, null, 2),
		copiedPayload,
	);
</script>

<template>
  <div class="flex flex-col gap-6 w-full max-w-full font-sans">


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

    <!-- Section: Raw Data -->
    <div class="space-y-5 pt-4">

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