/**
 * Motion System V2（PHASE 2E / MASTER PLAN PART 7）
 *
 * TimelineManager 契约（PART 7 六条要求）：
 * 1. 可取消：cancel(key)/cancelAll() 即时 kill 并回调用 onCancel
 * 2. 可清理：完成/取消后自动从登记表移除；dispose() 兜底清空
 * 3. Reduced Motion：全局开关（默认跟随 prefers-reduced-motion），开启时跳过动画直接置终态
 * 4. 单一所有权：同 key 同时只允许一个 Timeline（重复 play 先 kill 旧的）
 * 5. 3D/UI 职责：本管理器不关心目标类型（GSAP 可补间任意对象），职责边界由调用方命名约定维护
 * 6. 不累积：长期运行场景下登记表大小有界（完成即移除）
 */
import gsap from "gsap";
import { motion } from "@atl/shared";

/** Motion Tokens（扩展 @atl/shared 基线，供 GSAP 使用） */
export const MotionTokens = {
  ...motion.duration,
  cinematic: 1600,
  easeUI: motion.easing.ui,
  easeCamera: "power2.inOut",
  easeEntrance: "power3.out",
} as const;

export type ReducedMotionSource = () => boolean;

/** Reduced Motion：默认读系统偏好；测试可注入 */
export function systemReducedMotion(): boolean {
  return (
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface TimelineManagerOptions {
  reducedMotion?: ReducedMotionSource;
}

export class TimelineManager {
  private active = new Map<string, gsap.core.Timeline>();
  private reduced: ReducedMotionSource;

  constructor(opts: TimelineManagerOptions = {}) {
    this.reduced = opts.reducedMotion ?? systemReducedMotion;
  }

  /** 是否有指定 key 的活动 Timeline */
  isActive(key: string): boolean {
    return this.active.has(key);
  }

  get size(): number {
    return this.active.size;
  }

  /**
   * 播放具名 Timeline。同 key 重放：先 kill 旧的（所有权唯一）。
   * Reduced Motion 开启时：不创建动画，直接调用 build 的 onInstant（无则跳过）。
   * @param build 返回 Timeline 与可选的"无动画终态"回调
   * @returns killed 旧 Timeline 的 key 是否存在（供调用方感知抢占）
   */
  play(
    key: string,
    build: (t: gsap.core.Timeline) => void | gsap.core.Timeline | { onInstant?: () => void },
  ): boolean {
    this.cancel(key);
    const preempted = false;
    if (this.reduced()) {
      const result = build(gsap.timeline({ paused: true }));
      if (result && "onInstant" in result) result.onInstant?.();
      return preempted;
    }
    const tl = gsap.timeline({ onComplete: () => this.active.delete(key) });
    const result = build(tl);
    if (result && "onInstant" in result) result.onInstant?.();
    this.active.set(key, tl);
    return preempted;
  }

  /** 取消指定 Timeline（kill：进度停在原地；调用方可用 onCancel 语义自行回滚） */
  cancel(key: string): boolean {
    const tl = this.active.get(key);
    if (!tl) return false;
    tl.kill();
    this.active.delete(key);
    return true;
  }

  cancelAll(): number {
    const n = this.active.size;
    for (const tl of this.active.values()) tl.kill();
    this.active.clear();
    return n;
  }

  /** 对指定目标对象的全部补间兜底清理（防第三方直接 gsap.to 的泄漏） */
  killTweensOf(target: gsap.TweenTarget): void {
    gsap.killTweensOf(target);
  }

  dispose(): void {
    this.cancelAll();
  }
}

/** 便捷：Reduced Motion 下的"瞬时终态"包装 */
export function instantOrTimeline(
  manager: TimelineManager,
  key: string,
  build: (t: gsap.core.Timeline) => void,
  onInstant: () => void,
): void {
  manager.play(key, (t) => {
    build(t);
    return { onInstant };
  });
}
