<script setup lang="ts">
/** SPATIAL UI · Holographic Panel — 全息信息面板（扫描线底纹 + 顶缘光柱 + 角标），部件铭牌/浮动信息用 */
defineProps<{ kicker?: string; title: string }>();
</script>

<template>
  <aside class="av-holo" role="status">
    <span class="av-holo__kicker">{{ kicker }}</span>
    <strong class="av-holo__title">{{ title }}</strong>
    <div class="av-holo__scan" aria-hidden="true" />
    <i class="av-holo__corner av-holo__corner--tl" aria-hidden="true" />
    <i class="av-holo__corner av-holo__corner--br" aria-hidden="true" />
  </aside>
</template>

<style scoped>
.av-holo {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 22px;
  border-radius: var(--av-radius-l);
  border: 1px solid color-mix(in srgb, var(--av-nexus-500) 35%, transparent);
  background:
    linear-gradient(rgba(34, 211, 238, 0.06), rgba(10, 15, 26, 0.7)),
    repeating-linear-gradient(0deg, rgba(34, 211, 238, 0.05) 0 1px, transparent 1px 3px);
  backdrop-filter: var(--av-glass-blur);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 24px rgba(34, 211, 238, 0.12);
  overflow: hidden;
  pointer-events: none;
}

.av-holo__kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--av-nexus-500);
}

.av-holo__title {
  font-family: var(--av-font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--av-text-primary);
}

/* 扫描线扫过动画（reduced-motion 关闭） */
.av-holo__scan {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent);
  animation: av-holo-sweep 3.2s linear infinite;
}

.av-holo__corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--av-nexus-500);
  border-style: solid;
  opacity: 0.9;
}

.av-holo__corner--tl {
  left: 0;
  top: 0;
  border-width: 1px 0 0 1px;
}

.av-holo__corner--br {
  right: 0;
  bottom: 0;
  border-width: 0 1px 1px 0;
}

@keyframes av-holo-sweep {
  from {
    translate: 0 -2px;
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  to {
    translate: 0 84px;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .av-holo__scan {
    animation: none;
    opacity: 0.3;
  }
}
</style>
