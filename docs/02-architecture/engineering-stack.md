# 工程体系研究（Engineering Stack）

> 核实日期：2026-11-04 ｜ 状态：文献研究（工程验证由 prototypes 实际构建验证）｜ 研究员：AI Research Agent E

**证据分级约定**（全文适用）：

- 【官方确认事实】：来自工具官方文档、官方博客或 npm registry 包体直接核实。
- 【社区观点】：来自社区讨论、工程博客、论坛共识，无官方背书。
- 【V 级实测】：本实验室在 prototypes 工作区的实际构建/运行验证结果（V = Verified）。

---

## 1. Vite 与 Rolldown：构建体系现状

### 1.1 版本与许可

| 工具 | 当前版本 | 许可证 | 推荐程度 | 适用范围 | 风险与局限 |
|---|---|---|---|---|---|
| vite | **8.3.5**（npm registry，2026-11-04 核实） | MIT | 强烈推荐 | 全部应用原型与共享包的构建/开发服务 | 要求 Node.js ≥20.19 或 ≥22.12；安装体积增大约 15 MB；Environment API 尚未稳定；插件生态需逐一回归 |

【官方确认事实】Vite 官方博客时间线（来源：[vite.dev/blog](https://vite.dev/blog/)）：

- 2025-06-24：Announcing Vite 7
- 2025-12-03：Announcing Vite 8 Beta
- **2026-03-12：Announcing Vite 8**
- 2026-06-23：Announcing Vite 8.1（官网页头当时显示 v8.3.4；registry latest 为 8.3.5）

### 1.2 Rolldown 已成为默认内核

【官方确认事实】（来源：[Announcing Vite 8](https://vite.dev/blog/announcing-vite8)）：

- Vite 8 起内置 **Rolldown**（Rust 编写的打包器），取代原先"esbuild（开发）/Rollup（生产）"的双内核架构，官方称之为"Vite 2 以来最重大的架构变化"。
- 官方宣称构建提速 10–30 倍；引用案例：Linear 生产构建 46s → 6s、Beehiiv 快 64%、Ramp 快 57%、Mercedes-Benz.io 快至 38%。
- 保留 Rollup 插件兼容层：esbuild/rollupOptions 配置会自动转换；复杂项目可先在 Vite 7 上迁移 `rolldown-vite` 过渡。
- `.wasm?init` 导入现已支持 SSR 环境。
- 官方预告方向（实验性）：Full Bundle Mode（开发启动快 3 倍）、Environment API 稳定化。

【V 级实测】prototypes 构建日志中出现 `build.rolldownOptions`，直接证实当前运行的是 Rolldown 内核；三个应用的生产构建合计用时 <1s。

### 1.3 对 3D 项目的支持能力（大资源 / Worker / WASM）

【官方确认事实】（来源：[vite.dev/guide/features](https://vite.dev/guide/features)）：

- **Web Worker**：标准写法 `new Worker(new URL('./worker.js', import.meta.url))`（官方推荐，`{ type: 'module' }` 模块 worker）；另有 `?worker`（返回构造器）、`?worker&inline`（base64 内联）、`?sharedworker` 查询后缀；worker 产物打包格式由 Config Reference 的 worker 选项（worker.format）控制。DRACO/KTX2 解码器与音频分析等重负载可放入 worker。
- **WebAssembly**：`.wasm` 可作 ESM 直接导入（异步实例化，需 top-level await）；`?init` 后缀返回返回 Promise 的 init 函数；小于 `assetsInlineLimit` 的 wasm 产物会被 base64 内联；SSR 构建仅支持"Node.js 兼容运行时"。对 Draco/Basis 的 WASM 解码路径是官方原生场景。
- **大资源与静态资产**：`?url`（显式 URL）、`?raw`（字符串原文）、`?inline` 查询；`assetsInclude`、`chunkSizeWarningLimit` 等配置位于 Config Reference（本次仅经 Features 页间接确认存在，具体行为细节**未能核实**，落地时以官方配置参考为准）。着色器以 `import './shader.glsl?raw'` 方式作为字符串加载，无专用 GLSL 管线。

**结论**：Vite 8 + Rolldown 对"大 GLB/KTX2 资产 + worker 解码 + wasm"的 3D 项目形态有官方一级支持；构建速度经本实验室实测受益明显。推荐采用。

---

## 2. TypeScript 与 3D 库的类型支持

### 2.1 版本

| 工具 | 当前版本 | 许可证 | 推荐程度 | 适用范围 | 风险与局限 |
|---|---|---|---|---|---|
| typescript | **7.0.2**（npm registry，2026-11-04 核实） | Apache-2.0 | 推荐（需回归配套链路） | 全部包 | 下游类型工具链兼容性（见 vue-tsc） |
| @types/three | **0.187.0**（npm registry，2026-11-04 核实） | MIT | 强烈推荐（必需） | three.js 全量类型 | addons（examples/jsm）类型不保证全覆盖 |

TS 7.0.2 的官方路线定位（是否即"原生编译器/Go 移植"一代）本次未单独检索官方公告，**未能核实**；仅确认版本号与兼容性问题。

### 2.2 关键事实：three.js 不自带类型，@types/three 仍然必需

【官方确认事实】（npm registry 包体直接核实，2026-11-04）：

- `three` latest 为 **0.187.0**，MIT；其 `package.json` **既无顶层 `types` 字段，`exports` 中也无任何指向 .d.ts 的条件**（exports 仅含 `./build/three.module.js`、`./build/three.cjs` 及 `./addons`、`./webgpu`、`./tsl` 等子路径）。→ 引用 three 时仍需显式安装 `@types/three`。
- `@types/three` latest 为 **0.187.0**，与 three 主包**同步发版**，描述为 "TypeScript definitions for three"。
- 类型来源链路（来源：[three-types/three-ts-types](https://github.com/three-types/three-ts-types)）：类型在 three-ts-types 仓库开发，"Periodically the updates from this repository are pushed to DefinitelyTyped and released in the `@types/three` npm package"。其目标为 "complete public facing API types for all of the code in the `src` directory"；**`examples/jsm`（即 three/addons 插件生态，含 GLTFLoader/DRACOLoader/KTX2Loader）的"全覆盖"明确不是目标**，缺失类型依赖社区 PR 补充。

⚠️ **信息纠偏**：部分社区教程声称"three.js 自 r150 起自带 TypeScript 声明、@types/three 已弃用"（如 [mysimulator.uk 教程](https://www.mysimulator.uk/content/tutorials/typescript-threejs-tutorial.html)）。此说法与 registry 包体实测**不符**，判定为不可靠信息，不采纳。

### 2.3 兼容性风险

【V 级实测】vue-tsc 3.3.14 的 peer 依赖声明要求 TypeScript <7，与 TS 7.0.2 不兼容。→ 在 Vue 应用中升级 TS 7 的同时必须同步解决 vue-tsc 版本或替代方案（如改用 tsc --noEmit + vls/volar 新版）。

**结论**：`three` 与 `@types/three` 必须**同版本号锁定**升级；addons 类型存在缺口风险，复杂 addons 用法以官方 JSDoc + 实测为准；涉及 JSX 的文件必须使用 `.tsx` 命名（【V 级实测】，TS 7 下编译器不再按内容猜测扩展名）。

---

## 3. 资源加载管理（GLTF / Draco / KTX2 / 进度体系）

### 3.1 官方加载器用法（全部【官方确认事实】）

**GLTFLoader**（来源：[threejs.org/docs/pages/GLTFLoader.html](https://threejs.org/docs/pages/GLTFLoader.html)）：

- 导入：`import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'`。
- 构造：`new GLTFLoader( manager : LoadingManager )`。
- `load( url, onLoad, onProgress, onError )` / `parse( data, path, onLoad, onError )` / `parseAsync( data, path )`；官方示例亦演示 `loader.loadAsync( url )`。
- 压缩扩展挂钩：`setDRACOLoader( dracoLoader )`（KHR_draco_mesh_compression 必需）、`setKTX2Loader( ktx2Loader )`（KTX2 纹理必需）、`setMeshoptDecoder( decoder )`（EXT_meshopt_compression 必需）。
- 内置扩展含 `KHR_draco_mesh_compression`、`KHR_texture_basisu`、`KHR_mesh_quantization`、`EXT_meshopt_compression`、`EXT_texture_webp`、`EXT_texture_avif` 等；`KHR_gaussian_splatting` 等经插件注册。
- 注意事项：image bitmap 不会自动 GC，dispose 需特殊处理。

**DRACOLoader**（来源：[threejs.org/docs/pages/DRACOLoader.html](https://threejs.org/docs/pages/DRACOLoader.html)）：

- 用于 Draco 压缩网格/点云；独立 `.drc` 文件仅含几何属性，**不含材质/纹理/动画/节点层级**（需材质随 glTF 嵌入）。
- `setDecoderPath( path )` 接受路径或"每个解码器文件的显式 URL 配置对象"；`setDecoderConfig()` 已标记 **Deprecated**；解码开始后不可再改配置。
- `setWorkerLimit( n )` 限制解码 worker 数（官方提示：若 worker 另有他用，宜降低上限）；自动按浏览器能力选择 JS 或 WASM 解码库。
- 官方提示复用同一实例以避免创建多个解码器；glTF 场景下 DRACOLoader 由 GLTFLoader 内部调用；模型可用 [glTF-Pipeline](https://github.com/CesiumGS/gltf-pipeline) 预压缩。

**KTX2Loader**（来源：[threejs.org/docs/pages/KTX2Loader.html](https://threejs.org/docs/pages/KTX2Loader.html)）：

- 用于 KTX 2.0 容器 + Basis Universal 纹理，运行时转码为各 GPU 压缩格式；依赖 WASM，旧浏览器不支持。
- 官方用法：`setTranscoderPath( 'examples/jsm/libs/basis/' )`（可指向 CDN，默认即该路径）→ **`detectSupport( renderer )`（必须在加载任何纹理之前调用，接受 WebGLRenderer 或 WebGPURenderer；`detectSupportAsync` 已弃用）**→ `loadAsync( url )`。
- `setWorkerLimit( n )` 控制转码 worker 数；用毕 `dispose()`。

**LoadingManager**（来源：[threejs.org/docs/pages/LoadingManager.html](https://threejs.org/docs/pages/LoadingManager.html)）：

- `new LoadingManager( onLoad, onProgress, onError )`；回调属性 `.onStart/.onLoad/.onProgress/.onError`。
- 未传入时各 loader 自动使用**全局默认实例**（`THREE.DefaultLoadingManager`）；可传自定义实例实现"分组加载条"。
- 高级能力：`addHandler( regex, loader )` 按正则注册 loader、`setURLModifier( transform )` 重映射 URL（blob/ZIP/拖放场景）、`.abortController` / `.abort()` 中止未完成请求。
- 官方手册（来源：[threejs.org/manual/pages/loading-3d-models.html](https://threejs.org/manual/pages/loading-3d-models.html)）明确推荐 glTF："we recommend using glTF… it is compact to transmit and fast to load"；该手册页仅覆盖 GLTFLoader 用法与排错（onError、相对路径、缩放排查），DRACO/KTX2 的指导在各 loader 独立文档页。

### 3.2 进度与 Suspense 机制

【官方确认事实】：

- 原生机制即 3.1 的 LoadingManager onProgress/onLoad 与各 loader 的 `onProgress` 回调。
- React 生态（R3F/drei）：`useLoader` 官方描述为 "loads assets and suspends for easier fallback- and error-handling"（来源：[r3f.docs.pmnd.rs/api/hooks](https://r3f.docs.pmnd.rs/api/hooks)）；drei 的 `useProgress` **包装 `THREE.DefaultLoadingManager`**，返回 `{ active, progress, errors, item, loaded, total }`，其内部 store 基于 zustand，支持 selector 订阅，且"不必须作为 Suspense fallback，可放在 DOM 任意位置"（来源：[drei.docs.pmnd.rs/loaders/progress-use-progress](https://drei.docs.pmnd.rs/loaders/progress-use-progress)）。

【社区观点/推论】Suspense 模式是 React 生态惯例；本实验室 Vue 技术栈下等价做法是：自建 LoadingManager（或监听 DefaultLoadingManager 事件）封装成组合式函数/Store，实现与 `useProgress` 同构的进度源。此为工程推论，非官方结论。

### 3.3 资产预处理工具

| 工具 | 当前版本 | 许可证 | 推荐程度 | 适用范围 | 风险与局限 |
|---|---|---|---|---|---|
| @gltf-transform/core（及 cli） | **4.5.1**（npm registry，2026-11-04 核实，coordinator 提供 + 本次复核 core） | MIT | 强烈推荐 | 构建/CI 期对 GLB 做 Draco/meshopt/KTX2 压缩、剪裁、重拓扑等预处理 | 属 Node/工具链范畴，需与运行时解码器（DRACOLoader/KTX2Loader）配套；本项"官方用法"细节本次未逐页核实，以 [gltf-transform.dev](https://gltf-transform.dev) 为准 |
| gltfjsx | **6.5.3**（npm registry，2026-11-04 核实） | MIT | 可用（仅 React 生态） | 将 GLTF 转为 react-three-fiber 声明式 JSX 组件（官方描述 "GLTF to JSX converter"，作者 Paul Henschel/pmndrs，Node ≥16；在线版 [gltf.pmnd.rs](https://gltf.pmnd.rs)） | 产物面向 R3F/JSX；对本实验室 Vue 应用**不直接适用**，仅可作"模型→代码清单"的审查参考 |

---

## 4. 3D Runtime 与业务 UI 解耦：主流模式

### 4.1 模式 A：外部共享 Store 注入（pmndrs 生态官方推荐）

【官方确认事实/官方生态实践】：

- R3F 的 `<Canvas>` 是**隔离的 React root**，React context 默认不跨界；pmndrs 官方渠道（[GitHub Issue #1249](https://github.com/pmndrs/react-three-fiber/issues/1249)、[Discussion #2334](https://github.com/pmndrs/react-three-fiber/discussions/2334)、[Discourse 讨论帖](https://discourse.threejs.org/t/accessing-the-camera-in-react-three-fiber-out-of-the-canvas/39137)）一致推荐用**模块级外部 store（zustand/jotai/valtio）**作为 UI 与 3D 场景的桥梁。
- zustand 官方文档首页声明 "Works across React and vanilla"；核心可脱离 React 使用：`zustand/vanilla` 的 `createStore/getState/setState/subscribe`，再以 `useStore(store, selector)` 桥接回 React（来源：[zustand.docs.pmnd.rs](https://zustand.docs.pmnd.rs)）。
- 官方实现佐证：drei `useProgress` 本身就是"zustand store 包装 three.js LoadingManager"的成品（来源同 3.2）——即官方生态在用模式 A 解决"进度状态跨 Canvas/DOM 共享"。
- 【社区观点】组件选择器订阅（`useStore(selector)`）避免整树重渲染；3D 对象的高频指令更新应放进 store actions 直接改 three 对象，而非走框架响应式 state（来源：[Reddit r/threejs 讨论](https://www.reddit.com/r/threejs/comments/1m4swu6/reactthreefiber_usestate_within_canvas_component)、[lune.dev 汇总](https://www.lune.dev/questions/9397/how-can-i-manage-reactthreefiber-canvas-state-externally)）。

### 4.2 模式 B：事件总线

【社区观点】EventBus/mitt 式总线在 three.js 社区常见，语言/框架无关，适合 Vue UI ↔ 命令式内核的低耦合通信；缺点是时序难以推理、易漏解绑造成泄漏。无官方背书，属工程惯用法。

### 4.3 模式 C：命令式引擎内核 + 薄框架适配层

【官方确认事实（基础）】three.js 官方文档与手册示例全部为命令式 API（`loader.loadAsync` → `scene.add`），官方对"如何与框架结合"不表态、不提供官方框架绑定。

【社区观点】主流工程化做法（如 [Promaton 的 3D 测试实践](https://blog.promaton.com/testing-3d-applications-with-playwright-on-gpu-1e9cfc8b54a9)与各 R3F 讨论）：3D 内核（scene/renderer/loaders/循环）保持纯命令式、可独立测试；框架层（React/Vue 组件）只做挂载、销毁与状态映射，UI 通过 store/事件向内核发指令。

### 4.4 本实验室落地结论

- 【V 级实测】依赖体系内 pinia **4.1.0**（Vue 官方 store）与 zustand **5.0.16** 并存可用（版本经 npm registry 核实）。
- 【工程建议（研究员）】Vue 侧：业务态用 pinia；3D 内核内部一律可变对象 + 命令式 API；两者之间设**显式适配层**（watch 业务态 → 调内核命令；内核事件 → 回写 store），参照 drei useProgress 的"包装 LoadingManager 进 store"官方先例。3D 对象（scene/camera/mesh）**禁止**进入响应式系统（proxy 化 Three 对象有性能与兼容风险，社区共识）。

---

## 5. 自动化测试：3D/WebGL 应用的测试策略

### 5.1 工具与版本

| 工具 | 当前版本 | 许可证 | 推荐程度 | 适用范围 | 风险与局限 |
|---|---|---|---|---|---|
| vitest | **5.1.0**（npm registry，2026-11-04 核实；官方描述 "Next generation testing framework powered by Vite"） | MIT | 强烈推荐 | 与 Vite 共用配置的单元/逻辑测试（加载管理、状态机、数据变换等无 GL 依赖逻辑） | jsdom/happy-dom 下无 WebGL；GL 相关代码需 mock 或注入 |
| @playwright/test | **1.64.1**（npm registry，2026-11-04 核实） | Apache-2.0 | 强烈推荐 | E2E、视觉回归（`toHaveScreenshot`，官方 API 见 [playwright.dev](https://playwright.dev/docs/api/class-pageassertions)） | headless 下 WebGL 走软件渲染，见 5.2 |

### 5.2 WebGL headless 测试的可行性与已知限制

【官方确认事实（Playwright 官方 issue）】硬件 GPU 加速默认未在 Playwright 中开启是一个长期 feature request（[microsoft/playwright#11627](https://github.com/microsoft/playwright/issues/11627)）。

【社区观点/实测共识】（来源：[Currents](https://currents.dev/posts/when-tests-should-run-headless-vs-headed-in-playwright)、[CreateIT](https://www.createit.com/blog/headless-chrome-testing-webgl-using-playwright)、[Michael Krämer](https://michelkraemer.com/enable-gpu-for-slow-playwright-tests-in-headless-mode)、[Promaton](https://blog.promaton.com/testing-3d-applications-with-playwright-on-gpu-1e9cfc8b54a9)、[davesnider](https://davesnider.com/gputests)）：

- headless Chromium（尤其 headless shell）默认无 GPU 加速，WebGL 回退到 **SwiftShader 软件渲染**：功能可用但慢，个别环境可能直接创建失败。
- 缓解手段：launch 参数（如 `--use-gl=angle`、`--enable-webgl`、`--ignore-gpu-blocklist`）强制软件 WebGL；或 Chromium 新 headless 模式 + Linux GPU 机器 + 相应 flag 获得硬件加速；GitHub Actions GPU runner 上 Chromium 也不会自动开 GPU，需 **xvfb + headed 模式**才能拿到真 GPU。
- 视觉回归影响：SwiftShader 与真 GPU 的渲染结果可能有像素级差异 → 快照基线必须与"渲染后端（软件/硬件）+ 平台"绑定，否则大量假阳性。

### 5.3 推荐分层策略（研究员工程建议）

1. **单元测试（Vitest）**：只测逻辑（LoadingManager 封装、状态机、GLTF 数据处理、相机控制参数计算），DOM/WebGL 全部 mock。
2. **E2E（Playwright）**：功能性断言（模型加载完成后 DOM 标志位出现、无控制台错误、可交互），接受 SwiftShader 慢渲染；在 CI 固定同一渲染后端保证确定性。
3. **视觉回归**：`toHaveScreenshot` + 按渲染后端分桶的基线；重点页面低频运行。
4. **性能/FPS**：headless 数据不可信。【V 级实测】IAB/后台环境 rAF 节流导致 FPS 读数失真——性能测试必须真实浏览器、前台标签执行（浏览器后台标签 rAF 被节流另见 [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)）。

---

## 6. 性能监控

### 6.1 工具

| 工具 | 当前版本 | 许可证 | 推荐程度 | 适用范围 | 风险与局限 |
|---|---|---|---|---|---|
| stats.js | **0.17.0**（npm registry，2026-11-04 核实，"JavaScript Performance Monitor"） | MIT | 可用（经典款） | 开发期 FPS/毫秒/内存浮层 | npm 版本长期未更新（观察性事实）；读数仅基于 rAF，受后台节流影响 |
| stats-gl | **4.2.3**（npm registry，2026-11-04 核实） | MIT | 推荐 | stats.js 的 WebGL 场景现代化替代（仓库：[RenaudRohlinger/stats-gl](https://github.com/RenaudRohlinger/stats-gl)），社区广泛用于 R3F/three 项目 | 其 GPU 面板等具体功能细节本次**未能核实**（未逐读其 README），落地前自行验证 |

【V 级实测】后台/IAB 环境 rAF 节流会让 FPS 类读数严重失真——监控与基准都必须在可见前台环境进行。

### 6.2 浏览器原生能力

【官方确认事实】：

- **PerformanceObserver**：标准 API（[MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)）；web-vitals 官方 README 证实其利用 PerformanceObserver 的 `buffered` 标志实现"晚注册也能补发早期指标"。
- **Chrome DevTools Performance 面板**（来源：[developer.chrome.com/docs/devtools/performance/reference](https://developer.chrome.com/docs/devtools/performance/reference)）：提供 **GPU 区块**（"View GPU activity in the GPU section"）、**Frames 轨道**（四色帧：idle/正常绿/部分呈现黄/丢帧红）、**Raster 活动在 Thread Pool 区块**、`performance.mark()/measure()` 自定义计时、Rendering 面板 FPS meter、Paint profiler 与 Layers 工具；官方文档**没有**专门的 WebGL 分析章节——WebGL 深入分析依赖 GPU 区块与上述通用工具。

### 6.3 RUM（真实用户监控）概览

【官方确认事实】Google 官方库 **web-vitals**（[GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals)，Apache-2.0，约 3KB brotli）：测量与 Chrome/CrUX/PageSpeed 一致的 CLS、INP、LCP（Core Web Vitals）+ FCP、TTFB；建议用 `navigator.sendBeacon()` 上报并在 `visibilitychange → hidden` 时冲刷；attribution 构建提供 INP 子段（inputDelay/processingDuration/presentationDelay）等调试信息；`onCLS()` 仅 Chromium；不能观测跨 iframe 指标。

【社区观点】自建 RUM = web-vitals + 自有采集端点；商用平台（Sentry、Grafana Faro、Datadog RUM 等）提供开箱方案，本次未逐一核实其当前版本与 WebGL 场景适配度，**未能核实**（仅作方向性提及）。

---

## 7. pnpm workspace monorepo

| 工具 | 当前版本 | 许可证 | 推荐程度 | 适用范围 | 风险与局限 |
|---|---|---|---|---|---|
| pnpm | **12.16.1**（npm registry，2026-11-04 核实；MIT） | MIT | 强烈推荐 | 多原型并行开发的 monorepo 底座 | 过滤器/协议语义需团队统一约定；与 npm/yarn workspaces 语义有差异 |

【官方确认事实】（来源：[pnpm.io/workspaces](https://pnpm.io/workspaces)）：

- 工作区由根目录 `pnpm-workspace.yaml` 的 `packages` 字段定义；**自 pnpm v12.7.0 起**，若仓库只有 package.json 的 `workspaces` 字段而无 pnpm-workspace.yaml，`pnpm install` 会自动按同 pattern 生成一份（已有文件不会被覆盖）。
- **`workspace:` 协议**：pnpm "将拒绝解析到任何非本地工作区包"，版本不匹配直接安装失败（消除不确定性）；支持别名（`workspace:foo@*`）、相对路径（`workspace:../foo`）；发布时自动转换为真实 semver（`workspace:*` → `1.5.0`，`workspace:^` → `^1.5.0`）。
- **单一共享 lockfile**（`sharedWorkspaceLockfile` 默认 true）："every dependency is a singleton"——安装更快、评审 diff 更小，同时保留 pnpm 每项目符号链接的严格性。
- 过滤与并行：`pnpm --filter=<pkg> <cmd>`、`-r` 递归、`failIfNoMatch` 无匹配即非零退出、`includeWorkspaceRoot` 默认 false、`workspaceConcurrency` 默认 min(4, CPU 核数)；循环依赖有告警与 `disallowWorkspaceCycles` 禁止项。

**为何适合多原型并行开发（逐条对应官方特性）**：① 共享 lockfile → 多应用一次性安装、依赖版本全局一致；② `workspace:` 协议 → 共享 3D 内核/工具包以源码形式被各原型引用，改一处全生效且发布安全；③ `--filter` → 只构建/测试单个原型，互不拖累；④ 每原型独立 manifest → 依赖版本可局部隔离试验。【V 级实测】本实验室三应用在 Vite 8 下构建合计 <1s，与 pnpm 的并行任务编排（workspaceConcurrency）配合良好。

---

## 8. 浏览器兼容基线：WebGL2 覆盖率

【官方确认事实】数据源：caniuse 官方数据文件 [Fyrd/caniuse · features-json/webgl2.json](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgl2.json)（caniuse.com/webgl2 的机器可读源），抓取核实日期 **2026-11-04/05**：

- **全球支持率约 97.13%**（按全球使用占比口径；partial support 占比 0%）。
- 各浏览器起点版本（caniuse 标 "y" 的区间）：**Chrome 56+、Edge 79+、Firefox 51+、Safari 15+、iOS Safari 15+、Chrome Android、Firefox Android、Samsung Internet 7.2+、Opera 43+**；IE 全系不支持；Android 4.4.4 及以下不支持。
- 历史注记：Safari 10.1–14.1 需在"Experimental Features"中手动开启，**Safari 15 起默认支持**（这也是覆盖率跃升的关键节点）。

**基线建议（研究员）**：2026 年桌面 + 移动现代浏览器可将 **WebGL2 作为默认渲染基线**；工程上仍需：① 运行时能力检测（官方先例：KTX2Loader 的 `detectSupport(renderer)` 模式）；② 为旧 Safari/低端安卓保留 WebGL1 回退预案或明确降级提示。注意 caniuse 口径为"全球使用占比"，与项目目标市场构成可能有偏差。

---

## 9. 核实记录表

| # | 事项 | 核实结论 | 来源 | 方式/日期 |
|---|---|---|---|---|
| 1 | vite 当前版本 | 8.3.5（ Rolldown 内核） | [npm registry](https://registry.npmjs.org/vite)、[vite.dev/blog](https://vite.dev/blog/)、[Announcing Vite 8](https://vite.dev/blog/announcing-vite8) | registry + 官方博客抓取；构建日志 V 级佐证 ｜ 2026-11-04/05 |
| 2 | Vite 8 = Rolldown 默认 | 确认（2026-03-12 发布，官方称 10–30x 提速） | [Announcing Vite 8](https://vite.dev/blog/announcing-vite8) | 官方博客 ｜ 2026-11-04/05 |
| 3 | Vite worker/wasm/大资源支持 | 标准写法 + `?worker`/`?worker&inline`、`.wasm` ESM + `?init`、`?url`/`?raw` | [vite.dev/guide/features](https://vite.dev/guide/features) | 官方指南抓取 ｜ 2026-11-04/05 |
| 4 | typescript 当前版本 | 7.0.2 | [npm registry](https://registry.npmjs.org/typescript) | registry（coordinator 核实引用） ｜ 2026-11-04 |
| 5 | TS 7 官方路线定位 | **未能核实**（本次未单独检索官方公告） | — | — |
| 6 | three.js 是否自带类型 | **否**：three@0.187.0 package.json 无 types/exports.d.ts；需 @types/three 0.187.0 | [three registry](https://registry.npmjs.org/three/latest)、[@types/three registry](https://registry.npmjs.org/@types/three/latest)、[three-ts-types](https://github.com/three-types/three-ts-types) | registry 包体 + README 抓取 ｜ 2026-11-04/05 |
| 7 | "three r150 起自带类型"说法 | 判定为误传（与 registry 实测矛盾），不采纳 | 对比 [mysimulator.uk 教程](https://www.mysimulator.uk/content/tutorials/typescript-threejs-tutorial.html) 与 registry | 交叉验证 ｜ 2026-11-04/05 |
| 8 | vue-tsc 兼容性 | 3.3.14 peer 要求 TS <7，与 7.0.2 不兼容 | 本实验室 | 【V 级实测】 ｜ 2026-11-04 |
| 9 | GLTFLoader/DRACO/KTX2/LoadingManager 官方用法 | 全部按 docs/pages 官方页核实（详见 §3.1） | [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)、[DRACOLoader](https://threejs.org/docs/pages/DRACOLoader.html)、[KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html)、[LoadingManager](https://threejs.org/docs/pages/LoadingManager.html)、[手册 loading-3d-models](https://threejs.org/manual/pages/loading-3d-models.html) | 官方文档抓取 ｜ 2026-11-04/05 |
| 10 | useProgress / useLoader / Suspense | useProgress 包装 DefaultLoadingManager（zustand store）；useLoader "loads and suspends" | [drei 文档](https://drei.docs.pmnd.rs/loaders/progress-use-progress)、[r3f 文档](https://r3f.docs.pmnd.rs/api/hooks) | 官方文档 + 搜索定位 ｜ 2026-11-04/05 |
| 11 | gltf-transform | @gltf-transform/core & cli 4.5.1，MIT | [npm registry](https://registry.npmjs.org/@gltf-transform/core/latest)、[gltf-transform.dev](https://gltf-transform.dev) | registry ｜ 2026-11-04/05 |
| 12 | gltfjsx | 6.5.3，MIT，pmndrs，R3F 专用（Vue 不适用） | [npm registry](https://registry.npmjs.org/gltfjsx/latest)、[GitHub](https://github.com/pmndrs/gltfjsx) | registry ｜ 2026-11-04/05 |
| 13 | 3D/UI 解耦推荐模式 | 外部 store 桥（官方生态）/事件总线（社区）/命令式内核+适配层（社区共识） | [r3f#1249](https://github.com/pmndrs/react-three-fiber/issues/1249)、[r3f#2334](https://github.com/pmndrs/react-three-fiber/discussions/2334)、[zustand 文档](https://zustand.docs.pmnd.rs)、[Discourse](https://discourse.threejs.org/t/accessing-the-camera-in-react-three-fiber-out-of-the-canvas/39137) | 官方 issue/讨论 + 搜索 ｜ 2026-11-04/05 |
| 14 | vitest / @playwright/test 版本与许可 | 5.1.0（MIT）/ 1.64.1（Apache-2.0） | [registry](https://registry.npmjs.org/vitest/latest)、[registry](https://registry.npmjs.org/@playwright/test/latest) | registry ｜ 2026-11-04/05 |
| 15 | headless WebGL 限制 | 默认 SwiftShader 软渲染；GPU 加速未默认开启（官方 issue）；CI 需 xvfb+headed 得真 GPU | [playwright#11627](https://github.com/microsoft/playwright/issues/11627)、[Currents](https://currents.dev/posts/when-tests-should-run-headless-vs-headed-in-playwright)、[Promaton](https://blog.promaton.com/testing-3d-applications-with-playwright-on-gpu-1e9cfc8b54a9)、[davesnider](https://davesnider.com/gputests) | 官方 issue + 社区实测文章 ｜ 2026-11-04/05 |
| 16 | 性能工具版本 | stats.js 0.17.0（MIT）；stats-gl 4.2.3（MIT） | [registry](https://registry.npmjs.org/stats.js/latest)、[registry](https://registry.npmjs.org/stats-gl/latest) | registry ｜ 2026-11-04/05 |
| 17 | stats-gl 具体功能（GPU 面板等） | **未能核实**（未逐读其 README），落地前自行验证 | [仓库](https://github.com/RenaudRohlinger/stats-gl) | — |
| 18 | DevTools Performance 对 WebGL 的支持 | 有 GPU 区块/Frames/Raster Thread Pool/FPS meter；无专门 WebGL 分析章节 | [官方参考文档](https://developer.chrome.com/docs/devtools/performance/reference) | 官方文档抓取 ｜ 2026-11-04/05 |
| 19 | RUM 基础方案 | web-vitals（Apache-2.0）：CLS/INP/LCP/FCP/TTFB，sendBeacon 上报，onCLS 仅 Chromium，不跨 iframe | [GoogleChrome/web-vitals README](https://github.com/GoogleChrome/web-vitals) | 官方 README 抓取 ｜ 2026-11-04/05 |
| 20 | 商用 RUM 平台对比 | **未能核实**（本次仅方向性提及） | — | — |
| 21 | pnpm 版本与 workspace 机制 | 12.16.1；pnpm-workspace.yaml、workspace: 协议、共享 lockfile、--filter、v12.7.0 起可从 npm workspaces 自动生成 | [pnpm.io/workspaces](https://pnpm.io/workspaces)、[npm registry](https://registry.npmjs.org/pnpm/latest) | 官方文档 + registry ｜ 2026-11-04/05 |
| 22 | WebGL2 覆盖率 | 全球约 **97.13%**；Chrome 56+/Edge 79+/Firefox 51+/Safari 15+/iOS Safari 15+ 等为起点（口径：全球使用占比） | [caniuse webgl2 数据文件](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgl2.json)（[caniuse.com/webgl2](https://caniuse.com/webgl2)） | 官方数据 JSON 抓取 ｜ 2026-11-04/05 |
| 23 | Vite 8 三应用构建 <1s；含 JSX 必须 .tsx；IAB/后台 rAF 节流致 FPS 失真 | 成立 | 本实验室 | 【V 级实测】 ｜ 2026-11-04 |
| 24 | camera-controls / pinia / zustand 版本 | 3.1.2 / 4.1.0 / 5.0.16 | npm registry（coordinator 核实引用） | registry ｜ 2026-11-04 |
| 25 | vite `chunkSizeWarningLimit`/`assetsInclude` 具体行为 | **未能核实**（仅经 Features 页间接确认存在于 Config Reference），落地以官方配置参考为准 | [vite.dev/guide/features](https://vite.dev/guide/features) | — |

---

*文档结束。版本号一律以文中所附官方来源为准；本文不覆盖 prototypes 的构建验证结论，二者互补。*
