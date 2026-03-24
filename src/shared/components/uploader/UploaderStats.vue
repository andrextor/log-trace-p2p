<script setup lang="ts">
defineProps<{
	totalAccumulatedLines: number;
	maxStoreLimit: number;
	isOverLimit: boolean;
}>();
</script>

<template>
  <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
    <div class="flex items-center gap-3">
      <div class="w-2.5 h-2.5 rounded-full" :class="isOverLimit ? 'bg-rose-500' : 'bg-indigo-500 animate-pulse'"></div>
      <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">Ingestor Console</span>
    </div>
    
    <div class="px-3 py-1 bg-white dark:bg-black/20 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
      <span class="text-[10px] font-mono font-bold" :class="isOverLimit ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'">
        {{ totalAccumulatedLines.toLocaleString() }} <span class="opacity-40">/</span> {{ maxStoreLimit.toLocaleString() }}
      </span>
    </div>
  </div>
</template>
