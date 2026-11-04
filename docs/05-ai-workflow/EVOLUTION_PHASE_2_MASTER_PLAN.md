# AUTOVERSE TECH LAB
# EVOLUTION PHASE 2
## ENGINEERING HARDENING & VISUAL EVOLUTION
### 下一阶段工程强化与视觉进化总指令 V1.0

**项目仓库：** https://github.com/jxzlhy/AUTOVERSE-TECH-LAB

**当前承接 Commit：** 01e06772d6e549cedac3e8d68b46fe915dc193c5

**执行工具：** Zcode

**执行模式：** FULL AUTONOMOUS MODE

**任务类型：** 工程强化、Runtime 重构、自动化测试、真实性能验证、Design System 升级、视觉进化、资产扩展、产品原型迭代。

---

# PART 0 — 最高指令

你已经完成 AUTOVERSE TECH LAB 的第一轮基础建设。

现在进入 EVOLUTION PHASE 2。

这不是重新初始化项目。

不是重新编写上一阶段的代码。

不是推翻现有架构。

而是基于已经存在的代码、文档和技术实验成果，继续自主进化。

你需要：

1. 读取最新项目状态。
2. 审查上一阶段实际代码。
3. 重新验证遗留问题。
4. 修复真正存在的问题。
5. 建立工程质量门禁。
6. 提升 3D Runtime 稳定性。
7. 建立真实浏览器性能基准。
8. 完善 Design System。
9. 增强 3D 视觉和交互。
10. 扩展汽车模型与资产管线。
11. 持续自主规划和实施下一轮改进。

不要仅仅输出分析报告。

必须实际修改代码、运行测试、验证效果并记录结果。

不要每完成一个任务就询问用户是否继续。

---

# PART 1 — 恢复项目上下文

开始前必须读取：

- README.md
- AGENTS.md
- AI_WORKFLOW.md
- PROJECT_STATE.md
- DECISION_LOG.md
- 上一阶段交接报告
- 当前 Git 状态
- 最近 Commit
- 现有技术架构
- 当前所有原型

特别关注：

`01e06772d6e549cedac3e8d68b46fe915dc193c5`

检查：

- 当前分支是否为 main。
- 是否存在新的远程提交。
- 是否存在未提交修改。
- 是否有用户新增代码。
- 是否有尚未合并的实验。

以实际仓库为准，不要假设用户给出的 Commit 一定是当前最新版本。

禁止：

- git reset --hard。
- 未经确认的强制覆盖。
- Force Push。
- 删除有价值的实验。
- 重建整个仓库。
- 覆盖用户未提交的代码。

---

# PART 2 — RUNTIME STABILITY HARDENING

本阶段最高优先级。

重新审查 Three.js Runtime。

上一轮代码评审指出以下风险，但你必须逐项复核，不能未经验证就认定它们一定存在。

## 2.1 SceneManager

重点检查：

- 场景加载失败后的恢复。
- 场景切换时的状态一致性。
- 当前场景和目标场景的生命周期。
- 重复切换。
- 异步加载竞争。
- 并发场景切换。
- 场景销毁。
- 资源释放。
- 场景重新激活。

必须实现可靠的场景切换流程。

建议：

准备目标场景 → 加载目标资源 → 初始化目标场景 → 验证成功 → 切换活动场景 → 按策略释放旧场景。

如果目标场景失败：

保留当前可用场景。

不能让用户进入空白画面。

需要明确：

- 场景状态。
- 加载状态。
- 失败状态。
- 取消状态。
- 销毁状态。

必要时使用状态机。

## 2.2 AssetManager

重点检查：

- GLTFLoader。
- DRACOLoader。
- KTX2Loader。
- MeshoptDecoder。
- 加载器初始化。
- 异步依赖。
- 加载进度。
- 缓存。
- 重复请求。
- 请求取消。
- 加载失败。
- 资源释放。

特别验证 Draco 初始化顺序。

不能让模型在解码器尚未准备完成时就开始加载。

必须有可靠的初始化流程。

## 2.3 GLB Inspector

修复模型统计准确性。

尤其检查：

使用索引 Geometry 时，不能简单通过 position.count / 3 计算三角面数量。

应该根据 index.count 或 position.count 正确计算。

还需要检查：

- Mesh。
- SkinnedMesh。
- InstancedMesh。
- Geometry。
- Material。
- Texture。
- Animation。
- Nodes。
- Scene。
- Bounding Box。
- 文件大小。

输出结果必须区分：

- 已确认数据。
- 推测数据。
- 无法判断的数据。

## 2.4 ResourceDisposer

重点检查：

- Geometry。
- Material。
- Texture。
- RenderTarget。
- Skeleton。
- BoneTexture。
- InstancedMesh。
- Post-processing。
- Event Listener。
- AnimationMixer。
- WebGL 资源。

注意共享资源。

多个 Mesh 可能共享同一个 Material 或 Texture。

不能因为释放一个对象就错误地释放其他对象仍在使用的资源。

必要时建立引用计数或资源所有权机制。

必须测试：

1. 加载模型。
2. 使用模型。
3. 卸载模型。
4. 再次加载。
5. 再次卸载。
6. 重复执行。
7. 切换场景。
8. 长时间运行。

## 2.5 RendererManager

评估是否应该将 Renderer 配置从 Vue 应用层独立出来。

重点：

- Renderer 生命周期。
- DPR。
- Resize。
- Tone Mapping。
- Color Space。
- Shadow。
- Antialias。
- WebGL Context Lost。
- WebGL Context Restored。
- 性能档位。

不要为了模块数量而拆分。

如果现有架构已经足够清晰，可以保留。

## 2.6 App 生命周期

检查：

- Window Event。
- Document Event。
- ResizeObserver。
- IntersectionObserver。
- RAF。
- GSAP Timeline。
- Three AnimationMixer。
- Event Listener。
- Vue onMounted。
- Vue onUnmounted。

所有注册资源必须有对应清理机制。

特别检查 unhandledrejection 等全局监听器。

---

# PART 3 — 自动化测试与 CI

建立真正可执行的工程质量门禁。

## 3.1 Vitest

重点覆盖：

- SceneManager。
- AssetManager。
- ResourceDisposer。
- GLB Inspector。
- Runtime 状态。
- 工具函数。
- Design Tokens。
- 核心组件。

不仅测试正常情况。

还要测试：

- 异常。
- 重复调用。
- 空值。
- 资源缺失。
- 异步失败。
- 并发操作。
- 生命周期边界。

## 3.2 Playwright

建立真实浏览器测试。

至少覆盖：

1. 首页加载。
2. Design Playground。
3. Automotive Studio。
4. 3D Canvas 初始化。
5. 模型加载。
6. 模型旋转。
7. 模型缩放。
8. 零件交互。
9. 场景切换。
10. 页面卸载。
11. 页面重新进入。
12. 错误状态。

## 3.3 GitHub Actions

建立 CI。

建议包含：

- Install。
- Type Check。
- Lint。
- Unit Test。
- Build。
- E2E Smoke Test。

按照项目实际环境决定是否将 E2E 与其他检查分开。

不要为了 CI 通过而跳过真实错误。

不能使用 `|| true` 掩盖失败。

## 3.4 验收要求

必须能在仓库中找到：

- 测试配置。
- 测试代码。
- CI 工作流。
- 测试执行报告。

每次重要修改都运行相关测试。

---

# PART 4 — REAL WORLD PERFORMANCE BENCHMARK

上一阶段的 FPS 采样受到内嵌浏览器 RAF 节流影响。

本阶段必须建立可信的真实性能测试。

## 4.1 测试环境

记录：

- 浏览器。
- 浏览器版本。
- 操作系统。
- CPU。
- GPU。
- 屏幕分辨率。
- DPR。
- 测试时间。
- 是否为内嵌浏览器。
- 是否为真实浏览器窗口。

## 4.2 测试场景

建立统一测试场景：

A. 单车展示。

B. 多车展示。

C. 高多边形模型。

D. 大量独立 Mesh。

E. 大量材质。

F. 大纹理。

G. 粒子系统。

H. 后期处理。

I. 多场景切换。

J. 长时间运行。

## 4.3 测试指标

记录：

- FPS。
- Average Frame Time。
- P95 Frame Time。
- Model Load Time。
- Scene Switch Time。
- Draw Calls。
- Triangles。
- Geometry Count。
- Material Count。
- Texture Count。
- JavaScript Memory。
- WebGL Resource Trend。

浏览器不能可靠直接获取 GPU 显存占用时，明确标记为不可直接测量。

不要伪造 GPU Memory。

## 4.4 性能优化

根据实际测试结果优化：

- Geometry。
- Material。
- Texture。
- Instancing。
- Frustum Culling。
- LOD。
- DPR。
- Shadow。
- Post Processing。
- Shader。
- Particle。
- Loading。
- Caching。

不要为了指标好看牺牲实际画面质量。

---

# PART 5 — DESIGN SYSTEM V2

本阶段开始真正建立 AUTOVERSE 的设计辨识度。

## 5.1 完善 CORE UI

检查现有组件：

- Button。
- Input。
- Card。
- Badge。
- Modal。

完善：

- 交互状态。
- Keyboard。
- Focus。
- Disabled。
- Loading。
- Error。
- Responsive。
- Accessibility。

继续补充：

- Dropdown。
- Tabs。
- Tooltip。
- Drawer。
- Toast。
- Search。
- Select。
- Navigation。

## 5.2 SPATIAL UI

必须真正制作可运行组件。

包括：

- Spatial Navigation。
- Scene Selector。
- Holographic Panel。
- Floating Information。
- Location Marker。
- Object Label。
- Teleport Indicator。
- Exploration HUD。

视觉不能只是普通 Web 卡片加透明背景。

要考虑 3D 空间中的位置、距离、遮挡、层级和信息密度。

## 5.3 ENGINEERING UI

建立：

- Parts Tree。
- Component Inspector。
- Explode Slider。
- Section Control。
- X-Ray Toggle。
- Wireframe Toggle。
- Component Highlight。
- Engineering Annotation。
- Motion Control。

## 5.4 Design Playground V2

所有组件必须有真实交互。

展示：

- 不同状态。
- 不同尺寸。
- 不同主题。
- 动画。
- 响应式。
- 键盘交互。

## 5.5 视觉方向

继续研究：

AUTOMOTIVE LUXURY。

FUTURISTIC SPATIAL。

EDITORIAL MUSEUM。

可以融合，但必须建立清晰的设计规则。

不要把玻璃拟态、霓虹、黑色背景当作唯一风格。

建立统一：

- 色彩。
- 字体。
- 网格。
- 排版。
- 留白。
- 视觉层级。
- 图标。
- 动效。
- 面板。
- 导航。

---

# PART 6 — SHADER & VISUAL EVOLUTION

## 6.1 Shader Library V2

至少制作：

- Hologram。
- X-Ray。
- Dissolve。
- Scan。
- Fresnel。
- Wireframe。
- Energy Flow。
- Digital Grid。
- Outline。
- Heatmap。

每个 Shader 都应具有：

- 独立 Demo。
- 可调参数。
- 使用场景。
- 性能说明。
- 生命周期清理。

## 6.2 汽车材质

研究并实现：

- Metallic Paint。
- Clearcoat。
- Carbon Fiber。
- Brushed Metal。
- Chrome。
- Glass。
- Rubber。
- Leather。
- Plastic。
- Emissive Lighting。

建立汽车材质预设库。

## 6.3 Lighting

优化：

- HDRI。
- IBL。
- PMREM。
- Reflection。
- Studio Lighting。
- Museum Lighting。
- Night Lighting。
- Engineering Lighting。

## 6.4 Post Processing

研究：

- Bloom。
- SSAO / GTAO。
- Color Grading。
- Vignette。
- Depth of Field。
- Motion Blur。
- Outline。

注意性能。

不需要把所有效果同时打开。

---

# PART 7 — MOTION SYSTEM V2

完善 GSAP 动画系统。

重点：

- Scene Transition。
- Camera Motion。
- Object Focus。
- Panel Transition。
- Scroll Narrative。
- Exploded View。
- Assembly Animation。
- Spatial Navigation。

要求：

1. 动画必须可取消。
2. 动画必须可清理。
3. 支持 Reduced Motion。
4. 避免多个 Timeline 争夺同一对象。
5. 3D 动画与 UI 动画职责明确。
6. 长时间运行不能不断累积动画实例。

制作至少五个完整 Demo：

- 汽车登场。
- 机械拆解。
- 机械复原。
- 场景传送。
- 展品电影级聚焦。

---

# PART 8 — AUTOMOTIVE ASSET PIPELINE V2

## 8.1 GLB Inspector V2

完善模型分析能力。

包括：

- Mesh 层级。
- 独立零件。
- 材质。
- 纹理。
- 动画。
- 文件体积。
- 依赖资源。
- 压缩。
- 结构异常。

## 8.2 模型真实拆解能力

重点验证：

一个模型是否真的拥有独立 Mesh。

检查：

- 外壳。
- 车轮。
- 车身。
- 发动机。
- 电机。
- 电池。
- 座椅。
- 内饰。
- 传动系统。

不能把单个 Mesh 的视觉爆炸动画称为真实独立零件拆解。

## 8.3 资产质量等级

S：完整真实拆解。

A：高质量整车及独立部件。

B：外观模型加部分组件。

C：普通外观模型。

## 8.4 新增真实资产

优先寻找：

- Porsche。
- Lamborghini。
- Ferrari。
- Mercedes-Benz。
- BMW。
- DeLorean。
- Tesla。
- 经典跑车。
- 经典发动机。
- 机械组件。

重点关注 DeLorean DMC-12。

尽量寻找完整拆解模型。

如果没有合适资源，可以使用真实整车模型加工程示意组件。

必须标注哪些是真实模型，哪些是重建或模拟。

## 8.5 Blender 自动化

研究：

- Blender Python API。
- Geometry Nodes。
- GLB Export。
- 自动命名。
- Mesh 检查。
- 材质检查。
- 资产优化。

---

# PART 9 — PRODUCT EXPERIENCE V2

将前面完成的技术能力整合起来。

## 9.1 Automotive Studio

目标：

打造真正有汽车品牌发布会质感的 3D 汽车展厅。

至少具备：

- 高质量汽车模型。
- 自由视角。
- 自动环绕。
- 多种灯光。
- 材质切换。
- 车辆聚焦。
- 信息面板。
- 性能档位。

## 9.2 Engineering Lab

目标：

打造真正可探索的汽车机械实验室。

至少具备：

- 零件树。
- 零件高亮。
- 爆炸拆解。
- 装配复原。
- X-Ray。
- Wireframe。
- 结构说明。
- 机械动画。

## 9.3 影视汽车专题

优先建立：

BACK TO THE FUTURE — DELOREAN TIME MACHINE。

区分：

- 真实 DMC-12。
- 电影改装。
- 虚构时间机器部件。
- 影视幕后资料。

如果缺少真实模型，不得伪装成真实模型。

---

# PART 10 — 持续技术研究

持续关注：

- Three.js。
- WebGPU。
- TSL。
- GSAP。
- Blender。
- glTF。
- Meshopt。
- KTX2。
- Draco。
- Vue。
- R3F。
- Babylon.js。
- UI Design Systems。
- Frontend Design Skills。
- Motion Design。
- Shader。
- 开源汽车模型。

每个候选技术必须有：

- 项目来源。
- 官方文档。
- License。
- 维护状态。
- 技术价值。
- 引入成本。
- Demo。
- 实测结果。

不要为了追新而更换稳定技术。

---

# PART 11 — 自主迭代规则

每完成一个阶段：

1. 运行相关测试。
2. 进行真实浏览器验证。
3. 检查控制台错误。
4. 进行 UI/UX 审查。
5. 进行性能审查。
6. 修复发现的问题。
7. 更新文档。
8. 更新 PROJECT_STATE.md。
9. 更新 DECISION_LOG.md。
10. Git Commit。
11. 尝试 Push。
12. 继续下一项高价值工作。

不要每完成一个阶段就停止。

不要等待用户逐条批准。

如果某项任务失败：

- 分析原因。
- 尝试修复。
- 尝试替代方案。
- 记录无法解决的原因。
- 继续其他独立任务。

---

# PART 12 — 文档与交接

将本次完整指令保存到：

`docs/05-ai-workflow/EVOLUTION_PHASE_2_MASTER_PLAN.md`

保存前检查同名文件。

不要覆盖已有重要文档。

更新：

- README.md。
- AGENTS.md。
- AI_WORKFLOW.md。
- PROJECT_STATE.md。
- DECISION_LOG.md。
- CHANGELOG.md。

建立阶段报告：

`docs/09-handoff/EVOLUTION_PHASE_2_REPORT.md`

必须记录：

- 实际完成内容。
- 修改文件。
- 技术决策。
- 测试结果。
- 浏览器验证。
- 性能数据。
- 已知问题。
- 未完成事项。
- Git Commit。
- Push 状态。
- 下一轮建议。

---

# PART 13 — Git 规范

重要阶段分别提交。

Commit Message 使用：

- feat:
- fix:
- refactor:
- perf:
- test:
- docs:
- chore:

Push 前检查：

- Diff。
- 敏感信息。
- 用户修改。
- 大型文件。
- 未授权素材。
- 构建产物。

禁止 Force Push。

Push 失败时保留本地提交，记录原因并继续。

---

# PART 14 — 执行顺序

严格优先级：

PHASE 2A — Runtime Stability

PHASE 2B — Automated Testing & CI

PHASE 2C — Real Performance Benchmark

PHASE 2D — Design System V2

PHASE 2E — Shader & Motion Evolution

PHASE 2F — Asset Pipeline V2

PHASE 2G — Automotive Studio & Engineering Lab

PHASE 2H — Product Experience & DeLorean Showcase

PHASE 2I — Quality Review & Autonomous Evolution

阶段之间允许并行研究，但不得跳过前置基础直接堆叠复杂功能。

---

# PART 15 — 停止条件

仅在以下情况下结束：

- Token 或执行资源耗尽。
- 环境运行时间限制。
- 不可恢复的环境故障。
- 必须由用户完成的授权操作且没有其他可继续工作。
- 当前高价值任务已经完成。

资源即将耗尽时：

必须先更新 PROJECT_STATE.md。

保存：

- 最新 Commit。
- 当前进度。
- 未完成工作。
- 遇到的问题。
- 下一轮精确执行步骤。

确保下一次可以直接恢复。

---

# PART 16 — 立即开始

现在开始 EVOLUTION PHASE 2。

第一步：读取最新仓库和项目状态。

第二步：审查上一轮实际代码。

第三步：复核 Runtime 风险。

第四步：开始修复。

第五步：建立自动化测试和 CI。

第六步：完成真实性能基准。

第七步：推进 Design System V2。

第八步：提升 Shader、Motion 和汽车视觉。

第九步：完善资产管线。

第十步：构建更完整的 Automotive Studio 和 Engineering Lab。

第十一步：持续自主迭代。

**不要重新初始化项目。**

**不要只写计划。**

**不要伪造测试结果。**

**不要等待用户逐项安排。**

**不要在阶段完成后停止。**

让 AUTOVERSE TECH LAB 从一个有潜力的 3D 技术实验室，真正进化为具备成熟工程能力和独特视觉体验的汽车文明数字宇宙研发平台。

现在开始执行。

END OF EVOLUTION PHASE 2 MASTER DIRECTIVE
