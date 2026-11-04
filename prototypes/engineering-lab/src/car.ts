/** Engineering Lab 载具：程序化部件车（与旗舰同规格）+ 每部件结构说明（PART 9.2 结构说明） */
import * as THREE from "three";

export interface LabPart {
  id: string;
  label: string;
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  axis: THREE.Vector3;
  desc: string;
}

export interface LabCar {
  root: THREE.Group;
  parts: Map<string, LabPart>;
  wheels: THREE.Mesh[];
}

export function buildLabCar(): LabCar {
  const root = new THREE.Group();
  const parts = new Map<string, LabPart>();
  const wheels: THREE.Mesh[] = [];

  const add = (
    id: string,
    label: string,
    mesh: THREE.Mesh,
    axis: [number, number, number],
    desc: string,
  ) => {
    mesh.name = id;
    parts.set(id, {
      id,
      label,
      mesh,
      base: mesh.position.clone(),
      axis: new THREE.Vector3(...axis).normalize(),
      desc,
    });
    root.add(mesh);
  };

  const bodyMat = new THREE.MeshStandardMaterial({
    color: "#8FA3B8",
    metalness: 0.7,
    roughness: 0.4,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 1.9), bodyMat);
  body.position.set(0, 0.78, 0);
  add(
    "body",
    "车身壳体",
    body,
    [0, 1, 0],
    "承载式车身壳体：主要结构与外观件。真实拆解模型中此处会区分为前/中/后段与覆盖件。",
  );

  const cabinMat = new THREE.MeshStandardMaterial({
    color: "#0B1220",
    metalness: 0.1,
    roughness: 0.08,
  });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.58, 1.7), cabinMat);
  cabin.position.set(-0.25, 1.4, 0);
  add(
    "cabin",
    "座舱玻璃舱",
    cabin,
    [0, 1, -0.35],
    "座舱/风挡总成：本示意以单玻璃舱代表内饰+玻璃，独立拆解模型应有座椅、仪表、风挡分件。",
  );

  const wheelMat = new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.95 });
  const hubMat = new THREE.MeshStandardMaterial({
    color: "#33415C",
    metalness: 0.7,
    roughness: 0.4,
  });
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 28);
  const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 16);
  for (const [tag, x, z] of [
    ["FL", 1.45, 0.95],
    ["FR", 1.45, -0.95],
    ["RL", -1.45, 0.95],
    ["RR", -1.45, -0.95],
  ] as const) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.42, z);
    add(
      `wheel-${tag}`,
      `车轮 ${tag}`,
      wheel,
      [x, 0, z],
      `车轮总成 ${tag}：轮胎+轮辋+制动盘。独立拆解模型中轮胎/轮辋/卡钳分件。`,
    );
    wheels.push(wheel);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0.42, z);
    add(
      `hub-${tag}`,
      `轮毂 ${tag}`,
      hub,
      [x, 0, z],
      `轮毂/轴承 ${tag}：旋转副演示件（机械动画目标）。`,
    );
  }

  return { root, parts, wheels };
}

/** 机械动画：车轮自转（Motion Control 最小实现） */
export function spinWheels(car: LabCar, spinning: boolean, dt: number): void {
  if (!spinning) return;
  for (const w of car.wheels) w.rotation.z += dt * 6;
}

export function applyExplode(car: LabCar, t: number): void {
  for (const p of car.parts.values()) p.mesh.position.copy(p.base).addScaledVector(p.axis, t * 1.8);
}
