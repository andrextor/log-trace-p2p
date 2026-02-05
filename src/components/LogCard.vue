<script setup lang="ts">
import { ref } from 'vue';
import type { LogEvent } from '../logic/types';
import { CATEGORY_STYLES } from '../logic/mappers/checkout/checkoutConfigMap';

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
    class="group relative border transition-all duration-300 rounded-xl overflow-hidden"
    :class="[
      isHighlighted 
        ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/50 shadow-lg dark:shadow-[0_0_20px_-5px_rgba(79,70,229,0.2)]' 
        : 'bg-white dark:bg-white/2 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/4',
      isLocalOpen ? 'ring-1 ring-indigo-400/30 dark:ring-indigo-400/30' : ''
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
            :class="CATEGORY_STYLES[log.category]?.classes || CATEGORY_STYLES.GENERIC.classes" 
            class="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono"
          >
            {{ CATEGORY_STYLES[log.category]?.label || CATEGORY_STYLES.GENERIC.label }}
          </span>

          <span 
            v-if="log.details.source"
            :class="log.details.source === 'FRONTEND' 
              ? 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-400/10 dark:border-cyan-400/20' 
              : 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20'"
            class="text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold"
          >
            {{ log.details.source }}
          </span>

          <time class="text-[10px] font-mono text-slate-400 dark:text-gray-500 tabular-nums ml-1">
            {{ log.timestamp }}
          </time>
        </div>

        <div class="flex items-center gap-2 pr-6"> <button 
            v-if="log.details.sessionId" 
            @click.stop="emit('highlightSession', log.details.sessionId)"
            class="flex items-center bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-md overflow-hidden hover:border-indigo-500/50 transition-colors"
          >
            <span class="px-2 py-0.5 text-xs font-medium bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border-r border-slate-200 dark:border-white/10">Session id:</span>
            <span class="px-2 py-0.5 text-xs font-mono text-indigo-600 dark:text-indigo-300">{{ log.details.sessionId }}</span>
          </button>
          
          <div v-if="log.id" class="flex items-center bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-md overflow-hidden">
            <span class="px-2 py-0.5 text-xs font-medium bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border-r border-slate-200 dark:border-white/10">request_aws_id:</span>
            <span class="px-2 py-0.5 text-xs font-mono text-cyan-600 dark:text-cyan-300">{{ log.id.toString().slice(-8) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-sm text-slate-700 dark:text-gray-200 font-bold leading-relaxed wrap-break-words">
          {{ log.message }}
        </p>

        <div v-if="log.details.url" class="flex items-center gap-2 font-mono text-[10px] bg-slate-50 dark:bg-black/30 p-2 rounded border border-slate-200 dark:border-white/5 overflow-hidden">
          <span class="text-indigo-600 dark:text-indigo-400 font-bold shrink-0 uppercase italic text-[9px]">{{ log.details.method }}</span>
          <span class="text-slate-500 dark:text-gray-500 truncate flex-1">{{ log.details.url }}</span>
          <span 
            v-if="log.details.statusCode" 
            :class="log.details.statusCode >= 400 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'"
            class="font-bold shrink-0"
          >
            {{ log.details.statusCode }}
          </span>
        </div>
      </div>
    </div>

    <div 
      v-if="isLocalOpen" 
      class="bg-slate-50 dark:bg-black/40 border-t border-slate-200 dark:border-white/5 p-4 animate-in slide-in-from-top-2 duration-200"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold">Context Payload</span>
        <button 
          @click.stop="copyToClipboard(JSON.stringify(log.context, null, 2))"
          class="text-[9px] px-2 py-1 rounded border transition-all duration-200 flex items-center gap-1.5 font-bold uppercase tracking-tight"
          :class="[
            isCopied 
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
              : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-white/10 shadow-sm'
          ]"
        >
          <svg v-if="isCopied" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          {{ isCopied ? 'Copiado!' : 'Copiar JSON' }}
        </button>
      </div>
      <pre class="text-[11px] font-mono text-slate-600 dark:text-indigo-200/70 overflow-x-auto p-3 bg-white dark:bg-black/20 rounded-lg border border-slate-200 dark:border-white/5 leading-relaxed">{{ JSON.stringify(log.context, null, 2) }}</pre>
    </div>

    <div class="absolute right-3 top-5 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
      <svg 
        class="w-4 h-4 text-slate-400 dark:text-white/40 transition-transform duration-300" 
        :class="isLocalOpen ? 'rotate-180' : ''"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</template>