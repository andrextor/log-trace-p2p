<script setup lang="ts">
import {
	ANALYZER_NAMES,
	type AnalyzerType,
	type SupportedFormat,
} from "../../types";

const props = defineProps<{
	targetType: AnalyzerType;
	availableFormats: SupportedFormat[];
	detectedFormatName: string | null;
}>();
</script>

<template>
  <div class="animate-in fade-in slide-in-from-top-4 duration-700">
    <div class="flex items-center justify-between mb-2.5 px-1">
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
        <h4 class="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
          Formatos Soportados / {{ ANALYZER_NAMES[targetType] }}
        </h4>
      </div>
    </div>
    
    <div class="flex flex-wrap gap-2">
      <div v-for="format in availableFormats" :key="format.name" 
           class="relative flex items-center px-2.5 py-1.5 rounded-lg transition-all duration-300 overflow-hidden select-none border"
           :class="[
             detectedFormatName && format.name.includes(detectedFormatName) 
               ? 'bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02] z-10 ring-1 ring-emerald-500/20' 
               : detectedFormatName 
                 ? 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5 opacity-40 grayscale' 
                 : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 shadow-sm'
           ]">
        
        <div v-if="detectedFormatName && format.name.includes(detectedFormatName)" 
             class="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-transparent pointer-events-none"></div>
        
        <div class="flex items-center gap-2 relative z-10">
          <div v-if="detectedFormatName && format.name.includes(detectedFormatName)" class="flex h-1.5 w-1.5 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </div>
          <div v-else class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors"></div>
          
          <span class="text-[9px] uppercase tracking-wider transition-colors"
                :class="detectedFormatName && format.name.includes(detectedFormatName) ? 'font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm' : 'font-bold text-slate-600 dark:text-slate-400'">
            {{ format.name }}
          </span>
        </div>
        
      </div>
    </div>
  </div>
</template>