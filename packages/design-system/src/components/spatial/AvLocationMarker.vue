<script setup lang="ts">
/** SPATIAL UI · Location Marker — 3D 锚定标记（屏幕空间定位由宿主逐帧投影驱动，支持距离缩放/遮挡淡出） */
withDefaults(defineProps<{ label: string; sub?: string; visible?: boolean; scale?: number; dimmed?: boolean }>(), {
  visible: true,
  scale: 1,
  dimmed: false,
});
</script>

<template>
  <div
    v-show="visible"
    class="av-marker"
    :class="{ dimmed }"
    :style="{ scale: String(scale) }"
  >
    <span class="av-marker__anchor" aria-hidden="true" />
    <span class="av-marker__stem" aria-hidden="true" />
    <span class="av-marker__card">
      <strong>{{ label }}</strong>
      <em v-if="sub">{{ sub }}</em>
    </span>
  </div>
</template>

<style scoped>
.av-marker {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: center bottom;
  pointer-events: none;
  transition: opacity var(--av-motion-fast) var(--av-ease-ui);
}

.av-marker.dimmed {
  opacity: 0.35; /* 被遮挡/背向时降不透明度（遮挡层级规范） */
}

.av-marker__anchor {
  width: 8px;
  height: 8px;
  border: 1px solid var(--av-nexus-500);
  border-radius: 50%;
  background: rgba(34, 211, 238, 0.25);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.5);
}

.av-marker__stem {
  width: 1px;
  height: 18px;
  background: linear-gradient(to top, var(--av-nexus-500), rgba(34, 211, 238, 0.15));
}

.av-marker__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 4px 12px;
  border-radius: var(--av-radius-s);
  border: 1px solid color-mix(in srgb, var(--av-nexus-500) 40%, transparent);
  background: rgba(10, 15, 26, 0.72);
  backdrop-filter: var(--av-glass-blur);
  white-space: nowrap;
}

.av-marker__card strong {
  font-family: var(--av-font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--av-text-primary);
}

.av-marker__card em {
  font-family: var(--av-font-mono);
  font-style: normal;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--av-text-secondary);
}
</style>
