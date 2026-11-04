<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import * as THREE from "three";
import { PAINT_PRESETS } from "@atl/shared";
import {
  AssetManager,
  CameraController,
  EffectManager,
  InteractionManager,
  LIGHT_PRESETS,
  LightingManager,
  PerformanceMonitor,
  SceneManager,
  type LightPresetId,
  type LoadedGlb,
  type PerfSnapshot,
} from "@atl/three-runtime";
import { buildStudioScene, attachGlb, TOYCAR_URL, type StudioRefs } from "./studio/studio-scene";
import { buildEnergyScene, type EnergyRefs } from "./studio/energy-scene";
import { applyExplode } from "./studio/procedural-car";
import "./style.css";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const overlayRef = ref<HTMLDivElement | null>(null);

// —— UI 状态（SPATIAL HUD）——
const activeScene = ref<"studio" | "energy">("studio");
const switching = ref(false);
const lightPreset = ref<LightPresetId>("STUDIO");
const lightPresets = Object.values(LIGHT_PRESETS);
const paintId = ref<string>(PAINT_PRESETS[0].id);
const explodeT = ref(0);
const bloomOn = ref(false);
const selectedPart = ref<string | null>(null);
const perf = ref<PerfSnapshot>({ fps: 0, frameTimeMs: 0, drawCalls: 0, triangles: 0 });
const glbLoading = ref(0); // -1 = 未开始/完成态之外
const glbStats = ref<LoadedGlb["stats"] | null>(null);
const fatal = ref<string | null>(null);

// —— 运行时句柄 ——
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let sceneRoot: THREE.Group;
let clock: THREE.Clock;
let elapsed = 0;
let studioRefs: StudioRefs;
let energyRefs: EnergyRefs;
let sceneManager: SceneManager;
let lighting: LightingManager;
let cameraRig: CameraController;
let interaction: InteractionManager;
let effects: EffectManager;
let perfMonitor: PerformanceMonitor;
let explodeProxy = { t: 0 };
let resizeObs: ResizeObserver | null = null;
const assetManager = new AssetManager();

function setExplode(t: number, animate = false): void {
  if (animate) {
    gsap.to(explodeProxy, { t, duration: 0.9, ease: "power2.inOut", onUpdate: sync });
  } else {
    explodeProxy.t = t;
    sync();
  }
  function sync() {
    explodeT.value = explodeProxy.t;
    if (studioRefs) applyExplode(studioRefs.car, explodeProxy.t);
  }
}

async function goScene(id: "studio" | "energy"): Promise<void> {
  if (switching.value || id === activeScene.value || !overlayRef.value) return;
  switching.value = true;
  selectedPart.value = null;
  interaction.setEnabled(false);
  await gsap.to(overlayRef.value, { opacity: 1, duration: 0.28, ease: "power2.in" });

  if (id === "energy") {
    lighting.setPreset("NIGHT");
    lightPreset.value = "NIGHT";
    bloomOn.value = true;
    await sceneManager.activate("energy", { disposeCurrent: false });
    cameraRig.camera.position.set(7, 3.4, 9);
    cameraRig.controls.target.set(0, 2, 0);
  } else {
    lighting.setPreset("STUDIO");
    lightPreset.value = "STUDIO";
    await sceneManager.activate("studio", { disposeCurrent: false });
    cameraRig.frameObject(studioRefs.group, { padding: 1.28 });
  }
  effects.setBloom(bloomOn.value);
  effects.setScene(scene);
  await gsap.to(overlayRef.value, { opacity: 0, duration: 0.34, ease: "power2.out" });
  activeScene.value = id;
  switching.value = false;
  interaction.setEnabled(true);
}

function chooseLight(id: LightPresetId): void {
  lightPreset.value = id;
  lighting.setPreset(id);
}

function choosePaint(id: string): void {
  paintId.value = id;
  studioRefs.setPaint(PAINT_PRESETS.find((p) => p.id === id)?.color ?? "#22D3EE");
}

function toggleBloom(): void {
  bloomOn.value = !bloomOn.value;
  effects.setBloom(bloomOn.value);
}

// PHASE 2A §2.6：全局监听必须可反注册（命名处理器 + onBeforeUnmount 清理）
function onUnhandledRejection(e: PromiseRejectionEvent): void {
  fatal.value = String(e.reason?.message ?? e.reason);
}

function onContextLost(e: Event): void {
  e.preventDefault(); // 允许 restored 后恢复，而不是永久黑屏
  fatal.value = "WebGL 上下文丢失（context lost），等待恢复…";
}

function onContextRestored(): void {
  fatal.value = null; // 三 r187 会在 restored 后重建渲染目标，页面状态保留
}

onMounted(async () => {
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  canvasRef.value?.addEventListener("webglcontextlost", onContextLost);
  canvasRef.value?.addEventListener("webglcontextrestored", onContextRestored);
  try {
    await initApp();
  } catch (err) {
    fatal.value = err instanceof Error ? `${err.message}` : String(err);
    console.error(err);
  }
});

async function initApp() {
  {
  const canvas = canvasRef.value!;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  scene = new THREE.Scene();
  sceneRoot = new THREE.Group();
  scene.add(sceneRoot);
  clock = new THREE.Clock();

  cameraRig = new CameraController(new THREE.PerspectiveCamera(40, 1, 0.1, 200), canvas);
  cameraRig.camera.position.set(6.5, 3, 7.5);

  lighting = new LightingManager(scene, renderer, "STUDIO");

  // 场景注册
  studioRefs = buildStudioScene(paintId.value);
  energyRefs = buildEnergyScene();
  sceneManager = new SceneManager(sceneRoot);
  sceneManager.register({
    id: "studio",
    object3D: studioRefs.group,
    onEnter: async () => {
      if (studioRefs.glb || glbLoading.value >= 1) return;
      glbLoading.value = 0;
      const loaded = await assetManager.loadGLB(TOYCAR_URL, (r) => (glbLoading.value = r));
      attachGlb(studioRefs, loaded);
      glbStats.value = loaded.stats;
      glbLoading.value = 1;
      interaction.setPickables(studioRefs.car.root, loaded.scene);
    },
    onFrame: ({ delta }) => {
      studioRefs.turntable.rotation.y += delta * 0.18;
    },
  });
  sceneManager.register({
    id: "energy",
    object3D: energyRefs.group,
    onFrame: ({ delta }) => energyRefs.onFrame(delta, elapsed),
  });

  interaction = new InteractionManager(canvas, cameraRig.camera);
  interaction.setPickables(studioRefs.car.root);
  interaction.events.on("select", ({ object }) => {
    selectedPart.value = object?.name ?? null;
  });

  effects = new EffectManager(renderer, scene, cameraRig.camera);
  effects.setBloom(false);
  effects.setScene(scene);

  perfMonitor = new PerformanceMonitor(() => renderer.info);
  perfMonitor.onSnapshot((s) => (perf.value = s));

  // 尺寸
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    effects.setSize(w, h);
    cameraRig.camera.aspect = w / h;
    cameraRig.camera.updateProjectionMatrix();
  };
  resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvas);
  resize();

  // 首场景进入
  await sceneManager.activate("studio");
  cameraRig.frameObject(studioRefs.group, { padding: 1.28 });

  // 主循环
  renderer.setAnimationLoop(() => {
    const delta = Math.min(clock.getDelta(), 0.1);
    elapsed += delta;
    sceneManager.update(delta);
    cameraRig.update();
    effects.render();
    perfMonitor.sample(performance.now());
  });
  }
}

onBeforeUnmount(() => {
  window.removeEventListener("unhandledrejection", onUnhandledRejection);
  canvasRef.value?.removeEventListener("webglcontextlost", onContextLost);
  canvasRef.value?.removeEventListener("webglcontextrestored", onContextRestored);
  gsap.killTweensOf(explodeProxy); // PHASE 2A §2.6：动画实例不跨生命周期累积
  renderer?.setAnimationLoop(null);
  resizeObs?.disconnect();
  interaction?.dispose();
  effects?.dispose();
  lighting?.dispose();
  energyRefs?.dispose();
  cameraRig?.dispose();
  renderer?.dispose();
});
</script>

<template>
  <main class="stage">
    <canvas ref="canvasRef" class="canvas" />

    <!-- 转场遮罩 -->
    <div ref="overlayRef" class="transition-overlay" />

    <aside v-if="fatal" class="hud fatal-note" role="alert">
      <strong>初始化失败</strong>
      <code>{{ fatal }}</code>
    </aside>

    <!-- 顶部：品牌 + 空间切换 -->
    <header class="hud zone-top">
      <div>
        <span class="kicker">AUTOVERSE TECH LAB</span>
        <h1 class="title">Automotive Studio ｜ 旗舰整合原型</h1>
      </div>
      <nav class="scene-tabs" aria-label="空间切换">
        <button
          class="tab"
          :class="{ active: activeScene === 'studio' }"
          :disabled="switching"
          @click="goScene('studio')"
        >
          摄影棚
        </button>
        <button
          class="tab"
          :class="{ active: activeScene === 'energy' }"
          :disabled="switching"
          @click="goScene('energy')"
        >
          能量空间
        </button>
      </nav>
    </header>

    <!-- 左下：灯光 / 车漆 / 视角 -->
    <section v-if="activeScene === 'studio'" class="hud zone-bottom-left" aria-label="场景控制">
      <div class="control-row">
        <span class="control-label">LIGHT</span>
        <button
          v-for="p in lightPresets"
          :key="p.id"
          class="chip"
          :class="{ active: lightPreset === p.id }"
          @click="chooseLight(p.id)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="control-row">
        <span class="control-label">PAINT</span>
        <button
          v-for="p in PAINT_PRESETS"
          :key="p.id"
          class="chip"
          :class="{ active: paintId === p.id }"
          :style="{ '--paint': p.color }"
          @click="choosePaint(p.id)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="control-row">
        <span class="control-label">拆解</span>
        <input
          v-model.number="explodeT"
          class="slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          aria-label="爆炸拆解系数"
          @input="setExplode(explodeT)"
        />
        <button class="chip" :disabled="switching" @click="setExplode(explodeT > 0.5 ? 0 : 1, true)">
          {{ explodeT > 0.5 ? "装配" : "爆炸" }}
        </button>
        <button class="chip" :class="{ active: bloomOn }" @click="toggleBloom">BLOOM</button>
      </div>
      <p v-if="glbLoading >= 0 && glbLoading < 1" class="loading-note">
        ToyCar.glb 加载中 {{ Math.round(glbLoading * 100) }}%
      </p>
    </section>

    <!-- 部件铭牌 -->
    <aside v-if="selectedPart" class="hud plaque" role="status">
      <span class="plaque-kicker">PART</span>
      <strong>{{ selectedPart }}</strong>
    </aside>

    <!-- 右下：性能读数 -->
    <footer class="hud zone-bottom-right stats" aria-live="off">
      <span><em>{{ perf.fps }}</em> FPS</span>
      <span><em>{{ perf.frameTimeMs.toFixed(1) }}</em> ms</span>
      <span><em>{{ perf.drawCalls }}</em> DRAWS</span>
      <span><em>{{ (perf.triangles / 1000).toFixed(1) }}K</em> TRIS</span>
    </footer>

    <!-- ToyCar 资产统计（左上提示区） -->
    <aside v-if="glbStats && activeScene === 'studio'" class="hud zone-top-left asset-note">
      <span class="kicker">GLB · CC0 · Khronos ToyCar</span>
      <span class="mono-note">
        {{ glbStats.meshes }} mesh · {{ glbStats.materials }} mat · {{ glbStats.textures }} tex ·
        {{ (glbStats.triangles / 1000).toFixed(1) }}K tris
      </span>
    </aside>
  </main>
</template>
