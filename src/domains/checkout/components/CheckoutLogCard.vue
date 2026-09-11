<script setup lang="ts">
import { computed, ref } from "vue";
import LogCardHeader from "../../../shared/components/LogCardHeader.vue";
import type { HighlightTheme, LogEvent } from "../../../shared/types";
import { hasBody, isFailure } from "../../../shared/ui/LogUIHelper";
import { useLogStore } from "../../../store/logStore";
import CheckoutBody from "./CheckoutBody.vue";

const props = defineProps<{
	log: LogEvent;
	isHighlighted: boolean;
}>();

const store = useLogStore();

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const displaySubType = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	return d?.subType ? String(d.subType) : null;
});

// Los ids que el parser ya resolvió en `correlation`. La transacción y el
// placetopay_id estaban en la mitad de las líneas y solo se veían abriendo el
// JSON.
const essentialIdentifiers = computed(() => {
	const d = props.log.details as Record<string, unknown>;
	const c = props.log.correlation;
	return [
		{ label: "SID", value: d.sessionId },
		{ label: "TX", value: c.transactionId },
		{ label: "P2P ID", value: c.placetopayId },
		{ label: "Trace", value: d.awsRequestId || d.aws_request_id },
	].filter((c) => c.value);
});

const isErrorState = computed(() => isFailure(props.log));
const showBody = computed(() => hasBody(props.log));

const activeTheme = computed<HighlightTheme | null>(() => {
	if (!props.isHighlighted) return null;

	const activeId = String(store.highlightedSessionId).toLowerCase();
	const details = props.log.details as Record<string, unknown>;
	const payload = (details?.payload || {}) as Record<string, unknown>;

	const isSessionId =
		details?.sessionId && String(details.sessionId).toLowerCase() === activeId;
	const isInterdinHash =
		payload?.id && String(payload.id).toLowerCase().includes(activeId);

	if (isSessionId || isInterdinHash) {
		return {
			ring: "ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-500/20",
			bg: "bg-indigo-500",
		};
	}

	return {
		ring: "ring-2 ring-orange-500 border-orange-500 shadow-orange-500/20",
		bg: "bg-orange-500",
	};
});

const copiedId = ref<string | null>(null);
const handleCopyId = async (idValue: string | number) => {
	await navigator.clipboard.writeText(String(idValue));
	copiedId.value = String(idValue);
	setTimeout(() => {
		if (copiedId.value === String(idValue)) {
			copiedId.value = null;
		}
	}, 2000);
};
</script>

<template>
  <div
    class="relative bg-white dark:bg-[#161618] rounded-xl transition-all duration-300 group overflow-hidden border"
    :class="[
      isHighlighted ? (activeTheme?.ring + ' z-10 shadow-xl scale-[1.01]') : 'border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.05)]',
      { 'border-rose-300/50 shadow-sm dark:border-rose-500/30': isErrorState && !isHighlighted }
    ]"
  >
    <div class="absolute left-0 top-0 bottom-0 w-1 transition-colors"
         :class="isErrorState ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : (isHighlighted ? activeTheme?.bg : 'bg-transparent group-hover:bg-indigo-500/20')">
    </div>

    <div class="flex flex-col p-4 sm:p-5 pl-5 sm:pl-6">

      <LogCardHeader :log="log" />

      <!-- Tipo de evento e ids. El origen y el estado ya van en los badges y
           en el cuerpo: repetirlos aquí era lo que hacía la tarjeta larga. -->
      <div v-if="displaySubType || essentialIdentifiers.length" class="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-white/[0.02]">

           <div v-if="displaySubType" class="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 shadow-sm">
              <span class="text-[9px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400">{{ displaySubType }}</span>
           </div>

           <button v-for="id in essentialIdentifiers" :key="id.label"
                   @click.stop="id.label === 'SID' ? handleCopyId(id.value as string) : (handleCopyId(id.value as string), emit('highlight-session', id.value as string))"
                   class="flex items-center gap-1.5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-indigo-500/10 px-2 py-1 rounded-md border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all shadow-sm group/id"
                   :title="id.label === 'SID' ? 'Copy SID' : `Filter & copy ${id.label}`">
              <span class="text-[9px] font-black uppercase transition-colors flex items-center gap-1"
                    :class="{ 'text-emerald-500': copiedId === String(id.value), 'text-slate-600 dark:text-slate-400 group-hover/id:text-indigo-500': copiedId !== String(id.value) }">
                <svg v-if="copiedId === String(id.value)" class="w-3 h-3 animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                <template v-else>{{ id.label }}</template>
              </span>
              <span class="text-[9px] sm:text-[10px] font-mono font-bold truncate max-w-[100px] sm:max-w-[180px] transition-colors"
                    :class="{ 'text-emerald-600 dark:text-emerald-400': copiedId === String(id.value), 'text-slate-600 dark:text-slate-300': copiedId !== String(id.value) }"
                    :title="String(id.value)">{{ id.value }}</span>
              <svg v-if="id.label !== 'SID'" class="w-3 h-3 text-slate-300 dark:text-white/10 opacity-0 group-hover/id:opacity-100 transition-all group-hover/id:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </button>
      </div>
    </div>

    <!-- El cuerpo va siempre a la vista: abrir cada tarjeta era el clic que
         sobraba. -->
    <div v-if="showBody" class="border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/20 p-4 sm:p-5 pl-5 sm:pl-6">
      <CheckoutBody
        :details="log.details"
        :outcome="log.outcome"
      />
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: slide-down 0.25s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
