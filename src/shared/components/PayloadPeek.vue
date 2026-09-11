<script setup lang="ts">
import PayloadView from "./PayloadView.vue";

// Para las filas de una tarjeta agrupada: el JSON no cabe en la línea, así
// que se abre en un popover nativo —capa superior, se cierra con Esc o
// clicando fuera— sin un modal propio ni estado en Vue.
defineProps<{
	id: string | number;
	payload?: object | null;
	/** Lo que se abrió: la línea de la que sale el JSON, para no perderse. */
	title: string;
	time?: string;
}>();
</script>

<template>
  <template v-if="payload">
    <button
      :popovertarget="`payload-${id}`"
      @click.stop
      title="Ver el payload de este registro"
      class="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wide bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/40 hover:text-indigo-500 transition-all active:scale-95"
    >
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
      Payload
    </button>

    <!-- `m-auto`: el preflight de Tailwind pone `margin: 0` a todo y se lleva
         el centrado con el que el navegador coloca un popover. -->
    <div
      :id="`payload-${id}`"
      popover="auto"
      class="fixed inset-0 m-auto w-[min(90vw,64rem)] max-h-[85vh] overflow-auto p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161618] text-slate-800 dark:text-slate-100 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div class="flex items-baseline gap-3 mb-4">
        <h3 class="font-bold text-[15px] leading-snug wrap-anywhere min-w-0">{{ title }}</h3>
        <span v-if="time" class="font-mono text-[11px] text-slate-600 dark:text-slate-400 shrink-0 ml-auto">{{ time }}</span>
      </div>
      <PayloadView :payload="payload" />
    </div>
  </template>
</template>
