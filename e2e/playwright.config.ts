import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 冒烟配置（PHASE 2B）。
 * 本机网络策略拦截 Playwright CDN 下载（见 F11），浏览器安装与执行在 CI（ubuntu）进行；
 * 本地开发可用 `npx playwright install chromium` 后运行。
 */
export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost",
    trace: "retain-on-failure",
    // F17：本机 CDN 封锁导致 1.64 需要的 chromium-1248 不可下载；
    // 复用缓存中已有的 chromium-1228 完整浏览器（executablePath 绕过版本校验）。
    launchOptions: {
      executablePath: `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @atl/proto-vue-three exec vite preview --port 5171 --strictPort",
      url: "http://localhost:5171",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command:
        "pnpm --filter @atl/proto-automotive-studio exec vite preview --port 5174 --strictPort",
      url: "http://localhost:5174",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command:
        "pnpm --filter @atl/proto-design-playground exec vite preview --port 5175 --strictPort",
      url: "http://localhost:5175",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
