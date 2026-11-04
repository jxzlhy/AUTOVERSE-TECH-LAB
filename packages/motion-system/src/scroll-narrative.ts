/**
 * Scroll Narrative（PART 7）—— ScrollTrigger 的正式封装
 * 契约对齐 TimelineManager：可取消（destroy）/ 可清理（ctx.revert）/ Reduced Motion（直达终态）。
 * Playground 的直用版将迁移至此（formal integration）。
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollStep {
  el: HTMLElement | string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  /** ScrollTrigger 位置参数（默认 top 82% → top 45%，scrub 0.6） */
  start?: string;
  end?: string;
}

export interface ScrollNarrativeOptions {
  /** 作用域（gsap.context 根；默认 document） */
  scope?: HTMLElement | string;
  reducedMotion?: () => boolean;
}

export interface ScrollNarrativeHandle {
  /** 销毁：revert 全部补间与 ScrollTrigger（PART 7.2 可清理） */
  destroy: () => void;
  /** 步骤数 */
  size: number;
}

export function createScrollNarrative(
  steps: ScrollStep[],
  opts: ScrollNarrativeOptions = {},
): ScrollNarrativeHandle {
  const reduced = opts.reducedMotion ?? systemReducedMotion;
  const fromDefaults: gsap.TweenVars = { opacity: 0.15, y: 24 };

  // Reduced Motion：直接置终态，不注册任何 ScrollTrigger（PART 7.3）
  if (reduced()) {
    const els = steps
      .map((s) => (typeof s.el === "string" ? document.querySelector(s.el) : s.el))
      .filter(Boolean) as HTMLElement[];
    for (const el of els) gsap.set(el, { opacity: 1, y: 0 });
    return { destroy: () => undefined, size: els.length };
  }

  const ctx = gsap.context(() => {
    for (const s of steps) {
      gsap.fromTo(s.el, s.from ?? fromDefaults, {
        ...(s.to ?? { opacity: 1, y: 0 }),
        scrollTrigger: {
          trigger: s.el,
          start: s.start ?? "top 82%",
          end: s.end ?? "top 45%",
          scrub: 0.6,
        },
      });
    }
  }, opts.scope);

  return {
    destroy: () => ctx.revert(),
    size: steps.length,
  };
}

function systemReducedMotion(): boolean {
  return (
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
