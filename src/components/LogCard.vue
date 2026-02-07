<script setup lang="ts">
import { ref, computed, } from 'vue';
import { useLogStore } from '../store/logStore'; 
import { APP_TYPES, type LogEvent } from '../logic/types'; 
import { CATEGORY_STYLES } from '../logic/mappers/checkout/CheckoutConfigMap';

// Importación de los cuerpos específicos
import CheckoutBody from './log-bodies/checkout/CheckoutBody.vue'; 
import RestBody from './log-bodies/rest/RestBody.vue'; 

const props = defineProps<{
  log: LogEvent;
  isHighlighted: boolean;
}>();


const store = useLogStore();
const isExpanded = ref(false);
const emit = defineEmits<{
  (e: 'highlight-session', id: string | number): void
}>();

const bodyComponents: Record<string, any> = {
  [APP_TYPES.CHECKOUT]: CheckoutBody,
  [APP_TYPES.REST]: RestBody,
};

const currentBodyComponent = computed(() => bodyComponents[props.log.appType] || CheckoutBody);

/**
 * EXTRACCIÓN SEGURA DE DATOS (FIX DE TYPESCRIPT)
 */
const displayEndpoint = computed(() => {
  const details = props.log.details as any;
  return details?.endpoint && details.endpoint !== 'N/A' ? details.endpoint : null;
});

const displayProvider = computed(() => {
  const details = props.log.details as any;
  // Solo mostramos el proveedor si no es el genérico 'API_REST'
  return details?.provider && details.provider !== 'API_REST' ? details.provider : null;
});

const statusCodeStyle = computed(() => {
  const code = Number(props.log.details?.statusCode);
  if (!code || isNaN(code)) return null;
  if (code >= 500) return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400';
  if (code >= 400) return 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400';
  return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';
});

const activeTheme = computed(() => {
  if (!props.isHighlighted) return null;
  const activeId = String(store.highlightedSessionId);
  const details = props.log.details as any;
  if (details?.sessionId && String(details.sessionId) === activeId) {
    return { ring: 'ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-500/20', bg: 'bg-indigo-500' };
  }
  return { ring: 'ring-2 ring-orange-500 border-orange-500 shadow-orange-500/20', bg: 'bg-orange-500' };
});

const styles = computed(() => CATEGORY_STYLES[props.log.category] || { 
  label: props.log.category, 
  classes: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400' 
});

function handleFilterId(id: string | number) {
  emit('highlight-session', id);
}
</script>

<template>
  <div 
    class="relative bg-white dark:bg-[#161618] border rounded-2xl transition-all duration-300 hover:shadow-2xl group overflow-hidden"
    :class="isHighlighted ? (activeTheme?.ring + ' z-10 scale-[1.01]') : 'border-slate-200 dark:border-white/10 hover:border-indigo-300/50'"
  >
    <div class="flex flex-col p-4 gap-3 cursor-pointer select-none" @click="isExpanded = !isExpanded">
      
      <div class="flex justify-between items-center">
        <div class="flex gap-2 items-center">
          <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors" 
                :class="isHighlighted ? `${activeTheme?.bg} text-white border-white/10` : styles.classes">
            {{ styles.label }}
          </span>

          <span v-if="log.details?.method" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 text-[9px] font-bold border border-slate-200 dark:border-white/5 uppercase font-mono">
            {{ log.details.method }}
          </span>

          <span v-if="log.details?.statusCode" 
                class="px-2 py-0.5 rounded-md text-[9px] font-mono font-black border transition-all"
                :class="statusCodeStyle">
            {{ log.details.statusCode }}
          </span>
        </div>

        <span class="font-mono text-[10px] text-slate-400 font-bold opacity-60">
          {{ log.timestamp.split('T')[1]?.split('.')[0] || log.timestamp }}
        </span>
      </div>

      <div class="space-y-2">
        <h3 class="font-black text-[13px] leading-tight text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {{ log.message }}
        </h3>

        <div v-if="displayProvider || displayEndpoint" 
             class="flex flex-wrap items-center gap-1.5">
          
          <span v-if="displayProvider" 
                class="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase border border-indigo-500/20">
            {{ displayProvider }}
          </span>

          <div v-if="displayEndpoint" 
               class="flex items-center gap-2 py-1 px-2.5 bg-slate-50 dark:bg-black/30 rounded-lg border border-slate-100 dark:border-white/5 transition-all group-hover:border-indigo-500/20">
            <div class="w-1 h-1 rounded-full shrink-0" :class="isHighlighted ? activeTheme?.bg : 'bg-indigo-400 dark:bg-indigo-500'"></div>
            <span class="font-mono text-[10px] break-all leading-relaxed text-slate-500 dark:text-slate-400 italic">
              {{ displayEndpoint }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-end items-center mt-1 border-t border-slate-50 dark:border-white/5 pt-2">
        <div class="flex items-center gap-2">
           <span v-if="isHighlighted" class="text-[8px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Tracing Active</span>
           <svg class="w-4 h-4 text-slate-300 transform transition-transform duration-300" :class="{ 'rotate-180': isExpanded }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
    </div>

    <div v-if="isExpanded" class="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 animate-in slide-in-from-top-1">
      <div class="p-5">
        <component 
          :is="currentBodyComponent" 
          :details="log.details as any"
          :is-highlighted="isHighlighted"
          @filter-id="handleFilterId"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: slide-down 0.25s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>