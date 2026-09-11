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
const copiedId = ref<string | null>(null);

// `action` es opcional en la libreria: la linea que no la trae no debe tumbar
// el render de la tarjeta entera. El proveedor y la operación ya van en los
// badges de la cabecera.
const action = computed(() =>
	props.details.isLaravel
		? "LARAVEL_SYSTEM"
		: (props.details.action?.replace("-", " ") ?? null),
);

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

const hasData = computed(
	() =>
		Boolean(action.value || contextChips.value.length) ||
		Boolean(props.outcome?.isError || props.outcome?.status === "REJECTED"),
);

// Un clic copia; si el id sirve para seguir la traza, además filtra.
async function pickChip(chip: { value: string; filterable: boolean }) {
	await navigator.clipboard.writeText(chip.value);
	copiedId.value = chip.value;
	setTimeout(() => {
		if (copiedId.value === chip.value) copiedId.value = null;
	}, 2000);
	if (chip.filterable) emit("filter-id", chip.value);
}

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
  <!-- Datos a un lado, payload al otro, cuando el ancho lo permite: el cuerpo
       de un intercambio es la mitad de la tarjeta y ahí se apilan. -->
  <div class="@container grid gap-4 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <div v-if="hasData" class="space-y-4 min-w-0">
      <div v-if="action || contextChips.length > 0" class="flex flex-wrap items-center gap-2">
        <span v-if="action" class="px-2 py-1 rounded-md bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase border border-slate-100 dark:border-white/5 shadow-sm text-slate-600 dark:text-slate-400">
          {{ action }}
        </span>

        <button v-for="chip in contextChips" :key="chip.label"
                @click.stop="pickChip(chip)"
                :title="chip.filterable ? `Filter & copy ${chip.label}` : `Copy ${chip.label}`"
                class="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-indigo-500/10 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all shadow-sm group/id">
          <span class="text-[9px] font-black uppercase flex items-center gap-1 transition-colors"
                :class="copiedId === chip.value ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-400 group-hover/id:text-indigo-500'">
            <svg v-if="copiedId === chip.value" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
            <template v-else>{{ chip.label }}</template>
          </span>
          <span class="text-[9px] sm:text-[10px] font-mono font-bold truncate max-w-[120px] sm:max-w-[200px] transition-colors"
                :class="copiedId === chip.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'"
                :title="chip.value">{{ chip.value }}</span>
          <svg v-if="chip.filterable" class="w-3 h-3 text-slate-300 dark:text-white/10 opacity-0 group-hover/id:opacity-100 transition-all group-hover/id:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </div>

      <OutcomeAlert :outcome="outcome" />
    </div>

    <div v-if="details.payload" class="min-w-0 flex flex-col" :class="{ '@3xl:col-span-2': !hasData }">
      <div class="flex justify-between items-center mb-2 px-1">
        <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <span class="text-[9px] font-black uppercase tracking-widest">Payload · {{ Object.keys(details.payload).length }} keys</span>
        </div>
        <button @click.stop="copyJSON"
          class="flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-lg transition-all shadow-sm border uppercase bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:text-indigo-600 active:scale-95"
        >
          <svg v-if="!copiedPayload" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
          <svg v-else class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
          {{ copiedPayload ? 'Copied' : 'Copy' }}
        </button>
      </div>

      <pre class="p-4 overflow-x-auto bg-[#0d0d0e] rounded-2xl text-[10px] text-emerald-400/90 border border-white/5 shadow-2xl custom-scrollbar font-mono leading-relaxed ring-1 ring-white/5">{{ JSON.stringify(details.payload, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }
</style>
