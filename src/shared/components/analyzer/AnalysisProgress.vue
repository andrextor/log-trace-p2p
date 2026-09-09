<script setup lang="ts">
/**
 * Componente de Overlay para mostrar el progreso del análisis.
 * Se activa cuando el Store reporta que está procesando logs.
 */
defineProps<{
	progress: number;
	isProcessing: boolean;
}>();
</script>

<template>
  <Transition name="overlay-fade">
    <div 
      v-if="isProcessing" 
      class="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
    >
      <div 
        class="w-full max-w-md p-8 bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300"
      >
        <div class="flex justify-between items-end mb-6">
          <div class="space-y-1">
            <h3 class="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Analizando rastro
            </h3>
            <p class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">
              Estructurando bloques de tiempo...
            </p>
          </div>
          <div class="flex flex-col items-end">
             <span class="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400">
               {{ progress }}%
             </span>
          </div>
        </div>

        <div class="relative h-4 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
          <div 
            class="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer"
          ></div>
          
          <div 
            class="h-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <div class="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-6">
          <div class="flex gap-1">
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
          </div>
          <p class="text-[10px] text-slate-600 dark:text-slate-400 dark:text-gray-500 font-mono uppercase tracking-tight">
            No cierres la pestaña
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Transiciones de entrada y salida del overlay */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* Animación de brillo (shimmer) para la barra de carga */
@keyframes shimmer {
  0% { transform: translateX(-150%) skewX(-15deg); }
  100% { transform: translateX(150%) skewX(-15deg); }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
}

/* Sombra extra para profundidad en modo claro */
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}
</style>