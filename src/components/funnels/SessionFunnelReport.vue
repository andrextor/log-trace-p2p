<script setup lang="ts">
import { computed } from 'vue';
import { useLogStore } from '../../store/logStore';
import { toast } from 'vue-sonner';
import { APP_TYPES } from '../../logic/types'; 
import { useSessionFunnel } from '../../logic/funnels/useSessionFunnel';

const store = useLogStore();
const { generateReport } = useSessionFunnel();

// 1. Generamos el reporte reactivo basado en los logs actuales
const reportData = computed(() => {
  if (store.activeTab !== APP_TYPES.CHECKOUT) return [];
  
  const data = generateReport(store.filteredEvents);
  console.log("Funnel Data Generated:", data.length);
  return data;
});

function downloadCSV() {
  try {
    const data = reportData.value;
    if (data.length === 0) {
      toast.error("No hay sesiones para exportar");
      return;
    }

    const headers = [
      'session_id_log', 
      'type', 
      'created', 
      'entry', 
      'show', 
      'information', 
      'interest', 
      'GenerateOtpAct', 
      '3DS', 
      'process', 
      'Duracion entry', 
      'Duracion show'
    ];

    const rows = data.map(row => {
      const typeCode = row.sessionType === 'PAYMENT' ? 'P' : (row.sessionType === 'COLLECT' ? 'C' : 'U');
      return [
        row.sessionId,
        typeCode,
        row.steps.created,
        row.steps.entry,
        row.steps.show,
        row.steps.information,
        row.steps.interest,
        row.steps.generateOtp,
        row.steps.threeDS,
        row.steps.process,
        row.durations.timeToEntry || '',
        row.durations.timeToShow || ''
      ];
    });

    // Unimos con punto y coma (;) para compatibilidad directa con Excel
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    link.href = url;
    link.download = `p2p-funnel-report-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Reporte CSV descargado correctamente");
  } catch (error) {
    toast.error("Error al generar el archivo CSV");
    console.error(error);
  }
}
</script>

<template>
  <div class="space-y-4">
    
    <div v-if="reportData.length === 0" 
         class="p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-center">
      <div class="flex flex-col items-center gap-2">
        <svg class="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 2v-6m-9-9H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V3" />
        </svg>
        <span class="text-xs text-slate-500 font-black uppercase tracking-[0.2em]">
          No se encontraron sesiones de Checkout para procesar
        </span>
      </div>
    </div>

    <template v-else>
      <div class="flex items-center justify-between bg-white dark:bg-[#1e1e20] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h3 class="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">
            Resumen de Sesiones <span class="text-indigo-500">(Funnel)</span>
          </h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            {{ reportData.length }} Sesiones analizadas
          </p>
        </div>

        <button 
          @click="downloadCSV"
          class="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group"
        >
          <svg class="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-xs font-black uppercase tracking-widest">Exportar CSV</span>
        </button>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#161618]">
        <table class="w-full text-left text-[11px] font-mono whitespace-nowrap">
          <thead class="bg-slate-50 dark:bg-black/40 text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
            <tr>
              <th class="px-4 py-4 font-black">ID SESIÓN</th>
              <th class="px-4 py-4 font-black text-center">TIPO</th>
              <th class="px-4 py-4 font-black text-center">CR</th>
              <th class="px-4 py-4 font-black text-center">EN</th>
              <th class="px-4 py-4 font-black text-center">SH</th>
              <th class="px-4 py-4 font-black text-center">INF</th>
              <th class="px-4 py-4 font-black text-center">INT</th>
              <th class="px-4 py-4 font-black text-center">OTP</th>
              <th class="px-4 py-4 font-black text-center">3DS</th>
              <th class="px-4 py-4 font-black text-center">PR</th>
              <th class="px-4 py-4 font-black text-right">DUR. ENTRY</th>
              <th class="px-4 py-4 font-black text-right">DUR. SHOW</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="row in reportData.slice(0, 10)" :key="row.sessionId" class="hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-colors group">
              <td class="px-4 py-3 font-bold text-slate-700 dark:text-indigo-300">{{ row.sessionId }}</td>
              <td class="px-4 py-3 text-center">
                <span class="px-2 py-0.5 rounded text-[10px] font-black border"
                      :class="row.sessionType === 'PAYMENT' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'">
                  {{ row.sessionType === 'PAYMENT' ? 'Payment' : 'Collect' }}
                </span>
              </td>
              <td v-for="step in (['created', 'entry', 'show', 'information', 'interest', 'generateOtp', 'threeDS', 'process'] as const)" 
                  :key="step" 
                  class="px-4 py-3 text-center"
                  :class="row.steps[step] ? 'text-emerald-500 font-black scale-110' : 'text-slate-300 dark:text-slate-700'">
                {{ row.steps[step] ? '1' : '-' }}
              </td>
              
              <td class="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-bold">{{ row.durations.timeToEntry || '--' }}</td>
              <td class="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-bold">{{ row.durations.timeToShow || '--' }}</td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="reportData.length > 10" class="bg-slate-50/50 dark:bg-black/40 p-3 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] border-t border-slate-200 dark:border-white/5 font-black">
          Visualizando 10 de {{ reportData.length }} resultados • El CSV incluirá la data completa
        </div>
      </div>
    </template>

  </div>
</template>