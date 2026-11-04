/**
 * AssetManager — GLB/glTF 加载、去重缓存、进度与真实解析统计（PART 7 / §8）
 * 缓存内核 AssetRegistry 与 three 解耦，可独立单测。
 */
import type * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GlbStats, LoadedGlb } from "./types";

/** 泛型去重缓存：同 key 并发请求共享同一次加载；失败不缓存（允许重试）。 */
export class AssetRegistry<T> {
  private cache = new Map<string, T>();
  private inflight = new Map<string, Promise<T>>();

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  load(key: string, loader: (key: string) => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached !== undefined) return Promise.resolve(cached);
    const pending = this.inflight.get(key);
    if (pending) return pending;

    const p = loader(key)
      .then((value) => {
        this.cache.set(key, value);
        this.inflight.delete(key);
        return value;
      })
      .catch((err) => {
        this.inflight.delete(key); // 失败不缓存，允许重试
        throw err;
      });
    this.inflight.set(key, p);
    return p;
  }

  /** 逻辑移除（不负责释放 three 资源，调用方先用 ResourceDisposer） */
  evict(key: string): boolean {
    return this.cache.delete(key);
  }

  get size(): number {
    return this.cache.size;
  }
}

/** 从已解析的 glTF 场景统计真实资源数（非估算） */
export function computeGlbStats(gltf: GLTF): GlbStats {
  const textures = new Set<unknown>();
  const materials = new Set<unknown>();
  let meshes = 0;
  let triangles = 0;

  gltf.scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes++;
    const pos = mesh.geometry.getAttribute("position");
    triangles += pos ? Math.floor(pos.count / 3) : 0;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      materials.add(mat);
      for (const value of Object.values(mat)) {
        if (value && typeof value === "object" && "isTexture" in value) textures.add(value);
      }
    }
  });

  return {
    meshes,
    materials: materials.size,
    textures: textures.size,
    triangles,
    animations: gltf.animations.length,
  };
}

export class AssetManager {
  readonly registry = new AssetRegistry<LoadedGlb>();
  private loader: GLTFLoader;

  constructor(opts: { dracoDecoderPath?: string } = {}) {
    this.loader = new GLTFLoader();
    if (opts.dracoDecoderPath) {
      // Draco 解码器异步挂载（解码器文件较大，不在构造期阻塞）
      void import("three/examples/jsm/loaders/DRACOLoader.js").then(({ DRACOLoader }) => {
        const d = new DRACOLoader();
        d.setDecoderPath(opts.dracoDecoderPath!);
        this.loader.setDRACOLoader(d);
      });
    }
  }

  /** 加载 GLB（带去重缓存与统计）。onProgress 回调 0..1（浏览器可提供时）。 */
  loadGLB(url: string, onProgress?: (ratio: number) => void): Promise<LoadedGlb> {
    return this.registry.load(url, () => this.loadOnce(url, onProgress));
  }

  private loadOnce(url: string, onProgress?: (ratio: number) => void): Promise<LoadedGlb> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          gltf.scene.updateMatrixWorld(true);
          const stats = computeGlbStats(gltf);
          resolve({ url, scene: gltf.scene, animations: gltf.animations, stats });
        },
        (evt) => {
          if (onProgress && evt.total > 0) onProgress(evt.loaded / evt.total);
        },
        (err) => reject(err instanceof Error ? err : new Error(String(err))),
      );
    });
  }

  /** 释放某个已加载 GLB 的 three 资源并移出缓存 */
  disposeGLB(url: string, dispose: (loaded: LoadedGlb) => void): boolean {
    const loaded = this.registry.get(url);
    if (!loaded) return false;
    dispose(loaded);
    return this.registry.evict(url);
  }
}
