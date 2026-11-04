/**
 * 程序化车辆（含命名部件与爆炸拆解轴）——用于零件交互验证（DL-004：
 * ToyCar 仅 3 mesh，部件级交互由本模型承担；ToyCar 承担真实 GLB 管线验证）。
 */
import * as THREE from "three";
import { PAINT_PRESETS } from "@atl/shared";

export interface CarPart {
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  axis: THREE.Vector3; // 单位爆炸方向
}

export interface ProceduralCar {
  root: THREE.Group;
  parts: Map<string, CarPart>;
  paint: THREE.MeshPhysicalMaterial;
}

export function paintColorOf(id: string): string {
  return PAINT_PRESETS.find((p) => p.id === id)?.color ?? PAINT_PRESETS[0].color;
}

export function buildProceduralCar(): ProceduralCar {
  const root = new THREE.Group();
  const parts = new Map<string, CarPart>();

  const paint = new THREE.MeshPhysicalMaterial({
    color: PAINT_PRESETS[0].color,
    metalness: 0.9,
    roughness: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#0B1220",
    metalness: 0.1,
    roughness: 0.08,
    transparent: true,
    opacity: 0.72,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.95 });
  const trim = new THREE.MeshStandardMaterial({ color: "#0F172A", roughness: 0.5, metalness: 0.6 });

  const add = (name: string, mesh: THREE.Mesh, axis: [number, number, number]) => {
    mesh.name = name;
    mesh.castShadow = true;
    parts.set(name, {
      mesh,
      base: mesh.position.clone(),
      axis: new THREE.Vector3(...axis).normalize(),
    });
    root.add(mesh);
  };

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 1.9), paint);
  body.position.set(0, 0.78, 0);
  add("body", body, [0, 1, 0]);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.58, 1.7), glass);
  cabin.position.set(-0.25, 1.4, 0);
  add("cabin-glass", cabin, [0, 1, -0.35]);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 32);
  const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 16);
  for (const [tag, x, z] of [
    ["FL", 1.45, 0.95],
    ["FR", 1.45, -0.95],
    ["RL", -1.45, 0.95],
    ["RR", -1.45, -0.95],
  ] as const) {
    const wheel = new THREE.Mesh(wheelGeo, rubber);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.42, z);
    add(`wheel-${tag}`, wheel, [x, 0, z]);
    const hub = new THREE.Mesh(hubGeo, trim);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0.42, z);
    add(`hub-${tag}`, hub, [x, 0, z]);
  }

  return { root, parts, paint };
}

/** 纯函数：按系数 t∈[0,1] 应用爆炸位移（可直接由滑杆/GSAP 驱动） */
export function applyExplode(car: ProceduralCar, t: number): void {
  for (const { mesh, base, axis } of car.parts.values()) {
    mesh.position.copy(base).addScaledVector(axis, t * 1.6);
  }
}
