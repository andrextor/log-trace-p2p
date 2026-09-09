<script setup lang="ts">
import { type Component, computed } from "vue";
import { APP_TYPES } from "../types";
import type { LogEvent } from "../types";

import CheckoutBody from "../../domains/checkout/components/CheckoutBody.vue";
import RestBody from "../../domains/rest/components/RestBody.vue";

const props = defineProps<{
	log: LogEvent;
	isHighlighted: boolean;
}>();

defineEmits<(e: "filter-id", id: string | number) => void>();

// El mismo reparto que `LogCard`, pero solo del cuerpo: un intercambio los pinta
// sin envolver cada mitad en su propia tarjeta.
const bodies: Record<string, Component> = {
	[APP_TYPES.CHECKOUT]: CheckoutBody,
	[APP_TYPES.MICROSITIOS]: CheckoutBody,
	[APP_TYPES.REST]: RestBody,
};

const current = computed(() => bodies[props.log.appType] ?? CheckoutBody);
</script>

<template>
  <component
    :is="current"
    :details="log.details"
    :outcome="log.outcome"
    :is-highlighted="isHighlighted"
    @filter-id="(id: string | number) => $emit('filter-id', id)"
  />
</template>
