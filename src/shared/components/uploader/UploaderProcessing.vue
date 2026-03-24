<script setup lang="ts">
defineProps<{
	isProcessing: boolean;
	progress: number;
}>();
</script>

<template>
  <div v-if="isProcessing" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#0a0a0b]/90 backdrop-blur-md z-10 animate-in fade-in duration-300">
    <div class="flex flex-col items-center gap-5">
      <div class="relative flex items-center justify-center">
        <div class="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
        <span class="absolute text-[11px] font-black text-indigo-600 dark:text-indigo-400">{{ progress }}%</span>
      </div>
      <span class="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 animate-pulse">Analizando trazas...</span>
    </div>
  </div>
</template>
