<script setup lang="ts">
/** CORE UI · Card — 玻璃面板容器（SPATIAL 风格基线在 CORE 的应用） */
defineProps<{ title?: string; tag?: string }>();
</script>

<template>
  <section class="av-card">
    <header v-if="title || tag" class="av-card__head">
      <h3 class="av-card__title">{{ title }}</h3>
      <span v-if="tag" class="av-card__tag">{{ tag }}</span>
    </header>
    <div class="av-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.av-card {
  border: 1px solid var(--av-border-faint);
  border-radius: var(--av-radius-l);
  background: var(--av-glass-bg);
  backdrop-filter: var(--av-glass-blur);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.av-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--av-border-faint);
}

.av-card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--av-text-primary);
}

.av-card__tag {
  font-family: var(--av-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--av-nexus-500);
}

.av-card__body {
  padding: 18px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--av-text-secondary);
}
</style>
