<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
defineProps<{ label: string; items: { id: string; label: string }[] }>();
const emit = defineEmits<{ select: [id: string] }>();
const open = ref(false);
const root = ref<HTMLElement | null>(null);
function onDocClick(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false;
}
function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape") open.value = false;
}
onMounted(() => {
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  document.removeEventListener("keydown", onKey);
});
function pick(id: string): void {
  open.value = false;
  emit("select", id);
}
</script>

<template>
  <div ref="root" class="av-dd">
    <button type="button" class="av-dd__btn" :aria-expanded="open" aria-haspopup="menu" @click="open = !open">
      {{ label }} ▾
    </button>
    <Transition name="av-dd">
      <ul v-if="open" class="av-dd__menu" role="menu">
        <li v-for="it in items" :key="it.id" role="none">
          <button type="button" role="menuitem" class="av-dd__item" @click="pick(it.id)">{{ it.label }}</button>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.av-dd { position: relative; display: inline-block; }
.av-dd__btn {
  appearance: none; padding: 8px 14px; border-radius: var(--av-radius-m);
  border: 1px solid var(--av-border-faint); background: var(--av-glass-bg);
  color: var(--av-text-primary); font-size: 13px; cursor: pointer;
}
.av-dd__btn:focus-visible { outline: 2px solid var(--av-nexus-500); outline-offset: 2px; }
.av-dd__menu {
  position: absolute; z-index: 50; margin: 6px 0 0; padding: 6px; list-style: none;
  min-width: 180px; border-radius: var(--av-radius-m); border: 1px solid var(--av-border-strong);
  background: var(--av-bg-elevated); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}
.av-dd__item {
  appearance: none; width: 100%; text-align: left; padding: 8px 10px; border: none;
  background: none; border-radius: var(--av-radius-s); color: var(--av-text-secondary);
  font-size: 13px; cursor: pointer;
}
.av-dd__item:hover { background: rgba(34, 211, 238, 0.1); color: var(--av-text-primary); }
.av-dd-enter-active, .av-dd-leave-active { transition: opacity var(--av-motion-fast) var(--av-ease-ui); }
.av-dd-enter-from, .av-dd-leave-to { opacity: 0; }
</style>
