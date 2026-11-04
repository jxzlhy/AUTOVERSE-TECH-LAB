# 视觉渲染技术研究（three.js 视觉管线：PBR / 后期处理 / WebGPU / 粒子 / 玻璃 / 车漆）

> 核实日期：2026-11-04 ｜ 状态：文献研究（渲染效果由 three-rendering / lighting-and-materials 原型另行验证）｜ 研究员：AI Research Agent D

---

## 0. 研究说明与口径

- **版本基线**：three.js 当前发布版本 **0.187.0（r187）**，MIT 许可（来源：[three.js 仓库 package.json（dev 分支，version: 0.187.0, license: MIT）](https://github.com/mrdoob/three.js/blob/dev/package.json)；npm 侧预核实一致，见 [npm: three](https://www.npmjs.com/package/three)）。
- **标注口径**：文中结论分为两类——
  - **【官方确认事实】**：出自 three.js 官方文档（threejs.org/docs、threejs.org/manual）、官方源码注释（官方文档自 r168 前后由源码注释生成）、官方示例、官方 Release Notes / 迁移指南 / 官方 Wiki，或浏览器厂商官方发布说明（Chrome Developers、webkit.org、Apple Developer、Mozilla/MDN）、caniuse 数据。
  - **【社区观点】**：论坛、教程、博客等第三方资料，仅作参考。
- **官方 docs 静态页**：three.js 官方文档现已提供可直接访问的静态页面（如 `threejs.org/docs/pages/MeshPhysicalMaterial.html`），本文引用以核实过的页面为准。
- 检索不到的内容一律标注"**未能核实**"，不做推测性表述。

---

## 1. PBR 与环境光照（IBL）

### 1.1 MeshStandardMaterial vs MeshPhysicalMaterial

**【官方确认事实】**

- MeshStandardMaterial："A standard physically based material, using Metallic-Roughness workflow"，采用物理正确模型而非经验近似，比 MeshLambertMaterial / MeshPhongMaterial 更真实但计算更贵（逐像素着色）。核心参数：`metalness`（默认 0，"非金属（木材、石材）用 0.0，金属用 1.0，中间值适合做锈蚀感"）、`roughness`（默认 1，"0.0 = 光滑镜面，1.0 = 完全漫反射"）、`envMap`（"内部会用 PMREMGenerator 预处理以获得物理正确的渲染"，官方推荐使用 `.exr/.hdr` 等浮点格式的线性亮度数据）、`envMapIntensity`（默认 1，按乘法缩放环境贴图贡献）。
  来源：[官方文档 MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)；[源码 src/materials/MeshStandardMaterial.js（r187）](https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshStandardMaterial.js)
- MeshPhysicalMaterial **继承自 MeshStandardMaterial**，在其上提供"更高级的物理渲染属性"（clearcoat、anisotropy、iridescence、sheen、diffuse roughness、transmission、dispersion 等）。官方文档两条关键论断：
  - "**Most effects are disabled by default, and add cost as they are enabled**"（大多数效果默认关闭，开启即产生额外开销）；
  - "**For best results, always specify an environment map when using this material**"（要获得最佳效果，使用该材质时务必指定环境贴图）——这是环境光照（IBL）重要性的官方直接依据。
  来源：[官方文档 MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)；[源码 src/materials/MeshPhysicalMaterial.js（r187）](https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshPhysicalMaterial.js)
- 官方车漆示例 `webgl_materials_car` 中：车身用 `MeshPhysicalMaterial`，轮毂/饰条用 `MeshStandardMaterial`，车窗玻璃用 `MeshPhysicalMaterial`（transmission），见第 6 节。

### 1.2 PMREMGenerator 与 three.js 的 IBL 标准做法

**【官方确认事实】**

- PMREMGenerator："Generates a **Prefiltered, Mipmapped Radiance Environment Map (PMREM)** for image-based lighting"——生成预过滤、带 mipmap 的辐射环境贴图；其 mip 层按粗糙度递增保存 GGX 预过滤辐射（"from a mirror at level 0 to roughness 1"），锐利层采用 GGX 可见法线采样（引用 Heitz 2018）。核心方法：`fromScene(scene, sigma, near, far, options)`（可对场景先做高斯模糊再 GGX 过滤）、`fromEquirectangular` / `fromCubemap`（转换 LDR/HDR 贴图）。
  来源：[官方源码 src/extras/PMREMGenerator.js（r187，类文档注释）](https://github.com/mrdoob/three.js/blob/dev/src/extras/PMREMGenerator.js)；[官方文档 PMREMGenerator](https://threejs.org/docs/#api/en/extras/PMREMGenerator)
- **three.js 的 IBL 标准做法（官方示例中的两种路径）**：
  1. **HDR 环境贴图直挂**：`scene.environment = new HDRLoader().load( 'textures/equirectangular/venice_sunset_1k.hdr' );`（车漆示例 `webgl_materials_car` 现行代码即如此，不手动调 PMREM，内部自动预处理）。来源：[官方示例 webgl_materials_car（r187）](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_car.html)
  2. **程序化场景生成环境**：`scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;`（官方示例 `misc_exporter_usdz`）。来源：[官方示例 misc_exporter_usdz（r187）](https://github.com/mrdoob/three.js/blob/dev/examples/misc_exporter_usdz.html)
- 注意：官方示例 `webgl_animation_keyframes` 现行版本改用 `Sky`（大气散射天空盒）作为 `pmremGenerator.fromScene(sky)` 的输入，说明"fromScene 的输入可以是任意场景"（天空、房间、自建灯光场景均可）。
  来源：[官方示例 webgl_animation_keyframes（r187）](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_animation_keyframes.html)

### 1.3 RoomEnvironment 官方用法

**【官方确认事实】**

- RoomEnvironment 位于 `three/addons/environments/RoomEnvironment.js`，继承 `Scene`，内部为"一个用于 PMREMGenerator#fromScene 输入的基础房间场景"：一个大反向盒子（房间）+ 6 个 InstancedMesh 摆放的家具状盒子 + 1 个点光（intensity 900）+ 6 块自发光面板灯（emissive-only 材质）。其文档明确：PMREM 输出"可用于 Image Based Lighting，赋给 `Scene#environment` 或直接作为 PBR 材质的环境贴图"。实现源自 Google model-viewer 项目的 EnvironmentScene；提供 `dispose()` 释放资源。
  来源：[官方源码 examples/jsm/environments/RoomEnvironment.js（r187）](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/environments/RoomEnvironment.js)
- 官方示例 `misc_exporter_usdz` 实际用法（引用）：
  ```js
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
  ```
  （`0.04` 为 sigma 模糊参数。）

### 1.4 技术记录：PBR / IBL

| 维度 | 结论 |
|---|---|
| 成熟度 | 高。PBR（metallic-roughness）与 PMREM-IBL 是 three.js 多年前的标准能力，r187 文档/示例稳定【官方】 |
| 浏览器兼容 | WebGLRenderer 覆盖 WebGL2 全部主流浏览器；无兼容性问题【官方】 |
| 性能代价（定性） | MeshStandard/Physical 为逐像素 PBR，成本高于 Lambert/Phong（官方明示）；MeshPhysicalMaterial 每开启一个高级层（clearcoat/transmission/iridescence/sheen…）增加一份着色开销（官方明示"add cost as they are enabled"） |
| 推荐程度 | 强烈推荐。AUTOVERSE 所有实体对象默认 MeshStandardMaterial，重点视觉物（车漆、展品）用 MeshPhysicalMaterial + HDR 环境 |
| 适用范围 | 车辆外观、展馆空间、一切需要真实感的材质 |
| 风险与局限 | 环境贴图质量直接决定观感（官方要求 PBR 材质务必配 envMap）；LDR 贴图做 IBL 会明显失真，应使用 HDR（.hdr/.exr）；RoomEnvironment 适合开发期/无外部资产场景，正式展示建议换 HDR 实拍环境 |

---

## 2. 后期处理（Post Processing）

### 2.1 three.js 官方 EffectComposer 体系（WebGL 主线）现状

**【官方确认事实】**

- 官方手册《Post Processing》章节确认 EffectComposer 机制：向 composer 添加多个 `Pass`，内部用两个渲染目标 rtA/rtB **乒乓交替**读写；流程为 `RenderPass`（场景）→ 效果 Pass → `OutputPass`（末位，负责 sRGB 色彩空间转换与可选色调映射）；resize 时须调用 `composer.setSize`。来源：[官方手册 manual/pages/post-processing.html](https://github.com/mrdoob/three.js/blob/dev/manual/pages/post-processing.html)（线上入口 [threejs.org/manual/#en/post-processing](https://threejs.org/manual/#en/post-processing)）
- **四大目标 Pass 的官方示例现状（均在 r187 官方示例库中存活）**：
  - **UnrealBloomPass**（辉光）：`webgl_postprocessing_unreal_bloom`，组合 EffectComposer + RenderPass + UnrealBloomPass + OutputPass；示例中 `new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85)`，GUI 默认 strength 1 / radius 0.5 / threshold 0，另有色调映射曝光滑杆。来源：[官方示例 webgl_postprocessing_unreal_bloom](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_unreal_bloom.html)
  - **SSAOPass**（环境光遮蔽）：`webgl_postprocessing_ssao`，参数 `kernelRadius`（0–32）、`minDistance`（0.001–0.02）、`maxDistance`（0.01–0.3），支持 Default / SSAO Only / +Blur / Depth / Normal 输出模式。来源：[官方示例 webgl_postprocessing_ssao](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_ssao.html)
  - **SSRPass**（屏幕空间反射）：`webgl_postprocessing_ssr`，`new SSRPass({ renderer, scene, camera, ... })`，参数含 `thickness`（示例 0.018）、`maxDistance`（0.1）、`infiniteThick`、`opacity`、`fresnel`、`bouncing`、`blur`、`resolutionScale`，可配合 ReflectorForSSRPass 地面镜面。来源：[官方示例 webgl_postprocessing_ssr](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_ssr.html)
  - **BokehPass / DOF**（景深）：`webgl_postprocessing_dof`，`new BokehPass(scene, camera, { focus: 1.0, aperture: 0.025, maxblur: 0.01 })`，GUI 可调 focus/aperture/maxblur。来源：[官方示例 webgl_postprocessing_dof](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_dof.html)
- 这些 Pass 均属 addons（`three/addons/postprocessing/*.js`），官方 docs API 目录未单独收录各 Pass 页；EffectComposer 的权威说明位于官方手册章节（docs API 中未检索到 EffectComposer 页面，"是否完全未收录"未能核实）。
- 输出链官方要求：末位使用 `OutputPass` 做色彩空间/色调映射（UnrealBloom/SSAO/Bokeh 三个官方示例均以 `OutputPass` 收尾）。

### 2.2 pmndrs `postprocessing` 库现状

**【官方确认事实】（以下为该库官方仓库与 npm 的信息）**

- 当前版本 **6.39.6**（npm 最近发布 3 天前，周下载量约 171 万）。来源：[npm: postprocessing](https://www.npmjs.com/package/postprocessing)
- 许可：**Zlib**（注意：不是 MIT；README 说明其源头代码来自 three.js（MIT），但该库本身以 Zlib 发布——Zlib 为宽松许可，商用无障碍，仅需保留版权声明）。来源：[GitHub: pmndrs/postprocessing](https://github.com/pmndrs/postprocessing)、[package.json（license: Zlib）](https://github.com/pmndrs/postprocessing/blob/master/package.json)
- peer dependency：`three >= 0.168.0 < 0.188.0`（与 three r187 兼容，但升级 three 需盯紧上限）。来源：[package.json（master）](https://github.com/pmndrs/postprocessing/blob/master/package.json)
- 架构卖点（官方 README 原文意译）：`EffectPass` 会"自动组织并合并任意效果组合，最小化全屏渲染次数"；全屏操作用"单个三角形"替代四边形以减少片元开销；内置效果涵盖抗锯齿、bloom、blur、DOF、god rays、glitch、SSAO、outline、pixelation、色调映射、LUT 调色、色差、噪点等。推荐 renderer 设置：`antialias: false, stencil: false`、HalfFloatType 线性 HDR 缓冲。

**【社区观点】**：社区普遍认为 pmndrs postprocessing 的效果质量与性能优于官方 EffectComposer 的逐 Pass 方案（多效果叠加时尤其明显）；官方库的优势是零额外依赖、示例生态最大、许可是 MIT。来源举例：[pmndrs README 的性能论述](https://github.com/pmndrs/postprocessing)（官方口径），社区对比讨论散见于 three.js 论坛（本次未逐条核实具体帖子）。

### 2.3 两者关系与选型建议

- 关系：pmndrs postprocessing 由 three.js 官方早期代码发展而来（官方 README 明示出处），API 上同样以 composer + pass/effect 组织，但**不是**官方 addons 的一部分；官方 EffectComposer 的 UnrealBloomPass 等即源自同一血统。
- **AUTOVERSE 选型建议**：
  1. 效果少（1–2 个，如纯 bloom）、追求零依赖与最大示例兼容 → **官方 EffectComposer**；
  2. 效果多（bloom + DOF + 色差 + LUT + 抗锯齿叠加，正是"汽车文明数字宇宙"的质感需求）→ **pmndrs postprocessing**（EffectPass 合并大幅省带宽，Zlib 许可商用可用）；
  3. 无论哪条线，末位保留输出 Pass（OutputPass / ToneMappingEffect）统一色彩管理；SSR/SSAO 属重开销后期，只对特定场景按需开启。

| 维度 | 官方 EffectComposer | pmndrs postprocessing |
|---|---|---|
| 成熟度 | 高（官方示例/手册长期维护）【官方】 | 高（6.39.6，周下载约 171 万）【官方数据】 |
| 兼容 | WebGL 主线 | WebGL 主线（peer three 0.168–0.187） |
| 性能 | 逐 Pass 全屏乒乓，多 Pass 时带宽开销线性叠加【官方机制】 | EffectPass 合并 + 单三角形全屏，多效果时更优【官方 README】 |
| 许可 | MIT（随 three）【官方】 | Zlib【官方】 |
| 推荐程度 | ★★★★（轻量场景首选） | ★★★★★（重后期首选） |
| 风险 | 多 Pass 叠加性能下滑；Pass 集合更新慢 | three 版本窗口硬约束（<0.188），升级 three 前必须核对 |

---

## 3. TSL / WebGPU

### 3.1 WebGPURenderer 官方定位与 WebGL 回退

**【官方确认事实】**

- 官方文档原文："WebGPURenderer has the ability to target different backends. By default, the renderer tries to use a WebGPU backend if the browser supports WebGPU. If not, WebGPURenderer falls backs to a WebGL 2 backend."；构造项 `forceWebGL`（默认 false）可强制走 WebGL 2 后端。WebGPURenderer 被定位为"WebGLRenderer 的新替代品"（"the new alternative of WebGLRenderer"），但**并未取代默认地位**——WebGLRenderer 仍是大量官方示例的默认渲染器。
  来源：[官方文档 WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html)；[源码 src/renderers/webgpu/WebGPURenderer.js（r187）](https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgpu/WebGPURenderer.js)
- 源码注释中**没有任何"生产就绪/稳定"声明**（无稳定性警告，也无成熟度承诺）——官方是否将其标为生产就绪：**未能核实**（不存在该表述）。
- 官方 r183 release notes 含 "Fix compatibility with WebGLBackend if used as a fallback" 等条目，说明回退路径仍在持续修复（属官方事实，间接说明回退为常规配置）。
  来源：[three.js r183 Release Notes](https://github.com/mrdoob/three.js/releases/tag/r183)

### 3.2 TSL 官方现状

**【官方确认事实】**

- TSL（Three.js Shading Language）官方 Wiki 定义："基于 Node 的着色器抽象，用 JavaScript 编写"，"可编码为不同输出如 WGSL/GLSL——WebGPU/WebGL"，目标是"保持渲染器后端无关（keeping the renderer agnostic）"；定位为替代 `.onBeforeCompile()` 字符串 hack 的新一代着色系统；构建流程"setup、analyze、generate"三支柱，节点系统自动去重/优化/类型转换。
  来源：[three.js 官方 Wiki: Three.js Shading Language](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- r183 release notes："Introduce TSL.md (TSL Spec)"——官方已发布 TSL 规格文档。
  来源：[three.js r183 Release Notes](https://github.com/mrdoob/three.js/releases/tag/r183)
- 包入口：npm 包 `three` 官方导出 `"three/webgpu"`（→ `build/three.webgpu.js`）与 `"three/tsl"`（→ `build/three.tsl.js`），另有 `three/addons/*`。来源：[package.json（dev）](https://github.com/mrdoob/three.js/blob/dev/package.json)
- 迁移指南（官方 Wiki）明确：**r182 → r183："PostProcessing has been renamed to RenderPipeline."**；另含 SSR 混合改 additive、Clock 弃用改 Timer、Sky 旧 gamma 校正移除等。官方还建议"每次按不超过 10 个 release 的增量升级"。来源：[官方 Wiki: Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- r187 现状：`RenderPipeline` 位于核心 `src/renderers/common/RenderPipeline.js`，文档注明"负责管理应用的渲染管线设置"、"通常只创建一个实例"、**"只能与 WebGPURenderer 使用"**；旧名 `PostProcessing` 以向后兼容壳类保留：`@deprecated since r183. Use RenderPipeline instead... will be removed in a future version`（构造时一次性告警）。来源：[RenderPipeline.js（r187）](https://github.com/mrdoob/three.js/blob/dev/src/renderers/common/RenderPipeline.js)、[PostProcessing.js（r187，弃用壳）](https://github.com/mrdoob/three.js/blob/dev/src/renderers/common/PostProcessing.js)
- **WebGPU 后处理节点库**（`three/addons/tsl/display/`，r187 实测目录含 47 个文件）：BloomNode、GTAONode、SSAONode、SSRNode、SSGINode、DepthOfFieldNode、FXAANode、SMAANode、TAAUNode、TRAANode、GodraysNode、MotionBlur、ChromaticAberrationNode、Lut3DNode、DenoiseNode、OutlineNode 等。来源：[examples/jsm/tsl/display 目录（r187）](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/tsl/display)；GodraysNode 为 r183 新增（[r183 Release Notes](https://github.com/mrdoob/three.js/releases/tag/r183)）

### 3.3 浏览器 WebGPU 支持现状（核实日期：2026-11-04）

**【官方确认事实】**

| 浏览器 | 状态 | 官方来源 |
|---|---|---|
| Chrome / Edge（桌面） | **113+ 默认启用**（2023-05 起），Opera 99+ | [caniuse: WebGPU](https://caniuse.com/webgpu) |
| Chrome for Android | **121+ 默认启用**（2024-01-17 官宣；Android 12+，首发覆盖 Qualcomm/ARM GPU）——**注意：此条更正了"Android 未支持"的旧口径** | [Chrome Developers 官方博客 What's New in WebGPU 121](https://developer.chrome.com/blog/new-in-webgpu-121) |
| Safari（macOS/iOS/iPadOS/visionOS） | **Safari 26.0 默认启用**（2025-09-15 发布）；Safari 26.2（2025-12-12）追加 WebXR on WebGPU。caniuse 将 Safari 26+ 标为**部分支持（◐）** | [WebKit 官方博客 WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0)、[Apple Safari 26.0 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes) |
| Firefox | **141（2025-07-22）在 Windows 默认启用**："The WebGPU API is now fully supported on Windows, in all contexts except for service workers."；macOS 于随后版本（检索资料称 145）默认启用；**Linux / Android 截至核实日仍未见默认启用**（Mozilla Graphics 博客称"coming months"，推进中） | [MDN Firefox 141 for developers](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/141)、[Mozilla Firefox 141.0 Release Notes](https://www.firefox.com/en-US/firefox/141.0/releasenotes)、[Mozilla Graphics: Shipping WebGPU on Windows in Firefox 141](https://mozillagfx.wordpress.com/2025/07/15/shipping-webgpu-on-windows-in-firefox-141) |
| 整体覆盖率 | caniuse（2026-09 StatCounter 口径）：WebGPU 支持率约 **87.8%** | [caniuse: WebGPU](https://caniuse.com/webgpu) |

- **数据口径差异（重要）**：caniuse 当前表格将 Firefox 63–162 全部标注为"disabled by default"，与 Mozilla"按平台分阶段默认启用"的官方发布口径不一致——caniuse 按跨平台一致性统计，本报告以浏览器厂商官方发布说明为准记录 Firefox 状态。
- caniuse 同时标注 WebGPU 规范仍为 **WD（Working Draft）**。

### 3.4 技术记录：TSL / WebGPU

| 维度 | 结论 |
|---|---|
| 成熟度 | WebGPURenderer/TSL/RenderPipeline 处于"官方主力开发、API 仍在演化"阶段：r183 一次重命名（PostProcessing→RenderPipeline）、TSL Spec 刚在 r183 引入【官方】；官方无生产就绪声明【未能核实官方表态】 |
| 浏览器兼容 | 桌面 Chrome/Edge 113+、Safari 26+（部分）、Firefox Windows 141+/macOS 145+、Chrome Android 121+；Firefox Linux/Android 与 Android Browser 未默认支持；整体约 87.8%（2026-09）【官方】 |
| 性能代价（定性） | TSL 单代码库双后端，省一套着色器维护；WebGPU 后端在减少 draw call 开销与现代 GPU 特性上有潜力（官方未给量化数据，定性判断，属本文分析） |
| 推荐程度 | 渲染器：推荐采用 WebGPURenderer（自带 WebGL2 回退）；纯 WebGPU 特性（compute、RenderPipeline 后处理）：作增强路径 |
| 适用范围 | 新代码一律走 WebGPURenderer + TSL（NodeMaterial），兼容旧 WebGL 环境 |
| 风险与局限 | ① RenderPipeline 等后处理**仅限 WebGPURenderer**；② WebGL 回退下无原生 compute（见 4.5）；③ API 每 release 仍可能在动（r183 重命名即前车之鉴），需隔离封装；④ Safari 被 caniuse 标 partial，特性覆盖需逐项验证 |

---

## 4. GPU 粒子

### 4.1 InstancedMesh（官方基线）

**【官方确认事实】**：InstancedMesh 是"带实例化渲染支持的 mesh 特化版"，官方文档明确其价值："如果你必须渲染大量同几何/同材质的物体，使用 InstancedMesh 将减少 draw call 数量，从而提升整体渲染性能"。核心 API：`count`、`setMatrixAt/getMatrixAt`（更新后须置 `instanceMatrix.needsUpdate`）、`setColorAt`、包围盒需手动 `computeBoundingSphere`、支持按 `instanceId` 拾取。官方 SSAO 示例的场景主体即用 InstancedMesh 摆 100 个盒子。来源：[官方文档 InstancedMesh（r187 源码注释）](https://github.com/mrdoob/three.js/blob/dev/src/objects/InstancedMesh.js)、[webgl_postprocessing_ssao 示例](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_ssao.html)

### 4.2 Points + ShaderMaterial（CPU 更新型）

**【官方确认事实】**：官方示例 `webgl_points_waves`：THREE.Points + 自定义 ShaderMaterial，2500 个粒子（50×50），**位置每帧在 CPU（JS 循环）写入 position buffer 并置 needsUpdate**，GPU 侧只负责 `gl_PointSize` 与片元 discard 画圆点。来源：[官方示例 webgl_points_waves](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_points_waves.html)
→ 定性结论：该模式简单可靠，但粒子状态更新在 CPU，数量增长会线性推高 CPU 与上传带宽开销（本文分析，官方未明示）。

### 4.3 GPGPU / Compute（WebGL 线）

**【官方确认事实】**：官方 addons 提供 `GPUComputationRenderer`（`three/addons/misc/GPUComputationRenderer.js`）：以"RGBA float 纹理保存每个计算元素"的 GPGPU 模式，每个变量配独立片元着色器，**每变量双渲染目标做 ping-pong**，变量间依赖自动挂采样器。官方示例 `webgl_gpgpu_birds` 用它跑 1024 只鸟（32×32 纹理）的 boids 群体模拟（分离/对齐/聚集规则全在片元着色器中，渲染网格通过 `reference` 属性把顶点映射到模拟纹理单元）。来源：[GPUComputationRenderer.js（r187）](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/misc/GPUComputationRenderer.js)、[官方示例 webgl_gpgpu_birds](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_gpgpu_birds.html)

### 4.4 WebGPU Compute + TSL（WebGPU 线）

**【官方确认事实】**：官方示例 `webgpu_compute_particles`：WebGPURenderer + TSL 计算管线，`const particleCount = 200000;`（注意：示例页面标题写"500k Particles"，与代码 200k 不一致，以代码为准），用 `instancedArray(count, 'vec3')` 建 positions/velocities/colors storage buffer，计算节点实现重力、反弹、点击冲击波，每帧 `renderer.compute( computeParticles )` 后用 `SpriteNodeMaterial`（positionNode/colorNode/scaleNode/opacityNode）渲染。来源：[官方示例 webgpu_compute_particles（r187）](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles.html)

### 4.5 WebGPU compute 是否可用于生产

- 【官方确认事实】三大引擎均已默认启用 WebGPU（含 compute）：Chrome 113+/Android 121+、Safari 26+、Firefox 141+（Windows）；three.js 官方示例库已将 `webgpu_compute_particles` 等纳入正式示例并持续维护。来源：见 3.3 表与上文示例链接。
- 【官方确认事实】WebGPURenderer 在无 WebGPU 时回退 WebGL2；**WebGL2 无原生 compute 管线**。回退下 compute 的具体行为（部分以 transform feedback 模拟或直接不可用）：官方无系统性文档，**未能核实官方口径**；社区资料（ICS Media、threejsresources 等）称 compute 依赖特性在回退时降级或需备用路径。来源（社区）：[ICS Media: WebGPURenderer 指南](https://ics.media/en/entry/2501)、[threejsresources: WebGPU vs WebGL](https://threejsresources.com/webgpu/vs-webgl)
- **AUTOVERSE 结论**：WebGPU compute "技术上已在主流桌面/安卓 Chrome 可用"，但受 Safari partial、Firefox Linux/Android 缺口与回退限制，**不宜作为唯一路径**——大规模粒子用 compute + TSL，必须保留 WebGL 可用回退（GPGPU 纹理 ping-pong 或 InstancedMesh/Points 降级版）。

### 4.6 技术记录：GPU 粒子三种做法

| 做法 | 成熟度 | 性能（定性） | 推荐程度 | 适用范围 | 风险与局限 |
|---|---|---|---|---|---|
| InstancedMesh | 高【官方】 | draw call 合一，性能好；矩阵更新在 CPU | ★★★★★（基线） | 车流、城市道具、重复构件 | 逐实例状态更新走 CPU；包围盒需手动更新 |
| Points + ShaderMaterial | 高【官方】 | GPU 渲染廉价，但状态更新在 CPU，规模上限中低 | ★★★★（中小规模） | 尘埃、光点、雨雪（小规模） | CPU 每帧写 buffer，数量大时成为瓶颈 |
| GPGPU（GPUComputationRenderer） | 高（官方示例自 WebGL2 时代延续）【官方】 | 模拟全在 GPU，依赖 float 纹理 | ★★★★（WebGL 大规模首选） | 群体行为、大规模粒子（WebGL 回退线） | 需 float 纹理支持；调试难度高 |
| WebGPU compute + TSL | 新（r187 官方示例已内置，API 演化中）【官方】 | storage buffer + 真 compute，官方示例 20 万粒子流畅 | ★★★☆（增强路径） | ≥10 万级粒子、需要复杂交互逻辑 | WebGL 回退不可用/受限【未能核实官方细节】；API 仍在动 |

---

## 5. Glass / 折射材质（transmission / ior / thickness）

**【官方确认事实】**

- 参数定义（官方 MeshPhysicalMaterial 文档）：
  - `transmission`："Degree of transmission (or optical transparency), from 0.0 to 1.0"——模拟薄玻璃/塑料等"保持反射的透光体"；**"When transmission is non-zero, opacity should be set to 1"**；
  - `thickness`："The thickness of the volume beneath the surface. The value is given in the coordinate space of the mesh. If the value is 0 the material is thin-walled."（0 = 薄壁，无体积折射）；
  - `ior`："Index-of-refraction for non-metallic materials, from 1.0 to 2.333. Default is 1.5."；
  - `dispersion`：色散（透射色差），"realistic range [0, 1]"，仅对透射体生效；
  - 另有 `specularIntensity`（非金属高光缩放，0 时接近 Lambertian）、`iridescence`、`sheen` 等层。
  来源：[官方文档 MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- 官方示例 `webgl_materials_physical_transmission`：MeshPhysicalMaterial（transmission 1、ior 1.5、thickness GUI 0–5、roughness 0、DoubleSide、transparent），环境用 UltraHDRLoader 加载 `royal_esplanade_2k.hdr.jpg` 同时作 background 与 envMap；**示例专门暴露 `renderer.transmissionResolutionScale` 供调节**——透射渲染有独立分辨率开关这一事实本身就是"透射有额外渲染成本"的官方佐证。来源：[官方示例 webgl_materials_physical_transmission](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_physical_transmission.html)
- 官方车漆示例的车窗玻璃：`MeshPhysicalMaterial({ metalness: 0.25, roughness: 0, transmission: 1.0 })`。来源：[webgl_materials_car](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_car.html)

**性能代价（定性）**：transmission ≠ 普通透明（opacity）：透射材质需要先把场景渲染进中间缓冲再折射采样（多一轮场景渲染 + 分辨率缩放旋钮官方直接可调），开销显著高于 opacity 透明【官方机制，由示例的 transmissionResolutionScale 佐证】；官方明示"开启即加成本"（"Most effects are disabled by default, and add cost as they are enabled"）。

| 维度 | 结论 |
|---|---|
| 成熟度 | 高（参数齐备、官方示例完整）【官方】 |
| 兼容 | WebGL2 全支持；WebGPURenderer 亦支持 PBR 材质（TSL 同款材质）【官方】 |
| 性能代价 | 中—高：额外透射缓冲；建议控制透射物体数量与 transmissionResolutionScale |
| 推荐程度 | 车窗/展柜/真实玻璃：★★★★★；HUD 半透明面板：★★☆（优先 transparent+opacity 或轻量自定义材质） |
| 适用范围 | 车窗玻璃、仪表罩、展厅玻璃幕墙；HUD 若需"折射感"可用低 transmission + thickness 0（薄壁）折中 |
| 风险与局限 | 多层透射物互相叠放时排序/成本问题（官方未给明确指引，**未能核实**细节）；薄壁（thickness 0）无体积折射效果；透射与透明（opacity）语义不同，混用易出错（官方要求 transmission 非零时 opacity 置 1） |

---

## 6. 汽车车漆材质要点

**【官方确认事实】**

1. **clearcoat 是官方车漆示例的核心参数**。官方示例 `webgl_materials_car`（Ferrari）车身材质原文：
   ```js
   const bodyMaterial = new THREE.MeshPhysicalMaterial( {
       color: 0xff0000, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03
   } );
   ```
   车窗玻璃 transmission 1.0、轮毂饰条 MeshStandardMaterial（metalness 1.0 / roughness 0.5）。来源：[官方示例 webgl_materials_car](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_car.html)
2. **clearcoat 官方定义**："Represents the intensity of the clear coat layer, from 0.0 to 1.0. Use clear coat related properties to enable multilayer materials"（用清漆相关属性启用多层材质——基底层之上再叠一层薄半透明层）；`clearcoatRoughness` 为清漆层粗糙度（0–1，默认 0）。来源：[官方文档 MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
3. **环境贴图对车漆重要性的官方直接依据**：官方文档原文 "For best results, always specify an environment map when using this material"（针对 MeshPhysicalMaterial，即车漆基材）；且 `envMap` 官方机制为 PMREM 预过滤——粗糙度不同的漆面会自动采样到不同清晰度的环境 mip（"from a mirror at level 0 to roughness 1"），这正是车漆高光"底漆哑光 + 清漆锐利"双层反射感的来源。来源：[MeshPhysicalMaterial 文档](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)、[PMREMGenerator 源码文档](https://github.com/mrdoob/three.js/blob/dev/src/extras/PMREMGenerator.js)
4. **metalness/roughness 调参官方口径**：metalness 0 = 非金属、1 = 金属、"中间值适合表现锈蚀等混合状态"；roughness 0 = 镜面、1 = 全漫反射；车漆常用组合即"金属底漆（metalness 1.0 + 中高 roughness）+ 清漆（clearcoat 1.0 + 极低 clearcoatRoughness）"（官方示例实证）。来源同上。
5. **环境与色调映射配套**：官方车漆示例用 HDR 环境（`venice_sunset_1k.hdr`）+ `THREE.ACESFilmicToneMapping`（exposure 0.85）。来源：[webgl_materials_car](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_car.html)

**【社区观点】**：社区车型配置器经验（Reddit r/threejs）认为真实感主要来自 clearcoat、clearcoatRoughness、normal map 与 roughness 细调的组合，HDRI 环境贴图（经 RGBELoader → scene.environment）是反射真实感的关键；HDRI 质量最好但文件体积大于 JPG/PNG（sbcode 教程）。来源：[Reddit: Creating a realistic car configurator](https://www.reddit.com/r/threejs/comments/1qofdf5/need_help_with_creating_more_realistic_car)、[sbcode: Environment Maps](https://sbcode.net/threejs/environment-maps)

| 维度 | 结论 |
|---|---|
| 成熟度 | 高（官方示例直接给出车漆配方）【官方】 |
| 兼容 | WebGL2 / WebGPU 均支持【官方】 |
| 性能代价 | 中：clearcoat 增加一层着色计算（官方"开启即加成本"）；无独立缓冲，远低于 transmission |
| 推荐程度 | ★★★★★：AUTOVERSE 所有车型车漆默认 MeshPhysicalMaterial + clearcoat |
| 适用范围 | 车漆、漆器、塑料制品的多层反射质感 |
| 风险与局限 | 无环境贴图时车漆观感骤降（官方明示必须配 envMap）；环境贴图亮度/色温会直接"染"到漆面，需按场景调 envMapIntensity；金属片状漆（flake）需自加 normal/UV 细节，官方无现成参数（**未能核实**官方 flake 支持） |

---

## 7. AUTOVERSE 视觉管线建议

综合以上官方核实结论，给出 AUTOVERSE TECH LAB（汽车文明数字宇宙）的视觉管线建议：

### 7.1 渲染器：WebGL 优先、WebGPU 增强（单代码库双后端）

- **建议采用 `WebGPURenderer` 作为统一入口**：官方文档确认其"默认尝试 WebGPU 后端，不支持则自动回退 WebGL 2"（还有 `forceWebGL` 开关）。这意味着"WebGL 优先"不必付出双代码库代价——用 WebGPURenderer + TSL 写一份着色代码，兼容环境自动跑 WebGL2。来源：[WebGPURenderer 官方文档](https://threejs.org/docs/pages/WebGPURenderer.html)、[TSL 官方 Wiki（WGSL/GLSL 双输出、renderer agnostic）](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- 但**特效分层**：把"仅 WebGPU 可用"的能力（compute 粒子、RenderPipeline 后处理）全部设计为**增强层**，主视觉（车漆 PBR、HDR 环境、bloom、DOF）在 WebGL 线即可完整呈现。理由：Firefox Linux/Android、Android Browser 尚未默认支持 WebGPU，Safari 被 caniuse 标注部分支持，整体覆盖率约 87.8%（2026-09）。来源：[caniuse](https://caniuse.com/webgpu)、[Mozilla Graphics 博客](https://mozillagfx.wordpress.com/2025/07/15/shipping-webgpu-on-windows-in-firefox-141)
- 注意：官方未声明 WebGPURenderer "生产就绪"（**未能核实**任何官方稳定性表态），且 r183 刚发生 PostProcessing→RenderPipeline 重命名——WebGPU 侧 API 仍在演化，必须封装隔离。来源：[Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)、[PostProcessing.js @deprecated since r183](https://github.com/mrdoob/three.js/blob/dev/src/renderers/common/PostProcessing.js)

### 7.2 PBR / 环境光照基线

- 所有实体：MeshStandardMaterial；重点视觉物（车漆、展品、水体边缘）：MeshPhysicalMaterial。
- **环境贴图三段式**：开发期用 RoomEnvironment（零外部资产：`pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture`）；正式场景用 HDR（`HDRLoader` + `scene.environment`，如官方车漆示例）；大空间室外可用 Sky 程序化环境（官方 keyframes 示例路径）。色调映射统一 ACESFilmicToneMapping（官方车漆示例同款）。来源：[misc_exporter_usdz](https://github.com/mrdoob/three.js/blob/dev/examples/misc_exporter_usdz.html)、[webgl_materials_car](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_car.html)、[webgl_animation_keyframes](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_animation_keyframes.html)

### 7.3 后期处理选型

- **WebGL 主线**：官方 EffectComposer + RenderPass + OutputPass 收尾（色彩管理不出错）；轻量（1–2 效果）直接官方 Pass（UnrealBloomPass / BokehPass）；重后期（辉光+DOF+色差+LUT 叠加）选 **pmndrs postprocessing 6.39.6**（Zlib 许可，需在发行物版权声明中保留其声明；peer 窗口 three >=0.168 <0.188 与 r187 兼容）。SSAO/SSR 一律按需开关。来源：[官方手册 Post Processing](https://threejs.org/manual/#en/post-processing)、[npm: postprocessing](https://www.npmjs.com/package/postprocessing)、[pmndrs/postprocessing](https://github.com/pmndrs/postprocessing)
- **WebGPU 增强线**：RenderPipeline（r183 新名，勿再写 PostProcessing）+ `three/addons/tsl/display/` 的 BloomNode / GTAONode / DepthOfFieldNode / FXAANode 等 47 个节点；该线**仅随 WebGPURenderer 可用**，须做能力检测降级。来源：[RenderPipeline.js](https://github.com/mrdoob/three.js/blob/dev/src/renderers/common/RenderPipeline.js)、[tsl/display 目录](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/tsl/display)

### 7.4 粒子与玻璃

- 粒子阶梯：≤1 万 → Points/InstancedMesh；1 万–10 万（WebGL）→ GPUComputationRenderer GPGPU；≥10 万且检测到 WebGPU → TSL compute（官方示例 20 万粒子实证），无 WebGPU 自动降级到 GPGPU/InstancedMesh。来源：[webgl_gpgpu_birds](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_gpgpu_birds.html)、[webgpu_compute_particles](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles.html)
- 玻璃：车窗/展柜 transmission 1.0 + 适度 thickness + ior 1.5，控制 transmissionResolutionScale；HUD 面板**避开 transmission**（成本高），用 transparent/opacity 或薄壁（thickness 0）折中。来源：[MeshPhysicalMaterial 文档](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)、[transmission 官方示例](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_physical_transmission.html)

### 7.5 开发期注意点（Checklist）

1. **版本锁定**：three 0.187.0（r187）+ pmndrs postprocessing 6.39.6（peer <0.188）；升级 three 按官方迁移指南"每次 ≤10 个 release"推进。来源：[Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)、[package.json](https://github.com/mrdoob/three.js/blob/dev/package.json)
2. **WebGPU 后处理代码全封装**：RenderPipeline/tsl/display 只在能力检测通过时启用；r183 重命名证明该层 API 不稳定。
3. **能力检测矩阵**：WebGPU 存在性、float 纹理（GPGPU 前提）、透射分辨率档位、DPR 上限——入原型验证清单（本研究的定性结论需原型定量复核）。
4. **HDR 资产管线**：.hdr/.exr（浮点、线性）为 IBL 标配（官方 envMap 文档口径）；LDR 贴图仅作 background。
5. **色彩管理**：末位 OutputPass（WebGL）或 RenderPipeline 输出节点统一 sRGB/ACES，避免多 Pass 重复转换。
6. **许可合规**：three（MIT）与 postprocessing（Zlib）均商用友好，但 Zlib 需保留版权与许可声明于发行物。

---

## 8. 核实记录表

| # | 核实项 | 结论 | 来源 | 核实日期 | 性质 |
|---|---|---|---|---|---|
| 1 | three 版本与许可 | 0.187.0 / MIT；官方导出 three/webgpu、three/tsl、three/addons/* | [package.json (dev)](https://github.com/mrdoob/three.js/blob/dev/package.json)；npm 预核实一致 | 2026-11-04 | 官方 |
| 2 | MeshStandardMaterial 定义与参数 | Metallic-Roughness PBR；metalness/roughness/envMap/envMapIntensity 定义原文 | [docs: MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)；[源码](https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshStandardMaterial.js) | 2026-11-04 | 官方 |
| 3 | MeshPhysicalMaterial 定义与参数 | 继承 Standard；clearcoat/transmission/ior/thickness/dispersion 等定义原文；"开启即加成本""务必配 envMap" | [docs: MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)；[源码](https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshPhysicalMaterial.js) | 2026-11-04 | 官方 |
| 4 | PMREMGenerator 用途 | "Prefiltered, Mipmapped Radiance Environment Map for IBL"；fromScene/fromEquirectangular；GGX mip 0→roughness 1 | [源码 PMREMGenerator.js](https://github.com/mrdoob/three.js/blob/dev/src/extras/PMREMGenerator.js) | 2026-11-04 | 官方 |
| 5 | RoomEnvironment 用法 | PMREMGenerator#fromScene 的官方房间场景；示例代码 `fromScene(new RoomEnvironment(), 0.04).texture` | [源码](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/environments/RoomEnvironment.js)；[misc_exporter_usdz 示例](https://github.com/mrdoob/three.js/blob/dev/examples/misc_exporter_usdz.html) | 2026-11-04 | 官方 |
| 6 | EffectComposer 机制 | 官方手册：双 rt 乒乓、RenderPass→效果→OutputPass 收尾 | [manual/pages/post-processing.html](https://github.com/mrdoob/three.js/blob/dev/manual/pages/post-processing.html) | 2026-11-04 | 官方 |
| 7 | UnrealBloomPass / SSAOPass / SSRPass / BokehPass 现状 | 四者官方示例均在库中存活，参数齐备（详见 2.1） | 四个 examples 原文件（dev 分支） | 2026-11-04 | 官方 |
| 8 | pmndrs postprocessing 版本/许可/依赖 | 6.39.6 / **Zlib** / peer three >=0.168 <0.188 / 周下载约 171 万 | [npm](https://www.npmjs.com/package/postprocessing)；[GitHub](https://github.com/pmndrs/postprocessing)；[package.json](https://github.com/pmndrs/postprocessing/blob/master/package.json) | 2026-11-04 | 官方（该库仓库） |
| 9 | WebGPURenderer 回退机制 | "默认 WebGPU 后端，否则回退 WebGL 2"；forceWebGL 开关；无生产就绪声明（未能核实官方表态） | [docs: WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html)；[源码](https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgpu/WebGPURenderer.js) | 2026-11-04 | 官方 |
| 10 | TSL 定位 | JS 节点式着色语言，输出 WGSL/GLSL，后端无关；r183 引入 TSL.md 规范 | [官方 Wiki: TSL](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)；[r183 Release Notes](https://github.com/mrdoob/three.js/releases/tag/r183) | 2026-11-04 | 官方 |
| 11 | PostProcessing→RenderPipeline 重命名 | r183："Rename PostProcessing to RenderPipeline (#32789)"；PostProcessing 为 @deprecated 兼容壳；RenderPipeline 仅限 WebGPURenderer | [r183 Release Notes](https://github.com/mrdoob/three.js/releases/tag/r183)；[Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)；[PostProcessing.js](https://github.com/mrdoob/three.js/blob/dev/src/renderers/common/PostProcessing.js)；[RenderPipeline.js](https://github.com/mrdoob/three.js/blob/dev/src/renderers/common/RenderPipeline.js) | 2026-11-04 | 官方 |
| 12 | WebGPU 后处理节点库 | r187 tsl/display 含 47 文件（Bloom/GTAO/SSR/SSGI/DOF/FXAA/SMAA/TRAA/Godrays/MotionBlur/Lut3D…） | [examples/jsm/tsl/display](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/tsl/display) | 2026-11-04 | 官方 |
| 13 | Chrome/Edge/Opera WebGPU | 桌面 113+/113+/99+（2023）；Chrome for Android **121+**（2024-01，Android 12+，Qualcomm/ARM 首发）——更正"Android 未支持"旧口径 | [caniuse](https://caniuse.com/webgpu)；[Chrome 121 官方博客](https://developer.chrome.com/blog/new-in-webgpu-121) | 2026-11-04 | 官方 |
| 14 | Safari WebGPU | Safari 26.0（2025-09-15）全平台默认启用；26.2 增 WebXR；caniuse 标 partial | [WebKit 博客](https://webkit.org/blog/17333/webkit-features-in-safari-26-0)；[Apple Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes)；[caniuse](https://caniuse.com/webgpu) | 2026-11-04 | 官方 |
| 15 | Firefox WebGPU | 141（2025-07-22）Windows 默认启用；macOS 随后（检索资料称 145）；Linux/Android 推进中（截至核实日未默认）；caniuse 表格将 Firefox 标"默认禁用"（口径差异，以厂商发布说明为准） | [MDN Firefox 141](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/141)；[Mozilla Release Notes](https://www.firefox.com/en-US/firefox/141.0/releasenotes)；[Mozilla Graphics 博客](https://mozillagfx.wordpress.com/2025/07/15/shipping-webgpu-on-windows-in-firefox-141)；[caniuse](https://caniuse.com/webgpu) | 2026-11-04 | 官方 |
| 16 | WebGPU 整体覆盖率 | 约 87.8%（caniuse，2026-09 StatCounter 口径） | [caniuse: WebGPU](https://caniuse.com/webgpu) | 2026-11-04 | 官方数据 |
| 17 | InstancedMesh 定位 | 减 draw call 提升整体渲染性能；setMatrixAt/count/instanceId 拾取 | [源码 InstancedMesh.js](https://github.com/mrdoob/three.js/blob/dev/src/objects/InstancedMesh.js) | 2026-11-04 | 官方 |
| 18 | Points+ShaderMaterial 现状 | 官方示例 webgl_points_waves：2500 粒子 CPU 每帧更新 | [示例源文件](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_points_waves.html) | 2026-11-04 | 官方 |
| 19 | GPGPU（WebGL）现状 | GPUComputationRenderer（float 纹理 + ping-pong）；webgl_gpgpu_birds 1024 boids | [GPUComputationRenderer.js](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/misc/GPUComputationRenderer.js)；[webgl_gpgpu_birds](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_gpgpu_birds.html) | 2026-11-04 | 官方 |
| 20 | WebGPU compute 粒子 | webgpu_compute_particles：200k 粒子、instancedArray storage、renderer.compute()；页面标题 500k 与代码 200k 不一致（以代码为准） | [webgpu_compute_particles](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles.html) | 2026-11-04 | 官方 |
| 21 | compute 在 WebGL 回退下的行为 | WebGL2 无原生 compute；官方无系统文档（**未能核实官方口径**）；社区称 transform feedback 模拟或不可用 | 社区：[ICS Media](https://ics.media/en/entry/2501)、[threejsresources](https://threejsresources.com/webgpu/vs-webgl) | 2026-11-04 | 社区 |
| 22 | transmission 性能调节开关 | 官方 transmission 示例暴露 `renderer.transmissionResolutionScale`（透射有独立渲染成本之官方佐证） | [webgl_materials_physical_transmission](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_physical_transmission.html) | 2026-11-04 | 官方 |
| 23 | 车漆配方 | 官方 car 示例：body metalness 1.0 / roughness 0.5 / clearcoat 1.0 / clearcoatRoughness 0.03 + HDR 环境 + ACES exposure 0.85 | [webgl_materials_car](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_car.html) | 2026-11-04 | 官方 |
| 24 | 车漆社区经验 | clearcoat + clearcoatRoughness + normal map + HDRI 决定真实感 | [Reddit r/threejs](https://www.reddit.com/r/threejs/comments/1qofdf5/need_help_with_creating_more_realistic_car)、[sbcode](https://sbcode.net/threejs/environment-maps) | 2026-11-04 | 社区 |
| 25 | EffectComposer 是否在 docs API 收录 | 未检索到 docs API 页；权威出处为官方手册（"完全未收录"未能核实） | [官方手册](https://threejs.org/manual/#en/post-processing) | 2026-11-04 | 官方（手册） |
| 26 | WebGPURenderer 官方生产就绪声明 | 官方源码注释无稳定性声明——**未能核实**（不存在该表述） | [源码 WebGPURenderer.js](https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgpu/WebGPURenderer.js) | 2026-11-04 | 官方（无声明） |
| 27 | Firefox Linux 默认启用时间 | 官方博客仅称"coming months"；截至核实日未见默认启用——具体版本**未能核实** | [Mozilla Graphics 博客](https://mozillagfx.wordpress.com/2025/07/15/shipping-webgpu-on-windows-in-firefox-141) | 2026-11-04 | 官方（部分） |

---

*本文为文献研究产物；所有渲染效果的定量结论（帧率、画质、内存）由 three-rendering / lighting-and-materials 原型另行验证。*
