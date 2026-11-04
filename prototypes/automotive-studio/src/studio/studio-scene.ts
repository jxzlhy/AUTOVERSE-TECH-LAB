/**
 * 摄影棚场景（Scene A）：程序化车辆（零件交互/拆解）+ ToyCar GLB（真实资产验证）
 * + 转台 + 灯光预设挂接点。
 */
import * as THREE from "three";
import type { LoadedGlb } from "@atl/three-runtime";
import { buildProceduralCar, paintColorOf, type ProceduralCar } from "./procedural-car";
import toyCarUrl from "virtual:toycar-glb";

export interface StudioRefs {
  group: THREE.Group;
  car: ProceduralCar;
  turntable: THREE.Group;
  glb: LoadedGlb | null;
  glbGroup: THREE.Group | null;
  setPaint: (hex: string) => void;
}

export function buildStudioScene(paintId: string): StudioRefs {
  const group = new THREE.Group();

  // 地面
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: "#0A0F1A", roughness: 0.85, metalness: 0.1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // 程序化车辆（10 部件，支持拾取/拆解）
  const car = buildProceduralCar();
  car.paint.color.set(paintColorOf(paintId));
  const turntable = new THREE.Group();
  turntable.add(car.root);
  turntable.position.set(0, 0, 0);
  group.add(turntable);

  return {
    group,
    car,
    turntable,
    glb: null,
    glbGroup: null,
    setPaint: (hex: string) => car.paint.color.set(hex),
  };
}

/** 真实 GLB 挂载（AssetManager 已加载后调用）；缩放到与程序化车相当并放到邻位 */
export function attachGlb(refs: StudioRefs, loaded: LoadedGlb): void {
  loaded.scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(loaded.scene);
  const size = box.getSize(new THREE.Vector3());
  const scale = 4.4 / Math.max(size.x, size.z);
  const wrapper = new THREE.Group();
  wrapper.add(loaded.scene);
  wrapper.scale.setScalar(scale);
  // 底面贴地，放在程序化车旁
  wrapper.position.set(0, -box.min.y * scale + 0.001, 0);
  wrapper.position.x = 6.5;
  refs.group.add(wrapper);
  refs.glb = loaded;
  refs.glbGroup = wrapper;
}

export const TOYCAR_URL = toyCarUrl;
