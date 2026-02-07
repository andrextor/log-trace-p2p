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
 * Extrae IDs y Gateways para auditoría rápida.
 */
const contextChips = computed(() => {
  const d = props.details;
  const p = d.payload || {};
  
  const chips = [
    { label: 'Session ID', value: d.sessionId, filterable: true },
    { label: 'Transaction ID', value: d.transactionId, filterable: true },
    { label: 'Gateway', value: p.body?.gateway || p.gateway || null },
    { label: 'AWS Trace', value: d.aws_request_id, filterable: true },
    { label: 'BIN', value: p.bin || p.card?.bin || null },
  ];

  return chips.filter(c => c.value !== null && c.value !== undefined && c.value !== '');
});

/**
 * ESTADOS DE TRANSICIÓN:
 * Detecta si hay un cambio de estado en la sesión.
 */
const stateTransition = computed(() => {
  const p = props.details.payload || {};
  const actual = p.actual_session_state || p.session_state;
  const target = p.state_to_update || p.new_state;
  
  if (!actual && !target) return null;
  return { actual, target };
});

const errorDetail = computed(() => {
  const p = props.details.payload || {};
  // Detectar excepciones o fallos de validación
  if (props.details.subType === 'request_not_valid' || p.exception) {
    return {
      title: p.exception ? 'Error de Sistema' : 'Fallo de Validación',
      message: p.exception?.message || 'Estructura de petición inválida',
      code: props.details.statusCode || 'ERR_VAL',
      sub: p.exception ? `${p.exception.file}:${p.exception.line}` : 'Capa de Validación Checkout'
    };
  }
  return null;
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-white/2 p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs">
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
           class="flex items-center justify-between p-2 bg-white dark:bg-[#161618] border border-slate-100 dark:border-white/5 rounded-xl shadow-sm group/chip">
        <div class="flex flex-col overflow-hidden">
          <span class="text-[7px] font-black uppercase text-slate-400 tracking-tighter">{{ chip.label }}</span>
          <span class="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-300 truncate">{{ chip.value }}</span>
        </div>
        <button v-if="chip.filterable" 
                @click.stop="emit('filter-id', chip.value)"
                class="ml-2 p-1 rounded-md opacity-0 group-hover/chip:opacity-100 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 transition-all">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
      </div>
    </div>

    <div v-if="stateTransition" class="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/10 flex items-center justify-center gap-8">
      <div class="flex flex-col items-center">
        <span class="text-[7px] font-black uppercase text-indigo-400 mb-1">Estado Previo</span>
        <span class="px-2 py-0.5 rounded-md bg-white dark:bg-black/20 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/5 uppercase">
            {{ stateTransition.actual || 'N/A' }}
        </span>
      </div>
      <svg class="w-5 h-5 text-indigo-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
      <div class="flex flex-col items-center">
        <span class="text-[7px] font-black uppercase text-emerald-500 mb-1">Estado Objetivo</span>
        <span class="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-mono font-bold shadow-lg shadow-emerald-500/20 uppercase">
            {{ stateTransition.target || 'PENDING' }}
        </span>
      </div>
    </div>

    <div v-if="errorDetail" class="animate-in fade-in zoom-in duration-300">
      <div class="bg-rose-500/5 border-2 border-rose-500/20 rounded-2xl p-4 space-y-2">
        <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span class="text-[10px] font-black uppercase tracking-widest">{{ errorDetail.title }}</span>
          <span class="ml-auto font-mono text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded uppercase">Code: {{ errorDetail.code }}</span>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-relaxed">{{ errorDetail.message }}</p>
          <p class="text-[9px] font-mono text-rose-400/80 break-all">{{ errorDetail.sub }}</p>
        </div>
      </div>
    </div>

    <div v-if="details.endpoint" class="group bg-slate-50 dark:bg-black/30 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all">
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span class="text-[9px]  font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Request Path</span>
        </div>
        <button @click="copyToClipboard(details.endpoint, copiedEndpoint)" 
                class="text-[9px] font-black uppercase px-2 py-1 rounded-md hover:bg-indigo-500/10 transition-colors"
                :class="copiedEndpoint ? 'text-emerald-500' : 'text-indigo-500'">
          {{ copiedEndpoint ? 'Copiado' : 'Copiar URL' }}
        </button>
      </div>
      <div class="font-mono text-[10px] break-all leading-relaxed text-slate-500 dark:text-slate-400 pl-3 border-l-2 border-slate-200 dark:border-white/5">
        {{ details.endpoint }}
      </div>
    </div>

    <div v-if="details.payload" class="relative group">
       <div class="flex justify-between items-center mb-2 px-1">
         <div class="flex items-center gap-2">
             <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
             <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Payload Data</span>
         </div>
         <button @click.stop="copyToClipboard(JSON.stringify(details.payload, null, 2), copiedPayload)"
           class="flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-lg transition-all shadow-sm border uppercase bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:text-indigo-600"
         >
           <svg v-if="!copiedPayload" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
           <svg v-else class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
           {{ copiedPayload ? 'Copiado' : 'Copiar JSON' }}
         </button>
       </div>
       
       <div class="relative group/json">
           <pre class="p-4 bg-[#0d0d0e] rounded-2xl text-[10px] text-emerald-400/90 overflow-x-auto border border-white/5 shadow-2xl max-h-64 custom-scrollbar font-mono leading-relaxed ring-1 ring-white/5">{{ JSON.stringify(details.payload, null, 2) }}</pre>
           <div class="absolute bottom-3 right-4 text-[7px] font-black text-white/5 uppercase tracking-[0.4em] pointer-events-none">
             CHECKOUT_DEBUG_VIEWER
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