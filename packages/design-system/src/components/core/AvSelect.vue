<script setup lang="ts">
import { useId } from "vue";
defineProps<{ label: string; options: { value: string; label: string }[]; modelValue: string; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [v: string] }>();
const id = useId();
</script>

<template>
  <div class="av-select">
    <label class="av-select__label" :for="id">{{ label }}</label>
    <select
      :id="id"
      class="av-select__control"
      :value="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.av-select { display: flex; flex-direction: column; gap: 6px; }
.av-select__label { font-size: 12px; color: var(--av-text-secondary); }
.av-select__control {
  padding: 9px 12px; border-radius: var(--av-radius-m); border: 1px solid var(--av-border-faint);
  background: var(--av-glass-bg); color: var(--av-text-primary); font-size: 13px; cursor: pointer;
}
.av-select__control:focus { outline: none; border-color: var(--av-nexus-500); }
.av-select__control:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
