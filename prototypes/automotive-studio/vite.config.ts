import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

/** 从 cwd 向上查找仓库根的 ToyCar.glb（vite 转译后 import.meta.url 锚点不可靠） */
function findToycar(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, "assets/models/khronos/ToyCar.glb");
    try {
      readFileSync(candidate); // 探测存在性
      return candidate;
    } catch {
      dir = dirname(dir);
    }
  }
  throw new Error("ToyCar.glb not found from cwd: " + process.cwd());
}
const TOYCAR_ABS = findToycar();

/**
 * 单一资产来源插件：GLB 保存在仓库 assets/（许可档案在 assets/CREDITS.md），
 * 原型通过 virtual:toycar-glb 引用——dev 经 /@fs/ 提供文件，build 时 emit 进产物。
 */
function toycarAsset(): Plugin {
  return {
    name: "atl-toycar-asset",
    resolveId(id) {
      if (id === "virtual:toycar-glb") return "\0virtual:toycar-glb";
      return null;
    },
    load(id) {
      if (id !== "\0virtual:toycar-glb") return null;
      if (process.env.NODE_ENV === "production" || process.env.VITE_BUILD) {
        this.emitFile({
          type: "asset",
          fileName: "assets/ToyCar.glb",
          source: readFileSync(TOYCAR_ABS),
        });
        return `export default "${this.environment.config.base}assets/ToyCar.glb"`;
      }
      return `export default "/@fs${TOYCAR_ABS}"`;
    },
  };
}

export default defineConfig({
  plugins: [vue(), toycarAsset()],
  server: {
    port: 5174,
    fs: { allow: ["../.."] },
  },
  preview: { port: 5174 },
  assetsInclude: ["**/*.glb"],
});
