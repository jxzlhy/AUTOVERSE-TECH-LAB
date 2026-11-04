/**
 * PHASE 2C — 真实性能基准 harness（MASTER PLAN PART 4）
 *
 * 统一场景：A 单车 / B 多车实例化 / D 大量独立 Mesh / G 粒子系统 / H 后期处理 / J 长时间运行
 * 指标：FPS、平均/P95 帧耗时、draw calls、triangles、几何/材质/纹理计数、JS 内存（Chrome 专属，标注）
 * GPU 显存：浏览器 API 不可直接测量 —— 如实标记，不伪造。
 *
 * 用法：?scenario=A|B|D|G|H|J&duration=30&autostart=1
 * headless（SwiftShader 软渲染）结果不代表真实 GPU 性能（engineering-stack.md §5 结论）——
 * 真实结论请用日常浏览器打开本页执行并导出 JSON。
 */
import * as THREE from "three";
import { PAINT_PRESETS, colors } from "@atl/shared";

type ScenarioId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

interface BenchmarkResult {
  scenario: ScenarioId;
  durationSec: number;
  fpsAvg: number;
  frameTimeAvgMs: number;
  frameTimeP95Ms: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  sceneSwitchAvgMs: number | null;
  materials: number;
  textures: number;
  jsMemoryMB: number | null; // 仅 Chrome（performance.memory），其他浏览器 null
  gpuMemoryMB: "NOT_MEASURABLE"; // 浏览器无可靠 API，禁止伪造
  environment: {
    userAgent: string;
    dpr: number;
    viewport: string;
    renderer: string; // WEBGL_debug_renderer_info（可用时）
    timestamp: string;
    headlessSuspected: boolean; // SwiftShader/软件渲染嫌疑标记
  };
}

const params = new URLSearchParams(location.search);
const scenarioId = (params.get("scenario")?.toUpperCase() ?? "A") as ScenarioId;
const durationSec = Math.min(Number(params.get("duration") ?? 20), 600);
const autostart = params.get("autostart") === "1";

const canvas = document.getElementById("gl") as HTMLCanvasElement;
const ui = document.getElementById("ui")!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = false; // 基准默认关阴影（可开场景另行标注）
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(colors.bgVoid);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
camera.position.set(9, 4, 9);
camera.lookAt(0, 0.8, 0);

// 环境 IBL（与旗舰同规格：RoomEnvironment）
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  void import("three/examples/jsm/environments/RoomEnvironment.js").then(({ RoomEnvironment }) => {
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  });
}
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(5, 8, 3);
scene.add(key, new THREE.HemisphereLight(0xffffff, 0x0a0f1a, 0.15));

// ---------- 场景构建（统一车辆几何，跨场景一致） ----------
function makeGround(): THREE.Mesh {
  const g = new THREE.Mesh(
    new THREE.CircleGeometry(60, 48),
    new THREE.MeshStandardMaterial({ color: colors.bgDeep, roughness: 0.85, metalness: 0.1 }),
  );
  g.rotation.x = -Math.PI / 2;
  return g;
}

function buildCarGeometryParts(): { geo: THREE.BufferGeometry; mat: THREE.Material }[] {
  // 与 framework-comparison 同规格的简化车体（车身/座舱/轮）
  return [
    {
      geo: new THREE.BoxGeometry(4.4, 0.72, 1.9),
      mat: new THREE.MeshPhysicalMaterial({
        color: PAINT_PRESETS[0].color,
        metalness: 0.9,
        roughness: 0.35,
        clearcoat: 1,
      }),
    },
    {
      geo: new THREE.BoxGeometry(2.3, 0.58, 1.7),
      mat: new THREE.MeshStandardMaterial({ color: "#0B1220", roughness: 0.08, metalness: 0.1 }),
    },
    {
      geo: new THREE.CylinderGeometry(0.42, 0.42, 0.34, 24),
      mat: new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.95 }),
    },
  ];
}

let world: THREE.Group | null = null;
let bloomComposer: { render(): void; setSize(w: number, h: number): void } | null = null;
let particles: THREE.Points | null = null;
const multiScene = { enabled: false, phase: 0, switchMs: [] as number[] };

function clearWorld(): void {
  if (!world) return;
  world.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh || (o as THREE.Points).isPoints) {
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => x.dispose());
    }
  });
  scene.remove(world);
  world = null;
  bloomComposer = null;
  particles = null;
}

function addWorld(): THREE.Group {
  clearWorld();
  world = new THREE.Group();
  world.add(makeGround());
  scene.add(world);
  return world;
}

async function loadBloom(): Promise<void> {
  const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
  const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
  const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
  const { OutputPass } = await import("three/examples/jsm/postprocessing/OutputPass.js");
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(size, 0.5, 0.6, 0.85));
  composer.addPass(new OutputPass());
  bloomComposer = composer;
}

const builders: Record<ScenarioId, () => Promise<void> | void> = {
  // A 单车展示
  A: () => {
    const w = addWorld();
    const parts = buildCarGeometryParts();
    const car = new THREE.Group();
    const body = new THREE.Mesh(parts[0].geo, parts[0].mat);
    body.position.y = 0.78;
    const cabin = new THREE.Mesh(parts[1].geo, parts[1].mat);
    cabin.position.set(-0.25, 1.4, 0);
    car.add(body, cabin);
    for (const [x, z] of [
      [1.45, 0.95],
      [1.45, -0.95],
      [-1.45, 0.95],
      [-1.45, -0.95],
    ] as const) {
      const wheel = new THREE.Mesh(parts[2].geo, parts[2].mat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.42, z);
      car.add(wheel);
    }
    w.add(car);
  },
  // B 多车展示（InstancedMesh：6 部件 × 100 实例）
  B: () => {
    const w = addWorld();
    const COUNT = 100;
    const parts = buildCarGeometryParts();
    const mats = parts.map((p) => p.mat);
    const inst = parts.map((p) => new THREE.InstancedMesh(p.geo, p.mat, COUNT));
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < COUNT; i++) {
      const gx = ((i % 10) - 4.5) * 7;
      const gz = (Math.floor(i / 10) - 4.5) * 7;
      m4.makeTranslation(gx, 0, gz);
      inst[0].setMatrixAt(i, m4); // 车身
      const cab = m4.clone().multiply(new THREE.Matrix4().makeTranslation(-0.25, 1.4, 0));
      inst[1].setMatrixAt(i, cab);
      for (let k = 0; k < 4; k++) {
        const [wx, wz] = [
          [1.45, 0.95],
          [1.45, -0.95],
          [-1.45, 0.95],
          [-1.45, -0.95],
        ][k];
        const wm = m4.clone().multiply(new THREE.Matrix4().makeTranslation(wx, 0.42, wz));
        inst[2].setMatrixAt(i, wm);
      }
    }
    inst.forEach((im, i) => {
      im.instanceMatrix.needsUpdate = true;
      if (i === 1) im.position.y = 0; // 座舱随实例矩阵
      w.add(im);
    });
    void mats;
  },
  // D 大量独立 Mesh（600 draw calls 量级）
  D: () => {
    const w = addWorld();
    const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 24);
    const mat = new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.95 });
    for (let i = 0; i < 600; i++) {
      const m = new THREE.Mesh(geo, mat); // 共享 geometry+material，仅节点多
      m.position.set(((i % 25) - 12) * 2.2, 0.42, (Math.floor(i / 25) - 12) * 2.2);
      w.add(m);
    }
  },
  // G 粒子系统（100k 点）
  G: () => {
    const w = addWorld();
    const N = 100_000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0x22d3ee,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    w.add(particles);
  },
  // H 后期处理（单车 + Bloom）
  H: () => {
    builders.A();
    void loadBloom();
  },
  // C 高多边形模型（细分 96 段几何，~5.5 万三角形量级）
  C: () => {
    const w = addWorld();
    const hi = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.6, 0.5, 512, 96),
      new THREE.MeshPhysicalMaterial({
        color: PAINT_PRESETS[0].color,
        metalness: 0.9,
        roughness: 0.25,
        clearcoat: 1,
      }),
    );
    hi.position.y = 2.4;
    w.add(hi);
  },
  // E 大量材质（60 个独立材质 draw call）
  E: () => {
    const w = addWorld();
    const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    for (let i = 0; i < 60; i++) {
      const hue = i / 60;
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color().setHSL(hue, 0.6, 0.55),
          metalness: 0.6,
          roughness: 0.3,
          clearcoat: 0.5,
        }),
      );
      m.position.set(((i % 10) - 4.5) * 2.6, 0.8, (Math.floor(i / 10) - 2.5) * 2.6);
      w.add(m);
    }
  },
  // F 大纹理（2× 4096² 程序化画布纹理）
  F: () => {
    const w = addWorld();
    for (let k = 0; k < 2; k++) {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 4096;
      const ctx = cv.getContext("2d")!;
      for (let i = 0; i < 2400; i++) {
        ctx.fillStyle = `hsl(${Math.random() * 360},60%,${30 + Math.random() * 40}%)`;
        ctx.fillRect(Math.random() * 4096, Math.random() * 4096, 24, 24);
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 4;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 14),
        new THREE.MeshStandardMaterial({ map: tex }),
      );
      m.position.set(k * 16 - 8, 0.02 + k * 0.01, 0);
      m.rotation.x = -Math.PI / 2;
      w.add(m);
    }
  },
  // I 多场景切换（A/B 两组互切，记录切换耗时进 frame 序列间隙）
  I: () => {
    builders.A();
    // 切换由 run 循环按 2s 周期执行：A↔B 场景组重建 + 切换耗时计入 buildResult.sceneSwitchMs
    multiScene.enabled = true;
  },
  // J 长时间运行（同 A，duration 由参数控制，默认建议 ≥120）
  J: () => builders.A(),
};

// ---------- 指标采集 ----------
const frameTimes: number[] = [];
let last = performance.now();
let fpsFrames = 0;
let fpsWindowStart = 0;
let fpsSum = 0;
let fpsCount = 0;
let running = false;
let startedAt = 0;

function gpuRendererName(): string {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return "(unavailable)";
    return String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
  } catch {
    return "(unavailable)";
  }
}

function jsMemoryMB(): number | null {
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return mem ? Number((mem.usedJSHeapSize / 1048576).toFixed(1)) : null;
}

function isHeadlessSuspect(): boolean {
  const name = gpuRendererName().toLowerCase();
  return (
    name.includes("swiftshader") || name.includes("software") || name.includes("angle (software")
  );
}

function buildResult(): BenchmarkResult {
  const sorted = [...frameTimes].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const avg = frameTimes.length ? frameTimes.reduce((s, v) => s + v, 0) / frameTimes.length : 0;
  let mats = 0;
  world?.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh || (o as THREE.Points).isPoints) {
      const list = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats += list.length;
    }
  });
  return {
    scenario: scenarioId,
    durationSec,
    fpsAvg: fpsCount ? Math.round(fpsSum / fpsCount) : 0,
    frameTimeAvgMs: Number(avg.toFixed(2)),
    frameTimeP95Ms: Number(p95.toFixed(2)),
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    materials: mats,
    textures: renderer.info.memory.textures,
    jsMemoryMB: jsMemoryMB(),
    gpuMemoryMB: "NOT_MEASURABLE",
    sceneSwitchAvgMs: multiScene.switchMs.length
      ? Number(
          (multiScene.switchMs.reduce((a, b) => a + b, 0) / multiScene.switchMs.length).toFixed(2),
        )
      : null,
    environment: {
      userAgent: navigator.userAgent,
      dpr: devicePixelRatio,
      viewport: `${innerWidth}x${innerHeight}`,
      renderer: gpuRendererName(),
      timestamp: new Date().toISOString(),
      headlessSuspected: isHeadlessSuspect(),
    },
  };
}

function renderUI(line: string): void {
  ui.innerHTML = `<div style="position:absolute;top:16px;left:16px;white-space:pre;line-height:1.7">${line}</div>`;
}

async function run(): Promise<void> {
  await builders[scenarioId]?.();
  resize();
  running = true;
  startedAt = performance.now();
  fpsWindowStart = startedAt;
  requestAnimationFrame(tick);
}

function tick(now: number): void {
  if (!running) return;
  const dt = now - last;
  last = now;
  frameTimes.push(dt);
  fpsFrames++;
  if (now - fpsWindowStart >= 500) {
    fpsSum += (fpsFrames * 1000) / (now - fpsWindowStart);
    fpsCount++;
    fpsFrames = 0;
    fpsWindowStart = now;
  }
  if (particles) particles.rotation.y += 0.0004;
  if (bloomComposer) {
    bloomComposer.render();
  } else {
    renderer.render(scene, camera);
  }
  const elapsed = (now - startedAt) / 1000;
  // I 场景：每 2s 重建另一场景组（衡量销毁+重建切换耗时，CPU 侧）
  if (multiScene.enabled && elapsed - multiScene.phase * 2 >= 2) {
    multiScene.phase++;
    const t0 = performance.now();
    builders[multiScene.phase % 2 === 1 ? "B" : "A"]();
    resize();
    multiScene.switchMs.push(performance.now() - t0);
  }
  renderUI(
    `SCENARIO ${scenarioId} ｜ ${elapsed.toFixed(1)}s / ${durationSec}s\n` +
      `FPS(avg): ${fpsCount ? Math.round(fpsSum / fpsCount) : "—"} ｜ frame: ${dt.toFixed(1)}ms\n` +
      `draws: ${renderer.info.render.calls} ｜ tris: ${(renderer.info.render.triangles / 1000).toFixed(1)}K\n` +
      `GPU mem: NOT MEASURABLE（浏览器无可靠 API）`,
  );
  if (elapsed >= durationSec) {
    running = false;
    finish();
    return;
  }
  requestAnimationFrame(tick);
}

function finish(): void {
  const result = buildResult();
  const json = JSON.stringify(result, null, 2);
  renderUI(
    `RESULT ｜ scenario ${result.scenario}\n` +
      `fpsAvg=${result.fpsAvg} frameAvg=${result.frameTimeAvgMs}ms p95=${result.frameTimeP95Ms}ms\n` +
      `draws=${result.drawCalls} tris=${result.triangles} geo=${result.geometries}\n` +
      `headlessSuspected=${result.environment.headlessSuspected}\n` +
      `（JSON 已打印到控制台并触发下载）`,
  );
  console.info("ATL_BENCHMARK_RESULT", json);
  if (!params.has("no-download")) {
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `atl-benchmark-${scenarioId}-${Date.now()}.json`;
    a.click();
  }
}

function resize(): void {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  bloomComposer?.setSize(innerWidth, innerHeight);
}
addEventListener("resize", resize);

if (autostart) {
  void run();
} else {
  renderUI(
    `ATL Performance Benchmark\n` +
      `scenario=${scenarioId}（A/B/C/D/E/F/G/H/I/J）duration=${durationSec}s\n` +
      `添加 &autostart=1 开始；结果 JSON 自动下载。\n` +
      `⚠ headless/软件渲染结果不代表真实 GPU 性能，请用日常浏览器执行。`,
  );
  void builders[scenarioId]?.();
  resize();
}
