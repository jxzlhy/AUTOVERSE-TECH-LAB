# 研究资源索引（Research Index）

> 实验室全部研究文档的统一入口。每篇文档头部均有核实日期与证据等级，此处汇总导航。

## 文档地图

| 文档 | 主题 | 证据等级 | 核实日期 |
| --- | --- | --- | --- |
| [../01-product/autoverse-product-overview.md](../01-product/autoverse-product-overview.md) | 产品总纲（方向共识） | 产品基线 | 2026-11-04 |
| [../02-architecture/architecture-research.md](../02-architecture/architecture-research.md) | 架构研究总报告 + 机制设计 + 风险 | R+V | 2026-11-05 |
| [../02-architecture/engineering-stack.md](../02-architecture/engineering-stack.md) | 工程体系（Vite/TS/测试/监控/资源加载） | R | 见文档头 |
| [../03-technology/frontend-frameworks.md](../03-technology/frontend-frameworks.md) | Vue 3 vs React 19 | R | 2026-11-04 |
| [../03-technology/state-management.md](../03-technology/state-management.md) | Pinia/Zustand/Jotai/RTK/TanStack | R | 2026-11-04 |
| [../03-technology/3d-engines.md](../03-technology/3d-engines.md) | three/R3F/TresJS/Babylon 四路线 | R（原型佐证 V） | 2026-11-04 |
| [../03-technology/animation-systems.md](../03-technology/animation-systems.md) | GSAP/Motion/CSS/AnimationMixer/转场 | R | 2026-11-04 |
| [../03-technology/visual-techniques.md](../03-technology/visual-techniques.md) | PBR/IBL/后期/TSL/WebGPU/粒子 | R | 见文档头 |
| [../03-technology/tech-selection-comparison.md](../03-technology/tech-selection-comparison.md) | 选型比较总报告（ADR-001~005） | R+V | 2026-11-05 |
| [../04-design-system/design-system.md](../04-design-system/design-system.md) | 设计系统 v1.0 | 规范基线 | 2026-11-04 |
| [../06-assets-and-data/asset-sources.md](../06-assets-and-data/asset-sources.md) | 模型/HDRI 来源与许可 + DeLorean 风险 | R（法务提示） | 2026-11-04 |
| [dependency-registry.md](dependency-registry.md) | 依赖登记册 | V（npm 核实） | 2026-11-04 |
| [../../prototypes/framework-comparison/README.md](../../prototypes/framework-comparison/README.md) | 三路线实测对比（F1–F6 发现） | **V** | 2026-11-05 |

## 权威外部资源（常用入口）

| 资源 | URL | 用途 |
| --- | --- | --- |
| three.js 官方文档 / 手册 / 示例 | <https://threejs.org/docs> ｜ <https://threejs.org/manual> ｜ <https://threejs.org/examples> | 引擎 API 与官方示例 |
| three.js 迁移指南（官方 wiki） | <https://github.com/mrdoob/three.js/wiki/Migration-Guides> | 升级破坏性变更核对 |
| three.js WebGPURenderer 文档 | <https://threejs.org/docs/pages/WebGPURenderer.html> | WebGPU/TSL 演进 |
| React 官方博客 | <https://react.dev/blog> | React 版本动态 |
| Vue 官方发布页 | <https://vuejs.org/about/releases> ｜ <https://github.com/vuejs/core/releases> | Vue 版本动态 |
| R3F 文档 | <https://r3f.docs.pmnd.rs> | 备选路线 |
| Babylon.js 文档 | <https://doc.babylonjs.com> | 专项备选 |
| GSAP 学习 / 许可 | <https://gsap.com/docs/v3> ｜ <https://gsap.com/standard-license> | 动画与合规 |
| Motion | <https://motion.dev> | Vue 动画备选（motion-v） |
| Vite | <https://vite.dev> | 构建工具 |
| Poly Haven | <https://polyhaven.com> | CC0 HDRI/贴图/模型 |
| Khronos glTF 资产库 | <https://github.com/KhronosGroup/glTF-Sample-Assets> | 测试资产（逐模型核许可） |
| MDN WebGPU | <https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API> | 浏览器支持现状 |
| caniuse WebGPU | <https://caniuse.com/webgpu> | 兼容性查询 |

## 版本基线快照（npm registry，2026-11-04）

vue 3.5.44 ｜ three 0.187.0 ｜ @react-three/fiber 9.8.2 ｜ @react-three/drei 10.7.9 ｜ @babylonjs/core 9.33.2 ｜ gsap 3.15.1 ｜ motion 14.9.1 ｜ vite 8.3.5 ｜ pinia 4.1.0 ｜ zustand 5.0.16 ｜ jotai 3.0.1 ｜ typescript 7.0.2 ｜ postprocessing 6.39.6 ｜ @gltf-transform/* 4.5.1 ｜ stats-gl 4.2.3 ｜ camera-controls 3.1.2 ｜ @tresjs/core 5.10.1

---

变更记录：

| 日期 | 变更 |
| --- | --- |
| 2026-11-05 | 初版 |
