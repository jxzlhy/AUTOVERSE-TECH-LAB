<script setup lang="ts">
import { useId } from "vue";
defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{ "update:modelValue": [v: string]; search: [v: string] }>();
const id = useId();
</script>

<template>
  <div class="av-search">
    <span class="av-search__icon" aria-hidden="true">⌕</span>
    <input
      :id="id"
      class="av-search__input"
      type="search"
      :value="modelValue"
      :placeholder="placeholder ?? '搜索展品、品牌、技术…'"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown.enter="emit('search', ($event.target as HTMLInputElement).value)"
    />
    <kbd class="av-search__kbd">⏎</kbd>
  </div>
</template>

<style scoped>
.av-search { position: relative; display: flex; align-items: center; }
.av-search__icon { position: absolute; left: 12px; color: var(--av-text-muted); }
.av-search__input {
  width: 100%; padding: 9px 40px 9px 34px; border-radius: var(--av-radius-full);
  border: 1px solid var(--av-border-faint); background: var(--av-glass-bg);
  color: var(--av-text-primary); font-size: 13px;
}
.av-search__input::placeholder { color: var(--av-text-muted); }
.av-search__input:focus { outline: none; border-color: var(--av-nexus-500); box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.14); }
.av-search__input::-webkit-search-cancel-button { display: none; }
.av-search__kbd {
  position: absolute; right: 12px; padding: 1px 6px; border-radius: 4px;
  border: 1px solid var(--av-border-faint); font-family: var(--av-font-mono); font-size: 10px; color: var(--av-text-muted);
}
</style>
