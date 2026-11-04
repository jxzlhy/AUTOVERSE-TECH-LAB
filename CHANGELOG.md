# CHANGELOG

本仓库遵循阶段化推进；每阶段在 docs/09-handoff/ 留交接报告。

## [Evolution-2] 2026-11-05 — 工程强化与视觉进化（PHASE 2 首轮）

### Fixed（Runtime 稳定性，全部有测试佐证）

- **SceneManager 两阶段激活**：目标场景 prepare 失败时保留当前场景（修复"切场景失败=白屏"）；generation 计数防陈旧异步提交；cancelPending()
- **AssetManager 解码器门控**：Draco/KTX2/Meshopt 初始化串行化，修复"压缩模型在解码器未就绪时开始加载"竞态
- **computeGlbStats 索引几何修复**：triangles 按 index.count（原 position.count/3 对 ToyCar 偏差 4 倍以上）
- **ResourceDisposer 扩展**：SkinnedMesh 骨骼纹理 + InstancedMesh.dispose + ResourceLedger 引用账本 + disposeRenderTarget + createListenerTracker
- **App 生命周期**：unhandledrejection/contextlost/restored 命名监听器反注册 + gsap.killTweensOf

### Added

- **CI**：.github/workflows/ci.yml（quality job：lint→typecheck→test→build；e2e job：CI 内装 Chromium 跑冒烟）
- **E2E**：Playwright 三套件（Playground 组件+Modal Esc / vue-three 布局回归哨兵 / 旗舰 GLB+双场景切换+控制台零错误）
- **性能基准 harness**：prototypes/performance-benchmark 六场景（A 单车/B 实例化铺量/D 大量 Mesh/G 100k 粒子/H Bloom/J 长跑），avg/P95 帧时，GPU 显存如实标记 NOT_MEASURABLE，SwiftShader 嫌疑自动标记
- **Shader Library v2**（packages/three-runtime/src/shader-library.ts）：X-Ray / Dissolve（噪声消融）/ Energy Flow，统一 Handle（tick/dispose）生命周期
- **CORE UI v0.1**：AvTabs（WAI-ARIA roving tabindex）+ AvToast（role=status）；Playground 增补演示

### Verified

- **19/19 单测**（新增 8 项 PHASE 2A 边界：失败保当前场景/两阶段时序/并发拒绝/取消回滚/账本归零/监听器反注册/索引几何/超发抛错）
- **lint 0 / typecheck 0 / 六应用 build 全绿**；基准 harness 端到端实测（A 场景 RESULT 面板 + JSON 输出）

### Findings（F11–F13）

- F11 本机网络策略拦截 Playwright CDN → E2E 执行环境定为 CI（DL-007）
- F12 typescript-eslint 8.72 拒绝 TS7 → 根 TS6.0.3 side-by-side（DL-006）
- F13 three 的 BufferGeometry.dispose() 只发 GPU 释放事件、不清 CPU attributes（测试断言需 spy dispose 调用）

## [Evolution-1] 2026-11-05 — 通宵自主进化（MASTER PLAN V1.0 首轮）

### Added

- **断点续跑机制**：`PROJECT_STATE.md` + `DECISION_LOG.md`（DL-001~005）；总指令全文落盘 `docs/05-ai-workflow/FOUNDATION_AND_OVERNIGHT_EVOLUTION_MASTER_PLAN.md`
- **工程规范**：ESLint 9 flat + typescript-eslint 8.72（**TS 7.0.2 实测兼容**）+ Prettier + Vitest；`pnpm lint / test` 门禁
- **packages/shared**：Design Tokens 代码化（colors/spacing/motion/glass + validateColorTokens）
- **packages/three-runtime**（八模块，**11 项单测全通过**）：SceneManager（状态机+异步激活+回滚）、AssetManager（去重缓存+真实解析统计）、ResourceDisposer（真实释放计数）、CameraController（Box3 取景数学）、LightingManager（STUDIO/MUSEUM/NIGHT/ENGINEERING/CINEMATIC）、InteractionManager（raycast 拾取+双态高亮）、EffectManager（Bloom+setScene）、PerformanceMonitor（时间窗聚合）、AnimationManager
- **packages/design-system（CORE UI v0）**：AvButton/AvInput/AvCard/AvBadge/AvModal（无障碍基线 + prefers-reduced-motion）
- **资产管线首件**：Khronos ToyCar.glb（**CC0 官方 LICENSE.md 核实**）入库 + `tools/inspect-glb.mjs`（层级/材质/纹理/包围盒/部件候选带置信度）+ 检查报告 + CREDITS 档案
- **旗舰原型 automotive-studio**：SceneManager 双场景（摄影棚⇄能量空间）+ GSAP 遮罩转场 + 真实 GLB 加载统计上屏 + 零件拾取 + 爆炸拆解（纯函数 + GSAP 补间）+ 5 灯光预设 + 4 车漆 + Bloom + Hologram shader（Fresnel+扫描线）+ 3000 粒子 + 性能 HUD
- **design-playground**：CORE UI 验收环境（色板/状态矩阵/对话框）

### Verified（V 级实测）

- 三旧原型 + 两新原型 `vite build` 全通过；eslint 0 问题；vitest 11/11；automotive-studio `tsc --noEmit` 0 错误
- 浏览器实测：旗舰原型双场景转场/爆炸终态/车漆/灯光/Bloom/Hologram/粒子（能量空间 **32FPS 真实读数**）；Playground 全组件状态 + Modal Esc 关闭

### Findings（本轮新增实测发现）

- F7 typescript-eslint 8.72 兼容 TS 7.0.2（F1 顾虑部分解除；vue-tsc 仍不兼容）
- F8 Vite 转译后 `import.meta.url` 锚点不可靠（vite.config 中用 cwd 向上探测仓库根）
- F9 gltf-transform `accessor.getMin()` 部分模型崩溃（自算 POSITION 包围盒绕过）
- F10 IAB 节流环境下 GSAP 补间不可视：连续截图强制合成帧可推进时间轴（验证方法论）

## [Phase 1] 2026-11-04 ~ 2026-11-05 — 技术实验室初始化与知识库建设

### Added（新增）

- **规范与治理**
  - `AGENTS.md`：AI 代理行为规范（硬性禁令、必做流程、依赖纪律、提交规范）
  - `docs/00-overview/lab-charter.md`：实验室章程（定位、GEWU 边界、证据分级 V/R/O/U、决策规则）
  - `docs/05-ai-workflow/AI_WORKFLOW.md`：AI 开发工作流（研究→原型→记录循环、Git 纪律、外部资源协议）
- **产品与架构**
  - `docs/01-product/autoverse-product-overview.md`：产品总纲（定位、THE NEXUS、三层体验、展品分类、DeLorean 方向；六空间/八领域的具体枚举标注为待确认）
  - `docs/02-architecture/architecture-research.md`：分层架构 + 关键机制（状态分层/资源管线/场景转场/测试/监控）+ 风险登记
- **技术研究**（docs/03-technology/）
  - `frontend-frameworks.md`（Vue 3.5.44 vs React 19.3；Vapor/RC 状态；RSC 正交性）
  - `state-management.md`（Pinia 4.1 / Zustand 5 vanilla 桥接 / Jotai / RTK / TanStack Query）
  - `3d-engines.md`（three r187 / R3F 9.8 / TresJS 5.10 / Babylon 9.33；24 项核实记录）
  - `animation-systems.md`（GSAP 3.15 免费商用核实 / Motion→motion-v / AnimationMixer / 转场方案）
  - `visual-techniques.md`（PBR/IBL/后期/TSL/WebGPU/粒子：官方车漆配方、r183 RenderPipeline 更名、postprocessing 为 Zlib 许可且 peer three<0.188）
  - `engineering-stack.md`（Vite 8+Rolldown/TS7/资源加载管线/测试策略/性能监控/WebGL2 覆盖率）
  - `tech-selection-comparison.md`：选型比较总报告（ADR-001~005）
- **设计系统**
  - `docs/04-design-system/design-system.md` v1.0：三条 UI 线（CORE/SPATIAL/ENGINEERING）、Design Tokens（色彩/字体/间距/动效）、Glass/HUD/Motion/响应式/无障碍/组件基线
- **资源与许可**
  - `docs/06-assets-and-data/asset-sources.md`：Poly Haven(CC0)/poly.pizza/Khronos/three.js 模型/Sketchfab 许可核实；DeLorean 权利结构研究（DMC 商标 vs Universal 影视权，2024 诉讼与和解）
- **性能**
  - `docs/07-performance/performance-research.md`：阶段一实测发现（P1–P4）+ 预算框架 v0
- **索引与登记**
  - `docs/08-research/research-index.md`：研究资源索引（文档地图 + 权威外链 + 版本基线快照）
  - `docs/08-research/dependency-registry.md`：依赖登记册（版本/许可/理由/风险）
- **原型（prototypes/）**
  - `framework-comparison/`：**三条技术路线可运行基线**（vue-three 634KB / react-r3f / vue-babylon），统一场景规格（程序化车辆、轨道相机、转台、车漆切换、FPS/DRAWS/TRIS 指标），构建+浏览器运行双验证
  - `three-rendering` / `lighting-and-materials` / `particles-and-shaders` / `gsap-motion` / `performance-benchmark` / `babylon-rendering`：实施计划与验收标准（阶段二/三执行）
  - `experiments/`、`assets/` 使用规范占位

### Verified（V 级实测）

- 三应用 `vite build` 全通过（<1s，Vite 8=Rolldown）；react-r3f `tsc --noEmit` 零错误
- 三应用真实浏览器渲染验证（截图）：场景、HUD、车漆切换交互、转台动画全部生效
- 指标对齐：vue-three 与 react-r3f 修齐后均为 21 DRAWS / 1.6K TRIS；Babylon 11 DRAWS / 0.8K TRIS / 30 FPS

### Findings（阶段实测发现 F1–F6）

- F1 vue-tsc 3.3.14 不兼容 TS 7.0.2（Vue 线类型门禁暂缺）
- F2 Babylon PBR metallic 无 IBL 纯黑 → 程序化 RawCubeTexture 环境修复（车漆必须 IBL 的实证）
- F3 跨框架样式复用需抽象挂载点选择器（#app vs #root 塌陷）
- F4 IAB 宿主 rAF 节流：FPS 结论必须在真实浏览器复测
- F5 单场景 draw calls：three 系 21 vs Babylon 11
- F6 Vite 8=Rolldown；含 JSX 文件必须 .tsx 命名

### Decisions（决策）

- ADR-001 UI=Vue 3；ADR-002 3D=原生 three 内核；ADR-003 每帧状态不入响应式；ADR-004 动画=GSAP 主干；ADR-005 WebGL2 基线 + TSL 面向未来

## [Unreleased]（阶段二候选）

- gsap-motion 转场原型、lighting-and-materials 车漆基线卡、three-rendering 后期对比
- Vitest + Playwright 门禁；Vue 线类型检查方案（TS5.9 组合或等 Volar 适配）
- 六大数字空间/八大主题领域枚举确认（产品所有者）
- 真实浏览器 FPS 复测（framework-comparison §3 限制）
