<script setup lang="ts">
import { computed } from "vue";
import type { Outcome } from "../types";

const props = defineProps<{
	outcome?: Outcome;
}>();

const ERROR_TITLES: Record<string, string> = {
	exception: "System / Transport Exception",
	business: "Provider Rejection",
	http: "HTTP Failure",
	validation: "Invalid Request",
};

// El parser ya resolvió qué falló y por qué. Antes cada dominio volvía a
// recorrer el payload buscando `dinError`, con las claves en inglés — que es
// justo lo que los proveedores no emiten.
const detail = computed(() => {
	const outcome = props.outcome;
	if (!outcome?.isError) return null;

	return {
		title: ERROR_TITLES[outcome.kind ?? ""] ?? "Failure",
		message: outcome.message ?? "Operation rejected",
		code: outcome.code ?? outcome.httpStatus ?? "—",
		sub: outcome.exception
			? `${outcome.exception.class ?? ""} · ${outcome.exception.file?.split("/").pop()}:${outcome.exception.line ?? "?"}`
			: null,
	};
});
</script>

<template>
  <div v-if="detail" class="animate-in fade-in zoom-in duration-300">
    <div class="bg-rose-500/5 border-2 border-rose-500/20 rounded-2xl p-4 space-y-3 relative overflow-hidden">
      <div class="absolute top-0 right-0 p-1">
        <div class="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-bl-lg shadow-lg uppercase font-mono">
          Status: {{ detail.code }}
        </div>
      </div>
      <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span class="text-[10px] font-black uppercase tracking-widest">{{ detail.title }}</span>
      </div>
      <div class="space-y-1">
        <p class="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-relaxed pr-16">{{ detail.message }}</p>
        <p v-if="detail.sub" class="text-[9px] font-mono text-rose-400/80 break-all leading-tight italic">{{ detail.sub }}</p>
      </div>
    </div>
  </div>
</template>
