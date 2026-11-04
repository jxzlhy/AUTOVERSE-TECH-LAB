<script setup lang="ts">
import { ref, useId } from "vue";

/** CORE UI · Tabs — 键盘左右切换 + roving tabindex（WAI-ARIA tabs 基线） */
const props = defineProps<{ tabs: { id: string; label: string }[] }>();
const emit = defineEmits<{ change: [id: string] }>();
const active = ref(props.tabs[0]?.id ?? "");
const baseId = useId();

function onKeydown(e: KeyboardEvent): void {
  const idx = props.tabs.findIndex((t) => t.id === active.value);
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = props.tabs[(idx + dir + props.tabs.length) % props.tabs.length];
    active.value = next.id;
    emit("change", next.id);
  }
}

function select(id: string): void {
  active.value = id;
  emit("change", id);
}
</script>

<template>
  <div class="av-tabs">
    <div class="av-tabs__list" role="tablist" @keydown="onKeydown">
      <button
        v-for="t in tabs"
        :key="t.id"
        :id="`${baseId}-${t.id}`"
        role="tab"
        class="av-tabs__tab"
        :class="{ active: active === t.id }"
        :aria-selected="active === t.id"
        :tabindex="active === t.id ? 0 : -1"
        @click="select(t.id)"
      >
        {{ t.label }}
      </button>
    </div>
    <div
      v-for="t in tabs"
      v-show="active === t.id"
      :key="t.id"
      :id="`${baseId}-${t.id}-panel`"
      role="tabpanel"
      :aria-labelledby="`${baseId}-${t.id}`"
      class="av-tabs__panel"
    >
      <slot :name="t.id" />
    </div>
  </div>
</template>

<style scoped>
.av-tabs__list {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--av-border-faint);
}

.av-tabs__tab {
  appearance: none;
  border: none;
  background: none;
  padding: 9px 14px;
  font-size: 13px;
  color: var(--av-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition:
    color var(--av-motion-fast) var(--av-ease-ui),
    border-color var(--av-motion-fast) var(--av-ease-ui);
}

.av-tabs__tab:hover {
  color: var(--av-text-primary);
}

.av-tabs__tab.active {
  color: var(--av-nexus-500);
  border-bottom-color: var(--av-nexus-500);
}

.av-tabs__tab:focus-visible {
  outline: 2px solid var(--av-nexus-500);
  outline-offset: -2px;
  border-radius: var(--av-radius-s);
}

.av-tabs__panel {
  padding: 16px 2px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--av-text-secondary);
}
</style>
