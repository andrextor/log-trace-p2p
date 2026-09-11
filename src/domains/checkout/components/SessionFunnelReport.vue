<script setup lang="ts">
import { computed, ref } from "vue";
import { APP_TYPES, type CheckoutParseMetadata } from "../../../shared/types";
import { useLogStore } from "../../../store/logStore";
import { useFunnelExport } from "../composables/useFunnelExport";
import { useSessionFunnel } from "../composables/useSessionFunnel";
import type {
	FunnelStats,
	FunnelStep,
	SessionFunnelRow,
	SessionFunnelSteps,
	SessionOutcome,
	SessionType,
	StepConfig,
} from "../types";

const store = useLogStore();
const { generateReport } = useSessionFunnel();
const { exportToCSV } = useFunnelExport();
const emit = defineEmits(["filter-session"]);

const STEP_CONFIG: readonly StepConfig[] = [
	{ key: "created", label: "Created", full: "Session Creation Request" },
	{ key: "entry", label: "Entry", full: "SPA Initial Load (Entry)" },
	{ key: "show", label: "Show", full: "Data Visualization (Show)" },
	{ key: "information", label: "Info", full: "Information Query" },
	{ key: "interest", label: "Interest", full: "Interest Calculation" },
	{ key: "otp", label: "OTP", full: "OTP Generation / Validation" },
	{ key: "threeDS", label: "3DS", full: "3DS / MPI Validation" },
	{ key: "process", label: "Process", full: "Payment / Collect Execution" },
] as const;

// El color solo significa resultado, igual que en los badges de las tarjetas.
const OUTCOME_STYLE: Record<SessionOutcome, string> = {
	APPROVED:
		"bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
	REJECTED:
		"bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400",
	FAILED: "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400",
	PENDING:
		"bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
	EXPIRED:
		"bg-slate-100 text-slate-600 border-slate-300 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
	ABANDONED:
		"bg-slate-100 text-slate-600 border-slate-300 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
	UNKNOWN:
		"bg-slate-100 text-slate-600 border-slate-300 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
};

// Antes todo lo que no era PAYMENT se pintaba «Collect», suscripciones incluidas.
const TYPE_LABEL: Record<SessionType, { text: string; classes: string }> = {
	PAYMENT: {
		text: "Payment",
		classes: "text-emerald-500 border-emerald-500/30",
	},
	COLLECT: { text: "Collect", classes: "text-amber-500 border-amber-500/30" },
	SUBSCRIPTION: {
		text: "Subscription",
		classes: "text-indigo-500 border-indigo-500/30",
	},
	AUTOPAY: { text: "Autopay", classes: "text-indigo-500 border-indigo-500/30" },
	UNKNOWN: { text: "Unknown", classes: "text-slate-500 border-slate-300" },
};

const PAGE = 15;
const showAll = ref(false);
type SortKey = "time" | "outcome" | "total";
const sortBy = ref<SortKey>("time");

// Los fallos primero: es lo que se viene a buscar.
const OUTCOME_RANK: Record<SessionOutcome, number> = {
	FAILED: 0,
	REJECTED: 1,
	PENDING: 2,
	UNKNOWN: 3,
	EXPIRED: 4,
	ABANDONED: 5,
	APPROVED: 6,
};

const reportData = computed(() => {
	if (store.activeTab !== APP_TYPES.CHECKOUT) return [];
	const meta = store.metadata as CheckoutParseMetadata | null;
	if (!meta?.sessions?.length) return [];

	// La metadata describe el lote entero; el informe sigue respetando el filtro
	// activo, así que se recorta a las sesiones que quedan a la vista.
	const visible = new Set(
		store.filteredEvents
			.map((e) => e.correlation.sessionId)
			.filter((id): id is string => Boolean(id)),
	);
	return generateReport(meta.sessions, visible);
});

const sortedRows = computed<SessionFunnelRow[]>(() => {
	const rows = [...reportData.value];
	if (sortBy.value === "outcome") {
		rows.sort((a, b) => OUTCOME_RANK[a.outcome] - OUTCOME_RANK[b.outcome]);
	} else if (sortBy.value === "total") {
		rows.sort((a, b) => b.totalMs - a.totalMs);
	}
	return rows;
});

const visibleRows = computed(() =>
	showAll.value ? sortedRows.value : sortedRows.value.slice(0, PAGE),
);

const stats = computed<FunnelStats | null>(() => {
	const data = reportData.value;
	if (data.length === 0) return null;
	const total = data.length;
	const approved = data.filter((r) => r.outcome === "APPROVED").length;
	return {
		total,
		// SUBSCRIPTION y AUTOPAY también son cobros al cliente: antes la librería
		// no los distinguía y todos caían en PAYMENT.
		payments: data.filter(
			(r) => r.sessionType !== "COLLECT" && r.sessionType !== "UNKNOWN",
		).length,
		collects: data.filter((r) => r.sessionType === "COLLECT").length,
		processed: data.filter((r) => r.steps.process).length,
		approved,
		conversionRate: ((approved / total) * 100).toFixed(1),
	};
});

// Un COLLECT nunca hace entry ni show: metido en el embudo dibujaba una caída
// en Entry que no era abandono, era otro tipo de sesión.
const funnelBase = computed(() =>
	reportData.value.filter((r) => r.sessionType !== "COLLECT"),
);

const funnelSteps = computed<FunnelStep[]>(() => {
	const data = funnelBase.value;
	if (!data.length) return [];
	const pct = (count: number) => ((count / data.length) * 100).toFixed(0);
	const steps = STEP_CONFIG.filter((s) =>
		["created", "entry", "show", "information", "process"].includes(s.key),
	).map((s) => {
		const count = data.filter(
			(r) => r.steps[s.key as keyof SessionFunnelSteps],
		).length;
		return { ...s, count, percentage: pct(count) };
	});
	// El último escalón es el que importa: procesar no es cobrar.
	const approved = data.filter((r) => r.outcome === "APPROVED").length;
	steps.push({
		key: "approved",
		label: "Approved",
		full: "Approved Transaction",
		count: approved,
		percentage: pct(approved),
	});
	return steps;
});

const stepLabel = (key: SessionFunnelRow["lastStep"]) =>
	STEP_CONFIG.find((s) => s.key === key)?.label ?? key ?? "";

const handleExport = () => {
	exportToCSV(sortedRows.value, stats.value, funnelSteps.value, [
		...STEP_CONFIG,
	]);
};
</script>

<template>
  <div class="space-y-6">
    <div v-if="reportData.length === 0" class="p-8 text-center opacity-50 uppercase text-[10px] font-black tracking-widest border border-dashed rounded-3xl">
      No checkout data available...
    </div>

    <template v-else>
      <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div v-for="(v, l) in { 'Total': stats?.total, 'Payments': stats?.payments, 'Collects': stats?.collects, 'Processed': stats?.processed, 'Approved': stats?.approved, 'Conversion': stats?.conversionRate + '%' }" :key="l"
             class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10"
             :title="l === 'Conversion' ? 'Approved / total' : undefined">
          <p class="text-[8px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">{{ l }}</p>
          <p class="text-xl font-black" :class="l === 'Approved' || l === 'Conversion' ? 'text-emerald-500' : 'text-indigo-500'">{{ v }}</p>
        </div>
      </div>

      <div class="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10">
        <div class="flex justify-between items-end gap-2 h-24">
          <div v-for="step in funnelSteps" :key="step.key" class="flex-1 flex flex-col items-center" :title="`${step.full}: ${step.count}`">
            <div class="w-full bg-slate-100 dark:bg-white/5 rounded-lg relative h-20 mb-2 overflow-hidden flex items-end">
              <div class="w-full transition-all duration-700" :class="step.key === 'approved' ? 'bg-emerald-500' : 'bg-indigo-500'" :style="{ height: step.percentage + '%' }"></div>
              <span class="absolute inset-0 flex items-center justify-center text-[10px] font-black">{{ step.percentage }}%</span>
            </div>
            <span class="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400">{{ step.label }}</span>
          </div>
        </div>
        <p class="mt-3 text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Over {{ funnelBase.length }} SPA sessions<span v-if="stats && stats.collects"> · {{ stats.collects }} collects excluded</span>
        </p>
      </div>

      <div class="flex flex-wrap justify-between items-center gap-3">
        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
          Sessions · showing {{ visibleRows.length }} of {{ reportData.length }}
        </h3>
        <div class="flex items-center gap-2">
          <label class="text-[9px] font-black uppercase tracking-widest text-slate-500">Sort</label>
          <select v-model="sortBy" class="text-[10px] font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-slate-700 dark:text-slate-200">
            <option value="time">Time</option>
            <option value="outcome">Result (failures first)</option>
            <option value="total">Longest session</option>
          </select>
          <button @click="handleExport" class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
            Export Full Report
          </button>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent">
        <table class="w-full text-left text-[10px] font-mono whitespace-nowrap">
          <thead class="bg-slate-50 dark:bg-black/20 text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            <tr>
              <th class="px-4 py-3 font-black">ID</th>
              <th class="px-4 py-3 text-center">TYPE</th>
              <th class="px-4 py-3 text-center">RESULT</th>
              <th v-for="s in STEP_CONFIG" :key="s.key" class="px-2 py-3 text-center">{{ s.label }}</th>
              <th class="px-4 py-3 text-right text-indigo-500" title="Created → Entry">ENTRY</th>
              <th class="px-4 py-3 text-right text-indigo-500" title="Created → Show">SHOW</th>
              <th class="px-4 py-3 text-right text-indigo-500" title="Created → Process">PROCESS</th>
              <th class="px-4 py-3 text-right text-indigo-500" title="First → last event">TOTAL</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="row in visibleRows" :key="row.sessionId"
                :class="String(row.sessionId) === String(store.highlightedSessionId) ? 'bg-indigo-500/10' : 'hover:bg-indigo-500/5'"
                class="transition-colors">
              <td class="px-4 py-3 font-bold">
                <button @click="emit('filter-session', row.sessionId)" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ row.sessionId }}</button>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-black border" :class="TYPE_LABEL[row.sessionType].classes">
                  {{ TYPE_LABEL[row.sessionType].text }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-black border uppercase" :class="OUTCOME_STYLE[row.outcome]"
                      :title="row.outcome === 'UNKNOWN' ? 'Processed, but the log has no transaction resolution' : row.finalState">
                  {{ row.outcome }}<template v-if="row.outcome === 'ABANDONED' && row.lastStep"> @ {{ stepLabel(row.lastStep) }}</template>
                </span>
              </td>
              <td v-for="s in STEP_CONFIG" :key="s.key" class="px-2 py-3 text-center">
                <div v-if="row.steps[s.key as keyof typeof row.steps]" class="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto"></div>
                <div v-else class="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10 mx-auto"></div>
              </td>
              <td class="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">{{ row.durations.timeToEntry || '--' }}</td>
              <td class="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">{{ row.durations.timeToShow || '--' }}</td>
              <td class="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">{{ row.durations.timeToProcess || '--' }}</td>
              <td class="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">{{ row.durations.total || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="reportData.length > PAGE" class="flex justify-center">
        <button @click="showAll = !showAll" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
          {{ showAll ? `Show first ${PAGE}` : `Show all ${reportData.length}` }}
        </button>
      </div>
    </template>
  </div>
</template>
