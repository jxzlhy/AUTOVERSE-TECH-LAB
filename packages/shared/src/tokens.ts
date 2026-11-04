/**
 * AUTOVERSE Design Tokens — 代码化单一事实来源
 * 规范文档：docs/04-design-system/design-system.md v1.0
 * 两者不一致时以规范文档为准并修复代码（design-system §10）。
 */

export const colors = {
  bgVoid: "#05070D",
  bgDeep: "#0A0F1A",
  bgElevated: "#111827",
  borderFaint: "rgba(148, 163, 184, 0.12)",
  borderStrong: "rgba(148, 163, 184, 0.28)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  nexus: { 300: "#67E8F9", 500: "#22D3EE", 700: "#0E7490" },
  exhibit: { real: "#F59E0B", fiction: "#A78BFA", concept: "#34D399" },
  status: { success: "#10B981", warning: "#FBBF24", danger: "#F87171", info: "#38BDF8" },
} as const;

/** 展品类型语义色 → 车漆预设（内容层语义，非纯视觉 Token） */
export const PAINT_PRESETS = [
  { id: "nexus", label: "NEXUS", color: colors.nexus[500] },
  { id: "real", label: "REAL", color: colors.exhibit.real },
  { id: "fiction", label: "FICTION", color: colors.exhibit.fiction },
  { id: "concept", label: "CONCEPT", color: colors.exhibit.concept },
] as const;

export type PaintPresetId = (typeof PAINT_PRESETS)[number]["id"];

export const fontFamilies = {
  display: '"Space Grotesk", "PingFang SC", "Noto Sans SC", system-ui, sans-serif',
  body: 'system-ui, -apple-system, "PingFang SC", "Noto Sans SC", sans-serif',
  mono: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
} as const;

export const fontSizes = {
  displayXl: "56px",
  displayL: "40px",
  title: "24px",
  body: "16px",
  label: "13px",
  data: "12px",
} as const;

/** 4px 基网格（design-system §2.3） */
export const spacing = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;

export const radii = { s: "4px", m: "8px", l: "16px", full: "999px" } as const;

/** 动效时长与缓动（design-system §5） */
export const motion = {
  duration: { instant: 80, fast: 160, normal: 280, slow: 480 } as const,
  easing: {
    ui: "cubic-bezier(0.22, 1, 0.36, 1)",
    camera: "power2.inOut", // GSAP 命名，供镜头层使用
  },
} as const;

/** 玻璃面板基线（design-system §3） */
export const glass = {
  background: "rgba(10, 15, 26, 0.55)",
  blur: "blur(16px) saturate(1.2)",
  border: `1px solid ${colors.borderFaint}`,
  topHighlight: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
  radius: radii.l,
} as const;

/** HUD 屏幕分区惯例（design-system §2.3） */
export const hudZones = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** 校验所有颜色 Token 为合法 hex/rgba（供测试与生成器使用） */
export function validateColorTokens(): { ok: boolean; bad: string[] } {
  const bad: string[] = [];
  const walk = (v: unknown, path: string) => {
    if (typeof v === "string") {
      if (!HEX_RE.test(v) && !v.startsWith("rgba(")) bad.push(path);
    } else if (typeof v === "object" && v !== null) {
      for (const [k, val] of Object.entries(v)) walk(val, `${path}.${k}`);
    }
  };
  walk(colors, "colors");
  return { ok: bad.length === 0, bad };
}
