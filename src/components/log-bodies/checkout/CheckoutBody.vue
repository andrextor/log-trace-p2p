<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CheckoutDetails } from '../../../logic/types';

const props = defineProps<{
  details: CheckoutDetails;
  isHighlighted: boolean;
}>();

const emit = defineEmits(['filter-id']);

const copiedSession = ref(false);
const copiedTx = ref(false);
const copiedAws = ref(false);
const copiedPayload = ref(false);
const copiedUrl = ref(false);

async function copyText(text: string | number, type: 'session' | 'tx' | 'aws' | 'payload' | 'url') {
  await navigator.clipboard.writeText(String(text));
  const refs = { 
    session: copiedSession, 
    tx: copiedTx, 
    aws: copiedAws, 
    payload: copiedPayload, 
    url: copiedUrl 
  };
  
  refs[type].value = true;
  setTimeout(() => refs[type].value = false, 2000);
}

const sessionStates = computed(() => {
  const p = props.details.payload || {};
  return {
    actual: p.actual_session_state || p.session_state,
    target: p.state_to_update || p.new_state,
    awsId: p.aws_request_id || props.details.aws_request_id,
    // Extraemos el origen directamente de los detalles
    source: props.details.source || 'BACKEND'
  };
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-widest">Origen del Evento:</span>
      <span 
        class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border shadow-sm transition-colors"
        :class="sessionStates.source === 'FRONTEND' 
          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
          : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'"
      >
        {{ sessionStates.source }}
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 font-mono text-xs">
      
      <div v-if="details.sessionId" class="flex flex-col gap-1">
        <span class="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-widest">Session ID</span>
        <div class="flex items-start gap-2">
          <button @click.stop="copyText(details.sessionId, 'session')" 
            class="font-bold transition-all flex items-center gap-2 px-2 py-1.5 rounded bg-slate-100 dark:bg-white/5 group/btn text-left"
            :class="copiedSession ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'"
          >
            <span class="break-all">{{ details.sessionId }}</span>
            <svg v-if="!copiedSession" class="w-3 h-3 shrink-0 opacity-50 group-hover/btn:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <svg v-else class="w-3 h-3 shrink-0 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          </button>
          <button @click.stop="emit('filter-id', details.sessionId)" 
            class="p-1.5 rounded-lg border transition-all shrink-0"
            :class="isHighlighted ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm' : 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 hover:border-indigo-500'"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          </button>
        </div>
      </div>

      <div v-if="sessionStates.awsId" class="flex flex-col gap-1">
        <span class="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-widest">AWS ID</span>
        <div class="flex items-start gap-2">
          <button @click.stop="copyText(sessionStates.awsId, 'aws')" 
            class="font-bold transition-all flex items-center gap-2 px-2 py-1.5 rounded bg-slate-100 dark:bg-white/5 group/btn text-left w-full"
            :class="copiedAws ? 'text-emerald-500' : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10'"
          >
            <span class="break-all whitespace-normal">{{ sessionStates.awsId }}</span>
            <svg v-if="!copiedAws" class="w-3 h-3 shrink-0 opacity-50 group-hover/btn:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <svg v-else class="w-3 h-3 shrink-0 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          </button>
          <button @click.stop="emit('filter-id', sessionStates.awsId)" 
            class="p-1.5 rounded-lg border transition-all shrink-0 border-slate-200 dark:border-white/10 text-slate-400 hover:text-orange-500 hover:border-orange-500"
            title="Filtrar por esta solicitud AWS"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="sessionStates.actual || sessionStates.target" class="p-3 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center gap-6">
      <div v-if="sessionStates.actual" class="flex flex-col">
        <span class="text-[8px] text-slate-400 font-sans font-bold uppercase tracking-tighter">Estado Inicial</span>
        <span class="text-[11px] font-mono font-black text-indigo-500 uppercase italic">{{ sessionStates.actual }}</span>
      </div>
      <svg v-if="sessionStates.actual && sessionStates.target" class="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      <div v-if="sessionStates.target" class="flex flex-col">
        <span class="text-[8px] text-slate-400 font-sans font-bold uppercase tracking-tighter">Estado Destino</span>
        <span class="text-[11px] font-mono font-black text-emerald-500 uppercase italic">{{ sessionStates.target }}</span>
      </div>
    </div>

    <div v-if="details.url" class="group bg-slate-100/50 dark:bg-white/5 p-2 rounded border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all font-mono">
      <div class="flex justify-between items-center mb-1">
        <span class="text-[9px] text-slate-400 font-sans font-bold uppercase">Ruta</span>
        <button @click.stop="copyText(details.url, 'url')" 
          class="text-[9px] font-bold uppercase hover:underline transition-colors"
          :class="copiedUrl ? 'text-emerald-500' : 'text-indigo-500'"
        >
          {{ copiedUrl ? '¡Copiado!' : 'Copiar URL' }}
        </button>
      </div>
      <div class="break-all text-[10px] text-slate-500 dark:text-slate-400">{{ details.url }}</div>
    </div>

    <div v-if="details.payload" class="relative group font-mono">
       <div class="flex justify-between items-center mb-1 px-1">
         <span class="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-widest">Payload JSON</span>
         <button @click.stop="copyText(JSON.stringify(details.payload, null, 2), 'payload')"
           class="text-[9px] font-bold px-2 py-0.5 rounded transition-all shadow-sm"
           :class="copiedPayload ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white'"
         >
           {{ copiedPayload ? '✓ JSON Copiado' : '</> Copiar JSON' }}
         </button>
       </div>
       <pre class="p-3 bg-slate-900 rounded-lg text-[10px] text-indigo-100/80 overflow-x-auto border border-slate-800 shadow-inner max-h-48 custom-scrollbar">{{ JSON.stringify(details.payload, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
</style>