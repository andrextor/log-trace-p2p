<script setup lang="ts">
import { type Component, computed, ref } from "vue";
import { CATEGORY_STYLES } from "../../shared/constants/ui-styles";
import { APP_TYPES } from "../../shared/types";
import type { HighlightTheme, LogEvent } from "../../shared/types";
import { useLogStore } from "../../store/logStore";

import CheckoutBody from "../../domains/checkout/components/CheckoutBody.vue";
import RestBody from "../../domains/rest/components/RestBody.vue";

const props = defineProps<{
	log: LogEvent;
	isHighlighted: boolean;
}>();

const store = useLogStore();
const isExpanded = ref(false);

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const bodyComponents: Record<string, Component> = {
	[APP_TYPES.CHECKOUT]: CheckoutBody,
	[APP_TYPES.MICROSITIOS]: CheckoutBody,
	[APP_TYPES.REST]: RestBody,
};

const currentBodyComponent = computed(
	() => bodyComponents[props.log.appType] || CheckoutBody,
);

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

// Formateo de fecha más limpio: extraemos solo la hora y milisegundos si están disponibles
const formattedTime = computed(() => {
	try {
		const timePart = props.log.timestamp.split("T")[1];
		if (timePart) {
			// Intentamos dejar solo HH:MM:SS.mmm
			const cleanTime = timePart.split("-")[0].split("+")[0]; // quita la zona horaria
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
    class="relative bg-white dark:bg-[#161618] border rounded-2xl transition-all duration-300 group overflow-hidden"
    :class="[
      isHighlighted ? (activeTheme?.ring + ' z-10 scale-[1.01]') : 'border-slate-200 dark:border-white/10 hover:border-indigo-300/50 hover:shadow-xl',
      { 'border-l-4 border-l-rose-500 dark:border-l-rose-500': isErrorState && !isHighlighted } 
    ]"
  >
    <div class="flex flex-col p-4 gap-3 cursor-pointer select-none" @click="isExpanded = !isExpanded">
      
      <div class="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
        <div class="flex flex-wrap gap-2 items-center">
          <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors shadow-sm" 
                :class="isHighlighted ? `${activeTheme?.bg} text-white border-white/10` : styles.classes">
            {{ styles.label }}
          </span>

          <span v-if="log.details?.method" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 text-[9px] font-bold border border-slate-200 dark:border-white/5 uppercase font-mono shadow-sm">
            {{ log.details.method }}
          </span>

          <span v-if="log.details?.statusCode" 
                class="px-2 py-0.5 rounded-md text-[9px] font-mono font-black border transition-all shadow-sm"
                :class="statusCodeStyle">
            {{ log.details.statusCode }}
          </span>
        </div>

        <span class="font-mono text-[10px] text-slate-400 font-bold opacity-70 group-hover:opacity-100 transition-opacity">
          {{ formattedTime }}
        </span>
      </div>

      <div class="space-y-2.5 mt-1">
        <h3 class="font-black text-[13px] sm:text-sm leading-tight text-slate-800 dark:text-slate-100 uppercase tracking-tight transition-colors"
            :class="{ 'text-rose-600 dark:text-rose-400': isErrorState, 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400': !isErrorState }">
          {{ log.message }}
        </h3>

        <div v-if="displayProvider || displayEndpoint" 
             class="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-1">
          
          <span v-if="displayProvider" 
                class="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/20 shadow-sm">
            {{ displayProvider }}
          </span>

          <div v-if="displayEndpoint" 
               class="flex items-center gap-2 py-1 px-2.5 bg-slate-50 dark:bg-black/40 rounded-lg border border-slate-100 dark:border-white/5 transition-all group-hover:border-indigo-500/30 shadow-sm">
            <div class="w-1.5 h-1.5 rounded-full shrink-0" :class="isHighlighted ? activeTheme?.bg : 'bg-indigo-400 dark:bg-indigo-500/80'"></div>
            <span class="font-mono text-[10px] sm:text-[11px] break-all leading-relaxed text-slate-500 dark:text-slate-400 italic">
              {{ displayEndpoint }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-end items-center mt-1 border-t border-slate-50 dark:border-white/5 pt-2 transition-all">
        <div class="flex items-center gap-2">
           <span v-if="isHighlighted" class="text-[8px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Tracing Active</span>
           <div class="p-1 rounded-full group-hover:bg-slate-100 dark:group-hover:bg-white/5 transition-colors">
              <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transform transition-transform duration-300" 
                   :class="{ 'rotate-180': isExpanded }" 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
              </svg>
           </div>
        </div>
      </div>
    </div>

    <Transition name="expand">
      <div v-show="isExpanded" class="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 overflow-hidden">
        <div class="p-4 sm:p-5">
          <component 
            :is="currentBodyComponent" 
            :details="log.details"
            :is-highlighted="isHighlighted"
            @filter-id="handleFilterId"
          />
        </div>
      </div>
    </Transition>
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

/* Transición suave para el acordeón */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 2000px; /* Un valor alto que el contenido no superará */
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>