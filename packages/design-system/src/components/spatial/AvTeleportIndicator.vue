<script setup lang="ts">
/** SPATIAL UI · Teleport Indicator — 传送指示器（idle/charging/ready 三态，环弧进度） */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ state?: "idle" | "charging" | "ready"; progress?: number; label?: string }>(),
  { state: "idle", progress: 0, label: "传送" },
);
const CIRC = 2 * Math.PI * 26;
const dash = computed(() => `${(CIRC * Math.min(Math.max(props.progress, 0), 1)).toFixed(1)} ${CIRC.toFixed(1)}`);
</script>

<template>
  <div class="av-tp" :class="`av-tp--${state}`" role="status" :aria-label="`传送指示：${state}`">
    <svg class="av-tp__ring" viewBox="0 0 60 60" aria-hidden="true">
      <circle class="av-tp__track" cx="30" cy="30" r="26" />
      <circle class="av-tp__arc" cx="30" cy="30" r="26" :stroke-dasharray="dash" />
    </svg>
    <span class="av-tp__core" aria-hidden="true" />
    <span class="av-tp__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.av-tp {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  pointer-events: none;
}

.av-tp__ring {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}

.av-tp__track {
  fill: none;
  stroke: var(--av-border-faint);
  stroke-width: 2;
}

.av-tp__arc {
  fill: none;
  stroke: var(--av-nexus-500);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray var(--av-motion-normal) var(--av-ease-ui);
}

.av-tp--ready .av-tp__arc {
  stroke: var(--av-exhibit-concept, #34d399);
}

.av-tp__core {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--av-nexus-300, #67e8f9), transparent 70%);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.55);
  opacity: 0.5;
  transition: opacity var(--av-motion-normal) var(--av-ease-ui);
}

.av-tp--charging .av-tp__core {
  opacity: 0.85;
  animation: av-tp-breathe 1.1s ease-in-out infinite;
}

.av-tp--ready .av-tp__core {
  opacity: 1;
  animation: none;
}

.av-tp__label {
  position: absolute;
  bottom: -6px;
  font-family: var(--av-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--av-text-secondary);
}

@keyframes av-tp-breathe {
  0%,
  100% {
    transform: scale(0.85);
  }
  50% {
    transform: scale(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .av-tp--charging .av-tp__core {
    animation: none;
  }
}
</style>
