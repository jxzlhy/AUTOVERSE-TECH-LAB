<script setup lang="ts">
/** SPATIAL UI · Exploration HUD — 探索状态条（当前空间/已探索计数/引导提示） */
import { colors } from "@atl/shared";

defineProps<{
  spaceName: string;
  visited: number;
  total: number;
  hint?: string;
}>();
const nexus = colors.nexus[500];
</script>

<template>
  <div class="av-expl" role="status">
    <span class="av-expl__space">{{ spaceName }}</span>
    <span class="av-expl__dots" aria-hidden="true">
      <i
        v-for="i in total"
        :key="i"
        class="av-expl__dot"
        :class="{ visited: i <= visited }"
      />
    </span>
    <span class="av-expl__count">{{ visited }}/{{ total }}</span>
    <span v-if="hint" class="av-expl__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.av-expl {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 18px;
  border-radius: var(--av-radius-full);
  border: 1px solid var(--av-border-faint);
  background: var(--av-glass-bg);
  backdrop-filter: var(--av-glass-blur);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.av-expl__space {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--av-text-primary);
}

.av-expl__dots {
  display: inline-flex;
  gap: 5px;
}

.av-expl__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--av-border-strong);
  transition: background var(--av-motion-normal) var(--av-ease-ui);
}

.av-expl__dot.visited {
  background: var(--av-nexus-500);
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
}

.av-expl__count {
  font-family: var(--av-font-mono);
  font-size: 11px;
  color: var(--av-text-secondary);
}

.av-expl__hint {
  font-size: 11px;
  color: var(--av-text-muted);
}
</style>
