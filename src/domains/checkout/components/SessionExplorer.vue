<script setup lang="ts">
import { computed } from "vue";
import { useCheckoutSessions } from "../composables/useCheckoutSessions";

defineProps<{
	show: boolean;
}>();

const emit = defineEmits<(e: "update:show", value: boolean) => void>();

const {
	sessionSearch,
	setSessionFilter,
	getSessionMetadata,
	filteredSessionIds,
	sessionEventCount,
	getSessionTypeColor,
	store,
} = useCheckoutSessions();

const sessions = computed(() => {
	return filteredSessionIds.value.map((sid) => ({
		id: sid,
		metadata: getSessionMetadata(sid),
		eventCount: sessionEventCount(sid),
	}));
});
</script>

<template>
  <transition name="slide-panel">
    <aside v-if="show" 
           class="absolute inset-y-0 left-0 z-30 w-64 shrink-0 md:static md:z-20 border-r border-slate-200 dark:border-white/5 bg-[#fafafa]/90 dark:bg-[#0a0a0b]/90 backdrop-blur-xl flex flex-col overflow-hidden z-20 shadow-[4px_0_24px_rgba(0,0,0,0.03)]">
      
      <div class="flex items-center justify-between px-4 py-4 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">Session Explorer</span>
        </div>
        <button @click="emit('update:show', false)" class="p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
      </div>

      <div class="px-3 py-2 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
        <div class="relative group">
          <input 
            v-model="sessionSearch"
            type="text" 
            placeholder="Search sessions..." 
            class="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all placeholder:text-slate-400"
          />
          <svg class="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 relative">
        <button 
          v-if="store.sessionIds.length > 1"
          @click="setSessionFilter(null)"
          class="w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-between shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          :class="!store.sessionFilter
            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
            : 'bg-white dark:bg-[#131315] text-slate-500 border-slate-200 dark:border-white/5 hover:border-indigo-400/50 hover:bg-slate-50 dark:hover:bg-[#1a1b1e]'"
        >
          <span>All Sessions</span>
          <span class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-black/30 text-[9px] font-bold border border-slate-200 dark:border-white/5" :class="!store.sessionFilter ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'">{{ store.sessionIds.length }}</span>
        </button>

        <div v-if="store.sessionIds.length > 1" class="h-px bg-slate-200/50 dark:bg-white/5 my-3 mx-2"></div>

        <button
          v-for="session in sessions" :key="session.id"
          @click="setSessionFilter(session.id)"
          class="w-full text-left p-3 rounded-xl transition-all border group/sid relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          :class="store.sessionFilter === session.id 
            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-indigo-400 scale-[1.02] z-10'
            : 'bg-white dark:bg-[#131315] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-indigo-400/50 hover:shadow-md shadow-sm'"
        >
          <div class="relative z-10 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[11px] font-bold truncate pr-2" :class="store.sessionFilter === session.id ? 'text-white' : 'text-slate-700 dark:text-slate-200'">{{ session.id }}</span>
              <div class="flex items-center gap-1">
                 <div v-if="session.metadata?.hasSuccessfulTransaction" class="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white" title="Successful Transaction">
                    <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <span class="text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded-lg border transition-colors"
                      :class="store.sessionFilter === session.id ? 'bg-indigo-400/30 text-white border-white/20' : 'bg-slate-100/50 dark:bg-black/30 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-white/5'">
                  {{ session.eventCount }}
                </span>
              </div>
            </div>

            <div v-if="session.metadata" class="flex flex-col gap-1.5">
              <div class="flex flex-wrap items-center gap-1.5">
                <span v-if="session.metadata?.sessionType && session.metadata?.sessionType !== 'UNKNOWN'"
                      class="px-1.5 py-0.5 rounded-md border text-[8px] font-black tracking-widest uppercase"
                      :class="store.sessionFilter === session.id ? 'bg-white/20 border-white/30 text-white' : getSessionTypeColor(session.metadata?.sessionType)">
                  {{ session.metadata?.sessionType }}
                </span>
                <span v-if="session.metadata?.finalState !== 'UNDEFINED'" 
                      class="text-[9px] font-bold uppercase tracking-tighter"
                      :class="store.sessionFilter === session.id ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'">
                  {{ session.metadata?.finalState }}
                </span>
              </div>

              <div v-if="session.metadata?.reference" class="text-[9px] font-mono opacity-60 truncate">
                Ref: {{ session.metadata?.reference }}
              </div>

              <div class="flex items-center gap-2 pt-1 border-t" :class="store.sessionFilter === session.id ? 'border-white/10' : 'border-slate-100 dark:border-white/5'">
                <div class="flex items-center gap-1.5 grayscale opacity-50" :class="{ 'grayscale-0 opacity-100': session.metadata?.steps.otp }">
                  <svg class="w-2.5 h-2.5" :class="store.sessionFilter === session.id ? 'text-indigo-200' : 'text-amber-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span class="text-[7px] font-bold uppercase tracking-tighter">OTP</span>
                </div>
                <div class="flex items-center gap-1.5 grayscale opacity-50" :class="{ 'grayscale-0 opacity-100': session.metadata?.steps.threeDS }">
                  <svg class="w-2.5 h-2.5" :class="store.sessionFilter === session.id ? 'text-indigo-200' : 'text-indigo-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span class="text-[7px] font-bold uppercase tracking-tighter">3DS</span>
                </div>
                <div class="flex items-center gap-1.5 grayscale opacity-50" :class="{ 'grayscale-0 opacity-100': session.metadata?.steps.interest }">
                  <svg class="w-2.5 h-2.5" :class="store.sessionFilter === session.id ? 'text-indigo-200' : 'text-emerald-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-[7px] font-bold uppercase tracking-tighter">INT</span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
.slide-panel-enter-active, .slide-panel-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-panel-enter-from, .slide-panel-leave-to {
  opacity: 0;
  transform: translateX(-100%);
  margin-left: -16rem;
}
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(99, 102, 241, 0.2); 
  border-radius: 10px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: rgba(99, 102, 241, 0.4); 
}
</style>
