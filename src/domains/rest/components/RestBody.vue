<script setup lang="ts">
import { computed, ref } from "vue";
import OutcomeAlert from "../../../shared/components/OutcomeAlert.vue";
import type { Outcome } from "../../../shared/types";
import type { RestDetails } from "../types";

const props = defineProps<{
	details: RestDetails;
	outcome?: Outcome;
	isHighlighted: boolean;
}>();

const emit = defineEmits<(e: "filter-id", id: string | number) => void>();

const copiedPayload = ref(false);

const contextChips = computed(() => {
	if (!props.details.payload) return [];

	const importantKeys = [
		"id",
		"TENANT_DOMAIN",
		"bin",
		"reference",
		"site",
		"service",
		"tenantId",
		"bank",
	];
	const dataSource = props.details.payload as Record<string, unknown>;

	return Object.entries(dataSource)
		.filter(
			([key, value]) =>
				importantKeys.includes(key) &&
				value !== null &&
				value !== undefined &&
				value !== "",
		)
		.map(([key, value]) => ({
			label: key === "id" ? "Trace Hash" : key.replace("_", " "),
			value: String(value),
			filterable: ["id", "bin", "reference", "tenantId"].includes(key),
		}));
});

async function copyJSON() {
	const json = JSON.stringify(props.details.payload, null, 2);
	if (!json) return;

	await navigator.clipboard.writeText(json);
	copiedPayload.value = true;
	setTimeout(() => {
		copiedPayload.value = false;
	}, 2000);
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-white/2 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs">
      <div class="flex flex-col">
        <span class="text-[8px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">
            {{ details.isLaravel ? 'Domain Context' : 'Network Provider' }}
        </span>
        <span class="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
          {{ details.provider }}
        </span>
      </div>
      <div class="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
      <div class="flex flex-col">
        <span class="text-[8px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Logic Operation</span>
        <span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
          {{ details.operation }}
        </span>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-lg bg-white dark:bg-black/20 text-[9px] font-black uppercase border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
          {{ details.isLaravel ? 'LARAVEL_SYSTEM' : details.action.replace('-', ' ') }}
        </span>
      </div>
    </div>

    <div v-if="contextChips.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-left-3 duration-500">
      <div v-for="chip in contextChips" :key="chip.label" 
           class="flex items-center justify-between p-2.5 bg-white dark:bg-[#161618] border border-slate-100 dark:border-white/5 rounded-xl shadow-sm group/chip">
        <div class="flex flex-col overflow-hidden">
          <span class="text-[7px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-tighter mb-0.5">{{ chip.label }}</span>
          <span class="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-300 truncate">{{ chip.value }}</span>
        </div>
        <button v-if="chip.filterable" 
                @click.stop="emit('filter-id', chip.value)"
                class="ml-2 p-1 rounded-md opacity-0 group-hover/chip:opacity-100 hover:bg-indigo-500/10 text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-all active:scale-90"
                title="Filter trace by this ID">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </div>
    </div>

    <OutcomeAlert :outcome="outcome" />

    <div v-if="details.payload" class="relative">
       <div class="flex justify-between items-center mb-2 px-1">
         <div class="flex items-center gap-2">
             <svg class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
             <span class="text-[9px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">Internal Data Source</span>
         </div>
         <button @click.stop="copyJSON"
           class="flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-lg transition-all shadow-sm border uppercase bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:text-indigo-600 active:scale-95"
         >
           <svg v-if="!copiedPayload" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
           <svg v-else class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
           {{ copiedPayload ? 'Structure Copied' : 'Copy JSON' }}
         </button>
       </div>
       
       <div class="relative group/json">
           <pre class="p-4 bg-[#0d0d0e] rounded-2xl text-[10px] text-emerald-400/90 overflow-x-auto border border-white/5 shadow-2xl custom-scrollbar font-mono leading-relaxed ring-1 ring-white/5">{{ JSON.stringify(details.payload, null, 2) }}</pre>
           <div class="absolute bottom-3 right-4 text-[7px] font-black text-white/5 uppercase tracking-[0.4em] pointer-events-none group-hover/json:text-white/20 transition-colors">
             REST_TRACE_CONSOLE
           </div>
       </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }
</style>