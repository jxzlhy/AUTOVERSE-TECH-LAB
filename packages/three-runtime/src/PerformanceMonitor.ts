/**
 * PerformanceMonitor — FPS / 帧耗时 / draw calls / triangles（PART 7）
 * sample() 由外层每帧调用；FPS 用时间窗聚合（默认 500ms），支持订阅。
 * 不估算显存（浏览器拿不到真实数据，见 MASTER PLAN PART 7 禁令）。
 */
import type { PerfSnapshot, Unsubscribe } from "./types";

export class PerformanceMonitor {
  private frames = 0;
  private windowStart = 0;
  private lastSample = 0;
  private snapshot: PerfSnapshot = { fps: 0, frameTimeMs: 0, drawCalls: 0, triangles: 0 };
  private listeners = new Set<(s: PerfSnapshot) => void>();

  constructor(
    private getInfo: () => { render: { calls: number; triangles: number } },
    private windowMs = 500,
  ) {}

  onSnapshot(cb: (s: PerfSnapshot) => void): Unsubscribe {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** 每帧调用；nowMs 来自 performance.now()（可注入以便测试）。窗口满则发快照。 */
  sample(nowMs: number): void {
    if (this.frames === 0) this.windowStart = nowMs;
    const frameTime = this.lastSample ? nowMs - this.lastSample : 0;
    this.lastSample = nowMs;
    this.frames++;

    if (nowMs - this.windowStart >= this.windowMs) {
      const fps = Math.round((this.frames * 1000) / (nowMs - this.windowStart));
      const info = this.getInfo().render;
      this.snapshot = {
        fps,
        frameTimeMs: Number(frameTime.toFixed(2)),
        drawCalls: info.calls,
        triangles: info.triangles,
      };
      this.frames = 0;
      for (const cb of this.listeners) cb(this.snapshot);
    }
  }

  get current(): PerfSnapshot {
    return this.snapshot;
  }
}
