<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  errors: string[];
}>();

const emit = defineEmits(['close']);

const isCopied = ref(false);

const copyAll = async () => {
  try {
    await navigator.clipboard.writeText(props.errors.join('\n'));
    
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error al copiar al portapapeles', err);
  }
};
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      <div 
        @click="emit('close')" 
        class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
      ></div>

      <div class="relative w-full max-w-3xl bg-white dark:bg-[#0a0a0b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        <div class="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800 dark:text-white">Errores de Lectura</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Se encontraron {{ errors.length }} líneas con formato desconocido.
              </p>
            </div>
          </div>
          
          <button 
            @click="emit('close')"
            class="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-100 dark:bg-black/20">
          <div class="space-y-3">
            <div 
              v-for="(line, idx) in errors" 
              :key="idx"
              class="p-3 bg-white dark:bg-[#161618] rounded-lg border border-red-200 dark:border-red-500/20 text-xs font-mono text-slate-600 dark:text-red-200/80 break-all hover:border-red-300 transition-colors"
            >
              <div class="flex gap-3">
                <span class="text-red-400 select-none opacity-50">{{ idx + 1 }}.</span>
                <span>{{ line }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0a0a0b] flex justify-end gap-2">
          
          <button 
            @click="copyAll"
            class="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-2 border"
            :class="[
              isCopied 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/20' 
                : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-transparent hover:bg-slate-200 dark:hover:bg-white/10'
            ]"
          >
            <svg v-if="isCopied" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            
            {{ isCopied ? '¡Copiado!' : 'Copiar Todo' }}
          </button>

          <button 
            @click="emit('close')"
            class="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>