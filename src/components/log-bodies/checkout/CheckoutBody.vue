<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CheckoutDetails } from '../../../logic/types';

const props = defineProps<{
  details: CheckoutDetails;
  isHighlighted: boolean;
}>();

const emit = defineEmits(['filter-id']);

const copiedPayload = ref(false);
const copiedEndpoint = ref(false);

/**
 * GUARDIA DE COPIADO:
 * Evita errores de tipo y asegura que solo se copie si existe data.
 */
async function copyToClipboard(text: string | undefined | null, refTrigger: any) {
  if (!text) return;
  await navigator.clipboard.writeText(String(text));
  refTrigger.value = true;
  setTimeout(() => refTrigger.value = false, 2000);
}

/**
 * GRID DE METADATOS (Chips):
 * Extrae IDs, Gateways y Proveedores para auditoría rápida.
 */
const contextChips = computed(() => {
  const d = props.details;
  const p = d.payload || {};
  
  const chips = [
    { label: 'Session ID', value: d.sessionId, filterable: true },
    { label: 'Transaction ID', value: d.transactionId, filterable: true },
    { label: 'Provider', value: d.provider, filterable: false }, // <-- Nuevo: Provider Extraído
    { label: 'Gateway', value: p.body?.gateway || p.gateway || null, filterable: false },
    { label: 'AWS Trace', value: d.aws_request_id, filterable: true },
    { label: 'BIN', value: p.bin || p.card?.bin || null, filterable: false },
  ];

  return chips.filter(c => c.value !== null && c.value !== undefined && c.value !== '');
});

/**
 * ESTADOS DE TRANSICIÓN:
 * Detecta si hay un cambio de estado en la sesión o si se define por primera vez.
 */
const stateTransition = computed(() => {
  const p = props.details.payload || {};
  const actual = p.actual_session_state || p.session_state;
  const target = p.state_to_update || p.new_state;
  
  // Si no hay ninguno, no mostramos el bloque
  if (!actual && !target) return null;

  return { 
    actual: actual || 'N/A', 
    target: target || actual // Si no hay target, asumimos que se quedó en el actual
  };
});

const errorDetail = computed(() => {
  const p = props.details.payload || {};
  // Detectar excepciones o fallos de validación
  if (props.details.subType === 'request_not_valid' || p.exception || Number(props.details.statusCode) >= 400) {
    return {
      title: p.exception ? 'Error de Sistema' : 'Fallo o Validación',
      message: p.exception?.message || p.message || 'La petición fue rechazada o falló la validación.',
      code: props.details.statusCode || 'ERR_VAL',
      sub: p.exception ? `${p.exception.file}:${p.exception.line}` : (props.details.endpoint || 'Capa de Validación Checkout')
    };
  }
  return null;
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-white/2 p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
      <div class="flex flex-col">
        <span class="text-[8px] text-slate-400 font-black uppercase tracking-widest">Origen</span>
        <span 
          class="text-xs font-black uppercase tracking-tight"
          :class="details.source === 'FRONTEND' ? 'text-emerald-500' : 'text-indigo-500'"
        >
          {{ details.source || 'BACKEND' }}
        </span>
      </div>
      <div class="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
      <div class="flex flex-col">
        <span class="text-[8px] text-slate-400 font-black uppercase tracking-widest">Sub-Tipo</span>
        <span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
          {{ details.subType || 'General Event' }}
        </span>
      </div>
    </div>

    <div v-if="contextChips.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-left-3">
      <div v-for="chip in contextChips" :key="chip.label" 
           class="flex items-center justify-between p-2.5 bg-white dark:bg-[#161618] border border-slate-100 dark:border-white/5 rounded-xl shadow-sm group/chip hover:border-indigo-500/30 transition-colors">
        <div class="flex flex-col overflow-hidden">
          <span class="text-[8px] font-black uppercase text-slate-400 tracking-wider mb-0.5">{{ chip.label }}</span>
          <span class="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-300 truncate">{{ chip.value }}</span>
        </div>
        <button v-if="chip.filterable" 
                @click.stop="emit('filter-id', chip.value)"
                title="Filtrar por este ID"
                class="ml-2 p-1.5 rounded-md opacity-0 group-hover/chip:opacity-100 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 transition-all focus:opacity-100">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
      </div>
    </div>

    <div v-if="stateTransition" class="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/10 flex items-center justify-center gap-6 shadow-inner">
      <div class="flex flex-col items-center">
        <span class="text-[8px] font-black uppercase text-indigo-500 dark:text-indigo-400 mb-1.5 tracking-widest">Estado Previo</span>
        <span class="px-2.5 py-1 rounded-md bg-white dark:bg-black/40 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 uppercase">
            {{ stateTransition.actual }}
        </span>
      </div>
      
      <svg v-if="stateTransition.actual !== stateTransition.target" class="w-6 h-6 text-indigo-400 animate-pulse mt-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      <div v-else class="w-6 h-6 mt-4 flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-indigo-400"></div>
      </div>

      <div class="flex flex-col items-center">
        <span class="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5 tracking-widest">Estado Objetivo</span>
        <span class="px-2.5 py-1 rounded-md bg-emerald-500 text-white text-[11px] font-mono font-black shadow-lg shadow-emerald-500/20 uppercase ring-1 ring-emerald-400">
            {{ stateTransition.target }}
        </span>
      </div>
    </div>

    <div v-if="errorDetail" class="animate-in fade-in zoom-in duration-300">
      <div class="bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 shadow-sm">
        <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-3">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span class="text-[11px] font-black uppercase tracking-widest">{{ errorDetail.title }}</span>
          <span class="ml-auto font-mono text-[11px] font-black bg-rose-500 text-white px-2 py-0.5 rounded uppercase shadow-sm shadow-rose-500/30">Code: {{ errorDetail.code }}</span>
        </div>
        <div class="space-y-1.5 pl-7 border-l-2 border-rose-200 dark:border-rose-500/30 ml-2">
          <p class="text-xs font-bold text-rose-800 dark:text-rose-300 leading-relaxed">{{ errorDetail.message }}</p>
          <p class="text-[10px] font-mono text-rose-500/80 break-all">{{ errorDetail.sub }}</p>
        </div>
      </div>
    </div>

    <div v-if="details.endpoint" class="group bg-slate-50 dark:bg-black/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:border-indigo-500/20">
      <div class="flex justify-between items-center mb-2.5">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span class="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Request Path</span>
        </div>
        <button @click="copyToClipboard(details.endpoint, copiedEndpoint)" 
                class="text-[9px] font-black uppercase px-2.5 py-1 rounded-md hover:bg-indigo-500/10 transition-colors flex items-center gap-1"
                :class="copiedEndpoint ? 'text-emerald-500' : 'text-indigo-500'">
          <svg v-if="copiedEndpoint" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
          {{ copiedEndpoint ? 'Copiado' : 'Copiar URL' }}
        </button>
      </div>
      <div class="font-mono text-[11px] break-all leading-relaxed text-slate-600 dark:text-slate-400 pl-3.5 border-l-2 border-slate-200 dark:border-white/10">
        {{ details.endpoint }}
      </div>
    </div>

    <div v-if="details.payload" class="relative group">
       <div class="flex justify-between items-center mb-2 px-1">
         <div class="flex items-center gap-2">
             <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
             <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Payload Data</span>
         </div>
         <button @click.stop="copyToClipboard(JSON.stringify(details.payload, null, 2), copiedPayload)"
           class="flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shadow-sm border uppercase bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:text-indigo-600"
         >
           <svg v-if="!copiedPayload" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
           <svg v-else class="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
           {{ copiedPayload ? 'Copiado' : 'Copiar JSON' }}
         </button>
       </div>
       
       <div class="relative group/json">
           <pre class="p-4 bg-[#0d0d0e] rounded-2xl text-[11px] text-emerald-400/90 overflow-x-auto border border-white/10 shadow-xl max-h-72 custom-scrollbar font-mono leading-relaxed ring-1 ring-white/5">{{ JSON.stringify(details.payload, null, 2) }}</pre>
           <div class="absolute bottom-3 right-4 text-[8px] font-black text-white/10 uppercase tracking-[0.3em] pointer-events-none transition-opacity group-hover/json:opacity-0">
             JSON VIEWER
           </div>
       </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }

.animate-in {
  animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>