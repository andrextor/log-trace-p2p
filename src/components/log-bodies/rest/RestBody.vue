<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RestDetails } from '../../../logic/types';

// Extendemos la interfaz para soportar la marca de Laravel generada por el Mapper
interface ExtendedRestDetails extends RestDetails {
  isLaravel?: boolean;
}

const props = defineProps<{
  details: ExtendedRestDetails;
  isHighlighted: boolean;
}>();

const copiedPayload = ref(false);
const copiedURL = ref(false);

/**
 * EXTRACTOR DE METADATOS (Chips):
 * Resalta variables clave para auditoría rápida.
 */
const contextChips = computed(() => {
  if (!props.details.payload) return [];
  
  // Claves que queremos convertir en etiquetas visuales
  const importantKeys = ['TENANT_DOMAIN', 'bin', 'reference', 'site', 'service', 'tenantId', 'id', 'bank', 'provider'];
  
  // Buscamos en la raíz del payload o dentro del contexto de datos
  const dataSource = props.details.isLaravel 
    ? props.details.payload 
    : (props.details.payload?.context?.data?.dinHeader || props.details.payload?.context?.data || {});

  return Object.entries(dataSource)
    .filter(([key]) => importantKeys.includes(key) && dataSource[key] !== null)
    .map(([key, value]) => ({
      label: key.replace('_', ' '),
      value: String(value)
    }));
});

/**
 * DETECTOR DE ERRORES:
 * Prioriza excepciones de red sobre errores de respuesta del proveedor.
 */
const errorDetail = computed(() => {
  if (props.details.exception) {
    return {
      title: 'Excepción de Infraestructura',
      message: props.details.exception.message,
      code: props.details.statusCode || 500,
      sub: `Origen: ${props.details.exception.file?.split('/').pop()}:${props.details.exception.line || '?'}`
    };
  }
  
  const payloadData = props.details.payload?.context?.data || props.details.payload;
  const bizError = payloadData?.dinError || payloadData?.error;
  
  if (bizError && bizError.codigo !== '0000' && bizError.codigo !== undefined) {
    return {
      title: `Fallo de ${props.details.provider}`,
      message: bizError.mensaje || bizError.message || 'Error de procesamiento',
      code: bizError.codigo,
      sub: bizError.detalle || ''
    };
  }
  
  return null;
});

async function copyURL() {
  const url = props.details.endpoint;

  if (!url) return; 

  // 2. Ahora TypeScript sabe que 'url' es obligatoriamente un string
  await navigator.clipboard.writeText(url);
  
  copiedURL.value = true;
  setTimeout(() => (copiedURL.value = false), 2000);
}

async function copyJSON() {
  await navigator.clipboard.writeText(JSON.stringify(props.details.payload, null, 2));
  copiedPayload.value = true;
  setTimeout(() => copiedPayload.value = false, 2000);
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-white/2 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs">
      <div class="flex flex-col">
        <span class="text-[8px] text-slate-400 font-black uppercase tracking-widest">
            {{ details.isLaravel ? 'Context Domain' : 'Provider Source' }}
        </span>
        <span class="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
          {{ details.provider }}
        </span>
      </div>
      <div class="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
      <div class="flex flex-col">
        <span class="text-[8px] text-slate-400 font-black uppercase tracking-widest">Operation</span>
        <span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
          {{ details.operation }}
        </span>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-lg bg-white dark:bg-black/20 text-[9px] font-black uppercase border border-slate-200 dark:border-white/10 text-slate-400">
          {{ details.isLaravel ? 'FRAMEWORK_LOG' : details.action.replace('-', ' ') }}
        </span>
      </div>
    </div>

    <div v-if="contextChips.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-left-3 duration-500">
      <div v-for="chip in contextChips" :key="chip.label" 
           class="flex flex-col p-2.5 bg-white dark:bg-[#161618] border border-slate-100 dark:border-white/5 rounded-xl shadow-sm">
        <span class="text-[7px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">{{ chip.label }}</span>
        <span class="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-300 truncate">{{ chip.value }}</span>
      </div>
    </div>

    <div v-if="errorDetail" class="animate-in fade-in zoom-in duration-300">
      <div class="bg-rose-500/5 border-2 border-rose-500/20 rounded-2xl p-4 space-y-3 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-1">
            <div class="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-bl-lg shadow-lg uppercase font-mono">
                Code: {{ errorDetail.code }}
            </div>
        </div>
        <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span class="text-[10px] font-black uppercase tracking-widest">{{ errorDetail.title }}</span>
        </div>
        <div class="space-y-1">
          <p class="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-relaxed pr-16">{{ errorDetail.message }}</p>
          <p v-if="errorDetail.sub" class="text-[9px] font-mono text-rose-400/80 break-all leading-tight italic">{{ errorDetail.sub }}</p>
        </div>
      </div>
    </div>

    <div class="group bg-indigo-500/5 dark:bg-indigo-500/10 p-3.5 rounded-2xl border border-indigo-500/10 transition-all hover:border-indigo-500/30">
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></span>
            <span class="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">
                {{ details.isLaravel ? 'Rastro en Disco' : 'Network Endpoint' }}
            </span>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase font-mono bg-white dark:bg-black/40 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-white/5 shadow-xs">
                {{ details.method }}
            </span>
            <button @click="copyURL" class="p-1.5 hover:bg-indigo-500/20 rounded-lg transition-all text-indigo-400 active:scale-90">
                <svg v-if="!copiedURL" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                <span v-else class="text-[9px] font-black uppercase">Ok</span>
            </button>
        </div>
      </div>
      <div class="font-mono text-[10px] break-all text-indigo-900/60 dark:text-indigo-200/50 leading-relaxed pl-3 border-l-2 border-indigo-500/20">
        {{ details.endpoint }}
      </div>
    </div>

    <div v-if="details.payload" class="relative">
       <div class="flex justify-between items-center mb-2 px-1">
         <div class="flex items-center gap-2">
             <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
             <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Estructura de Datos</span>
         </div>
         <button @click.stop="copyJSON"
           class="flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-lg transition-all shadow-sm border uppercase bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:text-indigo-600 active:scale-95"
         >
           <svg v-if="!copiedPayload" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
           <svg v-else class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
           {{ copiedPayload ? 'Copiado' : 'Copiar JSON' }}
         </button>
       </div>
       
       <div class="relative group/json">
           <pre class="p-4 bg-[#0d0d0e] rounded-2xl text-[10px] text-emerald-400/90 overflow-x-auto border border-white/5 shadow-2xl max-h-96 custom-scrollbar font-mono leading-relaxed ring-1 ring-white/5">{{ JSON.stringify(details.payload, null, 2) }}</pre>
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