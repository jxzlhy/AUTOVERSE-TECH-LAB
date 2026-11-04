# AUTOVERSE 动画技术体系研究

> 核实日期：2026-11-04 ｜ 状态：文献研究（GSAP 集成将由 gsap-motion 原型另行验证）｜ 研究员：AI Research Agent C

---

## 0. 摘要与结论速览

| 库 / 技术 | 当前版本 | 许可证 | 推荐程度（AUTOVERSE 场景） |
|---|---|---|---|
| GSAP | 3.15.1（npm，2026-11-04） | Webflow 标准许可证（免费商用，禁捆绑进竞品 no-code 工具） | 强烈推荐（时间线编排 / ScrollTrigger / SplitText） |
| Motion（原 Framer Motion） | 14.9.1（npm，2026-11-04） | MIT | 推荐（React 组件态动画；Vue 需独立包 motion-v） |
| CSS Animation / Web Animations API | 浏览器原生（无版本号） | 无需许可 | 推荐（UI 微交互；不适合 3D 场景动画） |
| Three.js Animation System | 随 three.js rxxx（未单独发版本） | three.js MIT | 强烈推荐（glTF 骨骼/关键帧动画唯一官方路径） |
| camera-controls | 3.1.2（npm，2026-11-04） | MIT | 推荐（交互式镜头/相机转场） |

一句话结论：**GSAP 负责编排（UI + 镜头时间线）、Three.js AnimationMixer 负责 glTF 资产动画、CSS/WAAPI 负责轻量微交互、Motion 承担 React 组件态与弹簧物理**，四者通过 `gsap.ticker` 与 three.js 渲染循环同步，互不冲突。

---

## 1. GSAP

### 1.1 当前版本与免费化事实

【官方确认事实】

- 当前版本 **3.15.1**（npm，2026-11-04 检索）。官方文档页脚与 SplitText 文档均显示当前文档版本为 **v3.15**（来源：[GSAP 官网](https://gsap.com/)、[SplitText 文档](https://gsap.com/docs/v3/Plugins/SplitText/)）。
- GSAP 于 **2025-04-30**（生效日）被 Webflow 收购，之后 **全部插件（含原 Club 付费插件）免费**。官方 pricing 页原文：**"GSAP is now 100% free for all users, thanks to Webflow's support."**，且页面已无任何付费计划（无 Business/Sponsor 层级），页脚标注 "©2026 GSAP - A Webflow Product"。原文还包括 "The GSAP library is maintained by the original GSAP team - working full time at Webflow."
  - 来源：[gsap.com/pricing](https://gsap.com/pricing/)、[webflow.com/updates/gsap-becomes-free](https://webflow.com/updates/gsap-becomes-free)

【社区观点】收购初期社区曾担心"开源承诺缩水"，但 2026 年官网现状（免费声明 + 全插件文档公开 + GitHub 仓库开放）与许可条款均印证免费政策稳定延续。

### 1.2 许可协议现状（标准 GSAP License，重点核实）

以下均为【官方确认事实】，来源 [gsap.com/community/standard-license](https://gsap.com/community/standard-license/)（2025-04-30 生效、2025-05-30 最后修改，许可方为 Webflow，GSAP 全部知识产权归 Webflow 所有）：

- **商业使用：允许且免费。** FAQ 原文："Commercial usage is covered under the standard license." 商业项目可直接免费使用，包括以前的付费插件（SplitText、MorphSVG 等）。
- **禁止用途（对 AUTOVERSE 的关键条款）**：禁止在"无需编码即可构建可视化动画、且实质上与 Webflow 可视化动画构建能力竞争的工具"中使用 GSAP；禁止"为创建竞品而逆向工程 GSAP 产品"（"Reverse engineer any GSAP Products for the purpose of creating Competitive Products"）。官方 FAQ 同时说明：**不与 Webflow 动画功能直接竞争的可视化工具是被鼓励的，AI 生成代码不属于禁止用途**。
- **署名要求：无。** 无 attribution 义务，仅有"不得移除或更改专有声明与品牌标识"条款。
- **分发/部署数量限制：无。** 授予的是 "non-exclusive, worldwide license"，无部署量、分发包数量限制。
- **风险点**：Webflow 保留"随时修订许可条款"的权利，并可对违约者终止许可。对 AUTOVERSE（汽车文明数字宇宙，浏览器端 3D 叙事站，非 no-code 工具）而言，当前条款无阻碍；长期风险是条款变更，建议在依赖清单中记录当前许可证版本号以便审计。

### 1.3 关键插件现状

【官方确认事实】

- **ScrollTrigger**：免费、正常维护；官方论坛有针对 three.js 相机动画抖动的官方回复（浏览器滚动像素对齐导致），提示集成 3D 场景时需注意（来源：[ScrollTrigger and jittery three.js camera animation](https://gsap.com/community/forums/topic/38993-scrolltrigger-and-jittery-threejs-camera-animation)）。
- **SplitText**：v3.13 完成重大重写——官方原文 "Major rewrite in v3.13.0 - half the size, 14 new features!"（体积减半、新增 14 特性）。新特性含：屏幕阅读器无障碍（自动 aria-label/aria-hidden）、`autoSplit` + `onSplit()` 响应式重拆、`mask` 行遮罩揭示、`deepSlice` 跨行嵌套标签切分、emoji/非拉丁语言支持。**限制：不适用于 SVG `<text>` 节点**；大量元素拆分开销大，动画结束后建议 `revert()`。（来源：[SplitText 文档](https://gsap.com/docs/v3/Plugins/SplitText/)）
- **PixiPlugin**：仍在维护（v3.15 文档页正常、无弃用声明）。需先 `gsap.registerPlugin(PixiPlugin)` 并 `PixiPlugin.registerPIXI(PIXI)` 注册一次；支持度数角度（"rotational values are defined in degrees, not radians. Yay!"）、CSS 风格颜色、ColorMatrixFilter 快捷属性（saturation/brightness/contrast/hue/colorize）。文档未绑定特定 PixiJS 版本。（来源：[PixiPlugin 文档](https://gsap.com/docs/v3/Plugins/PixiPlugin/)）
- **gsap.ticker**：官方文档定义其为 "the heartbeat of the GSAP engine"——在每次 `requestAnimationFrame` 上推进全局时间线，是 three.js 渲染循环与 GSAP 同步的关键 API。（来源：[gsap.ticker 文档](https://gsap.com/docs/v3/GSAP/gsap.ticker)）

【社区观点】GSAP 论坛（官方团队回复）指出配合 three.js 时通常**不需要** `gsap.ticker.fps()`，GSAP 原生即以正确的帧率运行（来源：[Three.js and GSAP 论坛帖](https://gsap.com/community/forums/topic/29721-threejs-and-gsap)）。

### 1.4 与 three.js 集成的官方示例情况

【官方确认事实】

- 原官方资源页 `gsap.com/resources/THREE.js/` 已 404（2026-11-04 实测），**gsap.com 目前没有专门的 three.js 集成指南页**。最接近官方的参考是：
  1. `gsap.ticker` API 文档（官方建议模式：`gsap.ticker.add((time) => renderer.render(scene, camera))` 使渲染循环与 GSAP 时间线同源）；
  2. GSAP 论坛官方回复线程（上述 29721、38993 两个帖子含官方团队成员解答）。
- 来源：[gsap.ticker 文档](https://gsap.com/docs/v3/GSAP/gsap.ticker)、[GSAP 论坛](https://gsap.com/community/forums/topic/29721-threejs-and-gsap)

【社区观点】社区成熟模式（大量教程/CodePen 验证）：GSAP 时间线补间相机 position/lookAt 目标/FOV，`gsap.ticker.add()` 或让 three.js 自己的 rAF 循环调 `mixer.update(delta)`；ScrollTrigger 驱动镜头时用 scrub + 虚拟滚动（如 Lenis）缓解抖动（来源：[dev.to 教程：Next.js + three.js + GSAP](https://dev.to/robinzon100/build-an-award-winning-3d-website-with-scroll-based-animations-nextjs-threejs-gsap-3630)、[threejsresources 的 GSAP+three.js 课程](https://threejsresources.com/courses/gsap-threejs)）。此模式将由 gsap-motion 原型另行验证。

### 1.5 适用范围 / 风险与局限

- **推荐程度：强烈推荐。** 适用范围：UI 时间线编排、滚动叙事（ScrollTrigger/ScrollSmoother）、文本拆分动画（SplitText）、镜头关键帧编排（补间相机属性）、与 PixiJS/2D canvas 的动画。
- **风险与局限**：
  1. 许可证由 Webflow 单方面掌控并可修订（当前条款友好，但需留存版本记录）；
  2. 无官方 three.js 集成指南，镜头动画最佳实践依赖社区与原型验证；
  3. ScrollTrigger 驱动 3D 相机存在滚动抖动问题（官方给出解释与缓解方案，需在原型中验证）。

---

## 2. Motion（原 Framer Motion）

### 2.1 改名与版本

【官方确认事实】

- **改名已完成**。官网标题原文："Motion (prev Framer Motion): JavaScript & React animation library"，首屏 "Free and open source. Previously Framer Motion."；GitHub README 明确："Note: Framer Motion is now Motion. Import from motion/react instead of framer-motion."（来源：[motion.dev](https://motion.dev)、[GitHub motiondivision/motion](https://github.com/motiondivision/motion)）
- 当前版本 **14.9.1**（npm，2026-11-04 检索）；官网 changelog 最新条目为 14.9.0（2026-10-30），npm 略新于官网 changelog 展示。近一个月持续发版（14.6.0 → 14.9.0），维护活跃。

### 2.2 框架支持（重点核实 Vue）

【官方确认事实】

- 官网首页原文："is a fast, production-grade animation library for **React, JavaScript and Vue**"；宣传语 "Layout, scroll, gestures, 3D, and hardware acceleration for React, Vue and JavaScript."（来源：[motion.dev](https://motion.dev)）
- **Vue 支持通过独立包 `motion-v`** 提供（GitHub README："An open source animation library for JavaScript, React and Vue"，包分为 `motion/react`、`motion`（vanilla）、`motion-v`（Vue））。官网首页大量示例与文档链接仍以 React 为主（`platform=react`），Vue 属并列支持而非文档一等公民。（来源：[GitHub motiondivision/motion](https://github.com/motiondivision/motion)）
- 官网还明确支持 three.js：**"Animate Three.js meshes, materials and shader uniforms with the same springs and timelines as the DOM."**（来源：[motion.dev](https://motion.dev)）

【社区观点】Vue 社区的 motion-v 包由社区维护推进，成熟度普遍被认为弱于 React 侧（官网文档 React 占比可佐证）；AUTOVERSE 若用 Vue 栈，motion-v 需原型验证后再定依赖。

### 2.3 许可证 / 适用范围 / 风险

【官方确认事实】**MIT 许可证**，README 原文 "Motion is MIT licensed."（来源：[GitHub motiondivision/motion](https://github.com/motiondivision/motion)）

- **推荐程度：推荐（React 栈）/ 观察（Vue 栈）。**
- **适用范围**：React 组件挂载/卸载动画（AnimatePresence）、布局动画、手势、弹簧物理（spring）、以及 three.js mesh/material/uniform 的弹簧补间；`LazyMotion` 按需加载可从 3.2kb 起（官网数据）。
- **风险与局限**：
  1. Vue 包（motion-v）与 React 主包不同源维护，成熟度需验证（未能核实 motion-v 的独立版本节奏）；
  2. 编排长镜头时间线的能力不如 GSAP 时间线成熟；
  3. Framer Motion → Motion 迁移期生态内容混杂，检索旧教程时注意包名已换。

---

## 3. CSS Animation / Web Animations API

### 3.1 现代浏览器中的定位

【官方确认事实】（来源：[MDN CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations)、[MDN Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)、[MDN Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)）

- CSS Animations 与 WAAPI 均由**浏览器原生动画引擎**驱动：对**可合成属性**（`transform`、`opacity`）的动画可脱离主线程在合成器上运行，性能最佳。
- WAAPI（`Element.animate()`）是 CSS 动画的 JS 版超集：支持程序化 play/pause/reverse、动态关键帧、playbackRate、动画完成态持久化（commitStyles 等）。
- 两者是原生标准、零依赖、无许可问题。

### 3.2 UI 微交互 vs 3D 场景动画的分工

【官方确认事实】MDN 教程定位：CSS 适合简单声明式动画（hover、进入/退出、loading 微动效），WAAPI 适合需要 JS 程序化控制的场景。（来源：[MDN Using the Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API)）

【社区观点】（来源：[benedikt-sperl.de：CSS/rAF/WAAPI/View Transitions 对比（2026-01）](https://www.benedikt-sperl.de/blog/animations-on-the-web)、[Telerik：Web Animation API](https://www.telerik.com/blogs/web-animation-api)）

- UI 微交互层首选 CSS（成本最低、合成器加速），需要状态驱动的进阶场景用 WAAPI 或 Motion；
- **CSS/WAAPI 不适合 3D 场景动画**：它们只能操作 DOM/CSSOM 属性，无法触及 WebGL 对象、相机、着色器 uniform；3D 场景必须由 JS（GSAP/Motion/Three.js 内部系统）每帧驱动。二者的交集仅在于 3D 画布之上叠加的 DOM UI（HUD、字幕、转场遮罩）。

- **推荐程度：推荐（限定于 UI 层）。**
- **风险与局限**：动画控制粒度有限；长序列编排需 JS 辅助；Safari/旧引擎对部分新特性（scroll-driven animations）支持进度不一（未能核实 2026 年各浏览器 scroll-driven animations 的最新支持矩阵，建议用时另查 caniuse）。

---

## 4. Three.js Animation System

### 4.1 官方文档现状

【官方确认事实】

- three.js 官方文档 **Core → Animation 分组**包含完整动画类：`AnimationAction`、`AnimationClip`、`AnimationMixer`、`AnimationObjectGroup`、`AnimationUtils`、`PropertyBinding`、`PropertyMixer`，以及 7 种 KeyframeTrack（Boolean/Color/Number/Quaternion/String/Vector/KeyframeTrack）。（来源：[threejs.org/docs 动画分组](https://threejs.org/docs/#api/en/animation/AnimationMixer)，2026-11-04 实测目录）
- **AnimationMixer.update** 官方原文："Advances the global mixer time and updates the animation. This is usually done in the render loop by passing the delta time from Clock or Timer." —— 官方明确要求在渲染循环每帧传入 delta 时间调用。（来源：[AnimationMixer.update 官方文档](https://threejs.org/docs/#api/en/animation/AnimationMixer.update)）
- 官方手册保留 **Animation System 章节**（threejs.org/docs/#manual/en/introduction/Animation-system），内容涵盖 AnimationMixer、动画混合与 morph targets。（注：该手册页为 SPA，本次未能直接抓取正文全文，章节存在性与覆盖范围经官方文档目录与检索摘要核实。）
- **官方 glTF 动画示例存在**：`webgl_animation_gltf`（加载带蒙皮动画的 Soldier.glb，用 GLTFLoader + AnimationMixer，可切换 idle/walk/run）；官方示例库还含 `animation/keyframes`、`animation/skinning/blending` 等分类。（来源：[three.js 官方示例库](https://threejs.org/examples/)）

### 4.2 glTF 动画播放的标准模式

【官方确认事实】官方示例确认的标准流程（与官方文档一致）：加载 glTF → `new THREE.AnimationMixer(gltf.scene)` → `mixer.clipAction(gltf.animations[n])` → `action.play()` → 渲染循环每帧 `mixer.update(clock.getDelta())`。（来源：[three.js examples](https://threejs.org/examples/)；【社区观点】多模型场景需每个模型独立 mixer（来源：[three.js Discourse](https://discourse.threejs.org/t/loading-animations-on-different-gltf-models-in-scene/44429)））

### 4.3 镜头动画常用方案

【官方确认事实】

- three.js 核心不提供"相机动画系统"，CameraHelper 仅是相机辅助可视化工具，不是动画方案。
- 官方维护的交互控制基线是 `OrbitControls`（examples/jsm）。

【社区观点 / 权威社区库】

- **手动 lerp/damp**：渲染循环里 `camera.position.lerp(target, k)`，最轻量但编排能力弱，社区教程普遍作为入门方案（来源：[waelyasmina.net 的 three.js 模型动画指南](https://waelyasmina.net/articles/all-you-need-to-know-about-loading-and-animating-models-in-three-js)）。
- **GSAP 补间相机属性**：镜头关键帧编排的事实标准（见第 1.4 节）。
- **camera-controls**：`THREE.OrbitControls` 的增强替代，官方仓库自述 "A camera control for three.js, similar to THREE.OrbitControls yet supports smooth transitions and more features."。核心能力：v2 起用 **SmoothDamp** 算法（smoothTime/draggingSmoothTime）、`enableTransition` 的方法返回 **Promise**（可 async/await 串联镜头脚本）、fitToBox/fitToSphere、边界与碰撞检测、事件系统（transitionstart/rest/sleep）、状态序列化。MIT 许可；需 `CameraControls.install({ THREE })` 注入，支持 tree-shaking 传入 three.js 类子集；每帧 `control.update(delta)`。版本 3.1.2（npm，2026-11-04）。（来源：[GitHub yomotsu/camera-controls](https://github.com/yomotsu/camera-controls)、[camera-controls 文档站](https://yomotsu.github.io/camera-controls/)）
- 三个方案可共存：叙事镜头走 GSAP 时间线，自由探索走 camera-controls，一次性轻量过渡用手动 lerp。

- **推荐程度：AnimationMixer 强烈推荐（资产动画）；camera-controls 推荐（交互镜头）。**
- **风险与局限**：
  1. AnimationMixer 文档正文为 SPA 页面，离线检索不便（内容本身完善）；
  2. camera-controls 2.x 与 3.x 行为有差异（v3 改 SmoothDamp 与方位角归一化选项），升级需读迁移指南；
  3. 手动 lerp 的帧率无关性需自行保证（用 delta 归一），编排复杂镜头时易失控。

---

## 5. 场景转场（Scene Transition）方案调研

### 5.1 方案 A：GSAP 时间线驱动镜头 + 后期处理过渡

【社区观点 / 权威社区示例】

- Codrops（WebGL 社区权威教程站）2025-10 教程《How to Animate WebGL Shaders with GSAP》系统演示 GSAP 补间自定义着色器 uniform 实现 ripple/reveal/动态模糊；配套官方 demo 与 GitHub 源码。（来源：[Codrops 2025-10-08](https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects)、[demo](https://tympanus.net/Tutorials/ShaderAnimationGSAP)）
- Codrops 2021 教程《Rock the Stage with a Smooth WebGL Shader Transformation on Scroll》以 Three.js + GSAP + GLSL 实现滚动驱动的舞台级着色器转场。（来源：[Codrops 2021-07-13](https://tympanus.net/codrops/2021/07/13/rock-the-stage-with-a-smooth-webgl-shader-transformation-on-scroll)）
- 社区共识：GSAP 时间线同时编排相机路径与过渡 uniform（进度条/遮罩强度），是"叙事型站点"的主流架构。

### 5.2 方案 B：着色器转场（Shader Transition）

【社区观点】

- 通用做法：**两个场景渲染到 render target，再经全屏 quad / 后处理 pass 用 transition uniform 混合**（mix/dissolve/displacement/displacement-map 等效果）。（来源：[three.js Discourse：Transition effect between multiple scenes](https://discourse.threejs.org/t/transition-effect-between-multiple-scenes/68128)、[Stack Overflow：Cross-fade with quad material](https://stackoverflow.com/questions/28313349/cross-fade-using-quadmaterial-threejs-syntax)）
- 性能要点：**共享一个 renderer/WebGL 上下文**，用纹理混合代替切换 canvas；转场结束后释放旧场景资源。（来源：[Utsubo：100 Three.js 性能技巧](https://www.utsubo.com/blog/threejs-best-practices-100-tips)）
- 更风格化的效果（位移、溶解、扭曲遮罩）见 Codrops 后处理系列教程。（来源：[Codrops postprocessing 合集](https://tympanus.net/codrops/tag/postprocessing)）

### 5.3 方案 C：多 Canvas 方案

【社区观点】

- 多 Canvas / 多 iframe（每场景独立上下文，CSS 过渡叠放）在社区讨论中出现，被评价为"取决于具体用例"：实现隔离性好，但**多 WebGL 上下文的内存与上下文数量限制是明确代价**，主流不推荐用于大量场景切换。（来源：[three.js Discourse 68128（含 iframe + CSS 转场示例讨论）](https://discourse.threejs.org/t/transition-effect-between-multiple-scenes/68128)）
- 单 WebGL 场景常驻 + 路由驱动的替代思路：不换场景，只换光照/材质/相机，路由切换时场景持续存在（SPA 转场体验最佳，需与页面转场协调；Codrops 亦有 React Router + GSAP 协调持久 3D 层的教程）。（来源：[r/threejs：Page transitions](https://www.reddit.com/r/threejs/comments/1kfwxl6/page_transitions)、[Codrops GSAP 合集](https://tympanus.net/codrops/tag/gsap)）

### 5.4 小结

AUTOVERSE 这种多展厅/多时代场景的叙事站，社区证据指向的组合是：**单 renderer 常驻 + GSAP 时间线编排镜头 + render target 混合的着色器转场**；多 Canvas 仅在场景隔离需求压倒性能时考虑。以上均为社区成熟实践（Codrops/Discourse/Reddit），无官方规范背书，将进入原型验证。

---

## 6. AUTOVERSE 场景动画分层建议

> 原则：**每层一个主工具，层间用统一时间源同步**；UI 层与 3D 层绝不混用同一补间系统去操作对方的对象。

### 6.1 UI 动画层（HUD、字幕、仪表、叙事文本）

- **主工具：GSAP**（时间线编排 + ScrollTrigger 滚动叙事 + SplitText 文本逐字揭示）。
- **辅助：CSS Animation / WAAPI** 处理 hover、按钮态、loading 等高频微交互（合成器加速、零 JS 开销）。
- **可选：Motion**——若 AUTOVERSE 采用 React 框架（见 frontend-frameworks.md），组件级挂载/卸载与布局动画用 Motion 的 AnimatePresence/spring 更省代码；其官网明确支持 three.js 对象弹簧补间，可作为物理感微动的补充。
- **理由**：GSAP 时间线是唯一能将"文本揭示 + 滚动进度 + 3D 镜头触发"编成单一序列的成熟方案（官方事实：timeline + ScrollTrigger + SplitText 3.13 重写后免费）；CSS 覆盖静态微交互成本最低（MDN 官方定位）。

### 6.2 镜头层（相机路径、场景巡航、转场）

- **主工具：GSAP 时间线补间相机属性**（position / quaternion 目标 / FOV），配 `gsap.ticker.add((t) => renderer.render(scene, camera))` 保持同源时钟（官方文档定位 ticker 为引擎心跳）。
- **交互镜头：camera-controls 3.1.2**（Promise 化镜头脚本 + SmoothDamp，与 GSAP 可串联：GSAP 触发 → `await control.setLookAt(...)` 过渡 → 交还用户控制）。
- **转场：render target 混合的着色器转场**（Codrops 模式），GSAP 补间 transition uniform；避免多 WebGL 上下文。
- **理由**：three.js 官方无镜头动画系统（官方事实）；GSAP 补间 + ticker 同步是社区最成熟路径，ScrollTrigger 可直接把镜头绑到滚动叙事；camera-controls 补足"叙事结束后的自由探索"，且 MIT 无许可风险。
- **注意**：ScrollTrigger 驱动相机的抖动问题需在 gsap-motion 原型中验证官方缓解方案（像素对齐/虚拟滚动）。

### 6.3 3D 对象动画层（车辆、人物、机械装置、展品）

- **主工具：Three.js AnimationMixer / AnimationClip**——一切来自 DCC 软件（Blender 等）烘焙的 glTF 骨骼/关键帧动画都应走官方系统：`mixer.clipAction()` + 渲染循环 `mixer.update(delta)`（官方文档明确要求每帧传 delta）。多个模型各建独立 mixer。
- **程序化动画：GSAP 直接补间 three.js 对象属性与材质 uniform**（旋转展台、灯光强度、材质颜色、着色器 uniform）——官网声明 PixiPlugin 模式证明其"补间任意对象属性"的能力同样适用于 three.js 普通对象；Motion 官网亦声明可补间 mesh/material/uniform，作为弹簧物理备选。
- **理由**：glTF 资产动画只能由 AnimationMixer 播放（官方架构），硬件级蒙皮/混合（blending、crossFade）免费获得；程序化小动画若也进 Blender 烘焙会显著增加资产体积，用 GSAP 补间更轻。
- **注意**：AnimationMixer 与 GSAP 各自持有时钟，需统一 delta 来源（同一 rAF/ticker 内先 `mixer.update` 再 render），避免双时钟漂移。

### 6.4 分层总览表

| 层 | 首选 | 备选/辅助 | 同步机制 |
|---|---|---|---|
| UI 动画层 | GSAP（timeline/ScrollTrigger/SplitText） | CSS/WAAPI（微交互）、Motion（React 组件态） | 与 3D 层共享 gsap.ticker 时钟 |
| 镜头层 | GSAP 时间线补间相机 | camera-controls 3.1.2（交互）、AnimationClip（预制相机轨） | `gsap.ticker.add` 内驱动渲染 |
| 3D 对象动画层 | Three.js AnimationMixer（glTF 资产） | GSAP/Motion 补间对象属性与 uniform | 同一渲染循环内 `mixer.update(delta)` |

---

## 7. 核实记录表

| # | 核实项 | 结论 | 来源 | 日期 | 方法 |
|---|---|---|---|---|---|
| 1 | GSAP 当前版本 | 3.15.1 | npm（gsap 包） | 2026-11-04 | npm 检索（由协调者核实，本文档直接引用） |
| 2 | GSAP 全插件免费 | 确认（"GSAP is now 100% free for all users"） | [gsap.com/pricing](https://gsap.com/pricing/) | 2026-11-04 | WebFetch 官网 |
| 3 | GSAP 收购生效日 | 2025-04-30 生效，2025-05-30 许可最后修改 | [gsap.com/community/standard-license](https://gsap.com/community/standard-license/) | 2026-11-04 | WebFetch 官网 |
| 4 | GSAP 标准许可商业条款 | 商用免费；禁捆绑竞品 no-code 动画工具；禁逆向做竞品；无署名要求；无分发数量限制；Webflow 可修订条款 | [gsap.com/community/standard-license](https://gsap.com/community/standard-license/) | 2026-11-04 | WebFetch 官网 FAQ/Prohibited Uses |
| 5 | SplitText 现状 | v3.13 重大重写（half the size, 14 new features），免费开源，含 aria 无障碍/mask/autoSplit；不适用 SVG text | [SplitText 文档](https://gsap.com/docs/v3/Plugins/SplitText/) | 2026-11-04 | WebFetch 官网 |
| 6 | PixiPlugin 现状 | v3.15 文档在维护、无弃用声明；需 registerPIXI；度数角度/ColorMatrixFilter 快捷属性 | [PixiPlugin 文档](https://gsap.com/docs/v3/Plugins/PixiPlugin/) | 2026-11-05 | WebFetch 官网 |
| 7 | GSAP×three.js 官方集成页 | 原 resources/THREE.js 页 404，无专门官方指南；官方参考为 gsap.ticker 文档 + 论坛官方回复 | [gsap.ticker 文档](https://gsap.com/docs/v3/GSAP/gsap.ticker)、[论坛帖 29721](https://gsap.com/community/forums/topic/29721-threejs-and-gsap) | 2026-11-04 | WebFetch + WebSearch |
| 8 | ScrollTrigger 相机抖动 | 官方论坛回复存在（滚动像素对齐原因与缓解） | [论坛帖 38993](https://gsap.com/community/forums/topic/38993-scrolltrigger-and-jittery-threejs-camera-animation) | 2026-11-04 | WebSearch |
| 9 | Motion 改名状态 | 已完成："Motion (prev Framer Motion)"；包名迁移至 motion/react | [motion.dev](https://motion.dev)、[GitHub motiondivision/motion](https://github.com/motiondivision/motion) | 2026-11-04 | WebFetch 官网+仓库 |
| 10 | Motion 版本 | 14.9.1（npm）；官网 changelog 展示 14.9.0（2026-10-30） | npm；[motion.dev](https://motion.dev) | 2026-11-04 | npm 检索（协调者）+ WebFetch 官网 |
| 11 | Motion 对 Vue 支持 | 官网将 React/Vue/JS 并列支持；Vue 经独立包 motion-v；React 文档一等公民 | [motion.dev](https://motion.dev)、[GitHub motiondivision/motion](https://github.com/motiondivision/motion) | 2026-11-04 | WebFetch |
| 12 | Motion 许可证 | MIT（"Motion is MIT licensed."） | [GitHub motiondivision/motion](https://github.com/motiondivision/motion) | 2026-11-04 | WebFetch 仓库 |
| 13 | CSS/WAAPI 定位 | 合成器加速（transform/opacity）适合 UI 微交互；无法触及 WebGL 对象，不适用 3D 场景 | [MDN WAAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)、[MDN CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations) | 2026-11-04 | WebSearch（MDN 链接核实） |
| 14 | three.js 动画类完整性 | Core→Animation 含 AnimationMixer/AnimationClip/AnimationAction/7 种 KeyframeTrack 等 | [threejs.org/docs](https://threejs.org/docs/#api/en/animation/AnimationMixer) | 2026-11-04 | WebFetch 官方文档目录 |
| 15 | AnimationMixer.update 语义 | 官方原文确认渲染循环每帧传 delta（Clock/Timer） | [AnimationMixer.update 文档](https://threejs.org/docs/#api/en/animation/AnimationMixer.update) | 2026-11-04 | WebSearch 引官方原文 |
| 16 | three.js 手册 Animation System 章节 | 存在（#manual/en/introduction/Animation-system），覆盖 mixer/混合/morph targets；正文未能直接抓取（SPA），部分经检索摘要核实 | [threejs.org docs/manual](https://threejs.org/docs/#manual/en/introduction/Animation-system) | 2026-11-04 | WebFetch + WebSearch |
| 17 | 官方 glTF 动画示例 | webgl_animation_gltf 存在（Soldier.glb，GLTFLoader+AnimationMixer，idle/walk/run）；另有 animation/keyframes、animation/skinning/blending 分类 | [threejs.org/examples](https://threejs.org/examples/) | 2026-11-04 | WebSearch |
| 18 | camera-controls | 3.1.2（npm）；MIT；SmoothDamp；enableTransition 方法返回 Promise；需 install({THREE}) 注入 | npm（协调者核实）；[GitHub yomotsu/camera-controls](https://github.com/yomotsu/camera-controls) | 2026-11-04 | WebFetch 仓库 |
| 19 | 着色器转场主流做法 | 双 render target 混合 + 全屏 quad/后处理 + transition uniform；共享单 renderer | [three.js Discourse 68128](https://discourse.threejs.org/t/transition-effect-between-multiple-scenes/68128)、[SO 28313349](https://stackoverflow.com/questions/28313349/cross-fade-using-quadmaterial-threejs-syntax)、[Utsubo 性能技巧](https://www.utsubo.com/blog/threejs-best-practices-100-tips) | 2026-11-04 | WebSearch |
| 20 | GSAP+shader 转场权威示例 | Codrops 2025-10 教程（GSAP 补间 uniform）+ demo + GitHub 源码；Codrops 2021 滚动着色器转场教程 | [Codrops 2025-10](https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects)、[Codrops 2021-07](https://tympanus.net/codrops/2021/07/13/rock-the-stage-with-a-smooth-webgl-shader-transformation-on-scroll) | 2026-11-05 | WebSearch |
| 21 | 多 Canvas/iframe 方案 | 社区讨论存在，被认为视用例而定；多 WebGL 上下文代价明确，非主流推荐 | [three.js Discourse 68128](https://discourse.threejs.org/t/transition-effect-between-multiple-scenes/68128) | 2026-11-04 | WebSearch |
| 22 | 浏览器 scroll-driven animations 支持矩阵 | **未能核实**（2026 年各引擎最新支持状态，用时另查 caniuse） | — | — | — |
| 23 | motion-v 独立版本节奏 | **未能核实**（npm 包存在，发版节奏未检索） | — | — | — |

---

*本文档为文献研究产物，不含代码实验；GSAP 与 three.js 的集成行为、镜头抖动缓解、着色器转场性能将由 gsap-motion 原型（另行立项）验证。*
