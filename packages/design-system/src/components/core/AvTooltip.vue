<script setup lang="ts">
import { ref } from "vue";
defineProps<{ text: string }>();
const show = ref(false);
</script>

<template>
  <span class="av-tip" @mouseenter="show = true" @mouseleave="show = false" @focusin="show = true" @focusout="show = false">
    <slot />
    <span v-show="show" class="av-tip__bubble" role="tooltip">{{ text }}</span>
  </span>
</template>

<style scoped>
.av-tip { position: relative; display: inline-flex; }
.av-tip__bubble {
  position: absolute; bottom: calc(100% + 8px); left: 50%; translate: -50% 0;
  padding: 6px 10px; border-radius: var(--av-radius-s); border: 1px solid var(--av-border-strong);
  background: var(--av-bg-elevated); color: var(--av-text-secondary);
  font-size: 11px; white-space: nowrap; z-index: 60; pointer-events: none;
}
</style>
