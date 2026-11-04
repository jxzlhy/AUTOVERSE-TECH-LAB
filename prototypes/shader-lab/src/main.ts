/**
 * Shader Lab — 全十 Shader 独立 Demo 页（PHASE 2E §6.1）
 * 每个 Shader：可选 Demo + 参数滑杆 + 适用场景/性能说明。
 * 材质来自 @atl/three-runtime/shader-library（单一实现来源）。
 */
import * as THREE from "three";
import { colors } from "@atl/shared";
import {
  makeXRayMaterial,
  makeDissolveMaterial,
  makeScanMaterial,
  makeFresnelMaterial,
  makeDigitalGridMaterial,
  makeEnergyFlowMaterial,
  makeHeatmapMaterial,
  makeOutlineMaterial,
} from "@atl/three-runtime";
import type { ShaderHandle } from "@atl/three-runtime";

type Entry = {
  id: string;
  label: string;
  usage: string;
  perf: string;
  param?: { label: string; apply: (t: number) => void; init: number };
  build: () =>
    ShaderHandle | { material: THREE.Material; tick: (t: number) => void; dispose: () => void };
};

const entries: Entry[] = [
  {
    id: "hologram",
    label: "Hologram",
    usage: "全息展台/能量核心（Fresnel+扫描线）",
    perf: "1×pow+1×sin，可忽略",
    build: () => {
      const h = makeXRayMaterial(0x22d3ee, 0.85); // 近似全息：XRay 高不透明 + 外部 time
      return h;
    },
  },
  {
    id: "xray",
    label: "X-Ray",
    usage: "外壳透视/工程检视",
    perf: "1×pow，可忽略",
    param: { label: "不透明度", apply: () => {}, init: 0.32 },
    build: () => makeXRayMaterial(0x22d3ee, 0.32),
  },
  {
    id: "dissolve",
    label: "Dissolve",
    usage: "消融转场/销毁效果",
    perf: "程序化噪声（无纹理采样），低",
    param: { label: "消融进度", apply: (t) => currentDissolve?.setProgress(t), init: 0.3 },
    build: () => {
      currentDissolve = makeDissolveMaterial(0x22d3ee);
      return currentDissolve;
    },
  },
  {
    id: "scan",
    label: "Scan",
    usage: "工程扫描带/检视层",
    perf: "1×sin，可忽略",
    build: () => makeScanMaterial(0x22d3ee, 8),
  },
  {
    id: "fresnel",
    label: "Fresnel",
    usage: "边缘光/轮廓强化",
    perf: "1×pow，可忽略",
    param: {
      label: "边缘锐度",
      apply: (t) => {
        if (currentFresnel)
          (currentFresnel.material as THREE.ShaderMaterial).uniforms.uPower.value = 0.8 + t * 4;
      },
      init: 0.4,
    },
    build: () => {
      currentFresnel = makeFresnelMaterial(0x67e8f9, 0.8 + 0.4 * 4);
      return currentFresnel;
    },
  },
  {
    id: "wireframe",
    label: "Wireframe",
    usage: "结构视图/工程模式",
    perf: "标准材质线框，可忽略",
    build: () => {
      const m = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      });
      return { material: m, tick: () => {}, dispose: () => m.dispose() };
    },
  },
  {
    id: "grid",
    label: "Digital Grid",
    usage: "能量空间地面/全息台面（需 uv）",
    perf: "2×fract，可忽略",
    build: () => makeDigitalGridMaterial(0x22d3ee, 20),
  },
  {
    id: "flow",
    label: "Energy Flow",
    usage: "传送门/能量管道流动条纹（需 uv）",
    perf: "1×sin，可忽略",
    build: () => makeEnergyFlowMaterial(0x22d3ee, 1.2),
  },
  {
    id: "outline",
    label: "Outline",
    usage: "选中态外描边（背面外扩壳）",
    perf: "一次额外几何重绘",
    build: () => {
      const o = makeOutlineMaterial(0xf59e0b, 0.04);
      outlineMesh = new THREE.Mesh(knotGeo, o.material);
      outlineMesh.scale.setScalar(1 + o.thickness);
      return { material: o.material, tick: () => {}, dispose: () => o.dispose() };
    },
  },
  {
    id: "heatmap",
    label: "Heatmap",
    usage: "工程分析（高度/负载映射）",
    perf: "3×mix，可忽略",
    param: { label: "热输入", apply: (t) => currentHeat?.setInput(t), init: 0.5 },
    build: () => {
      currentHeat = makeHeatmapMaterial();
      currentHeat.setInput(0.5);
      return currentHeat;
    },
  },
];

let currentDissolve: ReturnType<typeof makeDissolveMaterial> | null = null;
let currentFresnel: ReturnType<typeof makeFresnelMaterial> | null = null;
let currentHeat: ReturnType<typeof makeHeatmapMaterial> | null = null;
let outlineMesh: THREE.Mesh | null = null;

// ---------- 场景 ----------
const canvas = document.getElementById("gl") as HTMLCanvasElement;
const ui = document.getElementById("ui")!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(colors.bgVoid);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 1.4, 6);
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  void import("three/examples/jsm/environments/RoomEnvironment.js").then(({ RoomEnvironment }) => {
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  });
}
const knotGeo = new THREE.TorusKnotGeometry(1.5, 0.48, 220, 36);
const knot: THREE.Mesh = new THREE.Mesh(
  knotGeo,
  new THREE.MeshStandardMaterial({ color: 0x22d3ee }),
);
knot.position.y = 1.2;
scene.add(knot);
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(20, 48),
  new THREE.MeshStandardMaterial({ color: colors.bgDeep, roughness: 0.9 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ---------- 选择与参数 ----------
let active: Entry | null = null;
let handle: { material: THREE.Material; tick: (t: number) => void; dispose: () => void } | null =
  null;
let paramValue = 0;

function select(entry: Entry): void {
  handle?.dispose();
  outlineMesh?.removeFromParent();
  active = entry;
  paramValue = entry.param?.init ?? 0;
  handle = entry.build() as {
    material: THREE.Material;
    tick: (t: number) => void;
    dispose: () => void;
  };
  knot.material = handle.material;
  entry.param?.apply(paramValue);
  if (outlineMesh) scene.add(outlineMesh);
  renderUI();
}

function renderUI(): void {
  const chips = entries
    .map(
      (e) =>
        `<button data-id="${e.id}" style="pointer-events:auto;margin:3px;padding:5px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.28);background:${e === active ? "rgba(34,211,238,.22)" : "rgba(10,15,26,.55)"};color:#F1F5F9;font:12px ui-monospace;cursor:pointer">${e.label}</button>`,
    )
    .join("");
  ui.innerHTML =
    `<div style="position:absolute;top:14px;left:16px;right:16px">${chips}</div>` +
    `<div style="position:absolute;bottom:16px;left:16px;max-width:520px;line-height:1.7">` +
    (active
      ? `<b style="color:#22D3EE">${active.label}</b><br>场景：${active.usage}<br>性能：${active.perf}` +
        (active.param
          ? `<br><label style="pointer-events:auto">${active.param.label} <input id="p" type="range" min="0" max="1" step="0.01" value="${paramValue}" style="width:220px;vertical-align:middle"></label>`
          : "")
      : "选择一个 Shader") +
    `</div>`;
  const slider = document.getElementById("p") as HTMLInputElement | null;
  slider?.addEventListener("input", () => {
    paramValue = Number(slider.value);
    active?.param?.apply(paramValue);
  });
}

ui.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("button[data-id]") as HTMLButtonElement | null;
  if (!btn) return;
  const entry = entries.find((x) => x.id === btn.dataset.id);
  if (entry) select(entry);
});

// ---------- 循环 ----------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  knot.rotation.y = t * 0.4;
  knot.rotation.x = Math.sin(t * 0.5) * 0.25;
  handle?.tick(t);
  renderer.render(scene, camera);
});

function resize(): void {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();
select(entries[0]);
