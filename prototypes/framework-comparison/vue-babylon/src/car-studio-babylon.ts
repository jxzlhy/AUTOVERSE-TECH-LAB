/**
 * AUTOVERSE TECH LAB — 摄影棚基线场景（Babylon.js 命令式内核）
 *
 * 规格约束（三条技术路线一致，见 framework-comparison/README.md）：
 * 程序化车辆（无外部资产）/ 灯光组（Babylon 无内置 RoomEnvironment 等价物，
 * 故用引擎原生灯光组而非 IBL——该差异本身作为选型发现记录）/
 * 单方向光阴影 / 转台自转 / 轨道相机 / 3 组车漆预设 / FPS + draw calls + triangles 指标。
 * 3D 内核不依赖任何 UI 框架。
 */
import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  PBRMaterial,
  RawCubeTexture,
  Scene,
  SceneInstrumentation,
  ShadowGenerator,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

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
  const engine = new Engine(canvas, true, { stencil: false });
  const scene = new Scene(engine);
  scene.clearColor = Color3.FromHexString("#05070D").toColor4(1);

  // 程序化 IBL：RawCubeTexture 六面渐变（天顶亮、天底暗）。
  // Babylon 的 PBR metallic 材质没有环境反射源时呈纯黑（实测发现，见
  // framework-comparison/README），故必须提供环境贴图；用引擎原生
  // RawCubeTexture 保持零外部资产约束。
  const skyRGB = Color3.FromHexString("#9FC7E8");
  const voidRGB = Color4.FromHexString("#05070DFF");
  const faceSize = 16;
  const makeFace = (mode: "side" | "top" | "bottom"): Uint8Array => {
    const d = new Uint8Array(faceSize * faceSize * 4);
    for (let y = 0; y < faceSize; y++) {
      for (let x = 0; x < faceSize; x++) {
        const i = (y * faceSize + x) * 4;
        let r: number, g: number, b: number;
        if (mode === "top") {
          [r, g, b] = [skyRGB.r * 255, skyRGB.g * 255, skyRGB.b * 255];
        } else if (mode === "bottom") {
          [r, g, b] = [voidRGB.r * 255, voidRGB.g * 255, voidRGB.b * 255];
        } else {
          const t = y / (faceSize - 1); // 0=上（天）→ 1=下（地）
          const e = t * t; // 二次曲线，压暗下半球
          r = (skyRGB.r + (voidRGB.r - skyRGB.r) * e) * 255;
          g = (skyRGB.g + (voidRGB.g - skyRGB.g) * e) * 255;
          b = (skyRGB.b + (voidRGB.b - skyRGB.b) * e) * 255;
        }
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 255;
      }
    }
    return d;
  };
  // 面顺序：+X, -X, +Y, -Y, +Z, -Z
  const env = new RawCubeTexture(
    scene,
    [
      makeFace("side"),
      makeFace("side"),
      makeFace("top"),
      makeFace("bottom"),
      makeFace("side"),
      makeFace("side"),
    ],
    faceSize,
  );
  scene.environmentTexture = env;
  scene.environmentIntensity = 1.0;

  // 相机：与 three 路线等效机位（radius≈8.95, beta≈1.37, alpha≈π/4）
  const camera = new ArcRotateCamera("cam", Math.PI / 4, 1.37, 8.95, new Vector3(0, 0.8, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 3.5;
  camera.upperRadiusLimit = 18;
  camera.upperBetaLimit = Math.PI / 2 - 0.02;
  camera.wheelDeltaPercentage = 0.01;

  // 灯光组：半球环境 + 主光（投影）+ 青色轮廓光
  const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.45;
  hemi.skyColor = Color3.FromHexString("#9FC7E8");
  hemi.groundColor = Color3.FromHexString("#0A0F1A");

  const key = new DirectionalLight("key", new Vector3(-5, -8, -3), scene);
  key.position = new Vector3(5, 8, 3);
  key.intensity = 2.4;
  const shadows = new ShadowGenerator(2048, key);
  shadows.usePercentageCloserFiltering = true;

  const rim = new DirectionalLight("rim", new Vector3(6, -4, 5), scene);
  rim.position = new Vector3(-6, 4, -5);
  rim.intensity = 0.6;
  rim.diffuse = Color3.FromHexString("#22D3EE");

  // 地面
  const ground = MeshBuilder.CreateGround("ground", { width: 60, height: 60 }, scene);
  const groundMat = new PBRMaterial("groundMat");
  groundMat.albedoColor = Color3.FromHexString("#0A0F1A");
  groundMat.metallic = 0.1;
  groundMat.roughness = 0.85;
  ground.material = groundMat;
  ground.receiveShadows = true;

  // 车辆：程序化几何，转台组
  const turntable = new TransformNode("turntable", scene);

  const paint = new PBRMaterial("paint");
  paint.albedoColor = Color3.FromHexString(PAINT_PRESETS[0].color);
  paint.metallic = 0.9;
  paint.roughness = 0.35;
  paint.clearCoat.isEnabled = true;
  paint.clearCoat.roughness = 0.06;

  const glass = new PBRMaterial("glass");
  glass.albedoColor = Color3.FromHexString("#0B1220");
  glass.metallic = 0.1;
  glass.roughness = 0.08;
  glass.alpha = 0.72;

  const rubber = new PBRMaterial("rubber");
  rubber.albedoColor = Color3.FromHexString("#111318");
  rubber.metallic = 0;
  rubber.roughness = 0.95;

  const trim = new PBRMaterial("trim");
  trim.albedoColor = Color3.FromHexString("#0F172A");
  trim.metallic = 0.6;
  trim.roughness = 0.5;

  const body = MeshBuilder.CreateBox("body", { width: 4.4, height: 0.72, depth: 1.9 }, scene);
  body.position.y = 0.78;
  body.material = paint;
  body.parent = turntable;

  const cabin = MeshBuilder.CreateBox("cabin", { width: 2.3, height: 0.58, depth: 1.7 }, scene);
  cabin.position.set(-0.25, 1.4, 0);
  cabin.material = glass;
  cabin.parent = turntable;

  for (const [x, z] of [
    [1.45, 0.95],
    [1.45, -0.95],
    [-1.45, 0.95],
    [-1.45, -0.95],
  ]) {
    const wheel = MeshBuilder.CreateCylinder(
      `wheel-${x}-${z}`,
      { diameter: 0.84, height: 0.34, tessellation: 32 },
      scene,
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.42, z);
    wheel.material = rubber;
    wheel.parent = turntable;

    const hub = MeshBuilder.CreateCylinder(
      `hub-${x}-${z}`,
      { diameter: 0.36, height: 0.36, tessellation: 16 },
      scene,
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.copyFrom(wheel.position);
    hub.material = trim;
    hub.parent = turntable;
  }

  body.receiveShadows = true;
  cabin.receiveShadows = true;

  // 转台自转
  scene.onBeforeRenderObservable.add(() => {
    turntable.rotation.y += (engine.getDeltaTime() / 1000) * 0.25;
  });

  // 指标（0.5s 聚合）
  const instrumentation = new SceneInstrumentation(scene);
  instrumentation.captureFrameTime = false;

  let last = performance.now();
  const reportStats = () => {
    const now = performance.now();
    if (now - last < 500) return;
    const fps = engine.getFps();
    let triangles = 0;
    const active = scene.getActiveMeshes();
    for (let i = 0; i < active.length; i++) triangles += active.data[i].getTotalIndices() / 3;
    onStats({
      fps: Math.round(fps),
      drawCalls: instrumentation.drawCallsCounter.current,
      triangles: Math.round(triangles),
    });
    last = now;
  };

  engine.runRenderLoop(() => {
    scene.render();
    reportStats(); // 渲染后采集，draw calls 才是本帧真实值
  });

  const onResize = () => engine.resize();
  window.addEventListener("resize", onResize);

  return {
    setPaint(hex) {
      paint.albedoColor = Color3.FromHexString(hex);
    },
    dispose() {
      window.removeEventListener("resize", onResize);
      instrumentation.dispose();
      scene.dispose();
      env.dispose();
      engine.dispose();
    },
  };
}
