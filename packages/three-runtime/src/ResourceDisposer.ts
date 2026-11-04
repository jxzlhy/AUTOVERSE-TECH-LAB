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
