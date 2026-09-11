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

// Un clic copia; si el id sirve para seguir la traza, además filtra.
async function pickChip(chip: { value: string; filterable: boolean }) {
	await navigator.clipboard.writeText(chip.value);
	copiedId.value = chip.value;
	setTimeout(() => {
		if (copiedId.value === chip.value) copiedId.value = null;
	}, 2000);
	if (chip.filterable) emit("filter-id", chip.value);
}
</script>

<template>
  <!-- Solo los datos; el payload lo pinta `PayloadView` donde la tarjeta decida.
       `empty:hidden` evita el hueco cuando no hay nada que contar. -->
  <div class="space-y-4 empty:hidden">
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
</template>

