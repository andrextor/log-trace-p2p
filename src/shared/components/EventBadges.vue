<script setup lang="ts">
import { computed } from "vue";
import type { LogEvent } from "../types";
import { type BadgeTone, getEventBadges } from "../ui/eventBadges";

const props = defineProps<{
	log: LogEvent;
}>();

// El color solo significa resultado. Todo lo demás es neutro, para que un fallo
// se vea desde el otro extremo de la pantalla. `alert` es la única excepción:
// el simulador cambia por completo la lectura de un fallo.
const TONE: Record<BadgeTone, string> = {
	danger: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
	warn: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
	ok: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
	alert:
		"bg-amber-400/20 text-amber-700 border-amber-500/40 dark:text-amber-300",
	neutral:
		"bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10",
};

const badges = computed(() => getEventBadges(props.log));
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
