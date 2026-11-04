# 状态管理选型研究：面向"3D Runtime 与业务 UI 解耦"模式

> 核实日期：2026-11-04 ｜ 状态：文献研究（未做原型验证）｜ 研究员：AI Research Agent A

## 1. 研究问题与场景定义

研究对象：Pinia、Zustand、Jotai、Redux Toolkit（RTK）、TanStack Query 五个状态/数据层库，在汽车文明数字宇宙 3D 沉浸式展示网站中的适用性。

【分析建议】本文采用的"3D Runtime 与业务 UI 解耦"参考架构：

```
┌─ 业务 UI 层（Vue/React 组件）────────────────────┐
│  配置器面板 / 参数面板 / 图文卡片 / 加载进度        │
│  状态载体：Pinia / Zustand（业务状态）             │
│           TanStack Query / RTK Query（服务端数据） │
├─ 桥接层（受控同步，低频）────────────────────────┤
│  配置变更事件、选中对象 ID、相机预设、加载百分比     │
├─ 3D Runtime 层（命令式）────────────────────────┤
│  three.js 场景图 / R3F·TresJS 组件树               │
│  每帧状态（相机、动画、物理）不进响应式 store       │
└─────────────────────────────────────────────────┘
```

核心原则（分析判断）：**每帧高频状态留在 3D 引擎侧命令式管理；只有低频、业务语义的状态（当前配置、选中车型、UI 开关、服务端数据）进入响应式状态库**。依据是 Vue/React 的响应式更新均按组件粒度调度，60fps 写入响应式 store 会导致 diff 与重渲染风暴——此为框架官方文档所述响应式模型（来源：[Vue 响应性原理](https://vuejs.org/guide/extras/reactivity-in-depth.html)、[react.dev 渲染模型](https://react.dev/learn/render-and-commit)）的自然推论，属【分析建议】。

## 2. 各库档案

### 2.1 Pinia（Vue 生态）

【官方确认事实】
- **当前版本 4.1.0**，许可 **MIT**（来源：npm registry JSON https://registry.npmjs.org/pinia/latest ，核实方式：WebFetch；GitHub Releases 同证）。
- **官方定位**：Vue 官方文档明确 "Pinia is a state management library that ... is **maintained by the Vue core team**"，被列于官方文档 "Official Libraries" 分类；原官方库 Vuex 已进入维护模式（"Vuex is now in maintenance mode ... It is recommended to use Pinia for new applications"）。来源：[vuejs.org State Management](https://vuejs.org/guide/scaling-up/state-management.html)，核实方式：WebFetch 官方文档原文。
- **Pinia 4.0.0**（2025-07-14）变更："Pinia 4 contains only technically breaking changes: ESM only and upgrading @vue/devtools-api"——即 ESM-only、devtools-api 升至 v8（需与 pinia 一同安装）、错误与开发警告重构（改用 Nostics，便于人与 AI 排查）；另修复 HMR 保留运行时属性等。
- **Pinia 4.1.0**（2025-10-14）新增 `getStores()` API、销毁被替换 store 时告警；**4.0.3 声明兼容 Nuxt 5**、修复 SSR 水合 Set/Map。来源：[vuejs/pinia Releases](https://github.com/vuejs/pinia/releases)，核实方式：WebFetch。

| 项 | 内容 |
|---|---|
| 当前版本 | 4.1.0（2025-10-14） |
| 许可证 | MIT |
| 商业使用限制 | 无（保留版权与许可声明即可） |
| 推荐程度 | **高**（Vue 技术栈下） |
| 适用范围 | 业务 UI 共享状态：车型配置器状态、全局 UI 开关、用户会话、跨页面购物车/对比清单 |
| 风险与局限 | 不适合承载每帧更新的 3D 运行时状态（响应式开销）；Pinia 4 最低 Vue 版本要求**未能核实**（Releases 页未注明）；Pinia 4 为 ESM-only，若构建链仍需 CJS 需注意 |

### 2.2 Zustand（React 生态，含 vanilla 模式）

【官方确认事实】
- **当前版本 5.0.16**，许可 **MIT**（来源：npm registry JSON https://registry.npmjs.org/zustand/latest ，WebFetch；[pmndrs/zustand Releases](https://github.com/pmndrs/zustand/releases) 将 v5.0.16 标记为 Latest，WebFetch）。
- 官方定位："A small, fast and scalable bearbones state-management solution using simplified flux principles"；"Has a comfy API based on hooks, isn't boilerplatey or opinionated"；"Doesn't wrap your app in context providers"（来源：[zustand README](https://github.com/pmndrs/zustand)，WebFetch）。
- **vanilla 模式可脱离 React 使用**："Zustand core can be imported and used without the React dependency"（`zustand/vanilla`），并可经 `useStore(vanillaStore, selector)` 桥回 React。来源同上。
- 5.x 近期版本以 devtools / persist 中间件修复与类型改进为主（如 5.0.14 类型推断改进、5.0.15 devtools 修复、5.0.16 useStore 不再 memoize getServerSnapshot）。

| 项 | 内容 |
|---|---|
| 当前版本 | 5.0.16 |
| 许可证 | MIT |
| 商业使用限制 | 无 |
| 推荐程度 | **高**（React 技术栈下） |
| 适用范围 | React 线业务状态；**vanilla store 可作为 React ↔ 3D Runtime 的桥接载体**（3D 侧直接读写 vanilla store，UI 侧经 selector 订阅） |
| 风险与局限 | 官方 README 未声明最低 React 版本（**未能核实**，推断支持 React 18+，需原型确认）；无内建 devtools 时调试体验依赖中间件；生态为 React 原生，Vue 线不适用 |

### 2.3 Jotai（React 生态，原子化）

【官方确认事实】
- **当前版本 3.0.1**，许可 **MIT**（来源：npm registry JSON https://registry.npmjs.org/jotai/latest ，WebFetch）。
- **v3.0.0**（2025-09-08）官方定性："This is a mostly backward-compatible update, dropping some legacy support and deprecated APIs."；v3.0.1（2025-09-29）修复 v3 引入的 `useAtomValue` 回归。来源：[pmndrs/jotai Releases](https://github.com/pmndrs/jotai/releases)，WebFetch。
- v3 破坏性变更（来自 alpha 发布记录）：移除旧版 TypeScript/React/Node 支持、移除 UMD/SystemJS/CJS 构建（module-first，目标 es2020）、移除 `atomFamily` / `loadable` / `jotai/babel` / `setSelf`、新增 `useAtomValueRaw` 等 API。来源同上。

| 项 | 内容 |
|---|---|
| 当前版本 | 3.0.1（2025-09-29） |
| 许可证 | MIT |
| 商业使用限制 | 无 |
| 推荐程度 | **中** |
| 适用范围 | 细粒度派生状态、组件级异步状态（suspense 集成）；适合状态碎片多、派生关系复杂面板 |
| 风险与局限 | v3.0 刚完成破坏性清理（2025-09），第三方 atom 工具/中间件的 v3 兼容需逐个确认（社区普遍现象，**未逐库核实**）；原子粒度过细易碎片化，团队规范成本高于 Zustand；最低 React 版本未在 Releases 页注明（**未能核实**） |

### 2.4 Redux Toolkit（RTK，框架无关 + React 绑定层）

【官方确认事实】
- **当前版本 2.14.0**，许可 **MIT**（来源：npm registry JSON https://registry.npmjs.org/@reduxjs/toolkit/latest ，WebFetch；[reduxjs/redux-toolkit Releases](https://github.com/reduxjs/redux-toolkit/releases) 标记 Latest，发布于 2026-11-03，WebFetch）。
- v2.14.0 要点：dispatch 性能优化（listener middleware 快照跳过无关 action，200 listeners 场景 108K → 5.34M ops/sec）；createSlice 标记 `asyncThunkCreator` 为 pure，esbuild 产物约省 1 kB（brotli）；RTK Query 类型检查提速约 25%（TS 6，实例化降 22%）；immer 升至 ^11.2.9、.d.ts 不再引用 immer；Entity Adapter 新增 `removeMany({ where })` / `selectByIds`；新 DevTools action sanitizer。
- **RTK 3.0 路线图已官宣**：官方 release 页明确 "we just announced our roadmap to Redux Toolkit 3.0"，包含 2.x 内逐步交付的特性与 3.0 breaking changes（详见 [Roadmap Discussion #5536](https://github.com/reduxjs/redux-toolkit/discussions/5536)，WebSearch/WebFetch）。

| 项 | 内容 |
|---|---|
| 当前版本 | 2.14.0（2026-11-03） |
| 许可证 | MIT |
| 商业使用限制 | 无 |
| 推荐程度 | **中** |
| 适用范围 | 大型团队强规范场景、需要时间旅行/动作审计/持久化中间件生态；RTK Query 可承担服务端缓存层；React/Vue 均有适配（RTK 核心框架无关） |
| 风险与局限 | 样板量与心智负担高于 Zustand/Pinia；**3.0 将含 breaking changes**，选型需把升级窗口纳入规划；对本项目体量（展示站 + 配置器）而言多数能力属过度供给 |

### 2.5 TanStack Query（服务端状态/数据请求层）

【官方确认事实】
- **当前版本 5.105.3**，许可 **MIT**（来源：npm registry JSON https://registry.npmjs.org/@tanstack/react-query/latest ，WebFetch；[TanStack/query Releases](https://github.com/TanStack/query/releases) 显示 2026-11-02 两次发版 5.105.2 → 5.105.3，WebFetch）。
- **monorepo 同步发版**：react-query 与 vue-query 共享同一 query-core、版本号完全同步（核实日均为 5.105.3）；例外：svelte-query 独立版本线（6.3.8/6.3.9）。来源同上——**即 Vue 技术栈可无差别使用 @tanstack/vue-query**。
- v5 定位（2023-10 发布 v5 时的官方公告延续至今）："smaller bundles and a more intuitive API"；v5 移除了 `onSuccess`/`onError` 等回调、新增 `maxPages` 等（来源：[Announcing TanStack Query v5](https://tanstack.com/blog/announcing-tanstack-query-v5) 与 [迁移指南](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)，WebSearch 命中官方站点）。
- 近期修复方向：静默取消间共享 fetch 结果、已取消流式查询不再写缓存、`isMutating` 只统计 pending 等（5.105.x release notes，WebFetch）。

| 项 | 内容 |
|---|---|
| 当前版本 | 5.105.3（2026-11-02） |
| 许可证 | MIT |
| 商业使用限制 | 无 |
| 推荐程度 | **高**（凡有后端数据的项目均建议引入） |
| 适用范围 | 车型数据、材质/配色清单、价格、媒体资源清单等服务端状态的缓存、重试、失效与乐观更新；**不属于客户端业务状态库** |
| 风险与局限 | 与 3D Runtime 无直接集成；若 3D 侧需要服务端资源（如模型清单）需经桥接层传递或直接在 3D 侧另行请求；DevTools 版本号自成序列，升级时注意配套 |

## 3. "3D Runtime 与业务 UI 解耦"模式下的选型分析

（本节全部为【分析建议】，基于第 2 节官方事实推导）

### 3.1 状态分类与载体映射

| 状态类别 | 特征 | 建议载体 | 理由 |
|---|---|---|---|
| 3D 引擎侧高频状态 | 相机位、动画时间轴、物理步、逐帧变换 | **不进任何 store**；three.js 场景对象/R3F-TresJS 内部状态命令式管理 | 响应式 diff 与 60fps 更新互斥；框架渲染模型不支持每帧语义 |
| 业务共享状态（低频） | 当前车型/时代节点、配置器选项、UI 开关、导览步骤 | **Vue 线：Pinia**；**React 线：Zustand**（或 Jotai） | Pinia 为 Vue 官方推荐（官方文档）；Zustand vanilla 模式可被 3D 侧直接读写，天然适配桥接 |
| 服务端状态 | 车型数据、材质清单、价格、多媒体资源索引 | **TanStack Query**（react/vue 同版）；重型规范团队可用 RTK Query 替代 | 请求缓存/重试/失效是它的领域内建；业务 store 只存"派生的 UI 态" |
| 一次性流程状态 | 资源加载进度、WebGL 上下文健康度 | 组件局部 state 或 store 单例字段 | 低频、生命周期短，无需专门方案 |

### 3.2 桥接层设计要点（分析）

1. **单向低频同步**：业务 store → 3D Runtime 走显式命令（如 `runtime.applyConfig(config)`）；3D Runtime → UI 走 selector 订阅或事件回调，只同步"语义级"结果（选中对象 ID、加载完成事件），不同步中间帧。
2. **Zustand vanilla 是当前官方明确支持的跨运行时桥**（官方 README 原文确认可无 React 依赖使用）；Pinia 的 store 本质是响应式对象，3D 侧（非 Vue 环境）读取时需经 `storeToRefs`/`watch` 桥接，官方未提供"无 Vue 依赖"的 vanilla 形态（**未能核实是否存在此类官方支持**，按无设计）。
3. **避免把 three.js 对象放进 store**：引用型对象（Scene、Mesh、Texture）入 store 会破坏可序列化假设（persist/devtools/time-travel 均假定可序列化，RTK/Zustand 官方文档对其中间件均有此约束），且引发 GC/泄漏问题（R3F 9.8.2 恰好修复了 Portal 内存泄漏一类问题，见 frontend-frameworks.md 4.1）。
4. **React 线若选 Jotai**：原子派生适合配置器联动规则（选 A 自动联动 B），但需先确认第三方中间件完成 v3 迁移。
5. **RTK 触发条件**：出现多团队协作、需要动作日志回放（如"用户配置路径分析"）或离线队列时再引入；否则 Zustand/Pinia 已覆盖。

### 3.3 推荐组合矩阵

| 技术路线 | 业务状态 | 服务端状态 | 桥接 3D | 综合推荐 |
|---|---|---|---|---|
| Vue 3.5 + TresJS | **Pinia 4.1.0** | **@tanstack/vue-query 5.105.3** | 显式命令 + watch/selector，3D 侧命令式 | **高** |
| React 19.3 + R3F | **Zustand 5.0.16**（vanilla 桥接）；细粒度联动多可加 Jotai 3.0.1 | **@tanstack/react-query 5.105.3** | vanilla store 双向低频同步 | **高** |
| 任意线（强规范/大团队备选） | Redux Toolkit 2.14.0 | RTK Query（内含） | action 流监听 | 中 |

### 3.4 风险汇总

- 五库许可均为 MIT，无商业使用限制（均经 npm registry 2026-11-04 核实）。
- RTK 3.0 官方路线图已含 breaking changes——引入即承担升级窗口。
- Jotai 3.0 于 2025-09 才完成破坏性清理，第三方配套兼容性需原型期确认。
- Zustand 与 Jotai 的最低 React 版本、Pinia 4 的最低 Vue 版本均未在所核实页面注明（见各档案卡，未能核实项）。
- 所有"桥接设计"未经原型验证：建议在技术验证阶段（P0）用"配置器改一个参数 → 3D 场景换材质"的最小链路实测 store 更新→渲染管线的延迟与重渲染范围。

## 4. 未能核实项（诚实清单）

- Pinia 4 官方声明的最低 Vue 版本号。
- Zustand 5 / Jotai 3 官方声明的最低 React 版本号。
- Jotai 生态第三方中间件的 v3 兼容清单（未逐库检索）。
- TanStack Query DevTools 当前对应版本号（Releases 页显示其自成序列，本次未展开）。
- RTK Query 与 TanStack Query 的性能/体积对比基准（未检索到双方官方认可的对比数据）。
- Pinia 官方是否提供脱离 Vue 的 vanilla 使用形态（未见官方文档支持）。

## 5. 核实记录表

| 核实项 | 来源 URL | 核实日期 | 核实方式 |
|---|---|---|---|
| Pinia 4.1.0、MIT | https://registry.npmjs.org/pinia/latest | 2026-11-04 | WebFetch npm registry JSON |
| Pinia 4.0.0 ESM-only / devtools-api v8 / Nostics；4.1.0 getStores()；4.0.3 兼容 Nuxt 5 | https://github.com/vuejs/pinia/releases | 2026-11-04 | WebFetch 官方 Releases 页 |
| Pinia 为 Vue 官方推荐、Vuex 进入维护模式 | https://vuejs.org/guide/scaling-up/state-management.html | 2026-11-04 | WebFetch 官方文档原文 |
| Zustand 5.0.16（Latest）、MIT | https://registry.npmjs.org/zustand/latest ｜ https://github.com/pmndrs/zustand/releases | 2026-11-04 | WebFetch npm registry JSON + 官方 Releases 页 |
| Zustand 定位与 vanilla 模式（无 React 依赖可用） | https://github.com/pmndrs/zustand | 2026-11-04 | WebFetch 官方 README |
| Jotai 3.0.1、MIT | https://registry.npmjs.org/jotai/latest | 2026-11-04 | WebFetch npm registry JSON |
| Jotai v3.0.0 "mostly backward-compatible"、移除 CJS/UMD、es2020 等 | https://github.com/pmndrs/jotai/releases | 2026-11-04 | WebFetch 官方 Releases 页 |
| Redux Toolkit 2.14.0（2026-11-03）、MIT、2.14 要点 | https://registry.npmjs.org/@reduxjs/toolkit/latest ｜ https://github.com/reduxjs/redux-toolkit/releases | 2026-11-04 | WebFetch npm registry JSON + 官方 Releases 页 |
| RTK 3.0 路线图官宣 | https://github.com/reduxjs/redux-toolkit/discussions/5536 | 2026-11-04 | WebSearch + Releases 页确认 |
| TanStack Query 5.105.3、MIT | https://registry.npmjs.org/@tanstack/react-query/latest | 2026-11-04 | WebFetch npm registry JSON |
| TanStack Query react/vue 同步发版（同 query-core）、5.105.2→5.105.3 | https://github.com/TanStack/query/releases | 2026-11-04 | WebFetch 官方 Releases 页 |
| TanStack Query v5 定位与迁移要点 | https://tanstack.com/blog/announcing-tanstack-query-v5 ｜ https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5 | 2026-11-04 | WebSearch 命中官方站点 |
| Vue/React 响应式与渲染模型（分析依据） | https://vuejs.org/guide/extras/reactivity-in-depth.html ｜ https://react.dev/learn/render-and-commit | 2026-11-04 | 官方文档通用引用（本次未逐字抓取，结论标注为分析建议） |

---

*本文档为文献研究成果。第 3 节全部为分析建议，需在原型验证阶段复核；第 2 节版本号与许可均可在核实记录表来源复核。相关文档：`frontend-frameworks.md`（框架层）、`3d-engines.md`（渲染内核）。*
