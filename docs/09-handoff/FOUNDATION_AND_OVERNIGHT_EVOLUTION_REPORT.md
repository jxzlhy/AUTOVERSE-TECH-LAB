# FOUNDATION AND OVERNIGHT EVOLUTION REPORT — 通宵自主进化报告

> 执行窗口：2026-11-05（MASTER PLAN V1.0 首轮）｜ 执行者：AI Agent（FULL AUTONOMOUS）
> 起始 Commit：`d577e4e`（Phase 1 完成时点）｜ 最终 Commit：见 §I

---

## A. 总体概览

- **执行路径**：PHASE 0 审计 → 断点续跑机制 → 工程规范 → packages 体系 → 资产管线 → 旗舰原型 → 设计系统 → Playground → 文档同步
- **完成**：技术债 D1–D6 中 4 项清偿、packages 三件套、旗舰原型全功能验证、CORE UI v0
- **未完成**：Playwright/CI、render-target 着色器转场、SPATIAL/ENGINEERING UI 线、性能基准量化（见 §J）

## B. Foundation Setup

- 工程基础：pnpm workspace（6 projects：3 对照原型 + 2 packages + 2 新原型）、ESLint9 flat + Prettier + Vitest 脚本门禁；`tsc --noEmit`（TS7 原生）对 .ts 全覆盖
- 目录体系：演进式抽层（DL-001），framework-comparison 原地保留
- 项目状态机制：PROJECT_STATE.md（断点续跑入口）+ DECISION_LOG.md（DL-001~005）+ 总指令全文落盘
- 测试体系：Vitest 11 项（ResourceDisposer 计数 / AssetRegistry 去重与失败重试 / SceneManager 状态机与回滚 / PerformanceMonitor 聚合 / framingForBox 数学 / 灯光预设完整性 / Tokens 校验）

## C. 产品与架构

- 产品总纲（Phase 1 已立）+ 本轮架构落地：**分层架构首次真实实现**——packages/three-runtime（引擎内核，零框架依赖）→ 桥接层（createStudio API）→ Vue UI 层；验证了"换 UI 框架不重写 Runtime"
- 技术决策：DL-001 演进式抽层 / DL-002 命令式内核 / DL-003 工具链分批引入 / DL-004 CC0 资产起步 / DL-005 单应用双场景验证 Nexus 可行性
- 演进方向：WebGPU/TSL（R 级结论保留）、render-target 转场、多空间 SceneManager 扩展

## D. Design System

- Tokens 代码化：@atl/shared（TS 单一事实来源）+ tokens.css（CSS 映射）；validateColorTokens 测试锁定一致性
- CORE UI v0：AvButton（variant×state 矩阵）、AvInput（label/error/aria）、AvCard、AvBadge（REAL/FICTION/CONCEPT 语义双通道）、AvModal（Esc/遮罩/滚动锁）
- Playground：prototypes/design-playground（:5175）浏览器验收通过（截图存档）
- 视觉方向：AUTOMOTIVE LUXURY / FUTURISTIC SPATIAL / EDITORIAL MUSEUM 三方向研究仍待做（R 级设计研究，下轮）；当前基线 = 深空底色 + NEXUS 青 + 玻璃面板
- UI/UX 问题：旗舰原型发现并修复取景遗漏（GLB 邻车未入初始帧）；玻璃拟态克制在基线内

## E. 3D Runtime（packages/three-runtime）

- 模块：SceneManager（idle/activating/active/deactivating 状态机 + 异步 onEnter + 失败回滚 + 可选物理释放）｜RendererManager 职责由应用层承担（DPR/ACES/阴影）｜CameraController（OrbitControls + Box3 取景 + 机位预设）｜LightingManager（5 预设 + RoomEnvironment IBL）｜AssetManager（GLTFLoader + 去重缓存 + 真实统计 + DRACO 挂载点）｜AnimationManager｜InteractionManager（raycast/hover/select/emissive 高亮还原）｜EffectManager（Bloom + setScene 切换）｜ResourceDisposer｜PerformanceMonitor（500ms 窗口聚合 + 订阅）
- 生命周期：activate→onFrame→onExit→dispose 全链路实现；ToyCar GLB 加载/挂载/统计实测
- 资源释放：disposeObject3D 真实计数（测试覆盖重复材质去重）；场景切换默认不释放（disposeCurrent 可选）
- 测试结果：11/11 通过（含失败回滚、并发去重、窗口聚合等边界）

## F. 动画与视觉

- GSAP：转场遮罩 + 爆炸拆解补间（onUpdate 驱动纯函数 applyExplode）；GSAP ticker 依赖 rAF——IAB 节流下不可视（F10，真机无此问题）
- Shader：Hologram（Fresnel + 扫描线 + 闪烁）落地能量空间；X-Ray/Dissolve/Scan 等列下轮
- Lighting：5 预设（数据 + 应用层），预设切换与场景切换联动实测
- Particle：3000 点球壳粒子云（Points + AdditiveBlending）；GPU 粒子/GPGPU 列下轮（visual-techniques.md 结论）
- Post-processing：UnrealBloomPass + OutputPass，能量空间实测辉光正常
- Scene Transition：遮罩 + 镜头重定位（已验证）；render-target 着色器转场未做（R 级主流方案已研究，待实现）

## G. 资产与数据

- 模型来源：Khronos ToyCar.glb（**CC0-1.0，官方 LICENSE.md 核实**，作者 Guido Odendahl/Eric Chadwick）入库 assets/models/khronos/
- 模型质量：C 级（工程示意，modelType=SIMULATED，3 mesh 无独立机械组件）——如实标注
- 资产管线：inspect-glb.mjs（层级/材质/纹理/包围盒/部件候选+置信度）；检查报告 docs/06-assets-and-data/inspect-ToyCar.json
- 数据来源：官方来源/Wikidata/NHTSA vPIC 等研究仍按 asset-sources.md 待展开（下轮）
- 版权状态：零 CC-BY-NC、零商标资产入库；DeLorean 法务提示保持
- 用户待授权事项：无（未使用任何需登录/付费来源）

## H. 真实验证

- 构建：5 个应用 `vite build` 全通过（134–881ms）；产物含 GLB 5.4MB（emitFile 验证）
- 类型检查：automotive-studio `tsc --noEmit` 0 错误（抓出 shaders.ts 漏 import 实锤价值）；react-r3f tsc 通过；vue-tsc 仍不可用（D1）
- 单元测试：Vitest **11/11**
- 浏览器测试（IAB/Chromium 1280×720）：旗舰双场景、爆炸终态、车漆/灯光/Bloom/Hologram/粒子全截图验证；Playground 全组件 + Modal
- FPS：能量空间 **32 FPS**（PerformanceMonitor 真实读数）；摄影棚 FPS 受 IAB rAF 节流限制（F4/D5，真机复测待做）
- 加载耗时：ToyCar.glb localhost 秒级（HUD 进度 0→100%）；量化基准待 performance-benchmark
- 资源释放：disposeObject3D 单测验证；页面级长时间运行测试未做（下轮）
- 已知问题：F1（vue-tsc）/F4（IAB FPS）/F8–F10 见 CHANGELOG

## I. Git

- 提交列表（本轮）：057edee（状态机制）→ 403ca9e（规范+packages+测试）→ 22a69a0（资产管线）→ 5aea09e（旗舰原型）→ 2498d38（设计系统+Playground）→ [docs 同步提交]
- Push 状态：全部成功（HTTPS + osxkeychain）；无 force push
- 最终 SHA：`git rev-parse HEAD`（见本轮最终提交）
- 工作区：干净（docs 更新后统一提交）

## J. 下一阶段规划（三方向）

| 方向 | 目标 | 收益 | 难度 | 风险 | 依赖 | 验收标准 |
| --- | --- | --- | --- | --- | --- | --- |
| **J1 性能基准与真机复测（推荐首选）** | performance-benchmark 原型：Draco/KTX2 压缩对比 + 铺量测试 + 用户真机 FPS 复测三路线 | 补齐 D5/F4 量化缺口；产出性能预算 v1 | 中 | 低 | gltf-transform（已装）、真实浏览器 | 压缩前后体积/加载耗时表 + 桌面/移动预算阈值 |
| **J2 转场升级 + SPATIAL UI** | render-target 着色器转场（R 级主流方案）+ GlassPanel/HUDLabel/ExhibitPlaque 组件 | 视觉电影感质变；SPATIAL UI 线启动 | 中高 | 中 | gsap-motion 依赖 | 转场 Demo 可打断性 + 组件入 Playground |
| **J3 E2E 门禁 + CI** | Playwright 冒烟（canvas/HUD/无 console error）+ GitHub Actions | 防回归；断点续跑质量兜底 | 低 | 低 | 无 | 3 条冒烟用例绿 + CI 徽章 |

**推荐**：J1 → J3 → J2。理由：J1 补齐所有性能结论的证据缺口（当前所有 FPS 结论受限），J3 低成本锁定本轮成果，J2 视觉升级放最后。

---

签署：AI Agent ｜ MASTER PLAN V1.0 首轮 ｜ 2026-11-05
