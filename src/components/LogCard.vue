<script setup lang="ts">
import { ref } from 'vue'; // Importamos ref para el estado local
import type { LogEvent } from '../logic/types';

const props = defineProps<{
  log: LogEvent;
  isHighlighted: boolean; // Mantenemos esto para el resaltado por sesión
}>();

const emit = defineEmits(['highlightSession']);

// Estado local: Solo afecta a ESTA tarjeta
const isLocalOpen = ref(false);

const toggleOpen = () => {
  isLocalOpen.value = !isLocalOpen.value;
};

const categoryStyles: Record<string, string> = {
  HTTP_REQ: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HTTP_RES: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DB_OP: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  NOTIFICATION: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  EVENT: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  GENERIC: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
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
        <div class="flex items-center gap-3">
          <span 
            :class="categoryStyles[log.category] || categoryStyles.GENERIC" 
            class="text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter"
          >
            {{ log.category.replace('_', ' ') }}
          </span>
          <time class="text-[10px] font-mono text-gray-500 tabular-nums">
            {{ log.timestamp }}
          </time>
        </div>

        <div class="flex items-center gap-2">
          <button 
            v-if="log.details.sessionId" 
            @click.stop="emit('highlightSession', log.details.sessionId)"
            class="flex items-center bg-black/40 border border-white/10 rounded-md overflow-hidden hover:border-indigo-500/50 transition-colors"
          >
            <span class="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 text-gray-500 border-r border-white/10 uppercase">Session ID</span>
            <span class="px-2 py-0.5 text-[10px] font-mono text-indigo-300">{{ log.details.sessionId }}</span>
          </button>
          
          <div v-if="log.id" class="flex items-center bg-black/40 border border-white/10 rounded-md overflow-hidden">
            <span class="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 text-gray-500 border-r border-white/10 uppercase">Aws request id</span>
            <span class="px-2 py-0.5 text-[10px] font-mono text-cyan-300">{{ log.id.toString().slice(-8) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-sm text-gray-200 font-medium leading-relaxed wrap-break-words">
          {{ log.message }}
        </p>

        <div v-if="log.details.url" class="flex items-center gap-2 font-mono text-[10px] bg-black/30 p-2 rounded border border-white/5 overflow-hidden">
          <span class="text-indigo-400 font-bold shrink-0">{{ log.details.method }}</span>
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
          @click="copyToClipboard(JSON.stringify(log.context, null, 2))"
          class="text-[9px] bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-1 rounded border border-white/10 transition-colors"
        >
          Copy JSON
        </button>
      </div>
      <pre class="text-[11px] font-mono text-indigo-200/70 overflow-x-auto p-3 bg-black/20 rounded-lg border border-white/5 leading-relaxed">{{ JSON.stringify(log.context, null, 2) }}</pre>
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