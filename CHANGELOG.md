# CHANGELOG

本仓库遵循阶段化推进；每阶段在 docs/09-handoff/ 留交接报告。

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
  - `visual-techniques.md`（PBR/IBL/后期/TSL/WebGPU/粒子——视觉技术研究）
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
