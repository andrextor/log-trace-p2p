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

const handleCopyPayload = () =>
	copyToClipboard(
		JSON.stringify(props.details.payload, null, 2),
		copiedPayload,
	);
</script>

<template>
  <div class="flex flex-col gap-6 w-full max-w-full font-sans">

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
        <div class="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-xl group/terminall">
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