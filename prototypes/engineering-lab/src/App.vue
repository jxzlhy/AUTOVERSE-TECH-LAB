<script setup lang="ts">
/** PART 9.2 — Engineering Lab 独立体验页（:5179）
 * 零件树 / 部件高亮 / 爆炸拆解+装配 / X-Ray / Wireframe / 结构说明 / 机械动画（轮转）
 * 复用：three-runtime（XRay/Wireframe/Section）+ design-system（AvPartsTree/AvInspector/AvToggle）
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as THREE from "three";
import { colors } from "@atl/shared";
import { AvInspector, AvPartsTree, AvToggle, type PartNode } from "@atl/design-system";
import { SectionController, XRayController, makeWireframeHandle } from "@atl/three-runtime";
import { applyExplode, buildLabCar, spinWheels, type LabCar } from "./car";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const tree = ref<PartNode[]>([]);
const selectedId = ref<string | null>(null);
const explodeT = ref(0);
const xrayOn = ref(false);
const wireOn = ref(false);
const sectionOn = ref(false);
const sectionT = ref(0);
const spinning = ref(false);
const perf = ref({ fps: 0, draws: 0, tris: 0 });

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let car: LabCar;
let xray: XRayController;
let wire: ReturnType<typeof makeWireframeHandle>;
let section: SectionController;
let raf = 0;
let clock: THREE.Clock;
const proxy = { t: 0 };
const selectedPart = ref<{ id: string; desc: string; tris: string } | null>(null);

function rows(): { label: string; value: string; certainty?: "confirmed" | "estimated" | "unknown" }[] {
  if (!selectedId.value || !car) return [];
  const part = car.parts.get(selectedId.value)!;
  part.mesh.geometry.computeBoundingBox();
  const s = part.mesh.geometry.boundingBox?.getSize(new THREE.Vector3());
  const idx = part.mesh.geometry.getIndex();
  const pos = part.mesh.geometry.getAttribute("position");
  return [
    { label: "部件 ID", value: part.id, certainty: "confirmed" },
    { label: "三角面", value: String(Math.floor((idx ? idx.count : pos.count) / 3)), certainty: "confirmed" },
    { label: "尺寸", value: s ? `${s.x.toFixed(2)}×${s.y.toFixed(2)}×${s.z.toFixed(2)}` : "—", certainty: "estimated" },
  ];
}

function selectPart(id: string): void {
  selectedId.value = id;
  const part = car.parts.get(id);
  selectedPart.value = part
    ? { id: part.id, desc: part.desc, tris: "" }
    : null;
}

function setExplode(t: number): void {
  explodeT.value = t;
  proxy.t = t;
  applyExplode(car, t);
}

function toggleXray(v: boolean): void {
  xrayOn.value = v;
  if (v) xray.apply(car.root);
  else xray.restore(car.root);
}

function toggleWire(v: boolean): void {
  wireOn.value = v;
  wire.set(v);
}

function toggleSection(v: boolean): void {
  sectionOn.value = v;
  if (v) {
    section.attach(renderer, car.root, { min: -4, max: 3.5 });
    section.setProgress(sectionT.value);
  } else section.detach();
}

function onSectionSlide(v: number): void {
  sectionT.value = v;
  if (sectionOn.value) section.setProgress(v);
}

onMounted(() => {
  const canvas = canvasRef.value!;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.bgVoid);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(7, 3.4, 7);
  camera.lookAt(0, 0.8, 0);
  clock = new THREE.Clock();

  // 工程布光（LIGHTING PRESET ENGINEERING 同款灯组，无 IBL 依赖便于拆解观察）
  const hemi = new THREE.HemisphereLight(0xffffff, 0x0d1117, 0.85);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(0, 10, 2);
  scene.add(hemi, key);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(24, 48),
    new THREE.MeshStandardMaterial({ color: "#10161f", roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  car = buildLabCar();
  scene.add(car.root);
  xray = new XRayController();
  wire = makeWireframeHandle(car.root);
  section = new SectionController();

  tree.value = Array.from(car.parts.keys()).map((id) => ({
    id,
    label: car.parts.get(id)!.label,
    depth: id.startsWith("hub-") ? 1 : 0,
  }));
  selectPart("body");

  const resize = () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", resize);
  resize();

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.1);
    spinWheels(car, spinning.value, dt);
    renderer.render(scene, camera);
    perf.value = {
      fps: perf.value.fps,
      draws: renderer.info.render.calls,
      tris: renderer.info.render.triangles,
    };
  };
  loop();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  xray?.dispose();
  section?.detach();
  wire?.dispose();
});
</script>

<template>
  <div class="lab">
    <canvas ref="canvasRef" class="canvas" />

    <header class="hud head">
      <span class="kicker">ENGINEERING UNDERGROUND ｜ PART 9.2</span>
      <h1>机械工程地下实验室</h1>
    </header>

    <aside class="hud left">
      <div class="panel">
        <div class="ptitle">零件树 PARTS</div>
        <AvPartsTree :parts="tree" :selected-id="selectedId" style="pointer-events: auto" @select="selectPart" />
        <div class="toggles" style="pointer-events: auto">
          <AvToggle v-model="xrayOn" label="X-RAY" @update:model-value="toggleXray" />
          <AvToggle v-model="wireOn" label="WIRE" @update:model-value="toggleWire" />
          <AvToggle v-model="sectionOn" label="SECTION" @update:model-value="toggleSection" />
          <AvToggle v-model="spinning" label="轮转动画" accent="#F59E0B" />
        </div>
        <div v-if="sectionOn" style="pointer-events: auto; display: flex; align-items: center; gap: 8px">
          <span class="plabel">剖面</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="sectionT"
            style="flex: 1; accent-color: var(--av-nexus-500, #22d3ee)"
            aria-label="剖切进度"
            @input="onSectionSlide(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        <div style="pointer-events: auto; display: flex; align-items: center; gap: 8px">
          <span class="plabel">拆解</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="explodeT"
            style="flex: 1; accent-color: var(--av-nexus-500, #22d3ee)"
            aria-label="爆炸拆解"
            @input="setExplode(Number(($event.target as HTMLInputElement).value))"
          />
          <button class="asm" @click="setExplode(explodeT > 0.5 ? 0 : 1)">
            {{ explodeT > 0.5 ? "装配复原" : "爆炸拆解" }}
          </button>
        </div>
      </div>
    </aside>

    <aside v-if="selectedPart" class="hud right">
      <AvInspector title="Component Inspector" :rows="rows()" />
      <div class="desc">
        <b>结构说明</b>
        <p>{{ selectedPart.desc }}</p>
      </div>
    </aside>

    <footer class="hud foot stats">
      <span>{{ perf.draws }} DRAWS</span>
      <span>{{ (perf.tris / 1000).toFixed(1) }}K TRIS</span>
      <span>GPU mem: NOT MEASURABLE</span>
    </footer>
  </div>
</template>

<style scoped>
.lab { position: relative; height: 100vh; }
.canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; display: block; }
.hud { position: absolute; z-index: 10; color: var(--av-text-primary, #f1f5f9); }
.head { top: 18px; left: 20px; flex-direction: column; gap: 2px; pointer-events: none; }
.head h1 { margin: 2px 0 0; font-size: 16px; font-weight: 500; }
.kicker { font-size: 10px; letter-spacing: 0.18em; color: var(--av-text-secondary, #94a3b8); }
.left { left: 20px; bottom: 20px; width: 300px; }
.panel {
  display: flex; flex-direction: column; gap: 10px; padding: 14px;
  border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(13, 17, 23, 0.72); backdrop-filter: blur(14px);
}
.ptitle { font-family: ui-monospace, Menlo, monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--av-text-secondary, #94a3b8); }
.toggles { display: flex; gap: 12px; flex-wrap: wrap; }
.plabel { font-family: ui-monospace, Menlo, monospace; font-size: 10px; color: var(--av-text-secondary, #94a3b8); }
.asm {
  appearance: none; padding: 6px 10px; border-radius: 999px; white-space: nowrap;
  border: 1px solid rgba(148, 163, 184, 0.28); background: rgba(13, 17, 23, 0.6);
  color: var(--av-text-primary, #f1f5f9); font-size: 12px; cursor: pointer;
}
.right { right: 20px; top: 80px; width: 300px; display: flex; flex-direction: column; gap: 12px; }
.desc {
  padding: 12px 14px; border-radius: 12px; font-size: 12px; line-height: 1.7;
  border: 1px solid rgba(148, 163, 184, 0.18); background: rgba(13, 17, 23, 0.72);
  color: var(--av-text-secondary, #94a3b8);
}
.desc b { color: var(--av-text-primary, #f1f5f9); }
.desc p { margin: 6px 0 0; }
.foot { bottom: 14px; right: 20px; gap: 14px; font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--av-text-secondary, #94a3b8); pointer-events: none; }
</style>
