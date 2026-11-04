<script setup lang="ts">
import { watch } from "vue";
const props = defineProps<{ open: boolean; title: string; side?: "left" | "right" }>();
const emit = defineEmits<{ close: [] }>();
function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape" && props.open) emit("close");
}
watch(
  () => props.open,
  (open) => {
    if (typeof document === "undefined") return;
    if (open) window.addEventListener("keydown", onKey);
    else window.removeEventListener("keydown", onKey);
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="av-drawer">
      <div v-if="open" class="av-drawer__mask" @click.self="emit('close')">
        <aside class="av-drawer" :class="`av-drawer--${side ?? 'right'}`" role="dialog" aria-modal="true" :aria-label="title">
          <header class="av-drawer__head">
            <h3>{{ title }}</h3>
            <button class="av-drawer__x" aria-label="关闭" @click="emit('close')">×</button>
          </header>
          <div class="av-drawer__body"><slot /></div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.av-drawer__mask { position: fixed; inset: 0; z-index: 100; background: rgba(5, 7, 13, 0.7); backdrop-filter: blur(6px); }
.av-drawer {
  position: absolute; top: 0; bottom: 0; width: min(360px, 86vw);
  background: var(--av-bg-elevated); border-color: var(--av-border-strong);
  display: flex; flex-direction: column;
}
.av-drawer--right { right: 0; border-left: 1px solid var(--av-border-strong); }
.av-drawer--left { left: 0; border-right: 1px solid var(--av-border-strong); }
.av-drawer__head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--av-border-faint); }
.av-drawer__head h3 { margin: 0; font-size: 15px; font-weight: 500; }
.av-drawer__x { appearance: none; border: none; background: none; color: var(--av-text-secondary); font-size: 20px; cursor: pointer; }
.av-drawer__body { padding: 20px; overflow: auto; font-size: 13px; line-height: 1.7; color: var(--av-text-secondary); }
.av-drawer-enter-active, .av-drawer-leave-active { transition: opacity var(--av-motion-normal) var(--av-ease-ui); }
.av-drawer-enter-from, .av-drawer-leave-to { opacity: 0; }
</style>
