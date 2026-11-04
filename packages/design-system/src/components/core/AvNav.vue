<script setup lang="ts">
defineProps<{ items: { id: string; label: string }[]; activeId: string }>();
const emit = defineEmits<{ navigate: [id: string] }>();
</script>

<template>
  <nav class="av-nav" aria-label="主导航">
    <button
      v-for="it in items"
      :key="it.id"
      type="button"
      class="av-nav__item"
      :class="{ active: it.id === activeId }"
      :aria-current="it.id === activeId ? 'page' : undefined"
      @click="emit('navigate', it.id)"
    >
      {{ it.label }}
    </button>
  </nav>
</template>

<style scoped>
.av-nav { display: flex; gap: 2px; }
.av-nav__item {
  appearance: none; border: none; background: none; padding: 8px 14px;
  border-radius: var(--av-radius-m); color: var(--av-text-secondary);
  font-size: 13px; cursor: pointer;
}
.av-nav__item:hover { color: var(--av-text-primary); }
.av-nav__item.active { color: var(--av-nexus-500); background: rgba(34, 211, 238, 0.1); }
.av-nav__item:focus-visible { outline: 2px solid var(--av-nexus-500); outline-offset: 1px; }
</style>
