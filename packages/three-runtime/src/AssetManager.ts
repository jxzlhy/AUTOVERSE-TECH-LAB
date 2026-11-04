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

/** 从已解析的 glTF 场景统计真实资源数（逐项解析确认，非估算） */
export function computeGlbStats(gltf: GLTF): GlbStats {
  const textures = new Set<unknown>();
  const materials = new Set<unknown>();
  let meshes = 0;
  let triangles = 0;

  gltf.scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes++;
    // 三角面数：索引几何必须按 index.count（PHASE 2A §2.3 修复：
    // position.count/3 对索引几何是错误值——ToyCar 实测偏差 4 倍以上）
    const pos = mesh.geometry.getAttribute("position");
    const index = mesh.geometry.getIndex();
    triangles += Math.floor((index ? index.count : pos ? pos.count : 0) / 3);
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

export interface AssetManagerOptions {
  /** Draco 解码器目录（public 下的静态路径）；配置后加载前会等待解码器就绪 */
  dracoDecoderPath?: string;
  /** KTX2 纹理支持：需要 renderer 做 detectSupport（PHASE 2A §2.2） */
  ktx2?: { renderer: THREE.WebGLRenderer; transcoderPath: string };
  /** Meshopt 压缩支持（three 内置 meshopt_decoder 模块） */
  meshopt?: boolean;
}

export class AssetManager {
  readonly registry = new AssetRegistry<LoadedGlb>();
  private loader: GLTFLoader;
  private decoderReady: Promise<void>;

  constructor(opts: AssetManagerOptions = {}) {
    this.loader = new GLTFLoader();
    // 解码器初始化统一串行化：loadGLB 必须等待本 Promise（PHASE 2A §2.2，
    // 修复"模型在解码器未就绪时开始加载"的竞态——旧实现为漂浮 async import）
    const steps: Promise<void>[] = [];
    if (opts.dracoDecoderPath) {
      steps.push(
        import("three/examples/jsm/loaders/DRACOLoader.js").then(({ DRACOLoader }) => {
          const d = new DRACOLoader();
          d.setDecoderPath(opts.dracoDecoderPath!);
          this.loader.setDRACOLoader(d);
        }),
      );
    }
    if (opts.ktx2) {
      const { renderer, transcoderPath } = opts.ktx2;
      steps.push(
        import("three/examples/jsm/loaders/KTX2Loader.js").then(({ KTX2Loader }) => {
          const k = new KTX2Loader();
          k.setTranscoderPath(transcoderPath);
          k.detectSupport(renderer); // 同步方法：基于 renderer 能力判定
          this.loader.setKTX2Loader(k);
        }),
      );
    }
    if (opts.meshopt) {
      steps.push(
        import("three/examples/jsm/libs/meshopt_decoder.module.js").then(({ MeshoptDecoder }) => {
          this.loader.setMeshoptDecoder(MeshoptDecoder);
        }),
      );
    }
    this.decoderReady = Promise.all(steps).then(() => undefined);
    // 解码器初始化失败不阻断非压缩资产：记录并在 load 时降级
    this.decoderReady = this.decoderReady.catch((err) => {
      console.error("[AssetManager] decoder init failed, compressed assets will fail:", err);
    });
  }

  /** 加载 GLB（先等待解码器就绪，再走去重缓存）。onProgress 回调 0..1。 */
  loadGLB(url: string, onProgress?: (ratio: number) => void): Promise<LoadedGlb> {
    return this.decoderReady.then(() =>
      this.registry.load(url, () => this.loadOnce(url, onProgress)),
    );
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
