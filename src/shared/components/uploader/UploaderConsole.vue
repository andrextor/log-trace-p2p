<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

const props = defineProps<{
	raw: string;
	isReadingFile: boolean;
	isDragging: boolean;
	isOverLimit: boolean;
	detectedFormat: string | null;
}>();

const emit = defineEmits<{
	(e: "update:raw", value: string): void;
	(e: "open-file"): void;
	(e: "paste", event: ClipboardEvent): void;
	(e: "drop", event: DragEvent): void;
}>();

function onPaste(e: ClipboardEvent) {
	emit("paste", e);
}

function handleGlobalPaste(e: ClipboardEvent) {
	// If we already have raw text (uploader is not empty), let the textarea handle it.
	if (props.raw) {
		return;
	}

	// Ignore if the user is typing in some other input or textarea.
	const target = e.target as HTMLElement;
	if (
		target &&
		(target.tagName === "INPUT" ||
			target.tagName === "TEXTAREA" ||
			target.isContentEditable)
	) {
		return;
	}

	// Make sure we have clipboard data
	if (!e.clipboardData || !e.clipboardData.getData("text")) {
		return;
	}

	// Emit the paste event and stop propagation
	e.preventDefault();
	e.stopPropagation();
	emit("paste", e);
}

onMounted(() => {
	window.addEventListener("paste", handleGlobalPaste);
});

onUnmounted(() => {
	window.removeEventListener("paste", handleGlobalPaste);
});
</script>

<template>
  <div class="relative w-full h-[400px]">
    <!-- EMPTY STATE (DROPZONE) -->
    <div v-if="!raw" 
         @click="emit('open-file')" 
         class="absolute inset-0 flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors m-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 group/dropzone"
    >
      <div class="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-500/20 group-hover/dropzone:scale-110 group-hover/dropzone:rotate-3 transition-transform duration-300 shadow-sm">
        <svg v-if="!isReadingFile" class="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <svg v-else class="w-10 h-10 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3 tracking-tight">Sube o arrastra tus logs aquí</h3>
      <p class="text-sm font-medium text-slate-600 dark:text-slate-400 text-center max-w-sm leading-relaxed">
        Puedes pegar directamente (<kbd class="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded-md border border-slate-200 dark:border-white/5 font-mono text-[11px] text-slate-600 dark:text-slate-300 shadow-sm tracking-tighter">Ctrl+V</kbd>), arrastrar un archivo de texto, o <span class="text-indigo-500 font-bold underline decoration-indigo-200 dark:decoration-indigo-500/30 underline-offset-4">hacer clic para explorar</span>.
      </p>
    </div>

    <!-- RAW TEXTAREA -->
    <div v-else class="w-full h-full flex flex-col bg-slate-50/30 dark:bg-black/10">
      <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#131315]">
        <div class="flex items-center gap-2 px-2">
          <svg class="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400">Datos Originales (Crudo)</span>
        </div>
      </div>
      <textarea
        class="flex-1 w-full h-[calc(100%-40px)] bg-transparent p-6 text-[13px] font-mono text-slate-800 dark:text-indigo-100/90 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none leading-relaxed custom-scrollbar selection:bg-indigo-500/30 focus:bg-white dark:focus:bg-[#1a1b1e] transition-colors"
        :value="raw"
        @input="emit('update:raw', ($event.target as HTMLTextAreaElement).value)"
        @paste="onPaste"
        spellcheck="false"
      />
    </div>

    <slot name="overlay"></slot>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.2); }
</style>
