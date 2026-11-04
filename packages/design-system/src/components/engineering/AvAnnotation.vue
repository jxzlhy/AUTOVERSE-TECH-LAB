<script setup lang="ts">
/** ENGINEERING UI · Annotation — 工程标注（引线 + 编号旗标 + 说明），位置由宿主锚定 */
withDefaults(defineProps<{ index: number; text: string; side?: "left" | "right" }>(), {
  side: "right",
});
</script>

<template>
  <div class="av-anno" :class="`av-anno--${side}`">
    <span class="av-anno__flag">{{ String(index).padStart(2, "0") }}</span>
    <span class="av-anno__line" aria-hidden="true" />
    <span class="av-anno__text">{{ text }}</span>
  </div>
</template>

<style scoped>
.av-anno {
  display: flex;
  align-items: center;
  gap: 0;
  pointer-events: none;
}

.av-anno--left {
  flex-direction: row-reverse;
}

.av-anno__flag {
  min-width: 22px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  border: 1px solid var(--av-nexus-500);
  background: rgba(10, 15, 26, 0.8);
  color: var(--av-nexus-300, #67e8f9);
  font-family: var(--av-font-mono);
  font-size: 9px;
}

.av-anno__line {
  width: 42px;
  height: 1px;
  background: linear-gradient(90deg, var(--av-nexus-500), rgba(34, 211, 238, 0.2));
}

.av-anno--left .av-anno__line {
  background: linear-gradient(270deg, var(--av-nexus-500), rgba(34, 211, 238, 0.2));
}

.av-anno__text {
  font-family: var(--av-font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--av-text-secondary);
  white-space: nowrap;
}
</style>
