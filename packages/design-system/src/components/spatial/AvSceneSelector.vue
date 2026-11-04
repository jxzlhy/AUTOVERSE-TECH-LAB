<script setup lang="ts">
/** SPATIAL UI · Scene Selector — 空间选择器（空间卡片 + 激活态 + 传送中禁用） */
defineProps<{
  scenes: { id: string; label: string; hint?: string }[];
  activeId: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <nav class="av-sel" aria-label="空间选择">
    <button
      v-for="s in scenes"
      :key="s.id"
      type="button"
      class="av-sel__card"
      :class="{ active: s.id === activeId }"
      :disabled="disabled"
      @click="emit('select', s.id)"
    >
      <span class="av-sel__label">{{ s.label }}</span>
      <span v-if="s.hint" class="av-sel__hint">{{ s.hint }}</span>
      <span class="av-sel__glow" aria-hidden="true" />
    </button>
  </nav>
</template>

<style scoped>
.av-sel {
  display: flex;
  gap: 10px;
}

.av-sel__card {
  appearance: none;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 16px;
  border-radius: var(--av-radius-l);
  border: 1px solid var(--av-border-faint);
  background: var(--av-glass-bg);
  backdrop-filter: var(--av-glass-blur);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: var(--av-text-secondary);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color var(--av-motion-fast) var(--av-ease-ui),
    box-shadow var(--av-motion-normal) var(--av-ease-ui),
    color var(--av-motion-fast) var(--av-ease-ui);
}

.av-sel__card:hover:not(:disabled) {
  color: var(--av-text-primary);
  border-color: var(--av-border-strong);
}

.av-sel__card.active {
  color: var(--av-text-primary);
  border-color: var(--av-nexus-500);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 24px rgba(34, 211, 238, 0.18);
}

.av-sel__card:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.av-sel__label {
  font-size: 13px;
  letter-spacing: 0.04em;
}

.av-sel__hint {
  font-family: var(--av-font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  color: var(--av-text-muted);
}

/* 底部能量条：激活空间的光柱指示（区别于普通 Web 卡片的透明底） */
.av-sel__glow {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--av-nexus-500), transparent);
  opacity: 0;
  transition: opacity var(--av-motion-normal) var(--av-ease-ui);
}

.av-sel__card.active .av-sel__glow {
  opacity: 1;
  animation: av-sel-pulse 2.4s ease-in-out infinite;
}

@keyframes av-sel-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .av-sel__card.active .av-sel__glow {
    animation: none;
    opacity: 1;
  }
}
</style>
