<script setup lang="ts">
import type { LogEvent } from '../logic/types';

const props = defineProps<{
  log: LogEvent;
  isHighlighted: boolean;
}>();

const emit = defineEmits(['highlightSession']);

// Mapeo de estilos por categoría usando Tailwind 4 syntax
const categoryStyles: Record<string, string> = {
  HTTP_REQ: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HTTP_RES: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DB_OP: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  NOTIFICATION: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  EVENT: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  GENERIC: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
};
</script>

<template>
  <div 
    @click="log.details.sessionId && emit('highlightSession', log.details.sessionId)"
    class="group relative border transition-all cursor-pointer rounded-xl p-4 overflow-hidden"
    :class="[
      isHighlighted 
        ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_-5px_rgba(79,70,229,0.3)]' 
        : 'bg-white/2 border-white/5 hover:border-white/20 hover:bg-white/4'
    ]"
  >
    <div 
      v-if="isHighlighted" 
      class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_#4f46e5]"
    ></div>

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
        <div v-if="log.details.sessionId" class="flex items-center bg-black/40 border border-white/10 rounded-md overflow-hidden">
          <span class="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 text-gray-500 border-r border-white/10 uppercase">SID</span>
          <span class="px-2 py-0.5 text-[10px] font-mono text-indigo-300">{{ log.details.sessionId }}</span>
        </div>
        
        <div v-if="log.id" class="flex items-center bg-black/40 border border-white/10 rounded-md overflow-hidden">
          <span class="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 text-gray-500 border-r border-white/10 uppercase">RID</span>
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

    <div class="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <svg class="w-4 h-4 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    </div>
  </div>
</template>