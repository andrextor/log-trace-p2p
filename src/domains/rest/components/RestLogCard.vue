<script setup lang="ts">
import { computed, ref } from "vue";
import { CATEGORY_STYLES } from "../../../shared/constants/ui-styles";
import type { HighlightTheme, LogEvent } from "../../../shared/types";
import { useLogStore } from "../../../store/logStore";
import type { RestDetails } from "../types";
import RestBody from "./RestBody.vue";

const props = defineProps<{
	log: LogEvent;
	isHighlighted: boolean;
}>();

const store = useLogStore();
const isExpanded = ref(false);

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const displayEndpoint = computed(() => {
	const details = props.log.details as Record<string, unknown>;
	return details?.endpoint && details.endpoint !== "N/A"
		? String(details.endpoint)
		: null;
});

const displayProvider = computed(() => {
	const details = props.log.details as Record<string, unknown>;
	return details?.provider && details.provider !== "API_REST"
		? String(details.provider)
		: null;
});

const essentialIdentifiers = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	const p = (d.payload || {}) as Record<string, unknown>;
	return [
		{ label: "Trace Hash", value: p.id },
		{ label: "Reference", value: p.reference },
		{ label: "Tenant", value: p.tenantId || p.TENANT_DOMAIN },
	].filter((c) => c.value);
});

const isErrorState = computed(() => {
	const code = Number(props.log.details?.statusCode);
	return (
		props.log.level === "ERROR" || props.log.category === "ERROR" || code >= 400
	);
});

const statusCodeStyle = computed(() => {
	const code = Number(props.log.details?.statusCode);
	if (!code || Number.isNaN(code)) return null;
	if (code >= 500)
		return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
	if (code >= 400)
		return "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400";
	return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
});

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

function handleFilterId(id: string | number) {
	emit("highlight-session", id);
}
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
      
      <div class="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 mb-3 border-b border-slate-100 dark:border-white/5 pb-3">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span v-if="log.details?.statusCode" 
                class="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-black tracking-wider transition-all shadow-sm"
                :class="statusCodeStyle">
            {{ log.details.statusCode }}
          </span>
          <div v-if="log.details?.statusCode" class="w-px h-3.5 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          
          <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors shadow-sm" 
                :class="isHighlighted ? `${activeTheme?.bg} text-white border-white/10` : styles.classes">
            {{ styles.label }}
          </span>

          <span v-if="log.details?.method" class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-bold border border-slate-200 dark:border-white/5 uppercase font-mono shadow-sm">
            <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {{ log.details.method }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 text-slate-400 shrink-0 bg-slate-50 dark:bg-black/20 px-2.5 py-1 rounded-md border border-slate-100 dark:border-white/5 shadow-sm">
           <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           <span class="font-mono text-[10px] sm:text-[11px] font-bold tracking-tight">
             {{ formattedTime }}
           </span>
        </div>
      </div>

      <div class="py-1">
        <h3 class="font-medium text-[14px] sm:text-[15px] leading-snug text-slate-800 dark:text-slate-100 transition-colors"
            :class="{ 'font-bold text-rose-600 dark:text-rose-400': isErrorState, 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400': !isErrorState }">
          {{ log.message }}
        </h3>

        <div v-if="log.details?.rawTitle && log.details.rawTitle !== log.message" 
             class="mt-1.5 px-2 py-1 bg-slate-100/50 dark:bg-white/5 rounded border border-slate-200/50 dark:border-white/5 w-fit">
          <p class="font-mono text-[10px] text-slate-400 dark:text-slate-500 break-all leading-relaxed uppercase tracking-tighter">
            {{ log.details.rawTitle }}
          </p>
        </div>
      </div>

      <div class="flex items-start sm:items-center justify-between mt-4">
        <div class="flex flex-wrap items-center gap-2">

           <span v-if="displayProvider" 
                 class="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider border border-indigo-500/20 shadow-sm flex items-center gap-1.5">
             <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
             {{ displayProvider }}
           </span>

           <button v-for="id in essentialIdentifiers" :key="id.label" 
                   @click.stop="handleFilterId(id.value as string)"
                   class="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-indigo-500/10 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all shadow-sm group/id"
                   :title="`Filter by ${id.label}: ${id.value}`">
              <span class="text-[9px] font-black uppercase text-slate-400 group-hover/id:text-indigo-500 transition-colors">{{ id.label }}</span>
              <span class="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 truncate max-w-[80px] sm:max-w-[120px]" :title="String(id.value)">{{ id.value }}</span>
           </button>

           <div v-if="displayEndpoint" 
                class="hidden lg:flex items-center gap-2 py-1 px-2.5 bg-slate-50 dark:bg-black/30 rounded-md border border-slate-100 dark:border-white/5 transition-all group-hover:border-indigo-500/30 group-hover:bg-white dark:group-hover:bg-black/50 shadow-sm max-w-[150px] xl:max-w-xs">
             <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span class="font-mono text-[10px] sm:text-xs truncate text-slate-500 dark:text-slate-400">
               {{ displayEndpoint }}
             </span>
           </div>
        </div>

        <div class="flex items-center gap-3 shrink-0 ml-4">
           <span v-if="isHighlighted" class="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
             <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
             Tracing
           </span>
           <div class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white text-slate-400 transition-all duration-300 shadow-sm relative">
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
            <RestBody
              :details="log.details as RestDetails"
              :is-highlighted="isHighlighted"
              @filter-id="handleFilterId"
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
