<script setup lang="ts">
/** CORE UI · Badge — 展品类型语义徽标（REAL/FICTION/CONCEPT，文字+色双通道，无障碍 §9.5） */
import { colors } from "@atl/shared";

const props = defineProps<{ kind: "REAL" | "FICTION" | "CONCEPT" }>();
const colorMap = {
  REAL: colors.exhibit.real,
  FICTION: colors.exhibit.fiction,
  CONCEPT: colors.exhibit.concept,
};
const color = colorMap[props.kind];
</script>

<template>
  <span class="av-badge" :style="{ '--badge': color }">
    <i class="av-badge__dot" aria-hidden="true" />
    {{ kind }}
  </span>
</template>

<style scoped>
.av-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--av-radius-full);
  border: 1px solid color-mix(in srgb, var(--badge) 45%, transparent);
  background: color-mix(in srgb, var(--badge) 12%, transparent);
  color: var(--badge);
  font-family: var(--av-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
}

.av-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--badge);
}
</style>
