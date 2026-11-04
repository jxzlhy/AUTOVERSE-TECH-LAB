/**
 * ResourceDisposer — 场景资源释放（PART 7）
 * 遍历 Object3D，释放 Geometry / Material / Texture，返回真实释放计数。
 * 不做估算：只统计实际调用过 dispose 的对象。
 */
import type * as THREE from "three";

export interface DisposalReport {
  geometries: number;
  materials: number;
  textures: number;
}

function disposeMaterialTextures(
  mat: THREE.Material,
  report: DisposalReport,
  seen: Set<unknown>,
): void {
  const record = (tex: unknown) => {
    if (tex && typeof tex === "object" && "dispose" in tex && !seen.has(tex)) {
      seen.add(tex);
      (tex as { dispose(): void }).dispose();
      report.textures++;
    }
  };
  // 遍历材质上的纹理槽位（map/normalMap/... 与环境相关字段）
  for (const value of Object.values(mat)) record(value);
}

export function disposeObject3D(root: THREE.Object3D): DisposalReport {
  const report: DisposalReport = { geometries: 0, materials: 0, textures: 0 };
  const seenGeo = new Set<unknown>();
  const seenMat = new Set<unknown>();
  const seenTex = new Set<unknown>();

  root.traverse((obj) => {
    // SkinnedMesh：骨骼纹理是 GPU 资源，随蒙皮网格释放（PHASE 2A §2.4）
    const skinned = obj as THREE.SkinnedMesh;
    if (
      skinned.isSkinnedMesh &&
      skinned.skeleton?.boneTexture &&
      !seenTex.has(skinned.skeleton.boneTexture)
    ) {
      seenTex.add(skinned.skeleton.boneTexture);
      skinned.skeleton.boneTexture.dispose();
      report.textures++;
    }
    // InstancedMesh：instanceMatrix/instanceColor 是独立 GPU 缓冲
    const instanced = obj as THREE.InstancedMesh;
    if (instanced.isInstancedMesh && !seenGeo.has(instanced)) {
      seenGeo.add(instanced);
      instanced.dispose();
      report.geometries++;
    }
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh && !(obj as THREE.Line).isLine && !(obj as THREE.Points).isPoints) return;

    if (mesh.geometry && !seenGeo.has(mesh.geometry)) {
      seenGeo.add(mesh.geometry);
      mesh.geometry.dispose();
      report.geometries++;
    }
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    for (const mat of mats) {
      if (!mat || seenMat.has(mat)) continue;
      seenMat.add(mat);
      for (const value of Object.values(mat)) {
        if (value && typeof value === "object" && "dispose" in value && !seenTex.has(value)) {
          seenTex.add(value);
          (value as { dispose(): void }).dispose();
          report.textures++;
        }
      }
      mat.dispose();
      report.materials++;
    }
  });

  return report;
}

export { disposeMaterialTextures };

/**
 * ResourceLedger — 跨场景共享资源的引用计数账本（PHASE 2A §2.4）。
 * 场景 A/B 共用同一材质/纹理时，由账本决定真正的 dispose 时机，
 * 避免"释放一个对象误伤仍在使用的资源"。约定：谁共享，谁 acquire。
 */
export class ResourceLedger {
  private refCounts = new Map<object, number>();
  private disposed = new Set<object>();

  acquire(resource: object, n = 1): void {
    this.refCounts.set(resource, (this.refCounts.get(resource) ?? 0) + n);
  }

  /** 引用归零时执行 dispose；重复 release 超出计数为调用方 bug，抛错暴露。 */
  release(resource: { dispose?(): void }, n = 1): void {
    const cur = this.refCounts.get(resource);
    if (cur === undefined || cur < n) {
      throw new Error(`ResourceLedger: release without matching acquire (${cur} < ${n})`);
    }
    const next = cur - n;
    this.refCounts.set(resource, next);
    if (next === 0 && !this.disposed.has(resource)) {
      this.disposed.add(resource);
      resource.dispose?.();
    }
  }

  count(resource: object): number {
    return this.refCounts.get(resource) ?? 0;
  }
}

/** RenderTarget 释放（含深度/纹理附件，见 seen 防重） */
export function disposeRenderTarget(rt: { dispose(): void } | null | undefined): boolean {
  if (!rt) return false;
  rt.dispose();
  return true;
}

/**
 * 事件监听器追踪器：注册即记账，disposeAll 一次性反注册。
 * 用于 App 生命周期审计（PHASE 2A §2.6：所有注册资源必须有对应清理）。
 */
export function createListenerTracker(): {
  on: (
    t: EventTarget,
    type: string,
    fn: EventListenerOrEventListenerObject,
    opts?: AddEventListenerOptions,
  ) => void;
  disposeAll: () => void;
  size: () => number;
} {
  const entries: Array<
    [EventTarget, string, EventListenerOrEventListenerObject, AddEventListenerOptions?]
  > = [];
  return {
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      entries.push([target, type, fn, opts]);
    },
    disposeAll() {
      for (const [t, type, fn, opts] of entries) t.removeEventListener(type, fn, opts);
      entries.length = 0;
    },
    size: () => entries.length,
  };
}
