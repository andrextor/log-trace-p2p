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
// Un rechazo del gateway no es un error, pero sí es lo que se viene a leer:
// se muestra con el mismo bloque.
const detail = computed(() => {
	const outcome = props.outcome;
	if (!outcome) return null;
	const rejected = !outcome.isError && outcome.status === "REJECTED";
	if (!outcome.isError && !rejected) return null;

	const code = outcome.code ?? outcome.httpStatus ?? "—";
	const message = outcome.message ?? "Operation rejected";

	// Un fallo HTTP sin más viene como «HTTP 400»: el código otra vez. La
	// cabecera ya lo dice en rojo («APPLE_PAY | 400 Bad Request»), así que el
	// bloque solo aparece cuando hay algo que leer además del código.
	if (message === `HTTP ${code}` && !outcome.exception) return null;

	return {
		title: rejected
			? "Provider Rejection"
			: (ERROR_TITLES[outcome.kind ?? ""] ?? "Failure"),
		message,
		code,
		sub: outcome.exception
			? `${outcome.exception.class ?? ""} · ${outcome.exception.file?.split("/").pop()}:${outcome.exception.line ?? "?"}`
			: null,
	};
});
</script>

<template>
  <div v-if="detail" class="animate-in fade-in zoom-in duration-300">
    <div class="bg-rose-500/5 border border-rose-500/20 rounded-xl px-3 py-2 space-y-1">
      <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span class="text-[10px] font-black uppercase tracking-widest">{{ detail.title }}</span>
        <span class="ml-auto px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded font-mono">{{ detail.code }}</span>
      </div>
      <p v-if="detail.message" class="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-relaxed">{{ detail.message }}</p>
      <p v-if="detail.sub" class="text-[9px] font-mono text-rose-400/80 break-all leading-tight italic">{{ detail.sub }}</p>
    </div>
  </div>
</template>
