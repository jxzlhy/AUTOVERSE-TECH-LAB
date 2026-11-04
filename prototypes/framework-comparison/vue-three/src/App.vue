<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createCarStudio, PAINT_PRESETS, type CarStudio, type StudioStats } from "./car-studio";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const stats = ref<StudioStats>({ fps: 0, drawCalls: 0, triangles: 0 });
const activePaint = ref(PAINT_PRESETS[0].id);
let studio: CarStudio | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  studio = createCarStudio(canvasRef.value, (s) => (stats.value = s));
});

onBeforeUnmount(() => studio?.dispose());

function selectPaint(id: (typeof PAINT_PRESETS)[number]["id"], color: string) {
  activePaint.value = id;
  studio?.setPaint(color);
}
</script>

<template>
  <main class="stage">
    <canvas ref="canvasRef" class="canvas" />
    <header class="hud hud-top">
      <span class="hud-kicker">AUTOVERSE TECH LAB</span>
      <h1 class="hud-title">摄影棚基线 ｜ <span class="route">Vue 3 + Three.js r187</span></h1>
    </header>
    <footer class="hud hud-bottom">
      <div class="paints" role="group" aria-label="车漆预设">
        <button
          v-for="p in PAINT_PRESETS"
          :key="p.id"
          class="paint-btn"
          :class="{ active: activePaint === p.id }"
          :style="{ '--paint': p.color }"
          @click="selectPaint(p.id, p.color)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="stats" aria-live="off">
        <span class="stat"><em>{{ stats.fps }}</em> FPS</span>
        <span class="stat"><em>{{ stats.drawCalls }}</em> DRAWS</span>
        <span class="stat"><em>{{ (stats.triangles / 1000).toFixed(1) }}K</em> TRIS</span>
      </div>
    </footer>
  </main>
</template>
