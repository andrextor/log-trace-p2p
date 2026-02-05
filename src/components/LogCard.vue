<script setup lang="ts">
import { ref } from 'vue';
import type { LogEvent } from '../logic/types';

const props = defineProps<{
  log: LogEvent;
  isHighlighted: boolean;
}>();

const emit = defineEmits(['highlightSession']);

const isLocalOpen = ref(false);
const isCopied = ref(false);

const toggleOpen = () => {
  isLocalOpen.value = !isLocalOpen.value;
};

// Mapeo de Títulos y Estilos
const categoryConfig: Record<string, { label: string, classes: string }> = {
  HTTP_REQ: { 
    label: 'Petición Http', 
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
  },
  HTTP_RES: { 
    label: 'Respuesta Http', 
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
  },
  DB_OP: { 
    label: 'Actionable / Job', 
    classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
  },
  NOTIFICATION: { 
    label: 'Notificación', 
    classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
  },
  BACKEND_LOG: { 
    label: 'Registro Backend', 
    classes: 'bg-green-500/10 text-green-400 border-green-500/20' 
  },
  GENERIC: { 
    label: 'Registro', 
    classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20' 
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error al copiar: ', err);
  }
};
</script>

<template>
  <div 
    class="group relative border transition-all rounded-xl overflow-hidden"
    :class="[
      isHighlighted 
        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_20px_-5px_rgba(79,70,229,0.2)]' 
        : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4',
      isLocalOpen ? 'ring-1 ring-indigo-400/30' : ''
    ]"
  >
    <div 
      v-if="isHighlighted" 
      class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_#4f46e5] z-10"
    ></div>

    <div @click="toggleOpen" class="p-4 cursor-pointer">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-2">
          <span 
            :class="categoryConfig[log.category]?.classes || categoryConfig.GENERIC.classes" 
            class="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono"
          >
            {{ categoryConfig[log.category]?.label || categoryConfig.GENERIC.label }}
          </span>

          <span 
            v-if="log.details.subType"
            class="text-[9px] font-mono bg-white/5 text-indigo-300/80 px-2 py-0.5 rounded border border-white/10"
          >
            {{ log.details.subType }}
          </span>

          <time class="text-[10px] font-mono text-gray-500 tabular-nums ml-1">
            {{ log.timestamp }}
          </time>
        </div>

        <div class="flex items-center gap-2">
          <button 
            v-if="log.details.sessionId" 
            @click.stop="emit('highlightSession', log.details.sessionId)"
            class="flex items-center bg-black/40 border border-white/10 rounded-md overflow-hidden hover:border-indigo-500/50 transition-colors"
          >
            <span class="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 text-gray-500 border-r border-white/10 uppercase tabular-nums">SID</span>
            <span class="px-2 py-0.5 text-[10px] font-mono text-indigo-300">{{ log.details.sessionId }}</span>
          </button>
          
          <div v-if="log.id" class="flex items-center bg-black/40 border border-white/10 rounded-md overflow-hidden">
            <span class="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 text-gray-500 border-r border-white/10 uppercase tabular-nums">RID</span>
            <span class="px-2 py-0.5 text-[10px] font-mono text-cyan-300">{{ log.id.toString().slice(-8) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-sm text-gray-200 font-medium leading-relaxed wrap-break-words">
          {{ log.message }}
        </p>

        <div v-if="log.details.url" class="flex items-center gap-2 font-mono text-[10px] bg-black/30 p-2 rounded border border-white/5 overflow-hidden">
          <span class="text-indigo-400 font-bold shrink-0 uppercase italic text-[9px]">{{ log.details.method }}</span>
          <span class="text-gray-500 truncate flex-1">{{ log.details.url }}</span>
          <span 
            v-if="log.details.statusCode" 
            :class="log.details.statusCode >= 400 ? 'text-red-400' : 'text-emerald-400'"
            class="font-bold shrink-0"
          >
            {{ log.details.statusCode }}
          </span>
        </div>
      </div>
    </div>

    <div 
      v-if="isLocalOpen" 
      class="bg-black/40 border-t border-white/5 p-4 animate-in slide-in-from-top-2 duration-200"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Context Payload</span>
        <button 
          @click.stop="copyToClipboard(JSON.stringify(log.context, null, 2))"
          class="text-[9px] px-2 py-1 rounded border transition-all duration-200 flex items-center gap-1.5 font-bold uppercase tracking-tight"
          :class="[
            isCopied 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20' 
              : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/10'
          ]"
        >
          <svg v-if="isCopied" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          {{ isCopied ? 'Copied!' : 'Copy JSON' }}
        </button>
      </div>
      <pre class="text-[11px] font-mono text-indigo-200/70 overflow-x-auto p-3 bg-black/20 rounded-lg border border-white/5 leading-relaxed ">{{ JSON.stringify(log.context, null, 2) }}</pre>
    </div>

    <div class="absolute right-4 top-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <svg 
        class="w-4 h-4 text-white/20 transition-transform duration-300" 
        :class="isLocalOpen ? 'rotate-180' : ''"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</template>