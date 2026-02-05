<script setup lang="ts">
import { useLogStore } from '../store/logStore';
import LogCard from './LogCard.vue';

const store = useLogStore();
defineEmits(['reset']);
</script>

<template>
  <div class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="sticky top-20 z-40 bg-[#0a0a0b]/80 backdrop-blur-md p-4 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
      </div>

    <div class="relative pl-8 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-linear-to-b before:from-indigo-500/40 before:via-indigo-500/10 before:to-transparent">
      <div v-for="(logs, timeBlock) in store.groupedEvents" :key="timeBlock" class="relative mb-12">
        <div class="absolute -left-8 mt-1.5 w-6 h-6 rounded-full bg-[#0a0a0b] border-2 border-indigo-500 z-10 flex items-center justify-center">
          <div class="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
        </div>
        
        <div class="flex items-center gap-4 mb-6">
          <h3 class="text-[11px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20 tracking-widest uppercase">
            {{ timeBlock }}
          </h3>
          <div class="h-px flex-1 bg-white/5"></div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <LogCard 
            v-for="(event, index) in logs" 
            :key="event.id" 
            :log="event" 
            :is-highlighted="store.highlightedSessionId === event.details.sessionId"
            :is-selected="store.selectedEventId === event.id"
            @highlight-session="store.toggleHighlight"
            @select-event="store.selectEvent"
          />
        </div>
      </div>
    </div>
    </div>
</template>