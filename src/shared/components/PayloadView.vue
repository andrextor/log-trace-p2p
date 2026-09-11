<script setup lang="ts">
import { ref } from "vue";

// El mismo bloque para los dos dominios: antes cada cuerpo llevaba su copia.
// Sin payload no pinta nada, para que quien lo usa no tenga que preguntarlo.
const props = defineProps<{ payload?: object | null }>();

const copied = ref(false);

const copy = async () => {
	if (!props.payload) return;
	await navigator.clipboard.writeText(JSON.stringify(props.payload, null, 2));
	copied.value = true;
	setTimeout(() => {
		copied.value = false;
	}, 2000);
};
</script>

<template>
  <div v-if="payload" class="flex flex-col min-w-0">
    <div class="flex justify-between items-center mb-2 px-1">
      <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        <span class="text-[9px] font-black uppercase tracking-widest">Payload · {{ Object.keys(payload).length }} keys</span>
      </div>
      <button @click.stop="copy"
        class="flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-lg transition-all shadow-sm border uppercase bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:text-indigo-600 active:scale-95"
      >
        <svg v-if="!copied" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" /></svg>
        <svg v-else class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>

    <pre class="p-4 overflow-x-auto bg-[#0d0d0e] rounded-2xl text-[10px] text-emerald-400/90 border border-white/5 shadow-2xl custom-scrollbar font-mono leading-relaxed ring-1 ring-white/5">{{ JSON.stringify(payload, null, 2) }}</pre>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }
</style>
