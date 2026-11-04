<script setup lang="ts">
/** CORE UI · Button — variant × state 完整矩阵（design-system §7 组件指南） */
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "danger";
    size?: "s" | "m";
    disabled?: boolean;
    loading?: boolean;
  }>(),
  { variant: "secondary", size: "m", disabled: false, loading: false },
);
</script>

<template>
  <button class="av-btn" :class="[`av-btn--${variant}`, `av-btn--${size}`]" :disabled="disabled || loading">
    <span v-if="loading" class="av-btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.av-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--av-radius-m);
  font-family: var(--av-font-body);
  font-size: 13px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    background var(--av-motion-fast) var(--av-ease-ui),
    border-color var(--av-motion-fast) var(--av-ease-ui),
    transform var(--av-motion-instant) var(--av-ease-ui);
}

.av-btn--s {
  padding: 5px 12px;
}

.av-btn--m {
  padding: 9px 18px;
}

.av-btn--primary {
  background: var(--av-nexus-700);
  color: var(--av-text-primary);
}

.av-btn--primary:hover:not(:disabled) {
  background: var(--av-nexus-500);
}

.av-btn--primary:active:not(:disabled) {
  transform: scale(0.97);
}

.av-btn--secondary {
  background: var(--av-glass-bg);
  border-color: var(--av-border-faint);
  color: var(--av-text-secondary);
}

.av-btn--secondary:hover:not(:disabled) {
  color: var(--av-text-primary);
  border-color: var(--av-border-strong);
}

.av-btn--danger {
  background: transparent;
  border-color: var(--av-danger);
  color: var(--av-danger);
}

.av-btn--danger:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.12);
}

.av-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.av-btn:focus-visible {
  outline: 2px solid var(--av-nexus-500);
  outline-offset: 2px;
}

.av-btn__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: av-spin 0.8s linear infinite;
}

@keyframes av-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .av-btn,
  .av-btn__spinner {
    transition: none;
    animation-duration: 2s;
  }
}
</style>
