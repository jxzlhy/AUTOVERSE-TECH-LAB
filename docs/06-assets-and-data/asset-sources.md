# 汽车模型与数字资源来源研究

> 核实日期：2026-11-04 ｜ 状态：文献研究（许可条款以来源官方页面为准，商用前需二次人工复核）｜ 研究员：主 Agent
> ⚠️ 本文档不构成法律意见。涉及商用边界的问题需咨询法务。

---

## 1. 结论速览

| 来源 | 许可 | 可商用 | 需署名 | 风险 | 推荐程度 |
| --- | --- | --- | --- | --- | --- |
| Poly Haven | CC0（全部自有资产） | ✅ | 否 | 模型内嵌的第三方商标/标志不受 CC0 覆盖 | 高（环境 HDRI/材质首选） |
| poly.pizza | 逐模型标注（多为 CC0/CC-BY） | 多数可 | CC-BY 需要 | 逐模型核对许可 | 高（验证期车辆道具） |
| Khronos glTF-Sample-Assets | 逐模型标注（CC0 或 CC-BY 为主） | 多数可 | CC-BY 需要 | Toy Car 等 CC0 可放心用 | 高（加载管线测试基准） |
| three.js examples 模型 | 代码 MIT；**模型各自独立许可** | 视具体模型 | ferrari.glb 需署名 | 许可随模型页变化 | 中（仅用于本地实验） |
| Sketchfab 免费下载 | CC-BY / CC-BY-NC 等混合 | 仅非 NC 类 | 多数需要 | **CC-BY-NC 不可商用**，极易误用 | 中（必须逐模型核对） |
| 商业市场（CGTrader/TurboSquid/Fab） | 逐商品 EULA | ✅（购买后按 EULA） | 视 EULA | 价格与授权范围逐项确认 | 高精度展品阶段选用 |

## 2. 详细记录

### 2.1 Poly Haven（HDRI / 贴图 / 模型）

- **许可**：CC0（公有领域），官方许可页明确：可商用、无需署名、可修改、不可撤销。
- **重要例外**：CC0 只覆盖 Poly Haven 自有资产；模型/贴图中嵌入的第三方内容（商标、Logo）仍受其自身权利约束。**汽车模型尤其要注意：车身品牌标不是 CC0。**
- 来源：<https://polyhaven.com/license>（核实日期 2026-11-04）
- 实验室用途：lighting-and-materials 原型的环境光照首选来源。

### 2.2 poly.pizza（低模资产，含车模）

- 许可**逐模型标注**：多数为 CC0 或 CC-BY（需署名）；Quaternius 的 Cars Bundle 明确"个人与商业项目均可免费使用"。
- 来源：<https://poly.pizza>、<https://poly.pizza/bundle/Cars-Bundle-FE5IWe6OMk>（核实日期 2026-11-04）
- 实验室用途：验证期批量车辆道具、性能压测（大量实例化车辆）。

### 2.3 Khronos glTF-Sample-Assets（官方测试资产）

- 官方资产库（[仓库](https://github.com/KhronosGroup/glTF-Sample-Assets)｜[浏览站](https://github.khronos.org/glTF-Assets)，2026-03 升级后每模型显著标注许可）。
- 许可**混合**：部分 CC0（如 Toy Car），多数 CC-BY（需署名）。官方 Issue #295 明确要求逐模型查看许可字段。
- 来源：仓库 README 与 Issue #295（核实日期 2026-11-04）
- 实验室用途：GLTFLoader/Draco/KTX2 管线验证的标准测试集；Toy Car（CC0）可进正式演示。

### 2.4 three.js 官方示例模型（ferrari.glb）

- three.js 仓库代码为 MIT，但**示例附带的艺术资源不在 MIT 覆盖范围内**，各自携带独立许可。
- `ferrari.glb`（webgl_materials_car 示例）：作者 vicent091036，来源 Sketchfab，页面示例本身标注署名 "Ferrari 458 Italia model by vicent091036"；具体许可以 Sketchfab 模型页为准。
- 另注意：**Ferrari 商标与 458 车型设计是独立权利**，商用展示需单独评估。
- 来源：<https://threejs.org/examples/webgl_materials_car.html>、[Sketchfab 模型页](https://sketchfab.com/3d-models/ferrari-458-italia-aa53bd0303014af2aa4d80341566ad8c)（核实日期 2026-11-04）
- 实验室用途：仅限本地 PBR 实验与调参，**不得直接进入可分发产物**。

### 2.5 Sketchfab

- 免费下载模型许可类型混合（CC0 / CC-BY / CC-BY-NC 等）；**CC-BY-NC 禁止商用**，是本项目最大的许可陷阱。
- 使用规则：逐模型查看许可徽标 → CC-BY-NC 一律不进库；CC-BY 需在展品铭牌/关于页署名。
- 来源：<https://sketchfab.com> 平台许可体系（核实日期 2026-11-04）

### 2.6 商业市场（高保真展品阶段）

CGTrader、TurboSquid、Fab（原 Unreal Marketplace）等提供高精度车模，许可为逐商品 EULA，价格与授权范围（渲染/游戏/编辑再分发）差异大。**本阶段不采购**，仅在展品清单确定后按需评估。

### 2.7 资源处理工具链（npm 核实 2026-11-04）

| 工具 | 版本 | 用途 | 许可 |
| --- | --- | --- | --- |
| @gltf-transform/core | 4.5.1 | glTF 读写库 | MIT（npm license 字段） |
| @gltf-transform/cli | 4.5.1 | 命令行优化（Draco 压缩、KTX2 纹理、简化、实例化） | MIT（npm license 字段） |
| gltfpack（meshoptimizer） | 未核实具体版本 | 极致压缩管线 | MIT（仓库级，待用前复核） |
| gltfjsx | 未核实 | GLB → R3F 组件代码生成 | 待用前核实 |

> Draco / KTX2 压缩效果与加载收益将在 performance-benchmark 原型中实测（V 级验证目标）。

## 3. 影视载具版权风险提示（DeLorean 案例）

以《回到未来》DeLorean 时空车为例，权利结构是**多层且被积极维权的**：

1. **DeLorean 品牌权利**：DeLorean Motor Company（德州公司，2000 年代初取得 DeLorean 品牌名称、Logo、商标）；
2. **影视权利**：NBCUniversal 持有《回到未来》电影相关权利（含时空车影视形象设定）；
3. **两者曾发生诉讼**：2024 年 2 月加州中区联邦法院允许 DMC 对 NBCUniversal 的商标侵权主张进入庭审阶段，**2024 年 3 月双方和解**——说明这两个权利主体都会积极维权，且权利边界复杂。
4. 对 AUTOVERSE 的含义：建模展示 DeLorean DMC-12（真实车辆）与复原"时空车"影视形象（电影设定）是**不同的风险等级**；正式商用前需法务意见；实验室阶段仅做技术演示不做分发。

来源：Reuters 及多家媒体对 2024 年诉讼与和解的报道（检索核实 2026-11-04，标注为 R 级新闻事实，非法律意见）。

## 4. AUTOVERSE 资产获取策略

| 阶段 | 策略 |
| --- | --- |
| **验证期（当前）** | 程序化几何 + Khronos 测试资产（CC0）+ Poly Haven HDRI；three.js ferrari 仅本地实验 |
| **开发期** | poly.pizza/Quaternius CC0 低模铺量；针对重点展品从商业市场采购高模（逐 EULA 评估） |
| **上线期** | 全部资产建立许可档案（来源 URL、许可、署名要求、核实日期）；影视载具法务复核后方可对外 |

**红线**：CC-BY-NC 资源一律不入库；品牌商标（车标）不得随模型进入可分发产物，除非权利方明确许可。

## 5. 核实记录表

| 核实项 | 来源 URL | 核实日期 |
| --- | --- | --- |
| Poly Haven CC0 及第三方内容例外 | <https://polyhaven.com/license> | 2026-11-04 |
| poly.pizza 逐模型许可 / Quaternius 车模可商用 | <https://poly.pizza>、<https://poly.pizza/bundle/Cars-Bundle-FE5IWe6OMk> | 2026-11-04 |
| Khronos 资产许可混合（CC0/CC-BY） | <https://github.com/KhronosGroup/glTF-Sample-Assets>、Issue #295 | 2026-11-04 |
| ferrari.glb 署名要求与商标提示 | <https://threejs.org/examples/webgl_materials_car.html>、Sketchfab 模型页 | 2026-11-04 |
| Sketchfab 许可混合体系 | <https://sketchfab.com> | 2026-11-04 |
| DMC vs NBCUniversal 诉讼与和解（2024） | Reuters 等媒体报道（检索结果） | 2026-11-04 |
| @gltf-transform/* 4.5.1 与各库许可 | npm registry | 2026-11-04 |
| gltfpack / gltfjsx 版本与许可 | 未核实（待使用前复核） | — |
