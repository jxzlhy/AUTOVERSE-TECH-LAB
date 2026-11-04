/**
 * SceneManager — 场景注册/两阶段激活/帧驱动（PART 7 + PHASE 2A §2.1）
 *
 * 两阶段激活（防白屏）：
 *   Phase 1 prepare：在**不移除当前场景**的前提下执行目标场景 onEnter（资源加载/构建）。
 *     → 失败：清理半成品目标，保持当前场景可用，向上抛错。
 *   Phase 2 commit：目标就绪后才退出并移除旧场景（可选择物理释放）。
 *
 * 附加保护：
 *   - generation 计数：cancelPending()/新激活后，陈旧异步 onEnter 的提交会被回滚。
 *   - 并发 activate：非 idle/active 状态直接抛错（调用方 UI 层负责禁用入口）。
 */
import type * as THREE from "three";
import { disposeObject3D } from "./ResourceDisposer";
import type { RuntimeScene, SceneState } from "./types";

export class SceneManager {
  private scenes = new Map<string, RuntimeScene>();
  private currentId: string | null = null;
  private state: SceneState = "idle";
  private delta = 0;
  private generation = 0;

  constructor(private root: THREE.Group) {}

  get activeId(): string | null {
    return this.currentId;
  }

  get currentState(): SceneState {
    return this.state;
  }

  register(scene: RuntimeScene): void {
    if (this.scenes.has(scene.id)) throw new Error(`scene already registered: ${scene.id}`);
    this.scenes.set(scene.id, scene);
  }

  has(id: string): boolean {
    return this.scenes.has(id);
  }

  /**
   * 两阶段激活。disposeCurrent：commit 后是否物理释放旧场景资源。
   * 目标 onEnter 失败 → 抛错且当前场景保持不动（不白屏）。
   */
  async activate(id: string, opts: { disposeCurrent?: boolean } = {}): Promise<void> {
    if (this.state !== "idle" && this.state !== "active") {
      throw new Error(`cannot activate while ${this.state}`);
    }
    const next = this.scenes.get(id);
    if (!next) throw new Error(`scene not registered: ${id}`);
    if (next.id === this.currentId) return;

    const gen = ++this.generation;

    // ---- Phase 1: prepare（当前场景保持展示）----
    this.state = "preparing";
    try {
      await next.onEnter?.({ root: next.object3D, delta: this.delta });
    } catch (err) {
      // 失败：丢弃半成品目标（退出钩子 + 移除 + 释放），当前场景原样保留
      this.root.remove(next.object3D);
      try {
        await next.onExit?.({ root: next.object3D, delta: this.delta });
      } catch {
        /* 清理失败不掩盖原始错误 */
      }
      if (gen === this.generation) this.state = this.currentId ? "active" : "idle";
      throw err;
    }
    if (gen !== this.generation) {
      // 已被 cancelPending()/更新的流程取代：回滚本次 prepare 的可见部分
      this.root.remove(next.object3D);
      await Promise.resolve(next.onExit?.({ root: next.object3D, delta: this.delta })).catch(() => {});
      return;
    }

    // ---- Phase 2: commit（目标就绪，切换可见性）----
    this.root.add(next.object3D);
    this.state = "switching";
    if (this.currentId && this.currentId !== id) {
      const prev = this.scenes.get(this.currentId);
      if (prev) {
        this.root.remove(prev.object3D);
        await prev.onExit?.({ root: prev.object3D, delta: this.delta });
        if (opts.disposeCurrent) disposeObject3D(prev.object3D);
      }
    }
    this.currentId = id;
    this.state = "active";
  }

  /** 取消进行中的 prepare/switch（陈旧异步提交会被 generation 保护拦截） */
  cancelPending(): void {
    this.generation++;
    if (this.state === "preparing" || this.state === "switching") {
      this.state = this.currentId ? "active" : "idle";
    }
  }

  /** 每帧由外层循环驱动；仅当前激活场景收到 onFrame。 */
  update(delta: number): void {
    this.delta = delta;
    if (this.state !== "active" || !this.currentId) return;
    const scene = this.scenes.get(this.currentId);
    scene?.onFrame?.({ root: scene.object3D, delta });
  }
}
