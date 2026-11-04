# PROJECT_STATE — 项目状态（断点续跑入口）

> 本文件是所有会话/工具恢复工作的第一入口。每轮工作结束前必须更新。
> 配套：DECISION_LOG.md（技术决策）、docs/09-handoff/（阶段交接）、CHANGELOG.md。

---

## 当前快照（更新于 2026-11-05 EVOLUTION PHASE 2）

| 项 | 值 |
| --- | --- |
| 当前阶段 | **EVOLUTION PHASE 2 五轮完成**（+ 三视觉方向研究/IDENTITY v0 + Scroll Narrative + CORE UI v0.3 六件 + Blender R 级研究 + DeLorean 骨架 :5178） |
| 新增包 | packages/motion-system（TimelineManager：单一所有权/可取消/自动清理/Reduced Motion；6 单测） |
| 新增原型 | prototypes/shader-lab（:5177，全十 Shader 可选 Demo + 参数滑杆） |
| 五 Motion Demo | 登场（新）/电影级聚焦（新，Box3 取景+cinematic）/拆解/复原/场景传送（全部改走 TimelineManager） |
| 材质预设产品级 | material-presets 接入旗舰 MAT 行（十预设实时切换+dispose 语义，浏览器实测碳纤维生效） |
| 承接 Commit | 01e0677 → 本轮最终 SHA 见 docs/09-handoff/EVOLUTION_PHASE_2_REPORT.md |
| 分支 | main（已推送） |
| 门禁状态 | lint 0 ｜ typecheck 0 ｜ vitest 19/19 ｜ 六应用 build 全绿 ｜ CI 已配置（push 触发） |

## 已完成（通宵进化轮，全部浏览器实测）

1. **PHASE 0 审查**：Git/构建/依赖全绿，技术债 D1–D6 登记
2. **总指令落盘** + PROJECT_STATE/DECISION_LOG 断点续跑机制（057edee）
3. **工程规范**：ESLint9(flat)+typescript-eslint 8.72（**TS7 实测兼容**）+ Prettier + Vitest，lint/test 脚本门禁（403ca9e 前置）
4. **packages 体系**：@atl/shared（Tokens 代码化）+ @atl/three-runtime（SceneManager/AssetManager/ResourceDisposer/CameraController/LightingManager×5预设/InteractionManager/EffectManager/PerformanceMonitor/AnimationManager）+ **11 项单元测试全通过**（403ca9e）
5. **资产管线**：Khronos ToyCar.glb（**CC0 官方核实**）入库 + tools/inspect-glb.mjs 检查工具 + 检查报告 + CREDITS 档案（22a69a0）
6. **旗舰原型 automotive-studio**（5aea09e）：双场景 SceneManager + GSAP 转场 + GLB 真实加载（3mesh/3mat/8tex/25.8K tris 上屏）+ 零件拾取 + 爆炸拆解（截图验证）+ 5 灯光预设 + 4 车漆 + Bloom + Hologram shader + 粒子 + 性能 HUD（能量空间实测 32FPS）
7. **packages/design-system（CORE UI v0）** + design-playground（2498d38）：Button/Input/Card/Badge/Modal，色板/状态矩阵/对话框（遮罩+Esc）浏览器验收

## 未完成（PHASE 2 下一轮候选，按 MASTER PLAN PART 14 优先级）

1. **真实浏览器基准执行**：harness 已就绪（:5176?scenario=X&autostart=1），需用户日常浏览器跑 A/B/D/G/H/J 并导出 JSON（IAB/headless 读数不可信——D5）
2. **CI E2E 首跑确认**：push 已触发 ci.yml；**本机 api.github.com 受网络策略拦截无法代查，需项目所有者在 GitHub 网页 Actions 页确认 quality+e2e 两 job 绿**（唯一待用户动作）
3. **PHASE 2G/2H**：Engineering Lab 深化（Section Control 已接入旗舰；剩余：机械动画/结构说明面板）+ DeLorean 专题页（真实 DMC-12 vs 影视改装区分展示；模型来源待寻，CC-BY-NC 禁入）。已落地：AvPartsTree/AvToggle/AvSceneSelector/AvHoloPanel + XRay/Section 控制器（旗舰实测通过，2026-11-05）
4. **PHASE 2D/2E 剩余**：材质预设接入旗舰车漆切换 UI + 三视觉方向研究（AUTOMOTIVE LUXURY/FUTURISTIC SPATIAL/EDITORIAL MUSEUM）+ CORE UI 缺项（Dropdown/Tooltip/Drawer/Search/Select/Navigation）
5. **PHASE 2E 深化**：render-target 着色器转场 + 5 个完整 Motion Demo（登场/拆解/复原/传送/聚焦）
6. **PHASE 2F**：Blender 自动化研究 + poly.pizza/Quaternius CC0 车模铺量（质量分级 S/A/B/C 实践）
7. **Vue 线类型门禁**：vue-tsc × TS7 仍不兼容（DL-006 side-by-side 不覆盖 vue-tsc）

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
