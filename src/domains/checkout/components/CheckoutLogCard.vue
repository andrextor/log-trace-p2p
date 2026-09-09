<script setup lang="ts">
import { computed, ref } from "vue";
import EventBadges from "../../../shared/components/EventBadges.vue";
import { CATEGORY_STYLES } from "../../../shared/constants/ui-styles";
import type { HighlightTheme, LogEvent } from "../../../shared/types";
import { isFailure } from "../../../shared/ui/LogUIHelper";
import { useLogStore } from "../../../store/logStore";
import CheckoutBody from "./CheckoutBody.vue";

const props = defineProps<{
	log: LogEvent;
	isHighlighted: boolean;
}>();

const store = useLogStore();
// El desplegado sale del componente para que un intercambio agrupado pueda
// abrir ida y vuelta con un solo mando. Sin `v-model:expanded` se comporta como
// antes, con estado propio.
const isExpanded = defineModel<boolean>("expanded", { default: false });

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const displayEndpoint = computed(() => {
	const details = props.log.details as Record<string, unknown>;
	return details?.endpoint && details.endpoint !== "N/A"
		? String(details.endpoint)
		: null;
});

const displaySource = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	return d?.source ? String(d.source).toUpperCase() : null;
});

const displaySubType = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	return d?.subType ? String(d.subType) : null;
});

const stateTransition = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	const p = (d?.payload || {}) as Record<string, unknown>;
	const actual = (p.actual_session_state || p.session_state) as
		| string
		| undefined;
	const target = (p.state_to_update || p.new_state) as string | undefined;
	if (!actual && !target) return null;
	return { actual: actual || "START", target: target || actual };
});

const essentialIdentifiers = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	return [
		{ label: "SID", value: d.sessionId },
		{ label: "Trace", value: d.awsRequestId || d.aws_request_id },
	].filter((c) => c.value);
});

const isErrorState = computed(() => isFailure(props.log));

const activeTheme = computed<HighlightTheme | null>(() => {
	if (!props.isHighlighted) return null;

	const activeId = String(store.highlightedSessionId).toLowerCase();
	const details = props.log.details as Record<string, unknown>;
	const payload = (details?.payload || {}) as Record<string, unknown>;

	const isSessionId =
		details?.sessionId && String(details.sessionId).toLowerCase() === activeId;
	const isInterdinHash =
		payload?.id && String(payload.id).toLowerCase().includes(activeId);

	if (isSessionId || isInterdinHash) {
		return {
			ring: "ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-500/20",
			bg: "bg-indigo-500",
		};
	}

	return {
		ring: "ring-2 ring-orange-500 border-orange-500 shadow-orange-500/20",
		bg: "bg-orange-500",
	};
});

const styles = computed(
	() =>
		CATEGORY_STYLES[props.log.category] || {
			label: props.log.category,
			classes:
				"bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400",
		},
);

const hasBodyContent = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	return !!(d?.payload || d?.sessionId || d?.transactionId || d?.provider);
});

const formattedTime = computed(() => {
	try {
		const timePart = props.log.timestamp.split("T")[1];
		if (timePart) {
			const cleanTime = timePart.split("-")[0].split("+")[0];
			return cleanTime;
		}
		return props.log.timestamp;
	} catch (e) {
		return props.log.timestamp;
	}
});

const copiedRawLog = ref(false);
const handleCopyRawLog = async () => {
	if (!props.log.details?.rawTitle) return;
	await navigator.clipboard.writeText(String(props.log.details.rawTitle));
	copiedRawLog.value = true;
	setTimeout(() => {
		copiedRawLog.value = false;
	}, 2000);
};

const copiedId = ref<string | null>(null);
const handleCopyId = async (idValue: string | number) => {
	await navigator.clipboard.writeText(String(idValue));
	copiedId.value = String(idValue);
	setTimeout(() => {
		if (copiedId.value === String(idValue)) {
			copiedId.value = null;
		}
	}, 2000);
};
</script>

<template>
  <div 
    class="relative bg-white dark:bg-[#161618] rounded-xl transition-all duration-300 group overflow-hidden border"
    :class="[
      isHighlighted ? (activeTheme?.ring + ' z-10 shadow-xl scale-[1.01]') : 'border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.05)]',
      { 'border-rose-300/50 shadow-sm dark:border-rose-500/30': isErrorState && !isHighlighted } 
    ]"
  >
    <div class="absolute left-0 top-0 bottom-0 w-1 transition-colors"
         :class="isErrorState ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : (isHighlighted ? activeTheme?.bg : 'bg-transparent group-hover:bg-indigo-500/20')">
    </div>

    <div class="flex flex-col p-4 sm:p-5 pl-5 sm:pl-6 cursor-pointer select-none" @click="isExpanded = !isExpanded">
      
      <div class="flex flex-wrap sm:flex-nowrap justify-between items-start sm:items-center gap-3 mb-3 border-b border-slate-100 dark:border-white/5 pb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <EventBadges :log="log" />

          <div v-if="displayEndpoint" 
               class="flex items-center gap-1.5 py-0.5 px-2 bg-transparent text-slate-400 dark:text-slate-500 max-w-[200px] sm:max-w-xs md:max-w-md">
            <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span class="font-mono text-[9px] sm:text-[10px] truncate">
              {{ displayEndpoint }}
            </span>
          </div>
        </div>

        <div class="flex flex-col items-end shrink-0 gap-1 mt-1 sm:mt-0">
           <div class="flex items-center gap-1.5 text-slate-400 opacity-80">
              <span class="font-mono text-[10px] sm:text-[11px] tracking-tight">
                {{ formattedTime }}
              </span>
           </div>
        </div>
      </div>

      <div class="py-1 flex gap-3 items-start">
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-[15px] sm:text-[17px] leading-tight text-slate-800 dark:text-slate-100 transition-colors"
              :class="{ 'text-rose-600 dark:text-rose-400': isErrorState, 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400': !isErrorState }">
            {{ log.message }}
          </h3>
          
          <div v-if="log.details?.rawTitle && log.details.rawTitle !== log.message" 
               class="mt-2 px-2 py-1 bg-slate-100/50 dark:bg-white/5 rounded border border-slate-200/50 dark:border-white/5 w-fit flex items-center gap-2 group/raw">
            <p class="font-mono text-[9px] text-slate-400 dark:text-slate-500 break-all leading-relaxed tracking-tighter">
              raw log: {{ log.details.rawTitle }}
            </p>
            <button @click.stop="handleCopyRawLog" 
                    class="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-500 transition-all opacity-0 group-hover/raw:opacity-100"
                    :class="{ 'opacity-100 text-emerald-500': copiedRawLog }"
                    title="Copy Raw Log">
              <svg v-if="!copiedRawLog" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <svg v-else class="w-3 h-3 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-start sm:items-center justify-between mt-5 pt-3 border-t border-slate-50 dark:border-white/[0.02]">
        <div class="flex flex-wrap items-center gap-2">
           
           <div v-if="displaySource" title="Event Source" class="flex items-center gap-1.5 bg-slate-50 dark:bg-black/20 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 shadow-sm">
              <div class="w-1.5 h-1.5 rounded-full" :class="displaySource === 'FRONTEND' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'"></div>
              <span class="text-[9px] font-black tracking-widest text-slate-500 dark:text-slate-400">{{ displaySource }}</span>
           </div>

           <div v-if="displaySubType" class="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 shadow-sm">
              <span class="text-[9px] font-mono font-bold uppercase text-slate-400">{{ displaySubType }}</span>
           </div>

           <div v-if="stateTransition" title="State Pipeline" class="flex items-center gap-1.5 bg-slate-50 dark:bg-black/20 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 shadow-sm">
              <span class="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 truncate max-w-[80px] sm:max-w-[100px]">{{ stateTransition.actual }}</span>
              <svg class="w-3 h-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              <span class="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[80px] sm:max-w-[100px]">{{ stateTransition.target }}</span>
           </div>


           <button v-for="id in essentialIdentifiers" :key="id.label" 
                   @click.stop="id.label === 'Trace' ? (handleCopyId(id.value as string), emit('highlight-session', id.value as string)) : handleCopyId(id.value as string)"
                   class="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-indigo-500/10 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all shadow-sm group/id"
                   :title="id.label === 'Trace' ? 'Filter & copy Trace ID' : `Copy ${id.label}`">
              <span class="text-[9px] font-black uppercase transition-colors flex items-center gap-1"
                    :class="{ 'text-emerald-500': copiedId === String(id.value), 'text-slate-400 group-hover/id:text-indigo-500': copiedId !== String(id.value) }">
                <svg v-if="copiedId === String(id.value)" class="w-3 h-3 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                <template v-else>{{ id.label }}</template>
              </span>
              <span class="text-[9px] sm:text-[10px] font-mono font-bold truncate max-w-[100px] sm:max-w-[180px] transition-colors" 
                    :class="{ 'text-emerald-600 dark:text-emerald-400': copiedId === String(id.value), 'text-slate-600 dark:text-slate-300': copiedId !== String(id.value) }"
                    :title="String(id.value)">{{ id.value }}</span>
              <svg v-if="id.label === 'Trace'" class="w-3 h-3 text-slate-300 dark:text-white/10 opacity-0 group-hover/id:opacity-100 transition-all group-hover/id:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </button>
        </div>

        <div class="flex items-center gap-3 shrink-0 ml-4">
           <span v-if="isHighlighted" class="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
             <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
             Tracing
           </span>
           <div class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white text-slate-400 transition-all duration-300 shadow-sm relative"
                :class="{ 'ring-2 ring-indigo-500/20': hasBodyContent && !isExpanded }">
              <div v-if="hasBodyContent && !isExpanded" class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.6)]"></div>
              <svg class="w-4 h-4 transform transition-transform duration-300" 
                   :class="{ 'rotate-180': isExpanded }" 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
              </svg>
           </div>
        </div>
      </div>
    </div>

    <!-- Accordion Body -->
    <div class="relative grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
         :style="{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }">
      <div class="overflow-hidden">
        <div class="border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/20 overflow-hidden relative">
          <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div class="p-4 sm:p-6 lg:p-8">
            <CheckoutBody
              :details="log.details"
              :outcome="log.outcome"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: slide-down 0.25s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
