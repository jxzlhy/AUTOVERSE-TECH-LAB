/**
 * SceneManager — 场景注册/激活/退出/帧驱动（PART 7）
 * 状态机：idle → activating → active ⇄ deactivating。
 * activate 支持异步 onEnter（资源加载）；失败回滚到 idle 并抛出。
 */
import type * as THREE from "three";
import { disposeObject3D } from "./ResourceDisposer";
import type { RuntimeScene, SceneState } from "./types";

export class SceneManager {
  private scenes = new Map<string, RuntimeScene>();
  private currentId: string | null = null;
  private state: SceneState = "idle";
  private delta = 0;

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

  /** 激活场景（自动退出当前）。disposeCurrent：退出后是否物理释放当前场景资源。 */
  async activate(id: string, opts: { disposeCurrent?: boolean } = {}): Promise<void> {
    if (this.state !== "idle" && this.state !== "active") {
      throw new Error(`cannot activate while ${this.state}`);
    }
    const next = this.scenes.get(id);
    if (!next) throw new Error(`scene not registered: ${id}`);
    if (next.id === this.currentId) return;

    this.state = "deactivating";
    if (this.currentId) {
      const prev = this.scenes.get(this.currentId);
      if (prev) {
        await prev.onExit?.({ root: prev.object3D, delta: this.delta });
        this.root.remove(prev.object3D);
        if (opts.disposeCurrent) disposeObject3D(prev.object3D);
      }
    }

    this.state = "activating";
    try {
      await next.onEnter?.({ root: next.object3D, delta: this.delta });
      this.root.add(next.object3D);
      this.currentId = next.id;
      this.state = "active";
    } catch (err) {
      this.state = "idle";
      this.currentId = null;
      throw err;
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
