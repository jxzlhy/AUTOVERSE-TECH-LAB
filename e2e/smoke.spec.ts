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

test.describe("Playground v0.2 扩展", () => {
  test("MUSEUM 浅色主题切换 + Scroll Narrative 渲染", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("http://localhost:5175/");
    await expect(page.getByRole("heading", { name: /CORE UI Playground/ })).toBeVisible();
    // 主题切换（AvToggle role=switch）
    await page.getByRole("switch", { name: /MUSEUM/ }).click();
    await expect(page.locator("main.page.museum")).toHaveCount(1);
    // 切回深色
    await page.getByRole("switch", { name: /MUSEUM/ }).click();
    await expect(page.locator("main.page.museum")).toHaveCount(0);
    // Scroll Narrative 四步渲染
    await expect(page.locator(".narr-step")).toHaveCount(4);
    await expect(page.getByText("不锈钢传奇")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("DeLorean 知识图谱", () => {
  test("搜索命中 + 枢纽跳转 + byLayer 过滤", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("http://localhost:5178/");
    await expect(page.getByRole("heading", { name: /BACK TO THE FUTURE/ })).toBeVisible();

    // 全局搜索"蝙蝠" → Batman 系列/Batmobile
    await page.getByLabel("知识图谱搜索").fill("蝙蝠");
    await expect(page.locator(".search-hits .chain-node")).toHaveCount(2);

    // byLayer 三分过滤：FICTION 9 实体
    await page.locator(".layer-row").getByText("FICTION").click();
    await expect(page.getByText(/9 实体/)).toBeVisible();

    // 枢纽跳转：点 DeLorean DMC-12 → 链根切换 + 二跳区出现
    await page.locator(".hub-chip", { hasText: "DeLorean DMC-12" }).click();
    await expect(page.locator(".chain-root strong")).toHaveText("DeLorean DMC-12");
    await expect(page.locator(".twohop-node").first()).toBeVisible();

    // 人物/技术实体（PART 10 清单）：搜索 Giugiaro → 跳转链根
    await page.getByLabel("知识图谱搜索").fill("Giugiaro");
    await expect(
      page.locator(".search-hits .chain-node", { hasText: "Giorgetto Giugiaro" }),
    ).toBeVisible();
    await page.locator(".search-hits .chain-node", { hasText: "Giugiaro" }).click();
    await expect(page.locator(".chain-root strong")).toHaveText("Giorgetto Giugiaro");

    // byLayer REALITY 过滤：8 实体（DMC-12/品牌/鸥翼/不锈钢/人物×2/技术×2）
    await page.locator(".layer-row").getByText("REALITY").click();
    await expect(page.getByText(/8 实体/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("AUTOVERSE 产品（THE NEXUS + 三空间）", () => {
  test("NEXUS 分类入口 + 传送 SUPERCAR 铭牌 + ENGINEERING 零件树/检查器", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("http://localhost:5181/");
    await expect(page.getByRole("heading", { name: "AUTOVERSE" })).toBeVisible();

    // NEXUS 分类入口：FICTION → 面板 9 实体
    await page.locator(".layer-quick").getByText("FICTION").click();
    await expect(page.getByText(/FICTION 视图 · 9 实体/)).toBeVisible();

    // 传送 SUPERCAR：信息铭牌 SIMULATED 诚实标注
    // （IAB/受限环境定时器节流：传送全程 ~1.5s，各步宽容等待）
    await page.locator(".dock-btn", { hasText: "SUPERCAR" }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator(".supercar-plaque")).toContainText("SIMULATED");
    await expect(page.locator(".supercar-plaque")).toContainText("程序化几何");
    await expect(page.locator(".matdock .dock-btn", { hasText: "车漆" })).toBeVisible();

    // ENGINEERING：零件树选车轮 FL → 检查器 + 结构说明
    await page.locator(".dock-btn", { hasText: "ENGINEERING" }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("SIMULATED / PROCEDURAL MODEL")).toBeVisible();
    await page.locator(".av-tree__item", { hasText: "车轮 FL" }).click();
    await expect(page.locator(".av-insp")).toContainText("wheel-FL");
    await expect(page.locator(".struct-desc")).toContainText("车轮总成");
    expect(errors).toEqual([]);
  });
});
