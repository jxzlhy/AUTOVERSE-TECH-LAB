/**
 * 三大空间场景构建（PHASE 3 第一批体验）
 * SUPERCAR WORLD：车型展示（材质预设/转台）
 * ENGINEERING LAB：机械交互（爆炸/X-Ray/Wireframe，SIMULATED 标注）
 * LEGENDS UNIVERSE：知识星域（DOM 层承载，3D 提供星场背景）
 * 全部复用 packages/three-runtime（严禁绕过）。
 */
import * as THREE from "three";
import { PAINT_PRESETS } from "@atl/shared";
import { makeWireframeHandle } from "@atl/three-runtime";

export interface CarPart {
  id: string;
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  axis: THREE.Vector3;
}

export interface LabCar {
  root: THREE.Group;
  parts: Map<string, CarPart>;
  wheels: THREE.Mesh[];
}

/** 结构说明（PART 9.2）——SIMULATED 视角下的部件科普 */
const PART_DESCRIPTIONS: Record<string, string> = {
  body: "承载式车身壳体：主要结构与外观件。真实拆解模型中会区分为前/中/后段与覆盖件。",
  cabin: "座舱/风挡总成：本示意以单玻璃舱代表内饰+玻璃，独立拆解模型应有座椅、仪表、风挡分件。",
};

export function buildLabCar(): LabCar {
  const root = new THREE.Group();
  const parts = new Map<string, CarPart>();
  const wheels: THREE.Mesh[] = [];
  const add = (id: string, mesh: THREE.Mesh, axis: [number, number, number]) => {
    mesh.name = id;
    parts.set(id, {
      id,
      mesh,
      base: mesh.position.clone(),
      axis: new THREE.Vector3(...axis).normalize(),
    });
    root.add(mesh);
  };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.72, 1.9),
    new THREE.MeshStandardMaterial({ color: "#8FA3B8", metalness: 0.7, roughness: 0.4 }),
  );
  body.position.set(0, 0.78, 0);
  add("body", body, [0, 1, 0]);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.58, 1.7),
    new THREE.MeshStandardMaterial({ color: "#0B1220", metalness: 0.1, roughness: 0.08 }),
  );
  cabin.position.set(-0.25, 1.4, 0);
  add("cabin", cabin, [0, 1, -0.35]);
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 28);
  const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.95 });
  const hubMat = new THREE.MeshStandardMaterial({
    color: "#33415C",
    metalness: 0.7,
    roughness: 0.4,
  });
  for (const [tag, x, z] of [
    ["FL", 1.45, 0.95],
    ["FR", 1.45, -0.95],
    ["RL", -1.45, 0.95],
    ["RR", -1.45, -0.95],
  ] as const) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.42, z);
    add(`wheel-${tag}`, wheel, [x, 0, z]);
    PART_DESCRIPTIONS[`wheel-${tag}`] =
      `车轮总成 ${tag}：轮胎+轮辋+制动盘。独立拆解模型中轮胎/轮辋/卡钳分件。`;
    wheels.push(wheel);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0.42, z);
    add(`hub-${tag}`, hub, [x, 0, z]);
    PART_DESCRIPTIONS[`hub-${tag}`] = `轮毂/轴承 ${tag}：旋转副演示件（机械动画目标）。`;
  }
  return { root, parts, wheels };
}

export function applyExplode(car: LabCar, t: number): void {
  for (const p of car.parts.values()) p.mesh.position.copy(p.base).addScaledVector(p.axis, t * 1.8);
}

/** SUPERCAR WORLD：展示车 + 材质预设应用 */
export interface ShowCar {
  root: THREE.Group;
  paint: THREE.MeshPhysicalMaterial;
}

export function buildShowCar(): ShowCar {
  const root = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: PAINT_PRESETS[0].color,
    metalness: 1.0,
    roughness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 1.9), paint);
  body.position.y = 0.78;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.58, 1.7),
    new THREE.MeshStandardMaterial({ color: "#0B1220", metalness: 0.1, roughness: 0.08 }),
  );
  cabin.position.set(-0.25, 1.4, 0);
  root.add(body, cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 28);
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.95 });
  for (const [x, z] of [
    [1.45, 0.95],
    [1.45, -0.95],
    [-1.45, 0.95],
    [-1.45, -0.95],
  ] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.42, z);
    root.add(w);
  }
  return { root, paint };
}

export function makeGround(color: string): THREE.Mesh {
  const g = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
  );
  g.rotation.x = -Math.PI / 2;
  return g;
}

/** LEGENDS 星域背景（DOM 知识层的 3D 氛围层） */
export function buildLegendsStars(): {
  group: THREE.Group;
  onFrame: (d: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const N = 1800;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = 16 * (0.4 + Math.random() * 0.6);
    const sn = Math.sqrt(1 - u * u);
    pos[i * 3] = r * sn * Math.cos(th);
    pos[i * 3 + 1] = r * u + 3;
    pos[i * 3 + 2] = r * sn * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xa78bfa,
    size: 0.08,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  group.add(stars);
  return {
    group,
    onFrame: (d: number) => (stars.rotation.y += d * 0.03),
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

export { makeWireframeHandle };

/** 部件结构说明（函数导出——跨模块可变对象直引在 rolldown 下有改名边界问题，F23） */
export function partDescription(id: string): string {
  return PART_DESCRIPTIONS[id] ?? "（该部件暂无结构说明）";
}
