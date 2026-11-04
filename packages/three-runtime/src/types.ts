import type * as THREE from "three";

/** 场景运行状态机（SceneManager，PHASE 2A 两阶段激活） */
export type SceneState = "idle" | "preparing" | "switching" | "active";

/** 场景生命周期钩子上下文 */
export interface SceneContext {
  /** 场景根容器（SceneManager 持有），activate 时把 object3D 挂进来 */
  root: THREE.Group;
  /** 引擎统一步进时钟秒差（每帧调用 onFrame 时传入） */
  delta: number;
}

/** 可注册进 SceneManager 的场景描述 */
export interface RuntimeScene {
  id: string;
  object3D: THREE.Group;
  /** 进入场景（异步允许：加载资源）；抛错则激活失败回滚 */
  onEnter?: (ctx: SceneContext) => void | Promise<void>;
  /** 每帧回调（仅激活场景） */
  onFrame?: (ctx: SceneContext) => void;
  /** 退出场景（异步允许）；用于停动画/解绑事件 */
  onExit?: (ctx: SceneContext) => void | Promise<void>;
}

/** 灯光预设（LightingManager） */
export interface LightPreset {
  id: string;
  label: string;
  background: string;
  envIntensity: number;
  hemiIntensity: number;
  key: { intensity: number; color: string; position: [number, number, number] };
  rim: { intensity: number; color: string; position: [number, number, number] };
}

/** AssetManager 加载结果统计（真实解析计数，非估算） */
export interface GlbStats {
  meshes: number;
  materials: number;
  textures: number;
  triangles: number;
  animations: number;
}

export interface LoadedGlb {
  url: string;
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  stats: GlbStats;
}

/** PerformanceMonitor 快照 */
export interface PerfSnapshot {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
}

export type Unsubscribe = () => void;
