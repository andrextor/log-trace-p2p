<script setup lang="ts">
import { computed, ref } from "vue";
import LogCardHeader from "../../../shared/components/LogCardHeader.vue";
import { CATEGORY_STYLES } from "../../../shared/constants/ui-styles";
import type { HighlightTheme, LogEvent } from "../../../shared/types";
import { isFailure } from "../../../shared/ui/LogUIHelper";
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

const essentialIdentifiers = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	const p = (d.payload || {}) as Record<string, unknown>;
	return [
		{ label: "Trace Hash", value: p.id },
		{ label: "Reference", value: p.reference },
		{ label: "Tenant", value: p.tenantId || p.TENANT_DOMAIN },
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

function handleFilterId(id: string | number) {
	emit("highlight-session", id);
}

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

const handleIdentifierClick = (idValue: string | number) => {
	handleCopyId(idValue);
	emit("highlight-session", idValue);
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
      
      <LogCardHeader :log="log" :is-expanded="isExpanded" />

      <div class="flex items-start sm:items-center justify-between mt-5 pt-3 border-t border-slate-50 dark:border-white/[0.02]">
        <div class="flex flex-wrap items-center gap-2">

           <button v-for="id in essentialIdentifiers" :key="id.label" 
                   @click.stop="handleIdentifierClick(id.value as string)"
                   class="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-indigo-500/10 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all shadow-sm group/id"
                   :title="`Copy ${id.label}`">
              <span class="text-[9px] font-black uppercase transition-colors flex items-center gap-1"
                    :class="{ 'text-emerald-500': copiedId === String(id.value), 'text-slate-400 group-hover/id:text-indigo-500': copiedId !== String(id.value) }">
                <svg v-if="copiedId === String(id.value)" class="w-3 h-3 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                <template v-else>{{ id.label }}</template>
              </span>
              <span class="text-[9px] sm:text-[10px] font-mono font-bold truncate max-w-[80px] sm:max-w-[120px] transition-colors" 
                    :class="{ 'text-emerald-600 dark:text-emerald-400': copiedId === String(id.value), 'text-slate-600 dark:text-slate-300': copiedId !== String(id.value) }"
                    :title="String(id.value)">{{ id.value }}</span>
           </button>
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
              :outcome="log.outcome"
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
