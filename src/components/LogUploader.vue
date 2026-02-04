<script setup lang="ts">
import { ref, computed } from "vue";


const raw = ref("");
const isDragging = ref(false);
const emit = defineEmits(['process']);

const charCount = computed(() => raw.value.length);
const lineCount = computed(() => raw.value.split('\n').filter(l => l.trim()).length);

// Al pegar, solo llenamos el ref para que se vea el Preview, no emitimos.
function onPaste(e: ClipboardEvent) {
  const content = e.clipboardData?.getData("text") ?? "";
  raw.value = content;
}

// Al soltar archivo, solo leemos el contenido. No emitimos.
async function handleFileDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) {
    const text = await file.text();
    raw.value = text;
  }
}

function clear() {
  raw.value = "";
}

function triggerProcess() {
  
  if (!raw.value) {
    console.error("ERROR: raw.value está vacío o es undefined");
    return;
  }

  emit('process', raw.value);
}
</script>

<template>
  <div class="space-y-6">
    <div 
      class="group relative rounded-2xl border transition-all duration-300"
      :class="[
        isDragging 
          ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_-10px_rgba(79,70,229,0.5)]' 
          : 'border-white/10 bg-white/2 hover:border-white/20'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span class="text-xs font-mono uppercase tracking-widest text-gray-400">Input Source</span>
        </div>
        <div class="flex gap-4">
          <span v-if="lineCount" class="text-[10px] font-mono text-indigo-400/80">{{ lineCount }} LINES</span>
          <span v-if="charCount" class="text-[10px] font-mono text-gray-500">{{ (charCount / 1024).toFixed(2) }} KB</span>
        </div>
      </div>

      <textarea
        class="w-full min-h-75 bg-transparent p-6 text-sm font-mono text-indigo-100/90 outline-none placeholder:text-gray-600 resize-y"
        placeholder="Paste logs here and click Analyze..."
        v-model="raw"
        @paste="onPaste"
      />

      <div v-if="isDragging" class="absolute inset-0 flex items-center justify-center pointer-events-none bg-[#0a0a0b]/60 rounded-2xl">
        <p class="text-indigo-400 font-bold animate-bounce text-lg">Release to load logs</p>
      </div>
    </div>

    <div class="flex items-center justify-between gap-4">
      <div class="flex gap-3">
        <button
          @click="triggerProcess"
          type="button"
          :disabled="!raw"
          class="cursor-pointer group relative px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <span class="relative z-10 flex items-center gap-2">
            Analyze Trace
            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </span>
        </button>

        <button
          class="cursor-pointer px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-all active:scale-95"
          type="button"
          @click="clear"
        >
          Clear
        </button>
      </div>
    </div>

    <div v-if="raw" class="rounded-2xl border border-white/5 bg-linear-to-br from-white/3 to-transparent p-6 animate-fade-in shadow-2xl">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <p class="text-xs font-bold text-indigo-400 uppercase tracking-tighter ">Raw View (Truncated)</p>
      </div>
      <div class="relative overflow-hidden rounded-lg bg-black/40 border border-white/5">
        <pre class="p-4 text-[11px] leading-relaxed text-indigo-300/60 overflow-x-auto font-mono whitespace-pre-wrap">{{ raw.slice(0, 1500) }}...</pre>
        <div class="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/80 to-transparent"></div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>