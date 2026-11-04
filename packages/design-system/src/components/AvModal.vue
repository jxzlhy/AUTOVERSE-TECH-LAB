<script setup lang="ts">
import { watch } from "vue";

/** CORE UI · Modal — 焦点容器 + Esc 关闭 + 背景点击关闭（无障碍基线） */
const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape" && props.open) emit("close");
}

watch(
  () => props.open,
  (open) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) window.addEventListener("keydown", onKeydown);
    else window.removeEventListener("keydown", onKeydown);
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="av-modal">
      <div v-if="open" class="av-modal__mask" @click.self="emit('close')">
        <div class="av-modal" role="dialog" aria-modal="true" :aria-label="title">
          <header class="av-modal__head">
            <h3 class="av-modal__title">{{ title }}</h3>
            <button class="av-modal__close" aria-label="关闭" @click="emit('close')">×</button>
          </header>
          <div class="av-modal__body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.av-modal__mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 7, 13, 0.7);
  backdrop-filter: blur(6px);
}

.av-modal {
  width: min(520px, calc(100vw - 48px));
  border-radius: var(--av-radius-l);
  border: 1px solid var(--av-border-strong);
  background: var(--av-bg-elevated);
  box-shadow: 0 0 48px rgba(34, 211, 238, 0.08);
  overflow: hidden;
}

.av-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--av-border-faint);
}

.av-modal__title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

.av-modal__close {
  appearance: none;
  border: none;
  background: none;
  color: var(--av-text-secondary);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
}

.av-modal__close:hover {
  color: var(--av-text-primary);
}

.av-modal__body {
  padding: 20px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--av-text-secondary);
}

.av-modal-enter-active,
.av-modal-leave-active {
  transition: opacity var(--av-motion-normal) var(--av-ease-ui);
}

.av-modal-enter-from,
.av-modal-leave-to {
  opacity: 0;
}
</style>
