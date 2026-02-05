<script setup lang="ts">
import { ref } from 'vue';
import type { LogEvent } from '../logic/types';
import { CATEGORY_STYLES } from '../logic/mappers/checkout/CheckoutConfigMap';

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
        ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/50 shadow-lg' 
        : 'bg-white dark:bg-[#0d0d0e] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-md',
      isLocalOpen ? 'ring-1 ring-indigo-400/30' : ''
    ]"
  >
    <div 
      v-if="isHighlighted" 
      class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 z-10"
    ></div>

    <div @click="toggleOpen" class="p-4 cursor-pointer">
      <div class="flex items-start justify-between gap-4 mb-3">
        <div class="flex flex-col gap-2 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span 
              :class="CATEGORY_STYLES[log.category]?.classes || CATEGORY_STYLES.GENERIC.classes" 
              class="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter font-mono shadow-sm"
            >
              {{ CATEGORY_STYLES[log.category]?.label || CATEGORY_STYLES.GENERIC.label }}
            </span>
            <span 
              v-if="log.details.source"
              :class="log.details.source === 'FRONTEND' 
                ? 'text-cyan-600 bg-cyan-50 border-cyan-100 dark:text-cyan-400 dark:bg-cyan-400/10' 
                : 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-400/10'"
              class="text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-black"
            >
              {{ log.details.source }}
            </span>
            <time class="text-[10px] font-mono text-slate-400 dark:text-gray-500 tabular-nums">
              {{ log.timestamp }}
            </time>
          </div>
          
          <h4 class="text-[13px] text-slate-800 dark:text-gray-100 font-bold leading-snug break-words tracking-tight">
            {{ log.message }}
          </h4>
        </div>

        <div class="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity pt-1">
          <svg 
            class="w-4 h-4 text-slate-400 transition-transform duration-300" 
            :class="isLocalOpen ? 'rotate-180' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div v-if="log.details.url" class="mb-3">
        <div class="flex items-center gap-0 font-mono text-[10px] bg-slate-100 dark:bg-black/40 rounded-lg border border-slate-200 dark:border-white/5 overflow-hidden">
          <span class="px-2 py-1.5 bg-slate-200 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-tighter border-r border-slate-300 dark:border-white/5">
            {{ log.details.method }}
          </span>
          <span class="px-3 py-1.5 text-slate-500 dark:text-gray-400 truncate flex-1 font-medium">
            {{ log.details.url }}
          </span>
          <span 
            v-if="log.details.statusCode" 
            :class="log.details.statusCode >= 400 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'"
            class="px-2 py-1.5 font-black min-w-[40px] text-center"
          >
            {{ log.details.statusCode }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button 
          v-if="log.details.sessionId" 
          @click.stop="emit('highlightSession', log.details.sessionId)"
          class="flex items-center group/btn"
        >
          <div class="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 rounded-l border border-slate-200 dark:border-white/10">SID</div>
          <div class="px-2 py-0.5 text-[9px] font-mono text-indigo-600 dark:text-indigo-400 border-y border-r border-slate-200 dark:border-white/10 rounded-r group-hover/btn:border-indigo-400 transition-colors">
            {{ log.details.sessionId }}
          </div>
        </button>

        <div v-if="log.id" class="flex items-center">
          <div class="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 rounded-l border border-slate-200 dark:border-white/10">AWS ID</div>
          <div class="px-2 py-0.5 text-[9px] font-mono text-cyan-600 dark:text-cyan-400 border-y border-r border-slate-200 dark:border-white/10 rounded-r">
            {{ log.id.toString().slice(-8) }}
          </div>
        </div>
      </div>
    </div>

    <div 
      v-if="isLocalOpen" 
      class="bg-slate-50 dark:bg-black/60 border-t border-slate-200 dark:border-white/5 p-4 animate-in slide-in-from-top-2 duration-200"
    >
      <div class="flex justify-between items-center mb-3">
        <span class="text-[10px] font-mono text-indigo-500 uppercase tracking-widest font-black flex items-center gap-2">
          <span class="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></span>
          Context Payload
        </span>
        <button 
          @click.stop="copyToClipboard(JSON.stringify(log.context, null, 2))"
          class="text-[9px] px-3 py-1 rounded-full transition-all duration-200 font-black uppercase tracking-tight shadow-sm border"
          :class="[
            isCopied 
              ? 'bg-emerald-500 text-white border-emerald-500' 
              : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10 hover:border-indigo-500'
          ]"
        >
          {{ isCopied ? '¡Copiado!' : 'Copiar JSON' }}
        </button>
      </div>
      <pre class="text-[10px] font-mono text-slate-600 dark:text-indigo-200/80 overflow-x-auto p-4 bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/5 leading-relaxed custom-scrollbar">{{ JSON.stringify(log.context, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(79, 70, 229, 0.2);
  border-radius: 10px;
}
</style>