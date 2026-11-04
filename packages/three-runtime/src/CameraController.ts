/**
 * CameraController — 轨道相机 + 取景/预设机位（PART 7）
 * frameObject 使用 Box3 包围盒做取景（纯数学，可单测）。
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type CameraViewPreset = "front" | "three-quarter" | "side" | "top";

/** 由包围盒推导"框住目标"的相机距离与目标点（纯函数，供单测） */
export function framingForBox(
  box: THREE.Box3,
  opts: { fovDeg: number; padding?: number; aspect?: number },
): { distance: number; target: THREE.Vector3 } {
  const padding = opts.padding ?? 1.25;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) / 2 || 1;
  const fovRad = (opts.fovDeg * Math.PI) / 180;
  // 水平 FOV 随 aspect 变化，取垂直/水平较紧者
  const aspect = opts.aspect ?? 16 / 9;
  const hFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
  const distance = (radius * padding) / Math.sin(Math.min(fovRad, hFovRad) / 2);
  return { distance, target: center };
}

export class CameraController {
  readonly controls: OrbitControls;

  constructor(
    readonly camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
  ) {
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
  }

  /** 框住目标物体（保持当前方位角，调整距离与目标点） */
  frameObject(object: THREE.Object3D, opts: { padding?: number } = {}): void {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const { distance, target } = framingForBox(box, {
      fovDeg: this.camera.fov,
      padding: opts.padding,
      aspect: this.camera.aspect,
    });
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    if (dir.lengthSq() < 1e-6) dir.set(1, 0.5, 1).normalize();
    this.controls.target.copy(target);
    this.camera.position.copy(target).addScaledVector(dir, distance);
    this.controls.update();
  }

  /** 标准机位（相对当前目标点半径） */
  setViewPreset(preset: CameraViewPreset): void {
    const target = this.controls.target.clone();
    const r = this.camera.position.distanceTo(target) || 8;
    const dirs: Record<CameraViewPreset, [number, number, number]> = {
      front: [0, 0.35, 1],
      "three-quarter": [0.75, 0.4, 0.75],
      side: [1, 0.3, 0],
      top: [0.001, 1, 0.001],
    };
    const [x, y, z] = dirs[preset];
    this.camera.position.copy(target).addScaledVector(new THREE.Vector3(x, y, z).normalize(), r);
    this.controls.update();
  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
