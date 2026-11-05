<script setup lang="ts">
/** AUTOVERSE 产品入口（PART V/VI）——THE NEXUS 主空间 + 空间节点传送 + 品牌层
 * 三层体验：EXPLORATION（漫游/节点点击）→ INTERACTION（进入空间）→ KNOWLEDGE（节点铭牌）。
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import * as THREE from "three";
import { colors } from "@atl/shared";
import { AvBadge, AvInspector, AvPartsTree, type PartNode } from "@atl/design-system";
import {
  SceneManager,
  XRayController,
  makeWireframeHandle,
} from "@atl/three-runtime";
import { createAutomaterial, MATERIAL_PRESET_INFO, type AutomotiveMaterialPreset } from "@atl/three-runtime";
import { buildNexus, type NexusRefs } from "./nexus";
import KnowledgeChain from "./components/KnowledgeChain.vue";
import { applyExplode, buildLabCar, buildShowCar, buildLegendsStars, makeGround, type LabCar, type ShowCar } from "./spaces";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const overlayRef = ref<HTMLDivElement | null>(null);
const currentSpace = ref("nexus");
const switching = ref(false);
const perf = ref({ fps: 0, draws: 0, tris: 0 });
const nodeScreens = ref<Array<{ id: string; x: number; y: number; visible: boolean; dist: number }>>([]);
const fatal = ref<string | null>(null);

const SPACE_META: Record<string, { label: string; hint: string; layer: "REALITY" | "FICTION" | "FUTURE" }> = {
  nexus: { label: "THE NEXUS", hint: "宇宙主入口 · 汽车文明枢纽", layer: "FUTURE" },
  supercar: { label: "SUPERCAR WORLD", hint: "超级跑车 · 速度与工程技术", layer: "REALITY" },
  engineering: { label: "ENGINEERING LAB", hint: "机械工程地下实验室", layer: "REALITY" },
  legends: { label: "LEGENDS UNIVERSE", hint: "影视传奇汽车收藏馆", layer: "FICTION" },
  museum: { label: "CIVILIZATION MUSEUM", hint: "汽车文明博物馆（规划中）", layer: "REALITY" },
  earth: { label: "AUTOMOTIVE EARTH", hint: "全球汽车工业地图（规划中）", layer: "REALITY" },
  future: { label: "FUTURE MOBILITY", hint: "未来交通空间站（规划中）", layer: "FUTURE" },
};

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let nexus: NexusRefs;
let sceneManager: SceneManager;
let showCar: ShowCar;
let labCar: LabCar;
let labXray: XRayController;
let labWire: ReturnType<typeof makeWireframeHandle>;
let labExplode = { t: 0 };
let legendsStars: ReturnType<typeof import("./spaces").buildLegendsStars>;
let clock: THREE.Clock;
let elapsed = 0;
let raf = 0;
let resizeObs: ResizeObserver | null = null;

const SPACE_IDS = ["nexus", "supercar", "engineering", "legends", "museum", "earth", "future"] as const;
type SpaceId = (typeof SPACE_IDS)[number];
const meta = computed(() => SPACE_META[currentSpace.value] ?? SPACE_META.nexus);
const visited = ref(new Set<string>(["nexus"]));
const explorationPct = computed(() => Math.round((visited.value.size / SPACE_IDS.length) * 100));

function onUnhandled(e: PromiseRejectionEvent): void {
  fatal.value = String(e.reason?.message ?? e.reason);
}
function onLost(e: Event): void {
  e.preventDefault();
  fatal.value = "WebGL 上下文丢失，等待恢复…";
}
function onRestored(): void {
  fatal.value = null;
}

const matPreset = ref<"paint" | AutomotiveMaterialPreset>("paint");
let presetMaterial: THREE.Material | null = null;
function chooseMaterial(preset: "paint" | AutomotiveMaterialPreset): void {
  const body = showCar?.root.children[0] as THREE.Mesh | undefined;
  if (!body) return;
  presetMaterial?.dispose();
  presetMaterial = null;
  matPreset.value = preset;
  if (preset === "paint") {
    body.material = showCar.paint;
    return;
  }
  presetMaterial = createAutomaterial(preset, 0x8fa3b8);
  body.material = presetMaterial;
}
const matPresets = Object.values(MATERIAL_PRESET_INFO);

const explodeT = ref(0);
const selectedPartId = ref<string | null>(null);
const partTree = ref<PartNode[]>([]);
function selectPart(id: string): void {
  selectedPartId.value = id;
  const part = labCar?.parts.get(id);
  if (!part) return;
  part.mesh.geometry.computeBoundingBox();
  const sz = part.mesh.geometry.boundingBox?.getSize(new THREE.Vector3());
  const idx = part.mesh.geometry.getIndex();
  const pos = part.mesh.geometry.getAttribute("position");
  inspectorRows.value = [
    { label: "部件 ID", value: id, certainty: "confirmed" },
    { label: "三角面", value: String(Math.floor((idx ? idx.count : pos.count) / 3)), certainty: "confirmed" },
    { label: "尺寸", value: sz ? `${sz.x.toFixed(2)}×${sz.y.toFixed(2)}×${sz.z.toFixed(2)}` : "—", certainty: "estimated" },
  ];
}
const inspectorRows = ref<{ label: string; value: string; certainty?: "confirmed" | "estimated" | "unknown" }[]>([]);
const xrayOn = ref(false);
const wireOn = ref(false);
const spinning = ref(true);
function setExplode(t: number): void {
  explodeT.value = t;
  labExplode.t = t;
  if (labCar) applyExplode(labCar, t);
}
function toggleXray(v: boolean): void {
  xrayOn.value = v;
  if (!labCar) return;
  if (v) labXray.apply(labCar.root);
  else labXray.restore(labCar.root);
}
function toggleWire(v: boolean): void {
  wireOn.value = v;
  labWire?.set(v);
}

onMounted(async () => {
  window.addEventListener("unhandledrejection", onUnhandled);
  try {
    await init();
  } catch (err) {
    fatal.value = err instanceof Error ? err.message : String(err);
  }
});

async function init(): Promise<void> {
  const canvas = canvasRef.value!;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.bgVoid);
  camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
  camera.position.set(0, 5.2, 13.5);
  camera.lookAt(0, 2.2, 0);
  clock = new THREE.Clock();

  // IBL + 灯光（SPATIAL 方向：冷调低补光 + 青 rim）
  const pmrem = new THREE.PMREMGenerator(renderer);
  const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.4;
  const hemi = new THREE.HemisphereLight(0x9fd8ff, 0x05070d, 0.25);
  const rim = new THREE.DirectionalLight(0x22d3ee, 1.8);
  rim.position.set(-8, 5, -6);
  scene.add(hemi, rim);

  nexus = buildNexus();
  scene.add(nexus.group);

  // SceneManager（两阶段激活）：nexus + 三大体验场景
  sceneManager = new SceneManager(scene);
  sceneManager.register({ id: "nexus", object3D: nexus.group });

  // SUPERCAR WORLD：展示车 + 材质预设
  showCar = buildShowCar();
  const supercarGroup = new THREE.Group();
  supercarGroup.add(makeGround(colors.bgDeep));
  supercarGroup.add(showCar.root);
  sceneManager.register({
    id: "supercar",
    object3D: supercarGroup,
    onEnter: () => {
      camera.position.set(6.2, 2.8, 7);
      camera.lookAt(0, 0.8, 0);
    },
    onFrame: ({ delta }) => {
      showCar.root.rotation.y += delta * 0.22;
    },
  });

  // ENGINEERING LAB：程序化示意车（SIMULATED）+ 爆炸/X-Ray/Wireframe
  labCar = buildLabCar();
  const labGroup = new THREE.Group();
  labGroup.add(makeGround("#10161f"));
  labGroup.add(labCar.root);
  labXray = new XRayController();
  labWire = makeWireframeHandle(labCar.root);
  sceneManager.register({
    id: "engineering",
    object3D: labGroup,
    onEnter: () => {
      camera.position.set(7, 3.6, 7);
      camera.lookAt(0, 0.8, 0);
      applyExplode(labCar, labExplode.t);
    },
  });

  // LEGENDS UNIVERSE：紫色星域背景（知识链为 DOM 层）
  legendsStars = buildLegendsStars();
  sceneManager.register({ id: "legends", object3D: legendsStars.group, onFrame: ({ delta }) => legendsStars.onFrame(delta) });

  // 通过 SceneManager 激活初始场景（currentId 追踪，切换时才能正确移除）
  await sceneManager.activate("nexus");
  partTree.value = Array.from(labCar.parts.keys()).map((id) => ({
    id,
    label: id.startsWith("hub-") ? `└ 轮毂 ${id.slice(4)}` : id.startsWith("wheel-") ? `车轮 ${id.slice(6)}` : id === "body" ? "车身壳体" : "座舱玻璃舱",
    depth: id.startsWith("hub-") ? 1 : 0,
  }));

  // 预置体验标记：已建成的三个空间节点高亮为"可进入"（REALITY/FICTION 已规划内容）
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateProjection(w, h);
  };
  resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvas);
  resize();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    elapsed += dt;
    nexus.onFrame(dt, elapsed);
    sceneManager.update(dt);
    if (currentSpace.value === "engineering" && spinning.value) {
      for (const w of labCar?.wheels ?? []) w.rotation.z += dt * 6;
    }
    renderer.render(scene, camera);
    perf.value = { fps: perf.value.fps, draws: renderer.info.render.calls, tris: renderer.info.render.triangles };
    updateProjection(canvas.clientWidth, canvas.clientHeight);
  });
}

function updateProjection(w: number, h: number): void {
  if (!nexus) return;
  nodeScreens.value = nexus.projectNodes(camera, w, h);
}

async function travel(id: SpaceId): Promise<void> {
  if (switching.value || id === currentSpace.value || !overlayRef.value) return;
  if (id !== "nexus" && !["supercar", "engineering", "legends"].includes(id)) return; // 规划中空间暂不可进入
  switching.value = true;
  const prev = currentSpace.value;
  currentSpace.value = id;
  visited.value.add(id);
  await sceneManager.activate(id, { disposeCurrent: false }).catch((err) => {
    // 两阶段失败保当前场景（PART 2A 契约）
    currentSpace.value = prev;
    fatal.value = `空间切换失败：${String(err)}`;
  });
  // 传送演出：镜头推进 + 白闪回淡（NEXUS→空间的沉浸式切换）
  const startPos = camera.position.clone();
  const endPos = id === "nexus" ? new THREE.Vector3(0, 5.2, 13.5) : new THREE.Vector3(0, 3.2, 9);
  const proxy = { t: 0 };
  const tl = (window as unknown as { __travelTL?: unknown }).__travelTL;
  void tl;
  const step = () => {
    proxy.t = Math.min(proxy.t + 0.02, 1);
    camera.position.lerpVectors(startPos, endPos, proxy.t);
    if (proxy.t < 1) requestAnimationFrame(step);
  };
  step();
  await new Promise((r) => setTimeout(r, 700));
  switching.value = false;
}

onBeforeUnmount(() => {
  window.removeEventListener("unhandledrejection", onUnhandled);
  canvasRef.value?.removeEventListener("webglcontextlost", onLost);
  canvasRef.value?.removeEventListener("webglcontextrestored", onRestored);
  cancelAnimationFrame(raf);
  resizeObs?.disconnect();
  nexus?.dispose();
  labXray?.dispose();
  labWire?.dispose();
  legendsStars?.dispose();
  renderer?.dispose();
});

const NODE_LABEL: Record<string, string> = {
  supercar: "SUPERCAR WORLD",
  engineering: "ENGINEERING LAB",
  legends: "LEGENDS UNIVERSE",
  museum: "MUSEUM",
  earth: "EARTH",
  future: "FUTURE",
};
</script>

<template>
  <div class="av-root">
    <canvas ref="canvasRef" class="av-canvas" />
    <div ref="overlayRef" class="transition-overlay" />

    <aside v-if="fatal" class="fatal" role="alert">
      <strong>初始化失败</strong><code>{{ fatal }}</code>
    </aside>

    <!-- 顶部：品牌 + 探索进度 -->
    <header class="hud top">
      <div>
        <span class="av-kicker">EXPLORE THE WORLD OF AUTOMOTIVE CIVILIZATION</span>
        <h1 class="brand">AUTOVERSE</h1>
      </div>
      <div class="expl" role="status">
        <AvBadge kind="CONCEPT" />
        <span>探索进度 {{ explorationPct }}%</span>
      </div>
    </header>

    <!-- 3D 节点标签（NEXUS 内可见） -->
    <template v-if="currentSpace === 'nexus'">
      <button
        v-for="n in nodeScreens.filter((n) => n.visible)"
        :key="n.id"
        class="node-label"
        :style="{ transform: `translate(${n.x}px, ${n.y - 14}px) translateX(-50%)`, opacity: n.dist > 16 ? 0.4 : 1 }"
        @click="travel(n.id as SpaceId)"
      >
        {{ NODE_LABEL[n.id] ?? n.id }}
      </button>
    </template>

    <!-- SUPERCAR：材质预设 -->
    <div v-if="currentSpace === 'supercar'" class="hud matdock">
      <button
        v-for="mp in [{ id: 'paint', label: '车漆' }, ...matPresets.map((m) => ({ id: m.id, label: m.label }))]"
        :key="mp.id"
        class="dock-btn small"
        :class="{ active: matPreset === mp.id }"
        @click="chooseMaterial(mp.id as 'paint' | AutomotiveMaterialPreset)"
      >
        {{ mp.label }}
      </button>
    </div>

    <!-- ENGINEERING：交互面板（SIMULATED 标注） -->
    <div v-if="currentSpace === 'engineering'" class="hud engdock">
      <span class="sim-tag">SIMULATED / PROCEDURAL MODEL</span>
      <div class="eng-row">
        <span class="elabel">拆解</span>
        <input type="range" min="0" max="1" step="0.01" :value="explodeT" style="flex:1;accent-color:#22d3ee" aria-label="爆炸拆解" @input="setExplode(Number(($event.target as HTMLInputElement).value))" />
        <button class="dock-btn small" @click="setExplode(explodeT > 0.5 ? 0 : 1)">{{ explodeT > 0.5 ? "复原" : "爆炸" }}</button>
      </div>
      <div class="eng-row toggles">
        <button class="dock-btn small" :class="{ active: xrayOn }" @click="toggleXray(!xrayOn)">X-RAY</button>
        <button class="dock-btn small" :class="{ active: wireOn }" @click="toggleWire(!wireOn)">WIRE</button>
        <button class="dock-btn small" :class="{ active: spinning }" @click="spinning = !spinning">轮转</button>
      </div>
      <div style="pointer-events: auto">
        <AvPartsTree :parts="partTree" :selected-id="selectedPartId" @select="selectPart" />
      </div>
      <AvInspector v-if="inspectorRows.length" title="Component Inspector" :rows="inspectorRows" />
    </div>

    <!-- LEGENDS：知识链（DOM 层，数据 @atl/shared DomainGraph 同源） -->
    <div v-if="currentSpace === 'legends'" class="hud legenddock">
      <span class="sim-tag" style="border-color: rgba(167,139,250,0.4); background: rgba(167,139,250,0.1); color: #a78bfa;">LEGENDS UNIVERSE · 知识图谱</span>
      <KnowledgeChain />
    </div>

    <!-- 当前空间信息铭牌 -->
    <aside class="hud plaque">
      <AvBadge :kind="meta.layer === 'FICTION' ? 'FICTION' : meta.layer === 'FUTURE' ? 'CONCEPT' : 'REAL'" />
      <strong>{{ meta.label }}</strong>
      <span class="hint">{{ meta.hint }}</span>
    </aside>

    <!-- 底部空间导航 -->
    <nav class="hud dock" aria-label="空间导航">
      <button
        v-for="id in SPACE_IDS"
        :key="id"
        class="dock-btn"
        :class="{ active: currentSpace === id, disabled: id !== 'nexus' && !['supercar', 'engineering', 'legends'].includes(id) }"
        :disabled="switching"
        @click="travel(id)"
      >
        {{ SPACE_META[id].label.split(" ")[0] }}
        <em v-if="!['nexus', 'supercar', 'engineering', 'legends'].includes(id)">规划中</em>
      </button>
    </nav>

    <footer class="hud foot">
      <span>{{ perf.draws }} DRAWS</span>
      <span>{{ (perf.tris / 1000).toFixed(1) }}K TRIS</span>
      <span>GPU mem: NOT MEASURABLE</span>
    </footer>
  </div>
</template>

<style scoped>
.av-root { position: relative; height: 100vh; }
.transition-overlay { position: fixed; inset: 0; background: var(--av-bg-void, #05070d); opacity: 0; pointer-events: none; z-index: 5; }
.hud { position: absolute; z-index: 10; }
.top { top: 20px; left: 24px; right: 24px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; }
.brand { margin: 4px 0 0; font-size: 30px; font-weight: 700; letter-spacing: 0.06em; color: var(--av-text-primary, #f1f5f9); }
.expl { display: flex; align-items: center; gap: 10px; font-family: var(--av-font-mono, ui-monospace); font-size: 11px; color: var(--av-text-secondary, #94a3b8); }
.node-label {
  position: fixed; left: 0; top: 0; z-index: 12; appearance: none; cursor: pointer;
  padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(34, 211, 238, 0.5);
  background: rgba(10, 15, 26, 0.72); backdrop-filter: blur(12px);
  color: var(--av-text-primary, #f1f5f9); font-family: var(--av-font-mono, ui-monospace); font-size: 11px; letter-spacing: 0.08em;
  transition: border-color 160ms var(--av-ease-ui, cubic-bezier(0.22, 1, 0.36, 1));
}
.node-label:hover { border-color: var(--av-nexus-500, #22d3ee); box-shadow: 0 0 18px rgba(34, 211, 238, 0.3); }
.plaque {
  left: 50%; bottom: 84px; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 24px; border-radius: 16px; pointer-events: none;
  border: 1px solid rgba(148, 163, 184, 0.18); background: rgba(10, 15, 26, 0.72); backdrop-filter: blur(14px);
}
.plaque strong { font-family: var(--av-font-mono); font-size: 13px; }
.plaque .hint { font-size: 11px; color: var(--av-text-secondary, #94a3b8); }
.dock { bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
.dock-btn {
  appearance: none; padding: 8px 14px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.2); background: rgba(10, 15, 26, 0.72); backdrop-filter: blur(12px);
  color: var(--av-text-secondary, #94a3b8); font-size: 12px; display: flex; flex-direction: column; align-items: center; gap: 1px;
  transition: border-color 160ms var(--av-ease-ui, cubic-bezier(0.22, 1, 0.36, 1)), color 160ms var(--av-ease-ui, cubic-bezier(0.22, 1, 0.36, 1));
}
.dock-btn em { font-style: normal; font-size: 9px; color: var(--av-text-muted, #64748b); }
.dock-btn:hover:not(:disabled) { color: var(--av-text-primary, #f1f5f9); border-color: rgba(148, 163, 184, 0.4); }
.dock-btn.active { color: var(--av-nexus-500, #22d3ee); border-color: var(--av-nexus-500, #22d3ee); box-shadow: 0 0 20px rgba(34, 211, 238, 0.2); }
.dock-btn.disabled { opacity: 0.55; cursor: not-allowed; }
.dock-btn:focus-visible { outline: 2px solid var(--av-nexus-500, #22d3ee); outline-offset: 2px; }
.foot { bottom: 14px; right: 20px; display: flex; gap: 14px; font-family: var(--av-font-mono); font-size: 11px; color: var(--av-text-secondary, #94a3b8); pointer-events: none; }
.matdock { bottom: 84px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; max-width: 92vw; }
.dock-btn.small { padding: 6px 12px; font-size: 11px; }
.dock-btn.small.active { color: var(--av-nexus-500, #22d3ee); border-color: var(--av-nexus-500, #22d3ee); }
.engdock { bottom: 84px; left: 20px; width: 320px; display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 16px; border: 1px solid rgba(148,163,184,0.18); background: rgba(13,17,23,0.72); backdrop-filter: blur(14px); }
.eng-row { display: flex; align-items: center; gap: 8px; }
.toggles { flex-wrap: wrap; }
.elabel { font-family: var(--av-font-mono); font-size: 10px; color: var(--av-text-secondary, #94a3b8); }
.sim-tag {
  display: inline-block; align-self: flex-start; padding: 3px 10px; border-radius: 999px;
  border: 1px solid rgba(251,191,36,0.4); background: rgba(251,191,36,0.1);
  color: #fbbf24; font-family: var(--av-font-mono); font-size: 9px; letter-spacing: 0.12em;
}
.legenddock { bottom: 84px; left: 50%; transform: translateX(-50%); width: min(720px, 94vw); max-height: 62vh; overflow: auto; display: flex; flex-direction: column; gap: 8px; padding: 14px 18px; border-radius: 16px; border: 1px solid rgba(167,139,250,0.3); background: rgba(20,15,30,0.75); backdrop-filter: blur(14px); }
.legend-note { font-size: 12px; color: var(--av-text-secondary, #94a3b8); }
.fatal {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 50;
  display: flex; flex-direction: column; gap: 8px; max-width: 560px; padding: 20px 26px;
  border-radius: 16px; border: 1px solid rgba(248, 113, 113, 0.4); background: rgba(26, 10, 12, 0.88);
}
.fatal strong { color: #f87171; }
.fatal code { font-family: var(--av-font-mono); font-size: 12px; color: var(--av-text-secondary, #94a3b8); word-break: break-all; }
</style>
