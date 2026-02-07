<script setup lang="ts">
import { ref } from 'vue';
import type { LogEvent, LogCategory } from '../logic/types';
import { CATEGORY_STYLES } from '../logic/mappers/checkout/CheckoutConfigMap';

const props = defineProps<{
  log: LogEvent;
  isHighlighted: boolean;
}>();

const emit = defineEmits(['highlightSession']);

const isLocalOpen = ref(false);
const isCopied = ref(false);

const toggleOpen = () => { isLocalOpen.value = !isLocalOpen.value; };

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    isCopied.value = true;
    setTimeout(() => { isCopied.value = false; }, 2000);
  } catch (err) {
    console.error('Error al copiar:', err);
  }
};

const getCategoryStyle = (category: LogCategory) => {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.GENERIC;
};
</script>

<template>
  <div 
    class="group relative border transition-all duration-300 rounded-xl overflow-hidden"
    :class="[
      isHighlighted 
        ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-500/50 shadow-lg' 
        : 'bg-white dark:bg-[#0d0d0e] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-md',
      isLocalOpen ? 'ring-1 ring-indigo-400/30' : ''
    ]"
  >
    <div v-if="isHighlighted" class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 z-10"></div>

    <div @click="toggleOpen" class="p-3 cursor-pointer">
      
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex flex-wrap items-center gap-2">
          
          <span 
            :class="getCategoryStyle(log.category).classes"
            class="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono border shadow-sm whitespace-nowrap"
          >
            {{ getCategoryStyle(log.category).label }}
          </span>

          <span 
            v-if="log.details.source"
            :class="log.details.source === 'FRONTEND' 
              ? 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100 dark:text-fuchsia-400 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20' 
              : 'text-sky-600 bg-sky-50 border-sky-100 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20'"
            class="text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold tracking-tight"
          >
            {{ log.details.source }}
          </span>
        </div>

        <time class="text-[10px] font-mono text-slate-400 dark:text-gray-500 tabular-nums shrink-0 ml-auto">
          {{ log.timestamp.split(' ')[1] || log.timestamp }}
        </time>
      </div>

      <div class="flex items-start justify-between gap-4">
        <h4 class="text-[13px] text-slate-700 dark:text-gray-200 font-bold leading-snug wrap-break-words tracking-tight w-full">
          {{ log.message }}
        </h4>
        
        <svg 
          class="w-4 h-4 text-slate-300 dark:text-gray-600 transition-transform duration-300 shrink-0 mt-0.5" 
          :class="isLocalOpen ? 'rotate-180' : ''"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div v-if="log.details.url" class="mt-2 flex items-center gap-0 overflow-hidden rounded-md border border-slate-100 dark:border-white/5 text-[10px] font-mono max-w-full">
        <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 font-bold border-r border-slate-200 dark:border-white/5 shrink-0">
          {{ log.details.method }}
        </span>
        <span class="px-2 py-0.5 bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-gray-500 truncate flex-1 min-w-0" :title="log.details.url">
          {{ log.details.url }}
        </span>
        <span 
          v-if="log.details.statusCode"
          :class="Number(log.details.statusCode) >= 400 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'"
          class="px-1.5 py-0.5 font-bold border-l border-slate-200 dark:border-white/5 shrink-0"
        >
          {{ log.details.statusCode }}
        </span>
      </div>

      <div class="mt-2 flex flex-wrap gap-3 pt-1 border-t border-dashed border-slate-100 dark:border-white/5 opacity-80 hover:opacity-100 transition-opacity">
        <button 
          v-if="log.details.sessionId" 
          @click.stop="emit('highlightSession', log.details.sessionId)"
          class="text-[9px] font-mono text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 group/sid"
        >
          <span class="text-slate-400 dark:text-gray-600 font-bold">SID:</span> 
          <span class="group-hover/sid:underline decoration-indigo-300">{{ log.details.sessionId }}</span>
        </button>
        
        <span v-if="log.id" class="text-[9px] font-mono text-slate-400 dark:text-gray-600 flex items-center gap-1">
          <span class="font-bold">ID:</span> {{ String(log.id).slice(-8) }}
        </span>
      </div>
    </div>

    <div 
      v-if="isLocalOpen" 
      class="bg-slate-50 dark:bg-black/40 border-t border-slate-200 dark:border-white/5 p-3 animate-in slide-in-from-top-1 duration-200"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <svg class="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          Payload JSON
        </span>
        <button 
          @click.stop="copyToClipboard(JSON.stringify(log.context, null, 2))"
          class="text-[9px] px-2 py-1 rounded border transition-colors bg-white dark:bg-white/5 hover:bg-slate-100 border-slate-200 dark:border-white/10 text-slate-500 active:scale-95"
        >
          {{ isCopied ? '¡Copiado!' : 'Copiar' }}
        </button>
      </div>
      <pre class="text-[10px] font-mono text-slate-600 dark:text-indigo-200/70 overflow-x-auto p-2 bg-white dark:bg-black/20 rounded border border-slate-200 dark:border-white/5 custom-scrollbar max-h-60">{{ JSON.stringify(log.context, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.4);
}
</style>