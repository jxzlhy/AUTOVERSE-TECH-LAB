# 前端框架选型研究：Vue 3 与 React（3D 沉浸式展示网站场景）

> 核实日期：2026-11-04 ｜ 状态：文献研究（未做原型验证）｜ 研究员：AI Research Agent A

## 0. 结论速览（先读这里）

| 维度 | Vue 3 | React |
|---|---|---|
| 最新稳定版 | **3.5.44**（2026-10-13 发布） | **19.3.x**（19.3 于 2026-09-09 发布） |
| 下一代大版本 | 3.6 处于 **RC 阶段**（v3.6.0-rc.14，2026-10-30），Vapor Mode 为核心特性，尚未稳定 | 19.3 为当前 minor 线；无公开的 20 路线图结论（未能核实） |
| 3D 封装层 | TresJS core **5.10.1** | @react-three/fiber（R3F）**9.8.2** |
| 许可证 | MIT | MIT |
| 本项目推荐度 | **高**（配合 TresJS + Pinia） | **高**（配合 R3F + Zustand/Jotai） |

> 推荐度为研究员基于官方事实的分析判断，属于【分析建议】而非官方结论。两条路线均可支撑汽车文明数字宇宙的 3D 沉浸式展示站，最终建议结合 `docs/03-technology/3d-engines.md` 的渲染内核结论综合决策。

## 1. 研究方法与信息分级

- **核实方式**：WebFetch 直接抓取官方页面原文（vuejs.org、react.dev、vite.dev、GitHub Releases、npm registry JSON），WebSearch 用于定位来源。
- **信息分级**：本文严格区分三类标注——
  - 【官方确认事实】：来自官方仓库/官网/官方账号的可核对原文；
  - 【社区观点/推测】：博客、论坛、第三方转述，未获官方确认；
  - 【分析建议】：研究员基于官方事实做出的工程判断。
- 版本号核实途径说明：任务下发方已于 2026-11-04 通过 npm registry（registry.npmjs.org）核实 Vue 3.5.44、React 19.3.x、TresJS 5.10.1、R3F 9.8.2 及 Vue/React 的 MIT 许可；研究员另行通过 GitHub Releases 与 npm registry JSON 独立复核了其中大部分条目（见文末核实记录表）。

## 2. Vue 3

### 2.1 版本现状

【官方确认事实】
- 当前最新稳定版为 **3.5.44**，GitHub Releases 页将其标记为 "Latest"，发布于 2026-10-13（commit bf5f0dd）。来源：[vuejs/core Releases](https://github.com/vuejs/core/releases)（核实方式：WebFetch 抓取 Releases 页原文；npm latest 由任务下发方经 npm registry 核实）。
- 稳定线另有 v3.5.43（2026-09-17）等补丁版本滚动发布。来源同上。

【官方确认事实】Vue 3.6 预发布状态
- **v3.6.0-rc.14** 发布于 2026-10-30，rc 序列自 2026-09-04（rc.7）起持续滚动；Releases 页面**已不再出现 beta/alpha 标签**，说明 3.6 处于 RC（发布候选）阶段，**稳定版尚未发布**。来源：[vuejs/core Releases](https://github.com/vuejs/core/releases)（WebFetch）。
- vuejs/core 的 GitHub Releases 均无详细文字说明，官方指引查阅 minor 分支 CHANGELOG.md（本次未逐条核对 changelog 内容）。

### 2.2 Composition API 现状

【官方确认事实】（来源：[Vue 官方 Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html)，核实方式：WebFetch 抓取原文）
- Composition API 是 Vue 3 与 Vue 2.7 的**内置能力**；在 SFC 中主要与 `<script setup>` 语法搭配使用。
- 官方明确其在大型项目中的价值："Composition API provides better long term scalability"；"The primary advantage of Composition API is that it enables clean, efficient logic reuse in the form of Composable functions"。
- 类型方面："Code written in Composition API can enjoy full type inference with little need for manual type hints."
- **Options API 不会被废弃**："we do not have any plan to do so"，官方将其定位为中低复杂度场景的"有护栏"选择；两者可在同一代码库共存。

结论（【官方确认事实】）：Composition API 与 `<script setup>` 是当前 Vue 3 的官方推荐主流写法，已完全成熟，新项目可直接全量采用，不存在"等待完善"的问题。

### 2.3 Vapor Mode 与 Vue 3.6

【官方确认事实】
- Vapor Mode 是 Vue 官方提出的**可选（opt-in）编译策略**，将模板直接编译为优化后的命令式 DOM 操作，跳过虚拟 DOM。来源：Vue 官方博客 [2022 Year In Review](https://blog.vuejs.org/posts/2022-year-in-review)（其中首次系统介绍该实验性策略，WebFetch/WebSearch 核实存在性与定位）。
- Vue 官方 X 账号宣布 **Vue 3.6.0-beta.1 时 Vapor 的目标特性集已完成、达成特性对等（feature parity）**。来源：[Vue 官方账号公告](https://x.com/vuejs/status/2003469481163784611)（核实方式：WebSearch 命中官方账号原文转述）。
- 结合 GitHub Releases 可确认：截至核实日，Vapor Mode 随 3.6 处于 **RC 阶段，尚未进入任何稳定版本**（来源：[vuejs/core Releases](https://github.com/vuejs/core/releases)，WebFetch）。

【社区观点/推测】（均未获官方确认）
- 稳定版发布时间"预计 2026 年 Q4"——来自第三方文章预测（如 [Medium: Vue 3.6 Vapor Mode](https://sadiqueali.medium.com/vue-3-6-vapor-mode-the-rendering-revolution-you-need-to-know-d39e3388f659)），**官方未给出承诺日期，未能核实**。
- "Vue 3.6 响应式系统重构采用 Alien Signals"——来自 Reddit r/vuejs 等社区报道（[示例](https://www.reddit.com/r/vuejs/comments/1v0s5bt/vue_36_just_entered_rc_stage)），**未能从官方文档直接核实**，引用需谨慎。
- 生态兼容风险：有社区讨论指出 Vapor Mode 暂不支持 `getCurrentInstance`，深度依赖该 API 的组件库（如 Vuetify）无法完整适配。来源：[Vuetify GitHub Discussion #22149](https://github.com/vuetifyjs/vuetify/discussions/22149)（社区来源）。

对本项目的影响（【分析建议】）：3D 沉浸式站的性能瓶颈在 GPU/WebGL 渲染与资源管线，而非 VDOM diff，Vapor 对 3D 场景本身的收益有限；但其对高频更新 UI（转速表、实时参数面板）可能有收益。**当前阶段应基于 Vue 3.5.x 稳定线设计，不为 Vapor 推迟任何决策**；待 3.6 稳定后再评估局部启用。

### 2.4 生态：Vite 官方合作、是否需要 Nuxt

【官方确认事实】
- **create-vue 是 vuejs 官方脚手架**，README 明确："The recommended way to start a Vite-powered Vue project"、"Vue CLI is based on webpack, while create-vue is based on Vite"。来源：[vuejs/create-vue](https://github.com/vuejs/create-vue)（WebFetch）。即：Vue 官方工具链与 Vite 是**绑定关系**，新 Vue 项目默认 Vite。
- **Vite 由 VoidZero 维护**：官网标注 "[By VoidZero](https://voidzero.dev)"，页脚版权 "© 2019-present VoidZero Inc. and Vite contributors"；官网显示当前版本 **v8.3.4**；许可声明原文 "Vite is MIT Licensed and will always be free and open source"。来源：[vite.dev](https://vite.dev/)（WebFetch）。
- VoidZero 由 Vue/Vite 作者 Evan You 创立，官网团队页同时列出其"Vue.js 与 Vite 创造者"身份（来源：vite.dev 团队页，WebSearch 命中）。Vite、Vue 两团队人员高度重叠是公开事实。

【社区观点/报道】（未能核实原始来源，引用需谨慎）
- "VoidZero 作为商业公司与 Vue 项目相互独立，但给 Vue 一等支持"——Evan You 表述的社区转述。
- "VoidZero 于 2026 年 6 月加入 Cloudflare，工具链保持开源 MIT；Vite+ 于 2026 年 9 月宣布 1.0 稳定"——仅来自搜索结果摘要，**原始链接未能核实**。

【官方确认事实】Nuxt 现状
- Nuxt 4.0 于 **2025-07-15** 正式发布（来源：[Nuxt 官方博客 Announcing Nuxt 4.0](https://nuxt.com/blog/v4)，WebSearch 命中官方博客）。
- Nuxt 3 已于 **2026-07-31 EOL**（来源：[nuxt/nuxt Releases](https://github.com/nuxt/nuxt/releases) 及 [HeroDevs 说明](https://www.herodevs.com/blog-posts/nuxt-3-reaches-end-of-life-on-july-31-2026-what-are-your-options)，WebSearch；EOL 具体日期属于官方公告内容）。
- 4.x 线持续活跃维护（来源：[Nuxt Roadmap/Changelog](https://nuxt.com/docs/4.x/community/roadmap)，WebSearch）。当前 4.x 具体最新补丁号**未能核实**（本次未抓取 releases 逐条版本）。

是否需要 Nuxt（【分析建议】）：纯前端 3D 沉浸式展示站若按 SPA 形态交付，**Vite 即可满足，Nuxt 非必需**；若强需求为 SEO/首屏与静态内容站点生成（SSG），可选用 Nuxt 4（注意 TresJS 提供官方 Nuxt 模块 `@tresjs/nuxt` 5.8.1，来源：[TresJS Releases](https://github.com/TresJS/tres/releases)，WebFetch）。若采用 Nuxt，需评估 SSR 与 WebGL 客户端渲染的边界处理成本。**本项目当前按纯前端 SPA 规划，倾向不引入 Nuxt；此判断需与产品侧 SEO 要求对齐后复核。**

### 2.5 许可协议

【官方确认事实】Vue 采用 **MIT** 许可（任务下发方于 2026-11-04 经 npm registry 核实；Vue 仓库 LICENSE 文件同证）。MIT 无商业使用限制，唯一义务是在分发物中保留版权与许可声明。

### 2.6 库档案卡：Vue 3

| 项 | 内容 |
|---|---|
| 当前版本 | 3.5.44（稳定）；3.6.0-rc.14（预发布） |
| 许可证 | MIT |
| 商业使用限制 | 无（保留版权与许可声明即可） |
| 推荐程度 | **高** |
| 适用范围 | 汽车文明数字宇宙的 Web 门户、配置器 UI、数据可视化层；配合 TresJS 承载 3D 场景 |
| 风险与局限 | 3.6/Vapor 未稳定，生态组件库对 Vapor 的适配参差（社区来源）；重大渲染架构变化集中在 3.6，升级窗口需等待 RC→稳定 |

## 3. React

### 3.1 React 19.3 现状

【官方确认事实】（来源：[React 官方博客 React 19.3](https://react.dev/blog/2026/09/09/react-19-3)，核实方式：WebFetch 抓取原文；npm latest 19.3.x 由任务下发方经 npm registry 核实）
- React 19.3 于 **2026-09-09** 由 React 团队发布，"React 19.3 is now available on npm!"。
- 主要特性：
  - **View Transitions 稳定**：`<ViewTransition>` 组件支持 enter / exit / update / share 四类动画，可用 `addTransitionType` 定制，可与 Suspense 边界集成；
  - **Fragment Refs 稳定**：可直接向 `<Fragment>` 传 ref 获得 `FragmentInstance`（addEventListener / focus / observeUsing 等，可挂 IntersectionObserver / ResizeObserver）；
  - **react-dom 新增 `browser()` API**：组件内 `use(browser())` 可让该部分跳过服务端渲染；
  - **Trusted Types 支持**：配合浏览器 Trusted Types API 防 DOM 型 XSS；
  - **Server Components 可直接渲染从 `'use client'` 模块导入的 Context**："In React 19.3, Server Components can import and render Context directly from a 'use client' module, without an additional wrapping component."
- **React 19.3.1**（约 2026-10-14）改进了 RSC 传输协议——此条来自第三方简报（[pulse.adyog.com](https://pulse.adyog.com/briefs/react-19-3-1-ships-one-change-to-server-components)），**官方 changelog 原文未能直接核实**，标注为待复核。

### 3.2 Server Components 对纯前端 3D 应用的影响

【官方确认事实】（来源：[react.dev RSC 参考文档](https://react.dev/reference/rsc/server-components)，核实方式：WebFetch 抓取原文）
- **不强制依赖运行时服务器**：官方设有专节 "Server Components without a Server"——"Server components can run at build time to read from the filesystem or fetch static content, so a web server is not required"；渲染产物可 SSR 成 HTML 后"uploaded to a CDN"。
- **必须由框架/bundler 支持**："To support React Server Components as a bundler or framework, we recommend pinning to a specific React version, or using the Canary release."
- RSC 不能使用 `useState` 等交互 API，交互必须组合 `'use client'` 客户端组件；RSC 不能创建 Context，但可以渲染 client 模块导出的 provider（19.3 起可直接渲染）。

【分析建议】对纯前端 3D 沉浸式网站的影响判断：
1. **RSC 与 3D 运行时正交**：three.js / R3F 场景必须运行在浏览器端（WebGL 上下文、每帧渲染循环），只能作为 Client Component 存在；RSC 不会"接管"或削弱 3D 渲染层。
2. **可用的收益面**：车型规格、图文解说等静态内容可交给 RSC 在构建期渲染，"expensive libraries" 不进客户端 bundle、首屏即见内容——这是官方文档给出的 SPA Effect-fetch 模式的替代收益。
3. **成本面**：采用 RSC 必须引入支持它的框架/构建插件（如 Next.js 或特定 Vite RSC 插件），对纯 SPA 是架构复杂度增量；若完全不用 RSC，React 19.3 就是一个普通客户端运行时，无任何强制。
4. 结论：**纯前端 3D 站可以完全不用 RSC 而不受惩罚**；若未来需要 SEO 与静态内容优化，RSC 是可选增强而非门槛。

### 3.3 许可协议

【官方确认事实】React 采用 **MIT** 许可（任务下发方于 2026-11-04 经 npm registry 核实）。无商业使用限制。

### 3.4 库档案卡：React 19

| 项 | 内容 |
|---|---|
| 当前版本 | 19.3.x（19.3 发布于 2026-09-09；19.3.1 待官方原文复核） |
| 许可证 | MIT |
| 商业使用限制 | 无（保留版权与许可声明即可） |
| 推荐程度 | **高** |
| 适用范围 | 与 Vue 同级可选；配合 R3F 承载 3D 场景；RSC 为可选增强（需框架支持） |
| 风险与局限 | 新 API（ViewTransition、browser()、Activity 等）在 3D 库侧的完整支持仍在跟进（R3F 9.8.0 自述"不完全支持所有新 API"，见 4.1）；RSC 需框架绑定，纯 SPA 用不到即无收益 |

## 4. 3D 沉浸式展示场景的适配性

### 4.1 three.js 封装层结合现状

【官方确认事实】
- **three.js 当前版本 0.187.0**，MIT（来源：npm registry latest JSON，https://registry.npmjs.org/three/latest ，WebFetch）。
- **@react-three/fiber（R3F）最新稳定版 9.8.2**，MIT（来源：npm registry JSON https://registry.npmjs.org/@react-three/fiber/latest ，WebFetch；GitHub Releases 同证，https://github.com/pmndrs/react-three-fiber/releases ）。关键 release 事实：
  - v9.8.0（2026-09-22）：官方声明 **"R3F is now compatible with React 19.3.0"**（不完全支持所有新 API，但不再冲突），并修复 Strict Mode 下 Canvas 问题；
  - v9.8.1（2026-09-24）：`<Activity>` 跨 React DOM 边界可用、Canvas 卸载不再漏 dispose；
  - v9.8.2（2026-10-15）：修复 Portal 内存泄漏、dpr 自适应、JSX 类型（避免 `React.ElementType` props 塌缩为 never）等；
  - **v10.0.0-alpha.6（"Going WebGPU First"，2026-10-17）**：WebGPURenderer 成为默认（GLSL 用户可改从 `@react-three/fiber/legacy` 导入）、核心不再直接依赖 three.js、TSL hooks 拆分至新包 `@react-three/tsl`、物理循环固定 1/60 步长——处于 **alpha**，非稳定（以上均来自 GitHub Releases 页，WebFetch）。
- **TresJS（Vue 3 自定义渲染器）core 最新版 5.10.1**，MIT（来源：npm registry JSON https://registry.npmjs.org/@tresjs/core/latest ，WebFetch；GitHub Releases 2026-10-28 同证，https://github.com/TresJS/tres/releases ）。关键事实：
  - 官方文档定位："built as a Vue 3 custom renderer that transforms Vue components into Three.js scene objects"（来源：[docs.tresjs.org](https://docs.tresjs.org/getting-started)，WebSearch 命中官方文档）；宣称 "fully typed"、"always brings updated Three.js features regardless of version"。
  - v5.10.0（2026-10-22）为 core / cientos / nuxt **新增 `/webgpu` 入口**；v5.10.1（2026-10-28）为修复版（prop patch 帧状态、useLoader 返回对象、生产环境跳过 devtools 注册）。
  - 配套包：cientos 5.10.1、@tresjs/nuxt 5.8.1、post-processing 3.11.1、rapier 1.2.1（均 2026-10-28）。
  - **文档滞后提示**：官方升级指南（[docs.tresjs.org Upgrade Guide](https://docs.tresjs.org/getting-started/upgrade-guide)）仍以 "v4 → v5（nightly）" 口吻描述，与 npm 上 5.10.1 已为 latest 的事实存在**文档更新滞后**（两处均为官方来源，事实以 npm/GitHub Releases 为准）。

### 4.2 TypeScript 支持

【官方确认事实】
- TresJS 官方文档宣称 "fully typed"（来源：[tresjs/tres 仓库](https://github.com/tresjs/tres)，WebSearch 命中官方仓库描述）。
- R3F 以 TypeScript 优先开发，v9.8.2 仍在修复 JSX 类型问题（来源：GitHub Releases，WebFetch）。
- Vue 3 Composition API、React 19 均支持完整类型推断（Vue 侧官方 FAQ 原文见 2.2；React 侧为通用事实，本文不再单列来源）。

【分析建议】：两侧 TS 体验均为一等；R3F 的 JSX 类型体系（ThreeElements 扩展）历史包袱略多（9.8.x 仍在修补），TresJS 声明式组件类型较新、覆盖面未见第三方评测，**实际 DX 差异需原型验证后才能定论（本文档不做结论）**。

### 4.3 长期维护风险

【官方确认事实】
- R3F 与 TresJS 在核实日前的 30 天内均有正式 release（R3F 9.8.2 于 2026-10-15；TresJS core 5.10.x 于 2026-10-22/28），两者均处于活跃维护状态（来源：各自 GitHub Releases，WebFetch）。
- R3F v10 alpha 的 "WebGPU First" 表明 React 3D 生态正在向 WebGPU 迁移；TresJS 5.10 同步加入 /webgpu 入口，两侧生态对 three.js WebGPU 化的跟进均在发生。

【社区观点/组织观察】
- R3F 背靠 pmndrs 组织（React 三方库生态中规模最大之一，drei/rapier/postprocessing 等配套齐全），社区使用基数大；TresJS 为独立社区团队维护、体量较小——此为社区普遍认知，**定量数据（下载量对比）本次未能核实**。
- 风险判断：两者均为"社区库依赖官方库（three.js）"结构，three.js 本身由 mrdoob 与核心团队持续发布（0.187.0 现行），上游风险低；封装层风险主要是"大版本迁移（v10/WebGPU）节奏"由小团队主导，跟进成本需纳入估计。

### 4.4 场景结论（【分析建议】）

1. **两条路线均可用且均活跃**：React 19.3 + R3F 9.8.2 / Vue 3.5.44 + TresJS 5.10.1，均 MIT、均全 TS、均在跟进 WebGPU。
2. 若团队无强既有偏好：R3F 配套生态（drei、rapier、postprocessing、市场案例库）更厚；TresJS 与 Vue 官方链路（create-vue + Vite + Pinia）一致性更好、心智负担更低。
3. 不建议为 Vapor Mode 或 RSC 等尚未在 3D 场景证明收益的特性改变选型；建议按 `docs/03-technology/3d-engines.md` 的渲染内核结论，先做双路线 1–2 天原型对比（加载管线、配置器事件流、类型体验）再固化。
4. 需要注意 R3F v10（WebGPU First）发布后 React 线的迁移窗口；Vue 线同样要盯 TresJS v5 文档补齐情况。

## 5. 未能核实项（诚实清单）

- Vue 3.6 稳定版发布日期（官方未承诺；社区预测 Q4 2026）。
- Vue 3.6 响应式采用 Alien Signals 的官方出处（仅社区报道）。
- VoidZero 加入 Cloudflare、Vite+ 1.0 稳定的原始官方链接（仅搜索摘要）。
- React 19.3.1 官方 changelog 原文（仅第三方简报）。
- React 20/下一代路线图（未检索到官方结论）。
- create-vue 的许可证类型（仓库存在 LICENSE 文件但抓取页面未显示具体条目）。
- Nuxt 4.x 当前最新补丁版本号（未逐条抓取 releases）。
- R3F 与 TresJS 的下载量/使用基数对比数据。

## 6. 核实记录表

| 核实项 | 来源 URL | 核实日期 | 核实方式 |
|---|---|---|---|
| Vue 最新稳定版 3.5.44（Latest，2026-10-13） | https://github.com/vuejs/core/releases | 2026-11-04 | WebFetch 官方 Releases 页 |
| Vue 3.6.0-rc.14（RC 阶段、无稳定版） | https://github.com/vuejs/core/releases | 2026-11-04 | WebFetch 官方 Releases 页 |
| Vue npm latest = 3.5.44、许可 MIT | https://registry.npmjs.org/vue/latest | 2026-11-04 | npm registry（任务下发方核实，本文引用） |
| Vapor Mode 特性集完成宣告（beta.1） | https://x.com/vuejs/status/2003469481163784611 | 2026-11-04 | WebSearch（Vue 官方账号） |
| Vapor Mode 定位（实验性/opt-in 编译策略） | https://blog.vuejs.org/posts/2022-year-in-review | 2026-11-04 | WebSearch 命中官方博客 |
| Composition API 官方定位与 Options API 不废弃 | https://vuejs.org/guide/extras/composition-api-faq.html | 2026-11-04 | WebFetch 官方文档原文 |
| create-vue 为官方脚手架、基于 Vite | https://github.com/vuejs/create-vue | 2026-11-04 | WebFetch 官方仓库 README |
| Vite 当前 v8.3.4、By VoidZero、MIT | https://vite.dev/ | 2026-11-04 | WebFetch 官网原文 |
| Nuxt 4.0 发布于 2025-07-15 | https://nuxt.com/blog/v4 | 2026-11-04 | WebSearch（官方博客） |
| Nuxt 3 于 2026-07-31 EOL | https://github.com/nuxt/nuxt/releases ｜ https://www.herodevs.com/blog-posts/nuxt-3-reaches-end-of-life-on-july-31-2026-what-are-your-options | 2026-11-04 | WebSearch |
| React 19.3 发布（2026-09-09）与全部新特性 | https://react.dev/blog/2026/09/09/react-19-3 | 2026-11-04 | WebFetch 官方博客原文 |
| RSC 构建期运行/无需服务器/需框架支持 | https://react.dev/reference/rsc/server-components | 2026-11-04 | WebFetch 官方文档原文 |
| React npm latest = 19.3.x、许可 MIT | https://registry.npmjs.org/react/latest | 2026-11-04 | npm registry（任务下发方核实，本文引用） |
| R3F 9.8.2（Latest）、9.8.0 兼容 React 19.3、v10 alpha.6 WebGPU First | https://github.com/pmndrs/react-three-fiber/releases | 2026-11-04 | WebFetch 官方 Releases 页 |
| @react-three/fiber npm 9.8.2、MIT | https://registry.npmjs.org/@react-three/fiber/latest | 2026-11-04 | WebFetch npm registry JSON |
| TresJS core 5.10.1 / cientos 5.10.1 / nuxt 5.8.1、5.10.0 加 /webgpu 入口 | https://github.com/TresJS/tres/releases | 2026-11-04 | WebFetch 官方 Releases 页 |
| @tresjs/core npm 5.10.1、MIT | https://registry.npmjs.org/@tresjs/core/latest | 2026-11-04 | WebFetch npm registry JSON |
| TresJS "Vue 3 custom renderer / fully typed" 定位 | https://docs.tresjs.org/getting-started ｜ https://github.com/tresjs/tres | 2026-11-04 | WebSearch 命中官方文档/仓库 |
| TresJS v4→v5 升级指南（文档滞后佐证） | https://docs.tresjs.org/getting-started/upgrade-guide | 2026-11-04 | WebSearch 命中官方文档 |
| three.js npm latest = 0.187.0、MIT | https://registry.npmjs.org/three/latest | 2026-11-04 | WebFetch npm registry JSON |
| Vuetify 对 Vapor 的兼容性担忧（社区） | https://github.com/vuetifyjs/vuetify/discussions/22149 | 2026-11-04 | WebSearch（社区讨论） |
| Vue 3.6 进入 RC / Alien Signals（社区报道） | https://www.reddit.com/r/vuejs/comments/1v0s5bt/vue_36_just_entered_rc_stage | 2026-11-04 | WebSearch（社区，未获官方确认） |

---

*本文档为文献研究成果。所有"推荐程度/适用范围/风险"评级为研究员分析判断；涉及版本号的结论均可在上表来源复核。下一步建议：按 4.4 节做双路线原型对比，将本文结论升级为"原型验证"。*
