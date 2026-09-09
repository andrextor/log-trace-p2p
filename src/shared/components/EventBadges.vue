<script setup lang="ts">
import { computed } from "vue";
import type { LogEvent } from "../types";
import type { Badge, BadgeTone } from "../ui/eventBadges";
import { getEventBadges } from "../ui/eventBadges";

const props = defineProps<{
	log: LogEvent;
	/** Limita a estas ranuras. Sin ello, las cuatro. */
	only?: Badge["slot"][];
}>();

// El color solo significa resultado. Todo lo demás es neutro, para que un fallo
// se vea desde el otro extremo de la pantalla. `alert` es la única excepción:
// el simulador cambia por completo la lectura de un fallo.
//
// En claro los tonos van al 700 y el neutro lleva fondo y borde propios: sobre
// blanco, un `-600` en texto de 10px se queda en torno a 3.6:1, por debajo del
// 4.5:1 que hace falta para leerlo sin esfuerzo. En oscuro se mantienen los
// claros, que ahí sí contrastan.
const TONE: Record<BadgeTone, string> = {
	danger:
		"bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400 dark:border-rose-500/20",
	warn: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400 dark:border-orange-500/20",
	ok: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-500/20",
	alert:
		"bg-amber-400/20 text-amber-800 border-amber-500/50 dark:text-amber-300 dark:border-amber-500/40",
	neutral:
		"bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-white/10",
};

const badges = computed(() => getEventBadges(props.log, props.only));
</script>

<template>
  <span
    v-for="badge in badges"
    :key="badge.slot + badge.text"
    :title="badge.title"
    class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm whitespace-nowrap"
    :class="[TONE[badge.tone], badge.mono && 'font-mono']"
  >
    {{ badge.text }}
  </span>
</template>
