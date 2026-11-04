# 3D 引擎技术路线研究：Three.js / React Three Fiber / TresJS / Babylon.js

> 核实日期：2026-11-04 ｜ 状态：文献研究（原型验证由 framework-comparison 原型另行进行）｜ 研究员：AI Research Agent B

---

## 0. 研究方法与口径说明

- **核实方式**：全部通过 WebSearch（检索）+ WebFetch（直接抓取官方页面/官方仓库源文件/npm registry API）完成，版本号一律以 GitHub Releases、npm registry、官方源码 `package.json` 为准，不采用记忆数据。
- **下载数据口径**：npm 官方页面与 npm downloads API 在 2026-11-04 当日的"最近一周"数值。npm 下载量受 CI/镜像/打包器影响，仅作为**生态规模代理指标**，不代表真实用户数。
- **标注约定**：
  - 【官方确认事实】= 直接来自官方仓库/官方文档/npm registry/官方 release notes；
  - 【社区观点/推测】= 第三方文章、社区讨论或本研究基于数据的推断；
  - 检索不到的明确写 **"未能核实"**。
- **r16x/r17x 说明**：官方迁移指南（wiki）包含逐版本章节，本次逐条摘录核实范围为 **r169→r170 至 r186→r187**（覆盖 2025 下半年—2026 年底）；r16x 系列（2025 年上半年）各版本逐条变更**未能核实**（未逐条抓取），如需可后续补充。

---

## 1. 结论速览

| 路线 | 核心包 | 当前版本（核实日） | 许可证 | npm 周下载 | 汽车展馆场景推荐程度 |
|---|---|---|---|---|---|
| Vue3 + 原生 Three.js | `three` | 0.187.0（r187，2026-10-30） | MIT | ~3,349.8 万 | ★★★★★（建议主路线） |
| React + R3F | `@react-three/fiber` | 9.8.2（2026-10-15）；v10 alpha（WebGPU First） | MIT | ~946.4 万 | ★★★☆（技术成熟但与本仓库 Vue 栈不匹配） |
| Vue3 + TresJS | `@tresjs/core` | 5.10.1（2026-10-28） | MIT | ~5.3 万 | ★★★（观察采用，社区规模小） |
| Vue3 + Babylon.js | `@babylonjs/core` | 9.33.2（2026-11-02） | Apache-2.0 | ~36.7 万 | ★★★☆（重型交互/工具链场景备选） |

**一句话结论**：以 Vue 3 为既定技术栈的前提下，"Vue3 + 原生 Three.js（命令式封装自有声明层）"为当前风险最低、生态最大的主路线；TresJS 提供官方级 Vue 声明式体验但社区规模小、无生产就绪声明；Babylon.js 引擎能力最"全家桶"但 Vue 集成为社区扩展文档，且下载量级与 three 相差近两个数量级。

---

## 2. Three.js

### 2.1 当前版本与发布节奏

- 【官方确认事实】最新稳定版 **r187**（npm `three@0.187.0`），GitHub Releases 显示发布于 **2026-10-30**，npm 显示"5 天前发布"，两者一致。
  - 来源：GitHub Releases（https://github.com/mrdoob/three.js/releases ）；npm（https://www.npmjs.com/package/three ）。核实方式：WebFetch 官方页面。
- 【官方确认事实】近期 release 日期（GitHub Releases 页面显示）：
  - r184：2026-04-16；r185：2026-07-01；r186：2026-09-24；r187：2026-10-30。
- 【官方确认事实】r181 约 2025-10-29 发布（官方 milestone #94 closed）。r182 约 2025-12 月发布（社区 Reddit/论坛帖，**日期为社区来源，非官方页面直接核实**）。
- 【社区观点/推测】官方历史上（2023 年论坛答复）称发布节奏约为每月一个 r 版本（https://discourse.threejs.org/t/what-is-threes-release-cadence-and-deprecation-timeline/53186 ）。按 2026 年实测（4—10 月共 4 版），实际节奏约为 **4—8 周一版**，未找到 2026 年关于节奏变更的官方公告（未能核实是否有正式变更公告）。

### 2.2 WebGLRenderer 与 WebGPURenderer 现状

- 【官方确认事实】`WebGPURenderer` 官方类注释（r187 源码）自我定位为"**WebGLRenderer 的新替代方案（the new alternative of WebGLRenderer）**"，支持多后端：默认优先使用 WebGPU 后端，浏览器不支持时**回退到 WebGL 2 后端**。
  - 来源：three.js 仓库源文件 `src/renderers/webgpu/WebGPURenderer.js` 顶部 JSDoc（https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgpu/WebGPURenderer.js ）。核实方式：WebFetch 官方源码。
- 【官方确认事实】npm 包 `three` 的官方 `exports` 自 r187 起提供独立入口：`three/webgpu` → `./build/three.webgpu.js`，`three/tsl` → `./build/three.tsl.js`。
  - 来源：官方 `package.json`（https://raw.githubusercontent.com/mrdoob/three.js/dev/package.json ）。核实方式：WebFetch。
- 【官方确认事实】**没有任何官方发布将 WebGPURenderer 设为默认渲染器**；迁移指南 r170→r187 全程显示两条渲染管线并行演化（如 r186 从 WebGPURenderer 移除 PCFSoftShadowMap、r182 将 WebGLRenderer 的 PCFSoftShadowMap 标记弃用）。
  - 来源：官方 Migration Guide wiki（https://github.com/mrdoob/three.js/wiki/Migration-Guide ）。核实方式：WebFetch。
- 【官方确认事实】WebGPURenderer 功能近年快速成熟：r185 加入 WebXR with WebGPU 支持、descriptor 缓存、渲染到纹理数组；r186 加入级联阴影的 SunLight；r187 与 WebGLRenderer 共用基于 WeakRef/FinalizationRegistry 的资源管理。
  - 来源：GitHub Releases r185—r187 发布说明。核实方式：WebFetch。

### 2.3 TSL（Three Shading Language）官方状态

- 【官方确认事实】TSL 在官方文档拥有**独立的、成体系的 API 板块**（控制流 `If/Loop/Fn`、数学/纹理函数、compute 能力等），是 NodeMaterial 体系的基础，可同时编译到 WGSL（WebGPU）与 GLSL（WebGL 后端），并暴露 `compute`/原子操作等 GPU 计算能力。官方文档地址：https://threejs.org/docs/#api/en/nodes/TSL 。核实方式：WebFetch。
- 【官方确认事实】官方入口 `three/tsl` 已进入 npm 包 exports（见 2.2）；r184 发布说明称 TSL 编译性能提升约 3 倍。
  - 来源：官方 package.json；GitHub Releases r184 发布说明。核实方式：WebFetch。
- 【官方确认事实】TSL API 仍在频繁调整中（迁移指南可见 r170→r187 间大量 TSL 更名/迁移：`burn()`→`blendBurn()`、`uv()`→`sample()`、`varying()`→`toVarying()`、`label()`→`setName()` 等），**属于"官方一等公民 + API 仍在快速演化"状态**；文档页面未标注 stable/experimental 字样。

### 2.4 下载量、许可证与记录卡

- 【官方确认事实】npm 周下载 **33,498,264**（2026-11-04，npm 官方页面）；许可证 **MIT**。
  - 来源：npm（https://www.npmjs.com/package/three ）。

| 项目 | 记录 |
|---|---|
| 当前版本 | 0.187.0（r187，2026-10-30） |
| 许可证 | MIT |
| 商业使用限制 | 无商用限制；需在分发物中保留版权与许可声明（MIT 许可证文本一般条款） |
| 推荐程度（汽车展馆） | ★★★★★ 建议作为主路线渲染底座 |
| 适用范围 | 展馆级渲染、车漆/玻璃/灯光材质、GLTF/Draco/KTX2 资产管线、后期处理 |
| 风险与局限 | ① r 系列快速迭代伴随持续 breaking changes（详见第 7 节，r170→r187 每版均有弃用/移除/更名）；② WebGPU/TSL 管线 API 仍在演化，早期采用需锁版本并跟迁移指南；③ 原生命令式 API，Vue 下需自行封装组件层 |

---

## 3. React Three Fiber + drei（pmndrs 生态）

### 3.1 版本与 React 19 兼容

- 【官方确认事实】`@react-three/fiber` 最新稳定版 **9.8.2**（GitHub Releases：2026-10-15），npm 周下载 **9,464,231**，许可证 MIT。
  - 来源：npm（https://www.npmjs.com/package/@react-three/fiber ）；GitHub Releases（https://github.com/pmndrs/react-three-fiber/releases ）。
- 【官方确认事实】**React 19 兼容**：v9.8.0（2026-09-22）的主要特性为 React 19.3 兼容（"不再与最新 React 冲突"，但未支持全部新 API）。
  - 来源：官方 GitHub Releases v9.8.0 说明。
- 【官方确认事实】**v10 处于 alpha 阶段，主题"Going WebGPU First"**（v10.0.0-alpha.6，2026-10-17）：WebGPURenderer 将成为默认渲染器（传统 WebGL 走 `@react-three/fiber/legacy` 入口）、TSL 相关 hooks 移至 `@react-three/tsl`、`/webgpu` 入口弃用、`state.gl` 更名 `state.renderer`；v10 alpha.4 起要求 `three >= 0.185`；alpha 系列声明支持 React 19.3。
  - 来源：官方 GitHub Releases（v10.0.0-alpha.4/5/6 说明）。
- 【官方确认事实】`@react-three/drei` 最新版 **10.7.9**（npm 显示约 1 个月前发布），周下载 **6,039,244**，MIT；peerDependencies：`react: ^19`、`three: >=0.159`、`@react-three/fiber: ^9.0.0`（npm registry 最新版元数据）。
  - 来源：npm（https://www.npmjs.com/package/@react-three/drei ）；npm registry API（https://registry.npmjs.org/@react-three/drei/latest ）。核实方式：WebFetch。
- 【官方确认事实】drei 基于 `three-stdlib`（而非 `three/examples/jsm`）提供加载器与工具；npm 页面显示其依赖 21 个包。

### 3.2 与 Three.js 版本兼容节奏

- 【官方确认事实】drei 10.x 兼容 `three >= 0.159`（宽区间）；R3F v10 alpha 要求 `three >= 0.185` 并以 WebGPU/TSL API 为核心。即：**v9/drei10 时代对旧 three 宽松，v10 起绑定新版 three**。
- 【社区观点/推测】pmndrs 生态（fiber/drei/postprocessing/xr 等）通常在 three 新 r 版发布后数周内跟进适配；本次未逐项核实跟进时延。

### 3.3 记录卡

| 项目 | 记录 |
|---|---|
| 当前版本 | fiber 9.8.2（2026-10-15）；drei 10.7.9；@react-three/postprocessing 3.2.2（peer：react ^19、three >=0.156、fiber >=9.7、postprocessing ^6.36） |
| 许可证 | MIT（fiber/drei/postprocessing 均 MIT） |
| 商业使用限制 | 无商用限制；保留版权与许可声明即可 |
| 推荐程度（汽车展馆） | ★★★☆：声明式 3D 方案中生态最成熟；但 peer 依赖 React ^19，与本仓库 Vue 3 栈冲突，除非前端栈改用 React 否则不适用 |
| 适用范围 | React 技术栈的声明式 3D、与 React 生态（状态管理、SSR 框架）深度集成 |
| 风险与局限 | ① drei 10.x 硬性要求 React ^19（旧 React 项目需先升级）；② v10 将默认切到 WebGPURenderer（alpha 阶段，API 变动大）；③ 框架锁定 React，跨栈迁移成本高 |

---

## 4. TresJS（Vue 的声明式 three.js 方案）

### 4.1 版本与维护活跃度

- 【官方确认事实】`@tresjs/core` 最新版 **5.10.1**，发布于 **2026-10-28**（GitHub Releases 与 npm"7 天前发布"一致），npm 周下载 **53,189**，许可证 MIT；peerDependencies：`vue >= 3.4`、`three >= 0.133`（npm registry 元数据）。
  - 来源：npm（https://www.npmjs.com/package/@tresjs/core ）；npm registry API（https://registry.npmjs.org/@tresjs/core/latest ）；GitHub Releases（https://github.com/Tresjs/tres/releases ）。
- 【官方确认事实】维护活跃（截至核实日）：
  - 仓库统计：约 3.8k stars、201 forks、88 个 open issues、7 个 open PR、main 分支 2,739 次提交（GitHub 仓库页，2026-11-04 抓取）；
  - 发版节奏：2026-10-22 与 2026-10-28 两个批次发布（core 5.10.0/5.10.1、cientos 5.10.x、post-processing 3.11.x、nuxt 5.8.x、rapier 1.2.x、leches 1.3.3），core 与生态包**版本号同步联动**；
  - 5.10.0 为 core/cientos/nuxt 增加了 WebGPU 入口（#1543）；
  - 历史发版（GitHub Releases 页面）均由同一维护者（alvarosabu）发布——【本研究观察】存在一定的单点维护集中度。
- 【官方确认事实】核心定位：基于 Vue Custom Renderer API 的声明式 ThreeJS；官方生态含 Cientos（辅助组件库）、post-processing（后期处理）、Nuxt 模块、rapier（物理）、leches/TresLeches（调试面板）、官方 devtools。文档站 https://docs.tresjs.org 显示当前版本 5.10.1。

### 4.2 是否生产可用（谨慎结论）

- 【官方确认事实】官方文档站与 GitHub README **均未发现明确的"production ready"声明**（docs.tresjs.org 首页仅含"Create awesome Three-based experiences with the framework you love"等表述；README 表述目标为让 Vue 社区便捷使用 three.js）。
- 【官方确认事实】可核实的生产采用证据有限：npm 页面显示 24 个依赖方（dependents）、周下载 5.3 万量级——**比 R3F 低约两个数量级**。
- 【社区观点/推测】综合判断：TresJS 处于"**活跃维护的成熟早期/成长期**"——版本号已到 5.x、发版规范、有 devtools 与文档，但社区规模小、无生产就绪背书、核心发版集中于单一维护者。用于汽车展馆这类高规格项目时，建议以"原型验证通过 + 锁定版本 + 准备好绕过封装直写 three.js 的降级预案"为前提谨慎采用。
- 【官方确认事实】已知集成要求：Vite 项目需在 Vue 插件配置中注入 `templateCompilerOptions`（自定义渲染器要求），否则有控制台警告（npm README）。

### 4.3 记录卡

| 项目 | 记录 |
|---|---|
| 当前版本 | @tresjs/core 5.10.1（2026-10-28） |
| 许可证 | MIT |
| 商业使用限制 | 无商用限制；保留版权与许可声明即可 |
| 推荐程度（汽车展馆） | ★★★：Vue 生态内体验最顺的声明式方案，可作为观察/备选路线；进入主路线前需原型验证与风险预案 |
| 适用范围 | Vue3/Nuxt 声明式 3D 场景、中小型 3D 交互；团队希望"Vue 组件即 3D 节点" |
| 风险与局限 | ① 无官方生产就绪声明；② 社区规模小（周下载 5.3 万、依赖方 24 个）；③ 发版集中于单一维护者；④ 生态包与 core 版本强耦合（升级需整体对齐）；⑤ 相对 R3F 缺少大规模案例背书 |

---

## 5. Babylon.js

### 5.1 当前版本与发布节奏

- 【官方确认事实】`@babylonjs/core` 最新版 **9.33.2**，发布于 **2026-11-02**（GitHub Releases 与 npm"2 天前发布"一致），npm 周下载 **367,495**，许可证 **Apache-2.0**。旧包 `babylonjs`（非 scoped）周下载仅 **38,718**（2026-10-28 至 11-03 区间）——官方主推 scoped 新包。
  - 来源：npm（https://www.npmjs.com/package/@babylonjs/core ）；npm downloads API（https://api.npmjs.org/downloads/point/last-week/babylonjs ）；GitHub Releases（https://github.com/BabylonJS/Babylon.js/releases ）。
- 【官方确认事实】发布节奏极快（约每周一个 minor/patch）：9.28.0（2026-09-24）→ 9.33.2（2026-11-02），共 10 个版本。
- 【官方确认事实】近期版本亮点（GitHub Releases 发布说明）：WebGPU 持续增强（half-float 回读、GPU frame time、canvas tone mapping）、Gaussian Splatting 的 WebGPU GPU 深度排序、**KTX2 编码器（基于 Basis Universal，9.33.1）**、glTF `KHR_materials_scatter` 支持（9.33.0）、Node Render Graph Editor 新增 frame graph reducer 块（9.29.0）、Inspector Lite 持续完善。

### 5.2 Playground / Arcade / Node Material Editor 生态

- 【官方确认事实】**Playground**（https://playground.babylonjs.com ）为官方在线场景编辑器；官方站提供游戏展示页 https://www.babylonjs.com/games 与社区 Demo 页 https://www.babylonjs.com/community 。
  - 来源：官方站点（搜索结果直接命中 babylonjs.com 域名下页面）。核实方式：WebSearch。
- 【官方确认事实】**Node Material Editor（NME）**：官方可视化着色器编辑器，现役地址 https://nodematerial-editor.babylonjs.com ，官方文档 https://doc.babylonjs.com/toolsAndResources/nme （"This visual editor lets you connect blocks together to make shaders"）；另有 Node Render Graph Editor（后处理/渲染图）随 9.29.0 等版本持续更新。
  - 来源：doc.babylonjs.com 官方文档；GitHub Releases。核实方式：WebSearch + WebFetch。
- **Arcade**：任务关注点之一，但 `arcade.babylonjs.com` 直接访问**超时未能核实**，搜索亦未命中该域名下的官方页面；官方站可核实的对应入口为 /games 与 /community 页。结论：**"Arcade 生态"现状未能核实**（不排除该子站已下线或更名）。
- 【官方确认事实】Babylon 官方论坛（forum.babylonjs.com）活跃，Vue 相关多篇社区实验帖。

### 5.3 与 Vue 3 结合方式

- 【官方确认事实】官方文档提供 Vue 集成系列，但位于 **communityExtensions（社区扩展）板块**，不在核心文档：总览页 https://doc.babylonjs.com/communityExtensions/Babylon.js+ExternalLibraries/BabylonJS_and_Vue ，含 Vue 3 安装与组件基础、异步场景方法（组件→场景命令 + 回调）、消息驱动场景（Vue↔Babylon 消息总线）等模式。
  - 来源：doc.babylonjs.com。核实方式：WebSearch（结果直接命中官方域名页面）。
- 【社区观点/推测】即 Babylon 官方**未提供**类似 R3F/TresJS 的声明式 Vue 渲染器；与 Vue 3 结合的惯用做法是：在 Vue 组件生命周期中初始化 Engine/Scene，通过 props/事件桥接或消息总线通信。社区第三方封装存在（如 Beg-in/vue-babylonjs 等），但**未核实其维护状态**，不建议据此决策。

### 5.4 记录卡

| 项目 | 记录 |
|---|---|
| 当前版本 | @babylonjs/core 9.33.2（2026-11-02）；约每周发版 |
| 许可证 | Apache-2.0 |
| 商业使用限制 | 允许商用；需保留 LICENSE/NOTICE 声明并标注修改（Apache-2.0 许可证文本一般条款，含专利授权条款） |
| 推荐程度（汽车展馆） | ★★★☆：引擎能力最全面（物理/GUI/粒子/着色器编辑器/Inspector 一站式），适合重交互、重工具链项目；Vue 集成为社区扩展文档，需自建组件桥接层 |
| 适用范围 | 复杂交互展项（配置器、试驾模拟、漫游）、需要可视化着色器/材质编辑与内置调试器的团队 |
| 风险与局限 | ① npm 下载量级（36.7 万）与 three（3,349.8 万）差约两个数量级，招聘/资料/模型库生态偏弱；② Vue 声明式层需自研；③ 发版极快（周更）意味着 API 与示例更新频繁，锁版本策略更重要；④ "Arcade 生态"现状未能核实 |

---

## 6. 三条路线对比（"汽车 3D 展馆"场景定性比较）

> 场景设定：Vue 3 前端 + WebGL（逐步过渡 WebGPU）渲染整车与展厅，重材质表现（车漆/玻璃/皮革）、GLTF+Draco/KTX2 资产管线、多终端性能预算。
> 除标注外，本节为**本研究定性分析（社区观点/推测）**，数据性结论引用上文已核实事实。

### 6.1 声明式 vs 命令式

| 路线 | 范式 | 定性评价 |
|---|---|---|
| Vue3 + 原生 Three.js | 命令式 | 【官方确认事实】three.js 本体为命令式 API。需要团队自建"场景图 ↔ Vue 组件"桥接层（如组合式函数 + 生命周期管理 dispose）。控制力最强、无中间抽象损耗，但样板代码多；r187 已将 Object3D 纳入统一 `dispose()`、渲染器改用 WeakRef/FinalizationRegistry 自动回收（官方迁移指南），资源管理负担略降 |
| React + R3F | 声明式 | 【官方确认事实】R3F 以 React 组件树承载 three 场景图，v9 稳定、v10 转向 WebGPU First。生态最成熟；但与本仓库 Vue 栈互斥 |
| Vue3 + TresJS | 声明式 | 【官方确认事实】基于 Vue Custom Renderer，Vue 组件即 3D 节点，与 Vue 开发体验最贴近。成熟度低于 R3F（见 4.2） |
| Vue3 + Babylon.js | 命令式 | 【官方确认事实】官方 Vue 集成仅为社区扩展文档；等同"命令式 + 自建桥接"，且桥接层无官方维护 |

**小结**：若追求声明式且留在 Vue，只有 TresJS 一个选项；若接受命令式，原生 three.js 与 Babylon.js 均需自建组件层——两者工作量同级，而 three.js 的桥接方案在社区有大量成熟范式（推测）。

### 6.2 后期处理生态

- 【官方确认事实】three.js 内置 PostProcessing 管线（WebGPU 侧）——r183 起 `PostProcessing` 更名 `RenderPipeline`（官方迁移指南）；WebGL 侧传统 EffectComposer/Pass 体系持续维护（r174/r176 迁移指南可见 SMAAPass 等调整；r185 移除 AnamorphicNode 改用 BloomNode、TiledLighting 改为 ClusteredLighting）。
- 【官方确认事实】R3F 侧有独立 `@react-three/postprocessing`（当前 3.2.2，peer 要求 fiber >=9.7、three >=0.156），基于 `postprocessing` 库（^6.36）。
- 【官方确认事实】TresJS 侧有官方 `@tresjs/post-processing`（3.11.1，2026-10-28 与 core 5.10.1 同步发版）。
- 【官方确认事实】Babylon.js 内置后处理 + **Node Render Graph Editor**（可视化编排后处理图，9.29.0 起新增 frame graph reducer 等块）。
- 【定性】三条路线后期处理能力均"够用"；差异在形态：three 系为节点/Pass 组合（代码），Babylon 提供官方可视化编辑器。汽车展馆常见的 Bloom/DOF/色调映射/SSAO 在四者均有官方支持（Babylon 的 Inspector Lite、three 的 RenderPipeline 均在活跃迭代——官方 release notes）。

### 6.3 模型加载（GLTFLoader / Draco / KTX2）

- 【官方确认事实】three.js 官方 `GLTFLoader`（examples/jsm）明确支持：`setDRACOLoader`（KHR_draco_mesh_compression）、`setKTX2Loader`（KTX2 压缩纹理）、`setMeshoptDecoder`（EXT_meshopt_compression）；内置大量 KHR 扩展，部分扩展经插件注册（KHR_materials_variants 等）。
  - 来源：官方源文件 `examples/jsm/loaders/GLTFLoader.js` 头部 JSDoc。核实方式：WebFetch。
- 【官方确认事实】Babylon.js 9.33.1 新增基于 Basis Universal 的 KTX2 编码器；9.33.0 支持 glTF KHR_materials_scatter 导入/导出；Gaussian Splatting 持续增强（官方 Releases）。
- 【官方确认事实】资产压缩的三件套（Draco 网格压缩、KTX2/Basis 纹理压缩、meshopt）在 three.js 与 Babylon.js 均有官方支持；TresJS/R3F 因直接复用 three 生态，能力随 three 版本继承（R3F v10 要求 three >=0.185，drei 基于 three-stdlib——官方元数据）。
- 【定性】对"汽车展馆"最关键的**大模型 + 纹理压缩管线**，two 条自建路线（原生 three / Babylon）均为第一方官方能力；声明式路线继承 three 能力。

### 6.4 学习曲线（社区观点/推测）

- 原生 Three.js：学习曲线最陡（需理解场景图、渲染循环、材质系统、资源回收），但资料/教程/案例最多（周下载 3,349.8 万——官方可核实规模指标）。
- R3F/TresJS：把 three 概念映射为组件树，入门快；但排查"组件抽象之外"的问题仍需回到 three 原生知识。
- Babylon.js：引擎概念最全（Scene/Engine/Node 体系 + 官方 Playground 与文档站），单引擎资料闭环好；API 面大，深度使用成本不低。

### 6.5 社区规模（可核实代理指标，2026-11-04）

| 包 | 周下载（npm 官方） | 备注 |
|---|---|---|
| three | 33,498,264 | 含构建工具/CDN 放大效应（口径说明见第 0 节） |
| @react-three/fiber | 9,464,231 | |
| @react-three/drei | 6,039,244 | |
| @babylonjs/core | 367,495 | 另有旧包 babylonjs 38,718/周 |
| @tresjs/core | 53,189 | |

- 【官方确认事实】TresJS 仓库约 3.8k stars（GitHub 页面抓取）；R3F 与 Babylon 仓库 star 数本次**未能核实**（未抓取）。

### 6.6 长期风险

- 【官方确认事实层面】
  - three.js：升级风险常态化（r170→r187 每版均有弃用/移除，见第 7 节）；但项目活跃度、下载规模、官方入口（three/webgpu、three/tsl）明确，长期存续风险最低。
  - R3F：v10 大改（WebGPU First、入口重构）在即（alpha），选型时应按 v9 稳定 + v10 演化双轨评估。
  - TresJS：单点维护集中 + 无生产背书是最大结构性风险；但其"始终跟进最新 three"策略（官方 README 表述）在 three 快速迭代下既是优势也是跟随风险。
  - Babylon：由 Microsoft 支持的背景属【社区观点/推测】（本次未核实其组织归属现状）；引擎本身周更活跃为【官方确认事实】。周更节奏要求更强的版本锁定纪律。
- 【本研究判断（推测）】对 AUTOVERSE 的"汽车文明数字宇宙"：主路线建议 **Vue3 + 原生 Three.js**（生态最大、资产管线官方完备、升级风险可通过锁 r 小版本 + 迁移指南管控）；**TresJS 作为声明式增强层**待原型验证；**Babylon.js 保留为重交互展项备选**；R3F 仅在前端栈转向 React 时重启评估。

---

## 7. 2025–2026 Three.js 重要变化时间线（官方迁移指南摘录，r169→r187）

> 来源：官方 Migration Guide wiki（https://github.com/mrdoob/three.js/wiki/Migration-Guide ）。核实方式：WebFetch（2026-11-04）。r16x 各版本（2025 上半年）逐条变更未能核实。

| 版本跨度 | 关键变化（与本项目相关者） |
|---|---|
| r169→170 | `Material.type` 变为不可变；部分 TSL 模块移至 addons |
| r170→171 | **导入拆分：`three/webgpu` 与 `three/tsl`**（WebGPU/TSL 代码迁移官方入口）；TSL 混合函数更名（`burn()`→`blendBurn()` 等） |
| r171→172 | `TextureNode.uv()`→`sample()`；雾函数重构；`PostProcessingUtils`→`RendererUtils` |
| r172→173 | `MeshGouraudMaterial` 弃用；`varying()`→`toVarying()`；RenderTarget.clone() 不再共享纹理 |
| r174→175 | `Controls.connect()` 必须传 DOM 元素；SMAAPass 等构造函数变更 |
| r176→177 | ColorManagement 方法更名；PeppersGhostEffect 移除 |
| r178→179 | Timer 移入核心；USDZLoader 弃用（改 USDLoader）；TSL `label()`→`setName()` |
| r179→180 | **RGBELoader 更名 HDRLoader**；RGBMLoader 移除；`renderAsync()` 等 async 渲染方法弃用（同步 API 要求先 `setAnimationLoop()` 或 `await renderer.init()`）；**官方 API 文档改为 JSDoc 生成、仅英文** |
| r180→181 | **PBR 能量守恒与间接高光计算变化（材质观感改变）**；`PI2`→`TWO_PI` |
| r181→182 | **WebGLRenderer 的 PCFSoftShadowMap 弃用**（PCFShadowMap 已等效柔和）；WebGPURenderer `colorBufferType`→`outputBufferType` |
| r182→183 | **`PostProcessing` 更名 `RenderPipeline`；`Clock` 弃用（改用 Timer）**；WebGPU 阴影改进需调低 shadow bias；WebGLCubeRenderTarget 不可用于 WebGPURenderer（改用 CubeRenderTarget） |
| r183→184 | 环境贴图旋转与物体旋转对齐；**FBXLoader 自动 +Z-up→+Y-up**；TSL 编译性能约 3 倍提升（Releases 说明）；新增 HTMLTexture |
| r184→185 | WebGPURenderer 预乘 alpha 实现变更；AnamorphicNode 移除（改 BloomNode）；**TiledLighting 移除（改 ClusteredLighting）**；WebXR with WebGPU、descriptor 缓存（Releases 说明） |
| r185→186 | Object3D 新增 `dispose()`；**PCFSoftShadowMap 从 WebGPURenderer 移除**；SunLight 级联阴影、retroreflectivity 材质（Releases 说明） |
| r186→187 | **PMREM 改用 cube render targets、`CubeUVReflectionMapping` 移除（材质观感微变）**；渲染器内部改用 WeakRef/FinalizationRegistry；TSL 数学函数隐式类型提升 |

**WebGPU 管线成熟度小结（官方确认事实）**：r171 起官方导入入口独立 → r180 async API 收敛 → r183 RenderPipeline 统一后处理 → r185 WebXR/纹理数组 → r186 级联阴影 → r187 与 WebGL 管线共享资源管理。**全程 WebGLRenderer 未被移除或降级为弃用**，双管线并行是官方现状。

---

## 8. 风险与局限汇总表

| 引擎/路线 | 主要风险 | 缓解措施（建议，属本研究判断） |
|---|---|---|
| Three.js（原生） | r 版本快速迭代 breaking changes；WebGPU/TSL API 演化 | 锁定 r 小版本；升级时逐条核对官方 Migration Guide wiki；WebGPU 特性以 `three/webgpu` 独立入口隔离 |
| R3F + drei | 与 Vue 栈互斥；drei 10 硬要求 React ^19；v10 大改在即 | 仅在技术栈转向 React 时评估；先等 v10 出 alpha |
| TresJS | 无生产就绪声明；社区规模小；单点维护 | 先原型验证；锁版本；封装层留直写 three.js 的逃生通道 |
| Babylon.js | Vue 无官方声明式层；周更节奏；生态量级较小 | 自建精简桥接组件；严格锁定 minor 版本；用于重交互展项而非全站 |

---

## 9. 未能核实事项（诚实清单）

1. **Babylon.js "Arcade" 生态现状**：`arcade.babylonjs.com` 访问超时、搜索未命中官方页面 → 未能核实。
2. **three.js 2026 年发布节奏是否官方调整**：未找到正式公告 → 未能核实（仅有实测节奏：约 4—8 周一版）。
3. **three.js r16x 系列（2025 上半年）逐条 breaking changes**：本次核实范围为 r170→r187，r16x 逐条未抓取 → 未能核实。
4. **R3F / Babylon 仓库 star 数、TresJS 贡献者结构细节**：未抓取对应页面 → 未能核实。
5. **TSL 官方 stable/experimental 标注**：文档页面无该字样 → 以"官方一等公民 + API 持续演化"描述。
6. **Babylon.js 当前组织支持背景（如 Microsoft 关系现状）**：本次未检索官方声明 → 未能核实。
7. **第三方 Vue-Babylon 封装（vue-babylonjs 等）维护状态**：未核实 → 不作为决策依据。

---

## 10. 核实记录表

| # | 核实项 | 来源 URL | 核实日期 |
|---|---|---|---|
| 1 | three.js 最新版 r187 / 0.187.0、发布日期 | https://github.com/mrdoob/three.js/releases | 2026-11-04 |
| 2 | three npm 周下载 33,498,264、MIT、5 天前发布 | https://www.npmjs.com/package/three | 2026-11-04 |
| 3 | three 官方 exports：three/webgpu、three/tsl、版本 0.187.0 | https://raw.githubusercontent.com/mrdoob/three.js/dev/package.json | 2026-11-04 |
| 4 | WebGPURenderer 官方定位（WebGLRenderer 新替代、WebGPU 优先 + WebGL2 回退） | https://raw.githubusercontent.com/mrdoob/three.js/dev/src/renderers/webgpu/WebGPURenderer.js | 2026-11-04 |
| 5 | TSL 官方 API 板块与能力 | https://threejs.org/docs/#api/en/nodes/TSL | 2026-11-04 |
| 6 | three.js r169→r187 迁移要点（第 7 节全部条目） | https://github.com/mrdoob/three.js/wiki/Migration-Guide | 2026-11-04 |
| 7 | r181 约 2025-10-29 发布（milestone #94） | https://github.com/mrdoob/three.js/milestone/94?closed=1 | 2026-11-04 |
| 8 | GLTFLoader 官方支持 Draco/KTX2/meshopt | https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/loaders/GLTFLoader.js | 2026-11-04 |
| 9 | @react-three/fiber 9.8.2、周下载 9,464,231、MIT | https://www.npmjs.com/package/@react-three/fiber | 2026-11-04 |
| 10 | R3F releases：v10 alpha "Going WebGPU First"、React 19.3、three>=0.185 | https://github.com/pmndrs/react-three-fiber/releases | 2026-11-04 |
| 11 | @react-three/drei 10.7.9、peer（react ^19 / three >=0.159 / fiber ^9） | https://registry.npmjs.org/@react-three/drei/latest | 2026-11-04 |
| 12 | @react-three/postprocessing 3.2.2 及 peer | https://registry.npmjs.org/@react-three/postprocessing/latest | 2026-11-04 |
| 13 | @tresjs/core 5.10.1、周下载 53,189、MIT | https://www.npmjs.com/package/@tresjs/core | 2026-11-04 |
| 14 | @tresjs/core peer：vue >=3.4、three >=0.133 | https://registry.npmjs.org/@tresjs/core/latest | 2026-11-04 |
| 15 | TresJS 仓库活跃度（3.8k stars、2739 commits、88 open issues） | https://github.com/Tresjs/tres | 2026-11-04 |
| 16 | TresJS 2026-10-22/28 发版批次、5.10.0 WebGPU 入口、alvarosabu 发布 | https://github.com/Tresjs/tres/releases | 2026-11-04 |
| 17 | TresJS 文档站版本 5.10.1、生态（Cientos/post-processing/Nuxt/devtools）、无生产就绪声明 | https://docs.tresjs.org/ | 2026-11-04 |
| 18 | @babylonjs/core 9.33.2、周下载 367,495、Apache-2.0 | https://www.npmjs.com/package/@babylonjs/core | 2026-11-04 |
| 19 | Babylon releases：9.28.0—9.33.2（2026-09-24—11-02）、KTX2 编码器、NME/NRGE、Inspector Lite | https://github.com/BabylonJS/Babylon.js/releases | 2026-11-04 |
| 20 | 旧包 babylonjs 周下载 38,718 | https://api.npmjs.org/downloads/point/last-week/babylonjs | 2026-11-04 |
| 21 | Babylon 官方 Playground / games / community 页 | https://playground.babylonjs.com ；https://www.babylonjs.com/games ；https://www.babylonjs.com/community | 2026-11-04 |
| 22 | Babylon Node Material Editor 官方地址与文档 | https://nodematerial-editor.babylonjs.com ；https://doc.babylonjs.com/toolsAndResources/nme | 2026-11-04 |
| 23 | Babylon+Vue 官方文档（communityExtensions 板块） | https://doc.babylonjs.com/communityExtensions/Babylon.js+ExternalLibraries/BabylonJS_and_Vue | 2026-11-04 |
| 24 | three.js 发布节奏历史答复（论坛） | https://discourse.threejs.org/t/what-is-threes-release-cadence-and-deprecation-timeline/53186 | 2026-11-04 |

---

*本文档为文献研究成果；所有【官方确认事实】均可在上表来源复现。框架选型的最终决策需结合 framework-comparison 原型的实测数据（另行进行）。*
