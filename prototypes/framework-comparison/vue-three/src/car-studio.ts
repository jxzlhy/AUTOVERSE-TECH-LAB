/**
 * AUTOVERSE TECH LAB — 摄影棚基线场景（Three.js 命令式内核）
 *
 * 规格约束（三条技术路线一致，见 framework-comparison/README.md）：
 * 程序化车辆（无外部资产）/ IBL 环境光照 / 单方向光阴影 / 转台自转 /
 * 轨道相机 / 3 组车漆预设 / FPS + draw calls + triangles 实时指标。
 * 3D 内核不依赖任何 UI 框架——与宿主框架只通过 createCarStudio 返回的接口通信。
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** 设计系统语义色（docs/04-design-system §2.1 展品类型语义色） */
export const PAINT_PRESETS = [
  { id: "nexus", label: "NEXUS", color: "#22D3EE" },
  { id: "real", label: "REAL", color: "#F59E0B" },
  { id: "fiction", label: "FICTION", color: "#A78BFA" },
  { id: "concept", label: "CONCEPT", color: "#34D399" },
] as const;

export interface StudioStats {
  fps: number;
  drawCalls: number;
  triangles: number;
}

export interface CarStudio {
  setPaint: (hex: string) => void;
  dispose: () => void;
}

export function createCarStudio(
  canvas: HTMLCanvasElement,
  onStats: (s: StudioStats) => void,
): CarStudio {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#05070D");

  // IBL：RoomEnvironment → PMREM（官方内置环境，无外部资产）
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(6.2, 2.6, 6.2);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.8, 0);
  controls.enableDamping = true;
  controls.minDistance = 3.5;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;

  // 灯光：IBL 为主 + 单方向光投影
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(5, 8, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x22d3ee, 0.6);
  rim.position.set(-6, 4, -5);
  scene.add(rim);

  // 地面
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: "#0A0F1A", roughness: 0.85, metalness: 0.1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 车辆：程序化几何（车身/座舱/四轮），转台组
  const turntable = new THREE.Group();
  scene.add(turntable);

  const paint = new THREE.MeshPhysicalMaterial({
    color: PAINT_PRESETS[0].color,
    metalness: 0.9,
    roughness: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });
  const trim = new THREE.MeshStandardMaterial({ color: "#0F172A", roughness: 0.5, metalness: 0.6 });
  const rubber = new THREE.MeshStandardMaterial({
    color: "#111318",
    roughness: 0.95,
    metalness: 0,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#0B1220",
    metalness: 0.1,
    roughness: 0.08,
    transparent: true,
    opacity: 0.72,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 1.9), paint);
  body.position.y = 0.78;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.58, 1.7), glass);
  cabin.position.set(-0.25, 1.4, 0);
  turntable.add(body, cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 32);
  for (const [x, z] of [
    [1.45, 0.95],
    [1.45, -0.95],
    [-1.45, 0.95],
    [-1.45, -0.95],
  ]) {
    const wheel = new THREE.Mesh(wheelGeo, rubber);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.42, z);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.36, 16), trim);
    hub.rotation.x = Math.PI / 2;
    hub.position.copy(wheel.position);
    turntable.add(wheel, hub);
  }
  turntable.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  // 主循环 + 指标（0.5s 聚合上报）
  let raf = 0;
  let frames = 0;
  let last = performance.now();
  const clock = new THREE.Clock();

  const tick = () => {
    raf = requestAnimationFrame(tick);
    const dt = clock.getDelta();
    turntable.rotation.y += dt * 0.25; // 转台自转
    controls.update();
    renderer.render(scene, camera);

    frames++;
    const now = performance.now();
    if (now - last >= 500) {
      onStats({
        fps: Math.round((frames * 1000) / (now - last)),
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
      });
      frames = 0;
      last = now;
    }
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);
  tick();

  return {
    setPaint(hex) {
      paint.color.set(hex);
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mt) => mt.dispose());
        }
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
