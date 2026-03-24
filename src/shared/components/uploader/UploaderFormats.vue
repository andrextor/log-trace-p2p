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
    <div class="flex items-center justify-between mb-3 px-1">
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
        <h4 class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
          Formatos Soportados / {{ ANALYZER_NAMES[targetType] }}
        </h4>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="detectedFormatName" class="text-[9px] font-bold text-emerald-500 tracking-tight animate-pulse">Match Encontrado</span>
        <span class="text-[8px] font-medium text-slate-400">Motor v4.2</span>
      </div>
    </div>
    
    <div class="flex flex-wrap gap-2">
      <div v-for="format in availableFormats" :key="format.name" 
           class="group/format relative flex flex-col px-4 py-2.5 rounded-2xl transition-all cursor-default overflow-hidden"
           :class="[
             detectedFormatName && format.name.includes(detectedFormatName) 
               ? 'bg-emerald-500/10 border-2 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02] z-10' 
               : detectedFormatName 
                 ? 'bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 opacity-40 grayscale-[0.5]' 
                 : 'bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-white/[0.05] shadow-sm'
           ]">
        
        <div v-if="detectedFormatName && format.name.includes(detectedFormatName)" 
             class="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent pointer-events-none"></div>
        
        <div class="flex items-center gap-2 mb-0.5 relative z-10">
          <span class="text-[10px] font-bold transition-colors"
                :class="detectedFormatName && format.name.includes(detectedFormatName) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'">
            {{ format.name }}
          </span>
          <div v-if="detectedFormatName && format.name.includes(detectedFormatName)" class="flex h-1.5 w-1.5 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </div>
          <div v-else class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover/format:bg-indigo-400 group-hover/format:animate-ping transition-colors"></div>
        </div>
        
        <div class="text-[9px] font-medium leading-tight relative z-10 transition-all duration-300"
             :class="[
               detectedFormatName && format.name.includes(detectedFormatName) 
                 ? 'text-emerald-600/80 dark:text-emerald-400/80 h-auto opacity-100' 
                 : 'text-slate-500 dark:text-slate-400 h-0 opacity-0 group-hover/format:h-auto group-hover/format:opacity-100 mt-1'
             ]">
          {{ detectedFormatName && format.name.includes(detectedFormatName) ? format.description : format.detectionRule }}
        </div>
      </div>
    </div>
  </div>
</template>
