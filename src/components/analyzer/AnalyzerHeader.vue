<script setup lang="ts">
defineProps<{ totalEvents: number }>();
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="space-y-1">
      <h1 class="text-3xl font-black tracking-tighter uppercase italic">
        Log <span class="text-indigo-600 dark:text-indigo-400">Trace</span> Engine
      </h1>
      <div class="flex items-center gap-2">
        <span class="w-8 h-0.5 bg-indigo-500 rounded-full"></span>
        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] opacity-80">
          Transaction Intelligence Unit
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-4">
      
      <div class="flex items-center gap-2">
        <slot name="actions"></slot>
      </div>

      <div class="bg-white dark:bg-white/5 px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col items-end shadow-sm group hover:border-indigo-500/30 hover:shadow-md transition-all">
        <div class="flex items-center gap-1.5 mb-1">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" :class="{'bg-slate-300 animate-none': totalEvents === 0}"></div>
          <span class="text-slate-400 uppercase text-[8px] font-black tracking-widest text-right">
            Carga Global
          </span>
        </div>
        <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xl leading-none transition-all"
              :class="{'opacity-50': totalEvents === 0}">
          {{ totalEvents.toLocaleString() }}
        </span>
      </div>
      
    </div>
  </div>
</template>