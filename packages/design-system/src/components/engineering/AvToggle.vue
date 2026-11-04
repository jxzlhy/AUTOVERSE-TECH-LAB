<script setup lang="ts">
/** ENGINEERING UI · Toggle — X-Ray/Wireframe/Section 等工程开关（role=switch 基线） */
const props = withDefaults(defineProps<{ label: string; modelValue?: boolean; accent?: string }>(), {
  modelValue: false,
  accent: "var(--av-nexus-500)",
});
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

function toggle(): void {
  emit("update:modelValue", !props.modelValue);
}
</script>

<template>
  <button
    type="button"
    role="switch"
    class="av-toggle"
    :class="{ on: modelValue }"
    :aria-checked="modelValue"
    :style="{ '--accent': accent }"
    @click="toggle"
  >
    <span class="av-toggle__track"><span class="av-toggle__thumb" /></span>
    <span class="av-toggle__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.av-toggle {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: 12px;
  color: var(--av-text-secondary);
}

.av-toggle:hover {
  color: var(--av-text-primary);
}

.av-toggle:focus-visible {
  outline: 2px solid var(--av-nexus-500);
  outline-offset: 2px;
  border-radius: var(--av-radius-s);
}

.av-toggle__track {
  width: 30px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid var(--av-border-strong);
  background: var(--av-glass-bg);
  position: relative;
  transition:
    border-color var(--av-motion-fast) var(--av-ease-ui),
    background var(--av-motion-fast) var(--av-ease-ui);
}

.av-toggle.on .av-toggle__track {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.av-toggle__thumb {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--av-text-secondary);
  transition:
    translate var(--av-motion-fast) var(--av-ease-ui),
    background var(--av-motion-fast) var(--av-ease-ui);
}

.av-toggle.on .av-toggle__thumb {
  translate: 14px 0;
  background: var(--accent);
}
</style>
