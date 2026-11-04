// 本文件在无 jsdom 环境（离线）下自动跳过 DOM 用例——CI 全量执行
import { describe, expect, it, vi } from "vitest";
import { TimelineManager, MotionTokens, createScrollNarrative } from "./index";

describe("TimelineManager（PHASE 2E PART 7）", () => {
  it("同 key 重放抢占旧 Timeline（单一所有权）", () => {
    const m = new TimelineManager({ reducedMotion: () => false });
    const obj = { x: 0 };
    m.play("move", (t) => t.to(obj, { x: 10, duration: 1 }));
    const first = m.isActive("move");
    m.play("move", (t) => t.to(obj, { x: 20, duration: 1 }));
    expect(first).toBe(true);
    expect(m.size).toBe(1); // 旧的被 kill 并移除
  });

  it("cancel 即时 kill 并移除登记", () => {
    const m = new TimelineManager({ reducedMotion: () => false });
    const obj = { x: 0 };
    m.play("k", (t) => t.to(obj, { x: 99, duration: 5 }));
    expect(m.cancel("k")).toBe(true);
    expect(m.isActive("k")).toBe(false);
    expect(m.cancel("k")).toBe(false); // 二次取消无副作用
  });

  it("完成后自动移除（长跑不累积）", async () => {
    // gsap 在 Node 无 rAF，回退 setTimeout 驱动：用真实时钟等待完成
    const m = new TimelineManager({ reducedMotion: () => false });
    const obj = { x: 0 };
    m.play("short", (t) => t.to(obj, { x: 1, duration: 0.05 }));
    await new Promise((r) => setTimeout(r, 350));
    expect(obj.x).toBe(1);
    expect(m.size).toBe(0);
  });

  it("Reduced Motion：跳过动画直接终态", () => {
    const m = new TimelineManager({ reducedMotion: () => true });
    const obj = { x: 0 };
    const instant = vi.fn(() => (obj.x = 42));
    m.play("rm", (t) => {
      t.to(obj, { x: 1, duration: 1 });
      return { onInstant: instant };
    });
    expect(instant).toHaveBeenCalledTimes(1);
    expect(obj.x).toBe(42);
    expect(m.size).toBe(0); // 未登记任何动画
  });

  it("cancelAll 清空全部并返回数量", () => {
    const m = new TimelineManager({ reducedMotion: () => false });
    const o = { y: 0 };
    m.play("a", (t) => t.to(o, { y: 1, duration: 2 }));
    m.play("b", (t) => t.to(o, { y: 2, duration: 2 }));
    expect(m.cancelAll()).toBe(2);
    expect(m.size).toBe(0);
  });

  it("MotionTokens 含 cinematic 档且继承设计系统基线", () => {
    expect(MotionTokens.cinematic).toBe(1600);
    expect(MotionTokens.normal).toBe(280);
  });
});

const hasJsdom = typeof document !== "undefined" && typeof window !== "undefined";
describe.skipIf(!hasJsdom)(
  "createScrollNarrative（PART 7 Scroll Narrative 正式封装；DOM 环境运行，CI 全量）",
  () => {
    function setupDom(): void {
      document.body.innerHTML =
        '<div id="root"><div class="step">A</div><div class="step">B</div></div>';
    }
    it("Reduced Motion：直达终态且不注册 ScrollTrigger", () => {
      setupDom();
      const h = createScrollNarrative(
        [{ el: "#root .step:nth-child(1)" }, { el: "#root .step:nth-child(2)" }],
        { reducedMotion: () => true },
      );
      expect(h.size).toBe(2);
      for (const el of document.querySelectorAll(".step")) {
        expect((el as HTMLElement).style.opacity).toBe("1");
      }
      h.destroy();
    });

    it("正常模式：注册后 destroy 可清理（gsap.context revert）", () => {
      setupDom();
      const h = createScrollNarrative(
        [{ el: "#root .step:nth-child(1)" }, { el: "#root .step:nth-child(2)" }],
        { reducedMotion: () => false },
      );
      expect(h.size).toBe(2);
      expect(() => h.destroy()).not.toThrow();
    });
  },
);
