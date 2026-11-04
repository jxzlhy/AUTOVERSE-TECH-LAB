import { expect, test, type Page } from "@playwright/test";

/** 控制台错误收集（PHASE 2B §3.2：错误状态验证） */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

test.describe("Design Playground", () => {
  test("加载 + 组件渲染 + 对话框交互", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("http://localhost:5175/");
    await expect(page.getByRole("heading", { name: /CORE UI Playground/ })).toBeVisible();
    await expect(page.getByText("Color Tokens")).toBeVisible();
    // 按钮矩阵与语义徽标
    await expect(page.getByRole("button", { name: "主要操作" })).toBeVisible();
    await expect(page.getByText("REAL", { exact: true })).toBeVisible();
    // Modal：打开 → Esc 关闭
    await page.getByRole("button", { name: "打开对话框" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    expect(errors).toEqual([]);
  });
});

test.describe("Vue + Three 基线", () => {
  test("3D Canvas 初始化 + HUD 文案", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("http://localhost:5171/");
    await expect(page.getByRole("heading", { name: /Vue 3 \+ Three.js/ })).toBeVisible();
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(300); // 非塌陷布局（F3 回归哨兵）
    // 车漆交互（rAF 正常环境 Playwright 可用 locator）
    await page.getByRole("button", { name: "REAL" }).click();
    await expect(page.getByRole("button", { name: "REAL" })).toHaveClass(/active/);
    expect(errors).toEqual([]);
  });
});

test.describe("Automotive Studio 旗舰", () => {
  test("双场景初始化 + GLB 加载 + 场景切换", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("http://localhost:5174/");
    await expect(page.getByRole("heading", { name: /Automotive Studio/ })).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();

    // GLB 真实加载：资产统计上屏（AssetManager 链路验证）
    await expect(page.getByText(/GLB · CC0 · Khronos ToyCar/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/3 mesh · 3 mat · 8 tex/)).toBeVisible();

    // 场景切换（SceneManager 两阶段）：能量空间 → HUD 消失 + 标签激活
    await page.getByRole("button", { name: "能量空间" }).click();
    await expect(page.getByRole("button", { name: "能量空间" })).toHaveClass(/active/);
    await expect(page.getByText(/GLB · CC0/)).toBeHidden(); // 回到 studio 才显示
    // 切回摄影棚：GLB 统计仍在（缓存命中）
    await page.getByRole("button", { name: "摄影棚" }).click();
    await expect(page.getByText(/GLB · CC0 · Khronos ToyCar/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});
