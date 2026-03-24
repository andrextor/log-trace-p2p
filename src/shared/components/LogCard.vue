<script setup lang="ts">
import { type Component, computed } from "vue";
import { APP_TYPES } from "../../shared/types";
import type { LogEvent } from "../../shared/types";

import CheckoutLogCard from "../../domains/checkout/components/CheckoutLogCard.vue";
import RestLogCard from "../../domains/rest/components/RestLogCard.vue";

const props = defineProps<{
	log: LogEvent;
	isHighlighted: boolean;
}>();

const emit =
	defineEmits<(e: "highlight-session", id: string | number) => void>();

const cardComponents: Record<string, Component> = {
	[APP_TYPES.CHECKOUT]: CheckoutLogCard,
	[APP_TYPES.MICROSITIOS]: CheckoutLogCard,
	[APP_TYPES.REST]: RestLogCard,
};

const currentCardComponent = computed(
	() => cardComponents[props.log.appType] || CheckoutLogCard,
);

function handleHighlightSession(id: string | number) {
	emit("highlight-session", id);
}
</script>

<template>
  <component 
    :is="currentCardComponent" 
    :log="log" 
    :is-highlighted="isHighlighted"
    @highlight-session="handleHighlightSession"
  />
</template>