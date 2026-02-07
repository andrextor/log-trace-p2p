<script setup lang="ts">
import { ref } from 'vue';
import type { RestDetails } from '../../../logic/types';

const props = defineProps<{
  details: RestDetails;
  isHighlighted: boolean;
}>();

const copiedPayload = ref(false);

async function copyJSON() {
  await navigator.clipboard.writeText(JSON.stringify(props.details.payload, null, 2));
  copiedPayload.value = true;
  setTimeout(() => copiedPayload.value = false, 2000);
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-3">
      <div class="flex flex-col">
        <span class="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Proveedor</span>
        <span class="text-xs font-black text-indigo-500 uppercase">{{ details.provider }}</span>
      </div>
      <div class="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
      <div class="flex flex-col">
        <span class="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Operación</span>
        <span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{{ details.operation }}</span>
      </div>
      <div v-if="details.action" class="ml-auto">
        <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[9px] font-black uppercase border border-slate-200 dark:border-white/10">
          {{ details.action }}
        </span>
      </div>
    </div>

    <div v-if="details.endpoint !== 'N/A'" class="bg-slate-50 dark:bg-black/20 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
      <div class="flex justify-between items-center mb-1">
        <span class="text-[9px] text-slate-400 font-bold uppercase">Endpoint Destino</span>
        <span class="text-[10px] font-black text-indigo-400 uppercase font-mono">{{ details.method }}</span>
      </div>
      <div class="font-mono text-[10px] break-all text-slate-600 dark:text-slate-400 leading-relaxed">
        {{ details.endpoint }}
      </div>
    </div>

    <div v-if="details.payload" class="relative group font-mono">
       <div class="flex justify-between items-center mb-1 px-1">
         <span class="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-widest">Contenido de la SDK</span>
         <button @click.stop="copyJSON"
           class="text-[9px] font-bold px-2 py-0.5 rounded transition-all shadow-sm"
           :class="copiedPayload ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white'"
         >
           {{ copiedPayload ? '✓ Copiado' : '</> Copiar JSON' }}
         </button>
       </div>
       <pre class="p-3 bg-slate-900 rounded-lg text-[10px] text-emerald-400/90 overflow-x-auto border border-slate-800 shadow-inner max-h-80 custom-scrollbar">{{ JSON.stringify(details.payload, null, 2) }}</pre>
    </div>
  </div>
</template>