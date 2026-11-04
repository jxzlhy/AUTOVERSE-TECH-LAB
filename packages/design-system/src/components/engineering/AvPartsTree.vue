<script setup lang="ts">
import { ref } from "vue";

/** ENGINEERING UI · Parts Tree — 零件树（roving 焦点 + Enter/Space 选中，WAI-ARIA tree 基线） */
export interface PartNode {
  id: string;
  label: string;
  depth: number;
}

const props = defineProps<{ parts: PartNode[]; selectedId?: string | null }>();
const emit = defineEmits<{ select: [id: string] }>();
const focusedIdx = ref(0);

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const dir = e.key === "ArrowDown" ? 1 : -1;
    focusedIdx.value = Math.min(Math.max(focusedIdx.value + dir, 0), props.parts.length - 1);
    emit("select", props.parts[focusedIdx.value].id);
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    emit("select", props.parts[focusedIdx.value].id);
  }
}
</script>

<template>
  <ul class="av-tree" role="tree" aria-label="零件树" tabindex="0" @keydown="onKeydown">
    <li
      v-for="(part, i) in parts"
      :key="part.id"
      role="treeitem"
      :aria-level="part.depth + 1"
      :aria-selected="part.id === selectedId"
      class="av-tree__item"
      :class="{
        selected: part.id === selectedId,
        focused: i === focusedIdx,
      }"
      :style="{ paddingLeft: `${8 + part.depth * 16}px` }"
      @mouseenter="focusedIdx = i"
      @click="emit('select', part.id)"
    >
      <span class="av-tree__label">{{ part.label }}</span>
    </li>
  </ul>
</template>

<style scoped>
.av-tree {
  margin: 0;
  padding: 6px;
  list-style: none;
  border: 1px solid var(--av-border-faint);
  border-radius: var(--av-radius-m);
  background: var(--av-glass-bg);
  font-size: 12px;
  color: var(--av-text-secondary);
  max-height: 260px;
  overflow: auto;
}

.av-tree:focus-visible {
  outline: 2px solid var(--av-nexus-500);
  outline-offset: 1px;
}

.av-tree__item {
  display: flex;
  align-items: center;
  padding-top: 4px;
  padding-bottom: 4px;
  border-radius: var(--av-radius-s);
  cursor: pointer;
  border-left: 2px solid transparent;
}

.av-tree__item.focused {
  background: rgba(34, 211, 238, 0.08);
}

.av-tree__item.selected {
  color: var(--av-text-primary);
  border-left-color: var(--av-nexus-500);
  background: rgba(34, 211, 238, 0.12);
}

.av-tree__label {
  font-family: var(--av-font-mono);
  letter-spacing: 0.03em;
}
</style>
