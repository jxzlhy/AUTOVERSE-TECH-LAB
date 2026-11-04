# babylon-rendering — Babylon.js 渲染专项验证（按需）

> 状态：**parked**（Babylon 已降级为专项备选，见 ../framework-comparison/README.md §6）

## 保留理由

当 AUTOVERSE 出现以下需求时重启本原型：

- 需要重型场景内检查器/材质调试工具（Babylon Inspector、Node Material Editor 生态）；
- 需要引擎级 GUI 体系或物理内建方案做快速验证；
- 需要与 Babylon 生态的既有资产/工具对接。

## 届时的验证项

1. Babylon 默认渲染管线（DefaultRenderingPipeline）的 Bloom/DOF/AA 组合性能；
2. Node Material Editor 制作车漆/玻璃的工作流；
3. Babylon 场景与 Vue 3 的生命周期管理最佳实践（社区扩展现状复核）。

## 已有结论（阶段一实测）

- PBR metallic 必须配环境贴图，否则纯黑（framework-comparison F2）；
- 单场景 draw calls 基线低于 three 系（F5）；
- 无官方 Vue 集成层，集成方式为社区扩展文档。
