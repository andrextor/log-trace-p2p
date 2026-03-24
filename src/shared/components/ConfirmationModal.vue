<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

const props = defineProps<{
	isOpen: boolean;
	title?: string;
	message?: string;
}>();

const emit = defineEmits(["close", "confirm"]);

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === "Escape" && props.isOpen) emit("close");
};

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-60 flex items-center justify-center p-4">
      
      <div 
        @click="emit('close')" 
        class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      ></div>

      <div class="relative w-full max-w-sm bg-white dark:bg-[#161618] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        
        <div class="h-1.5 w-full bg-linear-to-r from-red-500 to-orange-500"></div>

        <div class="p-6">
          <div class="flex items-start gap-4">
            <div class="shrink-0 p-3 bg-red-50 dark:bg-red-500/10 rounded-full">
              <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div class="flex-1">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                {{ title || '¿Estás seguro?' }}
              </h3>
              <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {{ message || 'Esta acción no se puede deshacer.' }}
              </p>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-white/5 flex gap-3 justify-end border-t border-slate-100 dark:border-white/5">
          <button 
            @click="emit('close')"
            class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg transition-all"
          >
            Cancelar
          </button>
          
          <button 
            @click="emit('confirm')"
            class="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Sí, eliminar todo</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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