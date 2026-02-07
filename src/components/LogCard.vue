<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLogStore } from '../store/logStore'; 
import { APP_TYPES, type LogEvent } from '../logic/types'; 
import { CATEGORY_STYLES } from '../logic/mappers/checkout/CheckoutConfigMap';
import CheckoutBody from './log-bodies/checkout/CheckoutBody.vue'; 

const props = defineProps<{
  log: LogEvent;
  isHighlighted: boolean;
}>();

const store = useLogStore();
const isExpanded = ref(false);

/**
 * TÍTULO LIMPIO:
 * Eliminamos la URL de cualquier mensaje de rastro (Browser o API).
 */
const cleanTitle = computed(() => {
  const msg = props.log.message;
  // Si contiene una ruta (indicada por un espacio seguido de /), la cortamos
  if (msg.includes(' /')) {
    return msg.split(' /')[0];
  }
  return msg;
});

/**
 * LÓGICA DE CAJA DE RUTA:
 * Se muestra SOLAMENTE para peticiones externas o respuestas.
 */
const shouldShowUrlBox = computed(() => {
  const categoriesWithBox = ['HTTP_REQ_OUT', 'HTTP_RES', 'NOTIFICATION'];
  return categoriesWithBox.includes(props.log.category);
});

const urlData = computed(() => {
  const details = props.log.details as any;
  return {
    method: details?.method || null,
    path: details?.url || (props.log.message.includes(' /') ? '/' + props.log.message.split(' /')[1] : null)
  };
});

// Lógica de temas para colores Naranja/Púrpura
const activeTheme = computed(() => {
  if (!props.isHighlighted) return null;
  const activeId = String(store.highlightedSessionId);
  const details = props.log.details as any;
  const ctx = props.log.context as any;

  if (details?.sessionId && String(details.sessionId) === activeId) {
    return { ring: 'ring-2 ring-indigo-500 border-indigo-500 shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)]', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500' };
  }
  const awsId = details?.aws_request_id || ctx?.aws_request_id || ctx?.payload?.aws_request_id;
  if (String(awsId) === activeId || String(props.log.id) === activeId) {
    return { ring: 'ring-2 ring-orange-500 border-orange-500 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500' };
  }
  return { ring: 'ring-2 ring-indigo-500 border-indigo-500', text: 'text-indigo-500', bg: 'bg-indigo-500' };
});

const styles = computed(() => CATEGORY_STYLES[props.log.category] || { label: props.log.category, classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10' });
const emit = defineEmits(['highlight-session']);
</script>

<template>
  <div 
    class="relative bg-white dark:bg-[#161618] border rounded-xl transition-all duration-300 hover:shadow-lg group overflow-hidden"
    :class="isHighlighted ? activeTheme?.ring + ' z-10' : 'border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30'"
  >
    <div class="flex flex-col p-4 gap-3 cursor-pointer select-none" @click="isExpanded = !isExpanded">
      
      <div class="flex justify-between items-center">
        <div class="flex gap-2 items-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border transition-colors" 
                :class="isHighlighted ? `${activeTheme?.bg} text-white border-white/10` : styles.classes">
            {{ styles.label }}
          </span>
          <span v-if="urlData.method" class="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-white/5 uppercase">
            {{ urlData.method }}
          </span>
        </div>
        <span class="font-mono text-xs text-slate-400 font-bold opacity-60">
          {{ log.timestamp.split('T')[1]?.split('.')[0] || log.timestamp }}
        </span>
      </div>

      <h3 class="font-bold text-sm leading-snug wrap-break-words text-slate-800 dark:text-slate-100">
        {{ cleanTitle }}
      </h3>

      <div v-if="shouldShowUrlBox && urlData.path" 
           class="bg-slate-50 dark:bg-black/20 p-2.5 rounded-lg border border-slate-100 dark:border-white/5 font-mono text-[11px] break-all leading-relaxed shadow-inner"
           :class="isHighlighted ? activeTheme?.text : 'text-slate-500 dark:text-slate-400'">
        <span class="text-[8px] uppercase font-black opacity-40 block mb-1 tracking-tighter italic">Outgoing Request Path</span>
        {{ urlData.path }}
      </div>

      <div class="flex justify-end items-center mt-1">
        <div class="flex items-center gap-2">
           <div v-if="isHighlighted" class="flex h-2 w-2 rounded-full animate-pulse" :class="activeTheme?.bg"></div>
           <svg class="w-5 h-5 text-slate-400 transform transition-transform duration-300" :class="{ 'rotate-180': isExpanded }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
    </div>

    <div v-if="isExpanded" class="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 animate-in slide-in-from-top-2 duration-200">
      <div class="p-4">
        <CheckoutBody 
          :details="log.details as any"
          :is-highlighted="isHighlighted"
          @filter-id="(id: string | number) => emit('highlight-session', id)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }
</style>