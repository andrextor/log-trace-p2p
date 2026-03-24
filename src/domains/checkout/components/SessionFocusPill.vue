<script setup lang="ts">
import { useCheckoutSessions } from "../composables/useCheckoutSessions";

const {
	hasSessionFilter,
	navigateSession,
	currentSessionIndex,
	setSessionFilter,
	store,
} = useCheckoutSessions();
</script>

<template>
  <transition name="fade">
    <div v-if="hasSessionFilter && store.sessionFilter" 
         class="absolute bottom-8 left-0 right-0 mx-auto w-max z-50 flex items-center gap-4 px-2 py-1.5 bg-white/90 dark:bg-[#1e1e22]/95 backdrop-blur-2xl rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom-4 ring-1 ring-black/5 dark:ring-white/5">
      
      <div class="flex items-center">
        <button @click="navigateSession('prev')" :disabled="currentSessionIndex <= 0"
                class="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      <div class="flex items-center gap-2.5 px-2">
        <div class="flex h-2 w-2 relative">
           <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
           <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span class="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-0.5 sm:mb-0">Session Focus</span>
          <span class="font-mono text-[13px] font-bold text-indigo-600 dark:text-indigo-400 tracking-tight select-all leading-none">{{ store.sessionFilter }}</span>
        </div>
        <span class="px-1.5 py-0.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-md text-[10px] text-indigo-600 dark:text-indigo-300 font-black ml-1 border border-indigo-500/20">
          {{ currentSessionIndex + 1 }} <span class="opacity-50">/</span> {{ store.sessionIds.length }}
        </span>
      </div>

      <div class="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-2">
        <button @click="navigateSession('next')" :disabled="currentSessionIndex >= store.sessionIds.length - 1"
                class="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
        <button @click="setSessionFilter(null)" 
                class="px-4 py-1.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/30 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border border-rose-400/20 mr-1">
          Clear
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}
.animate-in {
  animation: fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
