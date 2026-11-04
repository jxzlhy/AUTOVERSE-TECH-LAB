# PROJECT_STATE — 项目状态（断点续跑入口）

> 本文件是所有会话/工具恢复工作的第一入口。每轮工作结束前必须更新。
> 配套：DECISION_LOG.md（技术决策）、docs/09-handoff/（阶段交接）、CHANGELOG.md。

---

## 当前快照（更新于 2026-11-05 通宵自主进化）

| 项 | 值 |
| --- | --- |
| 当前阶段 | **MASTER PLAN 通宵自主进化已完成本轮**（总指令 V1.0） |
| 上一里程碑 | Phase 1 基础建设（2026-11-05）→ 本轮：packages 体系 + 旗舰原型 + 设计系统 |
| 最新 Commit | 见 git log（本轮最终 SHA 在演进报告 A 节） |
| 分支 | main（已推送） |
| 执行模式 | 本轮结束；下轮从"未完成"继续 |

## 已完成（通宵进化轮，全部浏览器实测）

1. **PHASE 0 审查**：Git/构建/依赖全绿，技术债 D1–D6 登记
2. **总指令落盘** + PROJECT_STATE/DECISION_LOG 断点续跑机制（057edee）
3. **工程规范**：ESLint9(flat)+typescript-eslint 8.72（**TS7 实测兼容**）+ Prettier + Vitest，lint/test 脚本门禁（403ca9e 前置）
4. **packages 体系**：@atl/shared（Tokens 代码化）+ @atl/three-runtime（SceneManager/AssetManager/ResourceDisposer/CameraController/LightingManager×5预设/InteractionManager/EffectManager/PerformanceMonitor/AnimationManager）+ **11 项单元测试全通过**（403ca9e）
5. **资产管线**：Khronos ToyCar.glb（**CC0 官方核实**）入库 + tools/inspect-glb.mjs 检查工具 + 检查报告 + CREDITS 档案（22a69a0）
6. **旗舰原型 automotive-studio**（5aea09e）：双场景 SceneManager + GSAP 转场 + GLB 真实加载（3mesh/3mat/8tex/25.8K tris 上屏）+ 零件拾取 + 爆炸拆解（截图验证）+ 5 灯光预设 + 4 车漆 + Bloom + Hologram shader + 粒子 + 性能 HUD（能量空间实测 32FPS）
7. **packages/design-system（CORE UI v0）** + design-playground（2498d38）：Button/Input/Card/Badge/Modal，色板/状态矩阵/对话框（遮罩+Esc）浏览器验收

## 未完成（下一轮候选，按价值排序）

1. **真实浏览器性能基准**（framework-comparison F4 遗留）：三路线 FPS 复测 + performance-benchmark 原型（Draco/KTX2 压缩对比）
2. **Playwright E2E 门禁**：页面冒烟（canvas 存在/HUD 文案/无 console error）+ CI 接入
3. **gsap-motion 原型**：render-target 着色器转场（当前为遮罩+镜头转场）
4. **SPATIAL UI / ENGINEERING UI 组件**（design-system v0 只有 CORE UI 线）
5. **更多 GLB 资产**：poly.pizza/Quaternius CC0 车模铺量 + 质量分级实践
6. **X-Ray/Dissolve 等 shader 试点扩充**（本轮完成 Hologram）
7. **Vue 线类型门禁**：试 TS5.9 组合恢复 vue-tsc

## 技术债（更新）

| # | 债 | 状态 |
| --- | --- | --- |
| D1 | vue-tsc × TS7 | 未解（react 线 tsc 已启用；automotive-studio 已加 tsc --noEmit 门禁覆盖 .ts） |
| D2 | ESLint/Prettier/Vitest | ✅ 已落地；Playwright 未做 |
| D3 | Runtime 内嵌原型 | ✅ 已抽出 packages/three-runtime |
| D4 | 无真实 GLB/检查工具 | ✅ 已落地（ToyCar + inspect-glb） |
| D5 | IAB FPS 失真 | 已验证方法论：真实浏览器复测待做 |
| D6 | 无场景管理/转场 | ✅ SceneManager + 转场已落地（着色器转场待做） |
| D7 | 新增：GSAP 补间在 IAB 节流环境不可视（验证方法论：连续截图强制合成帧） | 已记录验证技巧 |

## 用户待处理事项

- 暂无阻塞。远期：Sketchfab 账号（如需批量下载）、付费高模采购、DeLorean 法务意见。

## 下一步（断点续跑）

读本文件"未完成"清单第 1 项开始；先 `pnpm test && pnpm lint && pnpm -r build` 确认基线。
