# CHANGELOG

本仓库遵循阶段化推进；每阶段在 docs/09-handoff/ 留交接报告。

## [Evolution-2 六轮] 2026-11-05 — 三视觉方向 V 级对照验证
### Added
- **prototypes/lighting-and-materials（:5180）**：同车三方向对照（材质/布光/底色），URL ?dir= 切换，复用材质预设库
- 三截图入库 docs/04-design-system/directions/*.png；**IDENTITY v0 回写 design-system.md §11 升为正式基线**（视觉方向验证闭环）
## [Evolution-2 五轮] 2026-11-05 — Engineering Lab 独立体验页
### Added
- **prototypes/engineering-lab（:5179）**：PART 9.2 独立体验——零件树（AvPartsTree）/部件聚焦/爆炸拆解+装配复原/X-RAY/WIRE/SECTION/结构说明（每部件工程描述）/轮转动画；复用 three-runtime XRay/Section/WireframeHandle + design-system ENGINEERING 组件
### Verified
- 浏览器实测：10 部件树→选中→检查器（confirmed/estimated）→结构说明全链路；11 DRAWS / 0.8K TRIS / GPU NOT MEASURABLE 标注
### Fixed
- 5179 端口被游离 preview 进程占用（旧 Playground 实例）——lsof 定位终止重启
- 实验室 .vue 同样需要 shims-vue（与 F1 同根因）

## [Evolution-2 八轮] 2026-11-05 — Blender Draco → three 解码闭环（PART 2.2/8.5 完成）
### Added
- Blender 无头导出 Draco GLB（5.42MB→**2.22MB -59%**，KHR_draco_mesh_compression L6）→ 入库 public/assets/（CC0 衍生件，CREDITS 建档）
- 旗舰 `?draco=1` 通道：AssetManager dracoDecoderPath=/draco-decoders/（three 解码器 vendored）→ **浏览器实测解码后 3 mesh/108.9K tris 与源件一致，零错误**
### Fixed
- **F16**：eslint 挂因＝vendored 1MB 解码器被 lint + 并发 --fix 截断 config——public/** 入 ignores，config 重写
## [Evolution-2 十轮] 2026-11-05 — Scroll Narrative 封装 + 页面迁移安全回退
### Added
- **packages/motion-system `createScrollNarrative`**：契约对齐 TimelineManager（可清理/Reduced Motion 直达终态/scope 作用域）；2 DOM 用例（离线 skipIf 跳过，CI 全量）——单测通过
### Changed
- Playground 页面级迁移尝试在 IAB 出现黑屏 → **安全回退至已验证直用版并复验**（透明度梯度 [1, 0.994, 0.877, 0.609] 与首次一致）；迁移根因调试列下轮（需真实浏览器）
### Fixed
- F17 网络封锁：jsdom 离线不可装 → skipIf 条件执行（不伪造）；npm registry 亦断——环境网络逐块降级中
### ⚠️ Git
- 本地领先远程 **5 提交**（69db52e…52c8f1e 及后续）：github.com:443 持续封锁；网络恢复 `git push` 一次同步

## [Evolution-2 十一轮] 2026-11-05 — 后处理 SSAO/DOF/Vignette 实现（PART 6.4 研究转实现）
### Added
- **EffectManager 扩展**：setSSAO（GTAOPass，最贵/桌面 HIGH 档注记）/ setDOF（BokehPass，focus/aperture/maxblur）/ setVignette（Vignette+饱和度+暖冷合一终帧 ShaderPass，最便宜）——全部懒构建 + pass 顺序正确（AO→Bloom→DOF→Grade→Output）
- 旗舰工程面板接入 SSAO/VIG 切换：**浏览器实测三效果组合（BLOOM+SSAO+VIG）激活渲染正常**
- 摄影棚/能量空间 scene 切换联动保留（setScene 兼容新 pass 链）
## [Evolution-2 十二轮] 2026-11-05 — E2E 本机首次真实执行 3/3 通过（PART 3.2/3.4 缺口关闭）
### Added
- **Playwright E2E 首次真浏览器执行**：Playground（组件+Modal Esc）/ vue-three（布局哨兵+车漆）/ 旗舰（GLB+双场景+零 console 错误）——**3/3 passed (4.4s)**
- chromium-1228 executablePath 复用（绕过 1.64 需 1248 的 CDN 封锁，F17 续）
### Fixed
- **favicon 404**（全站 17 个 index.html 内联 SVG icon——测试驱动出的真实缺陷，消除而非掩盖）
- strict-mode 定位歧义（REAL 色板标签 vs 徽标 → exact match）
## [Evolution-2 十三轮] 2026-11-05 — DeLorean 知识关系链（PART 2.5 数据层首个 UI 落地）
### Added
- **knowledge.ts**：8 节点/7 边知识图谱数据层（Time Machine→DMC-12→鸥翼门→不锈钢车身→影视文化），每节点带 layer(REALITY/FICTION)+certainty(OFFICIAL…UNVERIFIED)+source 三标注
- **关系链 UI**（delorean-showcase）：链根跳转（点击节点探索）+ 双向关系箭头 + REAL/FICTION 徽标 + 来源可信度展示——浏览器实测 Time Machine→DMC-12 跳转与 4 关联渲染
- 域模型即 domain-engine 前身：静态数据验证 PART 10「先数据模型后后端」原则
## [Evolution-2 十七轮] 2026-11-05 — LEGENDS UNIVERSE 铺量 + F18 潜在缺陷修复
### Added
- **知识图谱铺量 13 节点/13 边**：James Bond 系列+DB5 / Batman 系列+Batmobile / Knight Rider+KITT（含"真实基底 vs 完全虚构"对照案例标注，PART 9.3）
### Fixed
- **F18 潜在运行时缺陷**：第 15 轮迁移脚本静默丢失 DomainGraph/Entity/Relation 导入与 EDGES 声明（vite 构建不查类型漏网；本机 never 浏览器复验该页）——全文件重写修复
- **typecheck 覆盖缺口**：delorean-showcase 纳入根 typecheck（此前无门禁）；.npmrc hoist 供 CI
### Verified
- 浏览器实测：DomainGraph 迁移后关系链正常（Time Machine 链根 3 邻居/徽标/来源三标注）
- 全门禁：lint 0 / typecheck 0（覆盖面扩大）/ vitest 31+2 / 九应用 build 全绿
## [Evolution-2 十八轮] 2026-11-05 — 枢纽视图接入（hubs API→UI）
### Added
- DeLorean 关系链顶部**枢纽 HUBS 行**：DomainGraph.hubs(3) 度数排序 chips（影视汽车文化 5 / DMC-12 4 / Time Machine 3），点击跳转链根、current 态高亮、title 显示关联数
- 浏览器实测：枢纽排序正确 + chip 跳转生效
## [Evolution-2 十九轮] 2026-11-05 — 二跳可达视图（traverse API→UI）
### Added
- DeLorean 关系链新增**二跳可达区**：GRAPH.traverse(root,2) 去链根/直接邻居后的远端网络 chips（点击跳转）
- 浏览器实测：枢纽「影视汽车文化」→ 5 直接关联（回到未来/Time Machine/Bond/Batman/KnightRider）+ 二跳 4 节点（DMC-12/DB5/Batmobile/KITT）——"从一辆车到整个文明网络"（总纲 §2.5）在 UI 兑现
## [Evolution-2 二十轮] 2026-11-05 — 知识图谱全局搜索（search API→UI）
### Added
- 知识关系链卡片顶部**全局搜索框**：GRAPH.search 子串检索（label+blurb），命中节点 chips 点击跳转链根
- 浏览器实测：输入"蝙蝠"命中 Batman 系列+Batmobile；PART 2.5 全局搜索能力首个 UI 落地
- DomainGraph 四 API（related/traverse/hubs/search）至此全部接线 UI
## [Evolution-2 七轮] 2026-11-05 — Blender V 级落地 + MUSEUM 主题
### Added
- **Blender 4.x 本机安装（Homebrew）→ tools/blender/inspect_asset.py V 级验证**：无头 ToyCar.glb 检查 4 mesh/108,936 tris（与 gltf-transform 双检一致）/part_id 告警；报告 blender-inspect-ToyCar.json
- Playground **MUSEUM 浅色主题**切换（PART 5.4 不同主题；CSS Token 覆写琥珀 accent）
## [Evolution-2 四轮] 2026-11-05 — 三视觉方向 + Scroll Narrative
### Added
- **三视觉方向研究 + AUTOVERSE VISUAL IDENTITY v0**（docs/04-design-system/visual-directions.md）：AUTOMOTIVE LUXURY / FUTURISTIC SPATIAL / EDITORIAL MUSEUM 设计规则 + 融合配方（场景决定语法：摄影棚=LUXURY、能量空间=SPATIAL、知识页=MUSEUM）+ Token 映射与"CORE UI 禁用 backdrop-blur"边界规则
- **Scroll Narrative**（Playground MOTION 卡片）：gsap ScrollTrigger + scrub 四步叙事（1886→未来），onMounted 注册/onBeforeUnmount revert 可清理；浏览器实测透明度梯度 [1, 0.994, 0.877, 0.609]
### Fixed
- F13′ 再例证：批量补丁对多行化 import 静默失配（Scroll Narrative 数据丢失）——改用 Edit 精确匹配修复；playground 补 gsap 依赖

## [Evolution-2 三轮] 2026-11-05 — CORE UI 补齐 + Blender 研究 + DeLorean 骨架

### Added
- **CORE UI v0.3 六件**：Dropdown（点击外/Esc 关闭）/Tooltip（hover+focus）/Drawer（Esc+遮罩）/Search（⏎ 提交）/Select（原生基座+Token 皮肤）/Nav（aria-current）——接入 Playground 真实交互
- **Blender 自动化研究**（docs/08-research/blender-automation.md）：bpy 无头批处理/glTF 导出/自动命名/网格材质检查/优化——R 级（官方文档核实，GPL 资产边界澄清：导出资产不传染）；检查脚本骨架设计，**V 级待 Blender 环境落地**
- **DeLorean 专题骨架**（prototypes/delorean-showcase :5178）：真实 DMC-12（REAL）与影视改装时空车（FICTION）**Tab 显式区分**，IP 边界横幅（DMC 商标≠Universal 影视权），资产"待寻源不出示 3D"——不伪装红线落实

## [Evolution-2 续] 2026-11-05 — PHASE 2D/2E 深化

### Added

- **SPATIAL UI**：AvTeleportIndicator（三态充能环）/ AvExplorationHud（探索进度）+ 旗舰接入：顶部探索 HUD、传送充能指示、**3D 锚定部件标记**（逐帧世界坐标→屏幕投影 + 距离缩放 + 相机背后隐藏）
- **ENGINEERING UI**：AvInspector（confirmed/estimated 双可信度标注）+ AvAnnotation（编号旗标引线标注，锚定 GLB）
- **Shader Library 补齐全十项**：Scan/Fresnel/DigitalGrid/Outline(壳放大法)/Heatmap(高度+输入混合)/WireframeHandle 加入既有 Hologram/XRay/Dissolve/EnergyFlow
- **汽车材质预设库**：metallic-paint（官方 car 示例配方）/clearcoat-paint/carbon-fiber（程序化织纹）/brushed-metal（条纹 roughnessMap）/chrome/glass（transmission）/rubber/leather（sheen）/plastic/emissive——每预设附依据说明

### Fixed

- 旗舰 SPATIAL 分区 CSS：.hud 的 left/right 拉伸残留覆盖（right:auto）
- **F13′**：python 批量补丁锚点缩进不匹配静默跳过（updateSpatialAnchors 注入丢失）——.vue 不在 tsc 范围放大风险；已建立"补丁必校验命中"纪律
- 索引几何修复在旗舰 HUD 生效实证：25.8K → **108.9K tris**（与 inspect-glb 一致）

### Verified

- 工程面板/零件树选择→相机聚焦→全息铭牌/检查器（含 ≈ 标注）/X-RAY 全息视图 浏览器截图验证
- 门禁全绿：lint 0 / typecheck 0 / vitest 19/19 / build 全绿

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
