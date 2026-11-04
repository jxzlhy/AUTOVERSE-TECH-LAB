/**
 * ENGINEERING UI 引擎侧控制器（PHASE 2D §5.3）
 * XRayController：透视外壳切换（材质级替换，可完整还原）。
 * SectionController：裁剪平面剖切（renderer.localClippingEnabled + material.clippingPlanes）。
 * 两者都遵循"保存原状 → 应用 → 完整还原"契约，供 UI Toggle 驱动。
 */
import * as THREE from "three";
import { makeXRayMaterial, type ShaderHandle } from "./shader-library";

export class XRayController {
  private saved = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private handle: ShaderHandle | null = null;

  /** 开启 X-Ray：记录并替换全部 Mesh 材质为共享透视材质 */
  apply(root: THREE.Object3D): void {
    if (!this.handle) this.handle = makeXRayMaterial(0x22d3ee, 0.32);
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && !this.saved.has(mesh)) {
        this.saved.set(mesh, mesh.material);
        mesh.material = this.handle!.material;
      }
    });
  }

  /** 关闭 X-Ray：还原被替换的材质（仅本控制器替换过的） */
  restore(root?: THREE.Object3D): void {
    if (root) {
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        const original = this.saved.get(mesh);
        if (original !== undefined) {
          mesh.material = original;
          this.saved.delete(mesh);
        }
      });
    } else {
      for (const mesh of [...this.saved.keys()]) {
        const original = this.saved.get(mesh)!;
        mesh.material = original;
        this.saved.delete(mesh);
      }
    }
  }

  get active(): boolean {
    return this.saved.size > 0;
  }

  dispose(): void {
    this.restore();
    this.handle?.dispose();
    this.handle = null;
  }
}

export interface SectionRange {
  min: number;
  max: number;
}

/** 沿世界 Z 轴滑动的剖切平面（PHASE 2D §5.3 Section Control） */
export class SectionController {
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  private meshes: THREE.Mesh[] = [];
  private savedSide = new Map<THREE.Mesh, THREE.Side>();
  private renderer: THREE.WebGLRenderer | null = null;
  private range: SectionRange = { min: -14, max: 14 };
  private active = false;

  /** 绑定目标组与渲染器（开启 localClipping；材质改双面以剖切后可见内壁） */
  attach(renderer: THREE.WebGLRenderer, root: THREE.Object3D, range?: SectionRange): void {
    if (range) this.range = range;
    this.renderer = renderer;
    this.renderer.localClippingEnabled = true;
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (this.meshes.includes(mesh)) continue;
        this.savedSide.set(mesh, mat.side);
        mat.side = THREE.DoubleSide;
        mat.clippingPlanes = [this.plane];
        mat.clipShadows = true;
      }
      this.meshes.push(mesh);
    });
    this.active = true;
  }

  /** t∈[0,1]：0=完全不剖切（平面退到 max 之外），1=最大剖切 */
  setProgress(t: number): void {
    const c = this.range.max + (this.range.min - this.range.max) * Math.min(Math.max(t, 0), 1);
    // normal(0,0,-1) 与常数 c：保留 z <= c 的部分
    this.plane.constant = c;
  }

  /** 解除剖切并还原材质侧面 */
  detach(root?: THREE.Object3D): void {
    for (const mesh of this.meshes) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        mat.clippingPlanes = null;
        const side = this.savedSide.get(mesh);
        if (side !== undefined) mat.side = side;
      }
    }
    this.meshes = [];
    this.savedSide.clear();
    this.active = false;
    if (this.renderer) this.renderer.localClippingEnabled = false;
    void root;
  }

  get isActive(): boolean {
    return this.active;
  }
}
