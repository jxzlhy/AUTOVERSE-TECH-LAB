<script setup lang="ts">
import { onMounted, ref } from "vue";

/** CORE UI · Toast — 自动消退 + role=status（不抢占焦点，符合 WAI-ARIA） */
const props = withDefaults(defineProps<{ message: string; kind?: "info" | "success" | "danger"; duration?: number }>(), {
  kind: "info",
  duration: 2800,
});
const emit = defineEmits<{ done: [] }>();
const visible = ref(true);

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
    emit("done");
  }, props.duration);
});
</script>

<template>
  <Transition name="av-toast">
    <div v-if="visible" class="av-toast" :class="`av-toast--${kind}`" role="status">
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.av-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  padding: 10px 18px;
  border-radius: var(--av-radius-m);
  border: 1px solid var(--av-border-strong);
  background: var(--av-bg-elevated);
  color: var(--av-text-primary);
  font-size: 13px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.av-toast--success {
  border-color: var(--av-success);
}

.av-toast--danger {
  border-color: var(--av-danger);
}

.av-toast-enter-active,
.av-toast-leave-active {
  transition:
    opacity var(--av-motion-normal) var(--av-ease-ui),
    translate var(--av-motion-normal) var(--av-ease-ui);
}

.av-toast-enter-from,
.av-toast-leave-to {
  opacity: 0;
  translate: 0 8px;
}
</style>
