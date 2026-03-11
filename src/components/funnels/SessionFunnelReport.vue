<script setup lang="ts">
import { computed } from 'vue';
import { useLogStore } from '../../store/logStore';
import { APP_TYPES } from '../../logic/types'; 
import { useSessionFunnel } from '../../logic/funnels/useSessionFunnel';
import { useFunnelExport } from '../../logic/funnels/useFunnelExport';

const store = useLogStore();
const { generateReport } = useSessionFunnel();
const { exportToCSV } = useFunnelExport();
const emit = defineEmits(['filter-session']);

// CONFIGURACIÓN DE PASOS
const STEP_CONFIG = [
  { key: 'created', label: 'Creacion', full: 'Solicitud Crear Sesion' },
  { key: 'entry', label: 'Entry', full: 'Carga inicial del SPA (Entry)' },
  { key: 'show', label: 'Vista', full: 'Visualizacion de datos (Show)' },
  { key: 'information', label: 'Info', full: 'Interaccion / Consulta Informacion' },
  { key: 'interest', label: 'Interes', full: 'Calculo de intereses' },
  { key: 'generateOtp', label: 'OTP', full: 'Generacion / Validacion de OTP' },
  { key: 'threeDS', label: '3DS', full: 'Validacion 3DS / MPI' },
  { key: 'process', label: 'Proceso', full: 'Ejecucion de Pago / Collect' },
] as const;

const reportData = computed(() => {
  if (store.activeTab !== APP_TYPES.CHECKOUT) return [];
  return generateReport(store.filteredEvents);
});

const stats = computed(() => {
  const data = reportData.value;
  if (data.length === 0) return null;
  const total = data.length;
  const finished = data.filter(r => r.steps.process === 1).length;
  return { 
    total, 
    payments: data.filter(r => r.sessionType === 'PAYMENT').length,
    collects: data.filter(r => r.sessionType === 'COLLECT').length,
    conversionRate: ((finished / total) * 100).toFixed(1)
  };
});

const funnelSteps = computed(() => {
  const data = reportData.value;
  if (!data.length) return [];
  return STEP_CONFIG.filter(s => ['created', 'entry', 'show', 'information', 'process'].includes(s.key))
    .map(s => {
      const count = data.filter(r => (r.steps as any)[s.key] === 1).length;
      return { ...s, count, percentage: ((count / data.length) * 100).toFixed(0) };
    });
});

// Llamada a la exportación externa
const handleExport = () => {
  exportToCSV(reportData.value, stats.value, funnelSteps.value, [...STEP_CONFIG]);
};
</script>

<template>
  <div class="space-y-6">
    <div v-if="reportData.length === 0" class="p-8 text-center opacity-50 uppercase text-[10px] font-black tracking-widest border border-dashed rounded-3xl">
      Sin datos de checkout...
    </div>

    <template v-else>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="(v, l) in { 'Total': stats?.total, 'Payments': stats?.payments, 'Collects': stats?.collects, 'Conversión': stats?.conversionRate + '%' }" :key="l"
             class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
          <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ l }}</p>
          <p class="text-xl font-black text-indigo-500">{{ v }}</p>
        </div>
      </div>

      <div class="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex justify-between items-end gap-2 h-32">
        <div v-for="step in funnelSteps" :key="step.label" class="flex-1 flex flex-col items-center">
          <div class="w-full bg-slate-100 dark:bg-white/5 rounded-lg relative h-20 mb-2 overflow-hidden flex items-end">
            <div class="w-full bg-indigo-500 transition-all duration-700" :style="{ height: step.percentage + '%' }"></div>
            <span class="absolute inset-0 flex items-center justify-center text-[10px] font-black">{{ step.percentage }}%</span>
          </div>
          <span class="text-[8px] font-black uppercase text-slate-400">{{ step.label }}</span>
        </div>
      </div>

      <div class="flex justify-between items-center">
        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Trazabilidad Reciente</h3>
        <button @click="handleExport" class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
          Exportar Full Report
        </button>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent">
        <table class="w-full text-left text-[10px] font-mono whitespace-nowrap">
          <thead class="bg-slate-50 dark:bg-black/20 text-slate-400 uppercase tracking-widest">
            <tr>
              <th class="px-4 py-3 font-black">ID</th>
              <th class="px-4 py-3 text-center">TIPO</th>
              <th v-for="s in STEP_CONFIG" :key="s.key" class="px-2 py-3 text-center">{{ s.label }}</th>
              <th class="px-4 py-3 text-right text-indigo-500">ENTRY</th>
              <th class="px-4 py-3 text-right text-indigo-500">SHOW</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="row in reportData.slice(0, 15)" :key="row.sessionId" 
                :class="String(row.sessionId) === String(store.highlightedSessionId) ? 'bg-indigo-500/10' : 'hover:bg-indigo-500/5'"
                class="transition-colors">
              <td class="px-4 py-3 font-bold">
                <button @click="emit('filter-session', row.sessionId)" class="text-indigo-600 dark:text-indigo-400 hover:underline">{{ row.sessionId }}</button>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-black border"
                      :class="row.sessionType === 'PAYMENT' ? 'text-emerald-500 border-emerald-500/30' : 'text-amber-500 border-amber-500/30'">
                  {{ row.sessionType === 'PAYMENT' ? 'Payment' : 'Collect' }}
                </span>
              </td>
              <td v-for="s in STEP_CONFIG" :key="s.key" class="px-2 py-3 text-center">
                <div v-if="row.steps[s.key]" class="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto"></div>
                <div v-else class="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10 mx-auto"></div>
              </td>
              <td class="px-4 py-3 text-right font-bold text-slate-400">{{ row.durations.timeToEntry || '--' }}</td>
              <td class="px-4 py-3 text-right font-bold text-slate-400">{{ row.durations.timeToShow || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>