<script setup lang="ts">
import { computed, useId } from "vue";

/** CORE UI · Input — 标签/错误/禁用态，label 关联与错误播报 */
const props = defineProps<{
  label: string;
  modelValue?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const id = useId();
const errorId = computed(() => `${id}-error`);
</script>

<template>
  <div class="av-field">
    <label class="av-field__label" :for="id">{{ label }}</label>
    <input
      :id="id"
      class="av-field__input"
      :class="{ 'av-field__input--error': error }"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error ? errorId : undefined"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" :id="errorId" class="av-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.av-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.av-field__label {
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--av-text-secondary);
}

.av-field__input {
  padding: 9px 12px;
  border-radius: var(--av-radius-m);
  border: 1px solid var(--av-border-faint);
  background: var(--av-glass-bg);
  color: var(--av-text-primary);
  font-size: 14px;
  transition: border-color var(--av-motion-fast) var(--av-ease-ui);
}

.av-field__input::placeholder {
  color: var(--av-text-muted);
}

.av-field__input:focus {
  outline: none;
  border-color: var(--av-nexus-500);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.14);
}

.av-field__input--error,
.av-field__input[aria-invalid] {
  border-color: var(--av-danger);
}

.av-field__input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.av-field__error {
  margin: 0;
  font-size: 12px;
  color: var(--av-danger);
}
</style>
