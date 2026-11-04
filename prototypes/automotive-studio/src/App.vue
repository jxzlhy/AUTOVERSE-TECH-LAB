<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import * as THREE from "three";
import { PAINT_PRESETS } from "@atl/shared";
import {
  AvAnnotation,
  AvExplorationHud,
  AvHoloPanel,
  AvInspector,
  AvLocationMarker,
  AvPartsTree,
  AvSceneSelector,
  AvTeleportIndicator,
  AvToggle,
  type PartNode,
} from "@atl/design-system";
import { SectionController, XRayController, framingForBox } from "@atl/three-runtime";
import { TimelineManager, MotionTokens } from "@atl/motion-system";
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
// —— ENGINEERING UI 状态（PHASE 2D §5.3）——
const xrayOn = ref(false);
const wireframeOn = ref(false);
const sectionOn = ref(false);
const sectionT = ref(0);
const selectedPartId = ref<string | null>(null);
let xray: XRayController | null = null;
let section: SectionController | null = null;
let motion: TimelineManager;
let wireframeSaved = new Map<THREE.Mesh, boolean>();
// —— SPATIAL UI 状态（PHASE 2D §5.2）——
const visitedSpaces = ref(new Set<string>(["studio"]));
const markerScreen = ref({ x: 0, y: 0, visible: false, scale: 1, dimmed: false });
const annoScreen = ref({ x: 0, y: 0, visible: false });
const inspectorRows = ref<{ label: string; value: string; certainty?: "confirmed" | "estimated" | "unknown" }[]>([]);

function updateInspector(id: string | null): void {
  if (!id || !studioRefs) {
    inspectorRows.value = [];
    return;
  }
  const part = studioRefs.car.parts.get(id);
  if (!part) return;
  part.mesh.geometry.computeBoundingBox();
  const size = part.mesh.geometry.boundingBox?.getSize(new THREE.Vector3());
  inspectorRows.value = [
    { label: "名称", value: id, certainty: "confirmed" },
    {
      label: "位置",
      value: `${part.base.x.toFixed(2)}, ${part.base.y.toFixed(2)}, ${part.base.z.toFixed(2)}`,
      certainty: "confirmed",
    },
    { label: "尺寸", value: size ? `${size.x.toFixed(2)}×${size.y.toFixed(2)}×${size.z.toFixed(2)}` : "—", certainty: "estimated" },
    { label: "材质", value: (part.mesh.material as THREE.Material).type, certainty: "confirmed" },
  ];
}

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
  const sync = () => {
    explodeT.value = explodeProxy.t;
    if (studioRefs) applyExplode(studioRefs.car, explodeProxy.t);
  };
  if (animate) {
    // PART 7 Demo：机械拆解/复原（同 key 抢占=可取消；Reduced Motion 直达终态）
    motion.play("explode", (tl) => tl.to(explodeProxy, { t, duration: 0.9, ease: MotionTokens.easeCamera, onUpdate: sync }));
  } else {
    motion.cancel("explode");
    explodeProxy.t = t;
    sync();
  }
}

async function goScene(id: "studio" | "energy"): Promise<void> {
  if (switching.value || id === activeScene.value || !overlayRef.value) return;
  switching.value = true;
  selectedPart.value = null;
  interaction.setEnabled(false);
  await motion.playAsync("teleport", (tl) => tl.to(overlayRef.value, { opacity: 1, duration: 0.28, ease: "power2.in" }));

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
  await motion.playAsync("teleport", (tl) => tl.to(overlayRef.value, { opacity: 0, duration: 0.34, ease: "power2.out" }));
  activeScene.value = id;
  switching.value = false;
  visitedSpaces.value.add(id);
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

const partNodes = ref<PartNode[]>([]);

function buildPartTree(): void {
  // 从程序化车部件推导零件树（hub 归属对应 wheel 之下）
  const nodes: PartNode[] = [];
  for (const id of studioRefs.car.parts.keys()) {
    const hub = id.startsWith("hub-");
    nodes.push({ id, label: hub ? `└ ${id.replace("hub-", "hub ")}` : id, depth: hub ? 1 : 0 });
  }
  partNodes.value = nodes;
}

function toggleXray(v: boolean): void {
  xrayOn.value = v;
  if (!studioRefs) return;
  if (v) xray?.apply(studioRefs.group);
  else xray?.restore(studioRefs.group);
}

function toggleWireframe(v: boolean): void {
  wireframeOn.value = v;
  if (!studioRefs) return;
  if (v) {
    studioRefs.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          wireframeSaved.set(mesh, mat.wireframe);
          mat.wireframe = true;
        }
      }
    });
  } else {
    for (const [mesh, original] of wireframeSaved) mesh.material && ((mesh.material as THREE.Material).wireframe = original);
    wireframeSaved.clear();
  }
}

function toggleSection(v: boolean): void {
  sectionOn.value = v;
  if (!renderer || !studioRefs) return;
  if (v) {
    section?.attach(renderer, studioRefs.group, { min: -6, max: 4 });
    section?.setProgress(sectionT.value);
  } else {
    section?.detach();
  }
}

function onSectionSlide(v: number): void {
  sectionT.value = v;
  if (sectionOn.value) section?.setProgress(v);
}

function selectPart(id: string): void {
  selectedPartId.value = id;
  selectedPart.value = id;
  updateInspector(id);
  const part = studioRefs?.car.parts.get(id);
  if (part && cameraRig) {
    cameraRig.frameObject(part.mesh, { padding: 2.2 });
    interaction.setEnabled(true);
  }
}

// PART 7 Demo：汽车登场（比例/沉降/镜头推近，cinematic）
function carEntrance(): void {
  if (!studioRefs) return;
  studioRefs.car.root.scale.setScalar(0.6);
  studioRefs.car.root.position.y = -1.6;
  cameraRig.camera.position.set(13, 6, 13);
  motion.play("entrance", (tl) => {
    tl.to(studioRefs!.car.root.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: MotionTokens.easeEntrance }, 0)
      .to(studioRefs!.car.root.position, { y: 0, duration: 1.1, ease: MotionTokens.easeEntrance }, 0)
      .to(cameraRig.camera.position, { x: 6.5, y: 3, z: 7.5, duration: 1.6, ease: MotionTokens.easeCamera }, 0);
  });
}

// PART 7 Demo：展品电影级聚焦（选中部件或整车，Box3 取景 + cinematic 缓动）
function cinematicFocus(): void {
  if (!studioRefs) return;
  const targetObj = (selectedPartId.value ? studioRefs.car.parts.get(selectedPartId.value)?.mesh : null) ?? studioRefs.car.root;
  targetObj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(targetObj);
  const { distance, target } = framingForBox(box, { fovDeg: cameraRig.camera.fov, padding: 1.6, aspect: cameraRig.camera.aspect });
  const startPos = cameraRig.camera.position.clone();
  const startTgt = cameraRig.controls.target.clone();
  const dir = startPos.clone().sub(startTgt).normalize();
  const endPos = target.clone().addScaledVector(dir, distance);
  const proxy = { t: 0 };
  motion.play("focus", (tl) =>
    tl.to(proxy, {
      t: 1,
      duration: MotionTokens.cinematic / 1000,
      ease: MotionTokens.easeCamera,
      onUpdate: () => {
        cameraRig.camera.position.lerpVectors(startPos, endPos, proxy.t);
        cameraRig.controls.target.lerpVectors(startTgt, target, proxy.t);
      },
    }),
  );
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
  xray = new XRayController();
  section = new SectionController();
  motion = new TimelineManager();

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
    selectedPartId.value = object?.name ?? null;
    updateInspector(object?.name ?? null);
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
  buildPartTree();
  cameraRig.frameObject(studioRefs.group, { padding: 1.28 });

  // 主循环
  renderer.setAnimationLoop(() => {
    const delta = Math.min(clock.getDelta(), 0.1);
    elapsed += delta;
    sceneManager.update(delta);
    cameraRig.update();
    effects.render();
    perfMonitor.sample(performance.now());
    updateSpatialAnchors();
  });
  }
}

/** SPATIAL UI 锚定：3D 世界坐标 → 屏幕像素（每帧；遮挡简化为"相机背后即隐藏"） */
function updateSpatialAnchors(): void {
  const w = canvasRef.value?.clientWidth ?? 1;
  const h = canvasRef.value?.clientHeight ?? 1;
  const project = (obj: THREE.Object3D, yOff: number) => {
    const pos = obj.getWorldPosition(new THREE.Vector3());
    pos.y += yOff;
    const ndc = pos.clone().project(cameraRig.camera);
    const behind = ndc.z > 1;
    return {
      x: (ndc.x * 0.5 + 0.5) * w,
      y: (-ndc.y * 0.5 + 0.5) * h,
      visible: !behind,
      dist: cameraRig.camera.position.distanceTo(pos),
    };
  };
  // 选中部件标记（世界坐标略抬升）
  if (selectedPartId.value && activeScene.value === "studio" && studioRefs) {
    const part = studioRefs.car.parts.get(selectedPartId.value);
    if (part) {
      const pr = project(part.mesh, 0.9);
      markerScreen.value = {
        x: pr.x,
        y: pr.y,
        visible: pr.visible,
        scale: Math.min(Math.max(9 / pr.dist, 0.55), 1.25), // 距离缩放
        dimmed: pr.dist > 16,
      };
    }
  } else {
    markerScreen.value = { ...markerScreen.value, visible: false };
  }
  // GLB 工程标注锚点
  if (studioRefs?.glbGroup && activeScene.value === "studio") {
    const pr = project(studioRefs.glbGroup, 2.4);
    annoScreen.value = { x: pr.x, y: pr.y, visible: pr.visible };
  } else {
    annoScreen.value = { ...annoScreen.value, visible: false };
  }
}

onBeforeUnmount(() => {
  window.removeEventListener("unhandledrejection", onUnhandledRejection);
  canvasRef.value?.removeEventListener("webglcontextlost", onContextLost);
  canvasRef.value?.removeEventListener("webglcontextrestored", onContextRestored);
  gsap.killTweensOf(explodeProxy); // PHASE 2A §2.6：动画实例不跨生命周期累积
  xray?.dispose();
  section?.detach();
  motion?.dispose();
  wireframeSaved.clear();
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

    <!-- SPATIAL：探索 HUD（顶部中央） -->
    <div class="hud zone-top-center">
      <AvExplorationHud
        :space-name="activeScene === 'studio' ? '摄影棚 STUDIO' : '能量空间 ENERGY'"
        :visited="visitedSpaces.size"
        :total="2"
        hint="选择上方空间卡片传送"
      />
      <AvTeleportIndicator v-if="switching" state="charging" :progress="0.5" label="TP" />
    </div>

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
      <AvSceneSelector
        aria-label="空间切换"
        :scenes="[
          { id: 'studio', label: '摄影棚', hint: 'STUDIO' },
          { id: 'energy', label: '能量空间', hint: 'ENERGY' },
        ]"
        :active-id="activeScene"
        :disabled="switching"
        @select="(id: string) => goScene(id as 'studio' | 'energy')"
      />
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
        <button class="chip" @click="carEntrance">登场</button>
        <button class="chip" @click="cinematicFocus">聚焦</button>
      </div>
      <p v-if="glbLoading >= 0 && glbLoading < 1" class="loading-note">
        ToyCar.glb 加载中 {{ Math.round(glbLoading * 100) }}%
      </p>
      <div class="eng-panel" aria-label="工程面板">
        <span class="control-label">PARTS</span>
        <AvPartsTree
          class="eng-tree"
          :parts="partNodes"
          :selected-id="selectedPartId"
          @select="selectPart"
        />
        <div class="eng-toggles">
          <AvToggle v-model="xrayOn" label="X-RAY" @update:model-value="toggleXray" />
          <AvToggle v-model="wireframeOn" label="WIRE" @update:model-value="toggleWireframe" />
          <AvToggle v-model="sectionOn" label="SECTION" @update:model-value="toggleSection" />
        </div>
        <div v-if="sectionOn" class="control-row">
          <span class="control-label">剖面</span>
          <input
            class="slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="sectionT"
            aria-label="剖切进度"
            @input="onSectionSlide(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
    </section>

    <!-- 部件铭牌 -->
    <AvHoloPanel v-if="selectedPart" class="hud plaque" kicker="PART" :title="selectedPart" />

    <!-- SPATIAL：3D 锚定标记（跟随选中部件，距离缩放/背后隐藏） -->
    <AvLocationMarker
      v-if="selectedPart && activeScene === 'studio'"
      class="anchored"
      :label="selectedPart"
      sub="SELECTED"
      :visible="markerScreen.visible"
      :scale="markerScreen.scale"
      :dimmed="markerScreen.dimmed"
      :style="{ transform: `translate(${markerScreen.x}px, ${markerScreen.y - 26}px) translateX(-50%)` }"
    />

    <!-- ENGINEERING：GLB 工程标注（编号旗标 + 引线） -->
    <div
      v-if="annoScreen.visible && activeScene === 'studio' && !xrayOn"
      class="anchored"
      :style="{ transform: `translate(${annoScreen.x + 30}px, ${annoScreen.y - 40}px)` }"
    >
      <AvAnnotation :index="1" text="SIMULATED · CC0 · Khronos ToyCar" />
    </div>

    <!-- ENGINEERING：部件检查器 -->
    <aside v-if="inspectorRows.length && activeScene === 'studio'" class="hud zone-right-inspector">
      <AvInspector title="Component Inspector" :rows="inspectorRows" />
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
