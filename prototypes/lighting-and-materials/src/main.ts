/** PART 5.5 三视觉方向对照原型（AUTOMOTIVE LUXURY / FUTURISTIC SPATIAL / EDITORIAL MUSEUM）
 * 同一程序化车辆，三种「布光 + 材质 + 底色 + 字重」方向；截图用于回写 design-system.md。
 * 用法：?dir=luxury|spatial|museum
 */
import * as THREE from "three";
import { colors } from "@atl/shared";
import { createAutomaterial, type AutomotiveMaterialPreset } from "@atl/three-runtime";

type Dir = "luxury" | "spatial" | "museum";
const params = new URLSearchParams(location.search);
const dir = (params.get("dir") ?? "luxury") as Dir;

interface DirectionSpec {
  label: string;
  bg: string;
  hemi: { intensity: number; sky: string; ground: string };
  key: { intensity: number; color: number; pos: [number, number, number] };
  rim: { intensity: number; color: number } | null;
  material: AutomotiveMaterialPreset | "plain-steel";
  bodyColor: string;
  groundColor: string;
}

const SPECS: Record<Dir, DirectionSpec> = {
  luxury: {
    label: "AUTOMOTIVE LUXURY",
    bg: "#0C0E12",
    hemi: { intensity: 0.22, sky: "#fff4e0", ground: "#0c0e12" },
    key: { intensity: 2.6, color: 0xfff0d8, pos: [6, 8, 4] },
    rim: null, // LUXURY：禁彩色 rim
    material: "metallic-paint",
    bodyColor: "#2A2C33",
    groundColor: "#101216",
  },
  spatial: {
    label: "FUTURISTIC SPATIAL",
    bg: colors.bgVoid,
    hemi: { intensity: 0.1, sky: "#9fd8ff", ground: "#05070d" },
    key: { intensity: 1.2, color: 0xbfe8ff, pos: [4, 7, 5] },
    rim: { intensity: 2.2, color: 0x22d3ee },
    material: "clearcoat-paint",
    bodyColor: "#1a2b33",
    groundColor: "#070b12",
  },
  museum: {
    label: "EDITORIAL MUSEUM",
    bg: "#151312",
    hemi: { intensity: 0.9, sky: "#fff8ef", ground: "#151312" },
    key: { intensity: 1.1, color: 0xfff6ea, pos: [3, 9, 6] },
    rim: null,
    material: "plain-steel",
    bodyColor: "#B8B2A6",
    groundColor: "#1a1715",
  },
};

const spec = SPECS[dir] ?? SPECS.luxury;

const canvas = document.getElementById("gl") as HTMLCanvasElement;
const ui = document.getElementById("ui")!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(spec.bg);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(6.5, 2.8, 7);
camera.lookAt(0, 0.8, 0);

// IBL（同旗舰规格）
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  void import("three/examples/jsm/environments/RoomEnvironment.js").then(({ RoomEnvironment }) => {
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = dir === "museum" ? 1.15 : 0.55;
  });
}

const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, spec.hemi.intensity);
hemi.color.set(spec.hemi.sky);
hemi.groundColor.set(spec.hemi.ground);
const key = new THREE.DirectionalLight(spec.key.color, spec.key.intensity);
key.position.set(...spec.key.pos);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(hemi, key);
if (spec.rim) {
  const rim = new THREE.DirectionalLight(spec.rim.color, spec.rim.intensity);
  rim.position.set(-6, 4, -5);
  scene.add(rim);
}

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(28, 64),
  new THREE.MeshStandardMaterial({ color: spec.groundColor, roughness: 0.9 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 车辆（复用材质预设库；MUSEUM 用哑光钢感）
const bodyMat =
  spec.material === "plain-steel"
    ? new THREE.MeshStandardMaterial({ color: spec.bodyColor, metalness: 0.25, roughness: 0.6 })
    : createAutomaterial(
        spec.material as AutomotiveMaterialPreset,
        Number(spec.bodyColor.replace("#", "0x")),
      );
const car = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 1.9), bodyMat);
body.position.y = 0.78;
body.castShadow = true;
const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(2.3, 0.58, 1.7),
  new THREE.MeshStandardMaterial({ color: "#0B1220", metalness: 0.1, roughness: 0.08 }),
);
cabin.position.set(-0.25, 1.4, 0);
cabin.castShadow = true;
car.add(body, cabin);
for (const [x, z] of [
  [1.45, 0.95],
  [1.45, -0.95],
  [-1.45, 0.95],
  [-1.45, -0.95],
] as const) {
  const w = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.34, 28),
    new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.95 }),
  );
  w.rotation.x = Math.PI / 2;
  w.position.set(x, 0.42, z);
  w.castShadow = true;
  car.add(w);
}
scene.add(car);

const accent =
  dir === "spatial" ? colors.nexus[500] : dir === "museum" ? colors.exhibit.real : "#D8C9A8";
const MATERIAL_LABEL: Record<string, string> = {
  "metallic-paint": "金属漆",
  "clearcoat-paint": "清漆珍珠",
  "plain-steel": "哑光钢（档案感）",
};
ui.innerHTML =
  `<div style="position:absolute;top:18px;left:20px">` +
  `<span style="font-size:10px;letter-spacing:.2em;color:#94A3B8">AUTOVERSE VISUAL DIRECTIONS</span><br>` +
  `<b style="font-size:15px;color:${accent}">${spec.label}</b><br>` +
  `<span style="font-size:11px;color:#64748B">dir=${dir} ｜ 材质：${MATERIAL_LABEL[spec.material]} ｜ rim: ${spec.rim ? "on" : "off（LUXURY/MUSEUM 规则）"}</span></div>` +
  `<div style="position:absolute;bottom:16px;left:20px;right:20px;display:flex;gap:8px;pointer-events:auto">` +
  ["luxury", "spatial", "museum"]
    .map(
      (d) =>
        `<button data-d="${d}" style="pointer-events:auto;padding:6px 14px;border-radius:999px;border:1px solid rgba(148,163,184,.28);background:rgba(10,15,26,.6);color:#F1F5F9;font:12px ui-monospace;cursor:pointer">${d.toUpperCase()}</button>`,
    )
    .join("") +
  `</div>`;
ui.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest("button[data-d]") as HTMLButtonElement | null;
  if (b) location.search = `?dir=${b.dataset.d}`;
});

function resize(): void {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  car.rotation.y += clock.getDelta() * 0.12;
  renderer.render(scene, camera);
});
