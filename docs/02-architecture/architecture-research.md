# AUTOVERSE 技术架构研究报告 v1.0

> 核实日期：2026-11-04 ｜ 状态：R（文献研究）+ V（原型实证）混合，逐节标注 ｜ 综合研究员：主 Agent
> 证据来源：docs/03-technology/ 全部研究文档 + prototypes/framework-comparison 实测记录

---

## 1. 架构目标与约束

从产品总纲（docs/01-product）推导的架构需求：

| 产品需求 | 架构含义 |
| --- | --- |
| 沉浸式 3D 展馆首页 | 3D Runtime 是应用主体，DOM UI 是叠加层——与常规"DOM 为主、3D 点缀"的网站相反 |
| 一个宇宙多个世界 + 电影级转场 | 场景管理器（多 Scene 生命周期）+ 转场管线 |
| 三层体验（漫游/交互/知识） | 3D 层与知识层（搜索/图谱/内容）是两套子系统，通过状态层桥接 |
| 三类展品显式区分 | 内容模型天然带类型元数据（REAL/FICTION/CONCEPT） |
| 长期演进 | 核心技术（引擎/框架）必须可替换，禁止业务代码与引擎 API 强耦合 |

## 2. 总体分层架构（已验证的骨架）

```text
┌─────────────────────────────────────────────────────┐
│  UI 层（框架层）                                      │
│  Vue 3 组件 / CORE UI / SPATIAL UI(HUD) / 知识层页面  │
├─────────────────────────────────────────────────────┤
│  桥接层（显式接口，双向事件 + 命令）                    │
│  Studio API：setPaint()/focus()/transitionTo()...   │
│  Events：select/pick/loaded/error...                │
├─────────────────────────────────────────────────────┤
│  3D Runtime 层（引擎内核，不依赖任何 UI 框架）          │
│  SceneManager / AssetPipeline / LightingRig /        │
│  InteractionSystem / MotionSystem / PerfMonitor      │
├─────────────────────────────────────────────────────┤
│  引擎层：three r187（主）｜ WebGPU/TSL（演进方向）      │
└─────────────────────────────────────────────────────┘
```

**V 级证据**：framework-comparison 三应用均按此模式实现——`car-studio.ts`（内核）只暴露 `createCarStudio(canvas, onStats) → { setPaint, dispose }`，Vue 组件零引擎 API 引用。该模式在三个技术路线上都成立，证明**桥接层设计与框架选型正交**。

## 3. 技术栈决策（双证据汇总）

| 层 | 决策 | 证据 |
| --- | --- | --- |
| UI 框架 | **Vue 3.5.x**（3.6/Vapor 观望，不追新） | R：生态成熟、团队现状、TresJS/官方工具链；V：vue-three 原型 DX 良好 |
| 3D 引擎 | **three r187+（原生命令式内核）** | R：周下载 3350 万、官方 WebGPU/TSL 演进路径清晰；V：RoomEnvironment 车漆 IBL 开箱即用、F2/F5 实测差异支持 |
| 声明式 3D 备选 | R3F 保留观察（React 线）；TresJS 观望 | R+A：R3F 成熟但绑 React；TresJS 无生产就绪声明 |
| 专项备选 | Babylon.js（检查器/工具类需求） | V：Inspector 生态强，但无 Vue 官方层、IBL 需自建 |
| 状态管理 | **Pinia（业务/UI 状态）+ 内核外置可变对象（每帧状态）** | R：Pinia 4.1.0 Vue 官方推荐；Zustand vanilla 模式可作 3D 桥接备选；V：原型中 stats 通道模式（模块级对象+轮询）避免响应式开销 |
| 动画 | **GSAP 3.15（UI+镜头）+ three AnimationMixer（3D 对象）+ CSS/WAAPI（微交互）** | R：GSAP 免费可商用、镜头层 GSAP+camera-controls 结论；V：待 gsap-motion 原型复核 |
| 构建 | **Vite 8（Rolldown 内核）+ pnpm workspace** | V：三应用构建 <1s；monorepo 支撑多原型并行 |
| 语言 | TypeScript（严格模式） | V：react-r3f 线 tsc+TS7 通过；F1：vue 线类型检查门禁待解（TS5.9 或等 Volar） |

## 4. 关键架构机制设计

### 4.1 状态分层（每帧状态不进响应式系统）

```text
响应式 store（Pinia）        内核可变对象（plain object）
  ├─ 当前世界/展品 id          ├─ 相机位姿、FPS、draw calls
  ├─ 展品类型元数据            ├─ 加载进度（节流后上报）
  └─ UI 开关/偏好             └─ 交互瞬时状态
        ▲ 桥接层节流同步 ▼
```

R 依据：状态管理研究（每帧更新走响应式会引发调度风暴）；V 依据：原型 stats 通道实测可行。

### 4.2 资源管线

```text
来源（docs/06-assets-and-data 许可清单）
→ gltf-transform CLI 优化（Draco + KTX2，4.5.1 已核实）
→ assets/ 或 CDN（按体积决策，>10MB 评估 LFS）
→ GLTFLoader+DRACOLoader+KTX2Loader（LoadingManager 统一进度）
→ 内核 AssetPipeline 缓存与释放
```

V 空缺：压缩收益量化 → performance-benchmark 原型（阶段三）。

### 4.3 场景与转场

- SceneManager 管理 World 注册表（每个 World = 场景描述 + 资产清单 + 入口/出口转场配置）；
- 转场走"单 renderer + render target 混合"主流方案（动画研究 R 级结论），阶段二 gsap-motion 原型验证。

### 4.4 测试与质量门禁

| 层 | 工具 | 本阶段状态 |
| --- | --- | --- |
| 构建 | Vite build（三应用） | ✅ V：通过 |
| 类型 | tsc（react 线）✅ / vue-tsc ⚠️F1 | 部分 |
| 单元 | Vitest（内核纯逻辑：SceneManager、状态桥接） | 未开始（阶段二） |
| E2E | Playwright（页面冒烟：canvas 存在、HUD 文案、无 console error） | 未开始（阶段二） |
| 性能 | FPS/DRAWS/TRIS HUD（三应用内置） | ✅ V：工作正常（F4 环境限制已记录） |

### 4.5 性能监控

内核 PerfMonitor 统一上报（原型已内置雏形）：FPS（rAF delta EMA）、draw calls、triangles、资源加载耗时。RUM 方案与预算阈值待 performance-benchmark 输出后定稿（docs/07-performance/）。

## 5. 风险登记

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| three 每版本破坏性变更（R 级：r170→r187 逐版均有） | 中 | 锁定次版本 + 升级走 changelog 核对清单；内核层隔离引擎 API |
| TS7 生态适配期（F1：vue-tsc 未跟上） | 低 | Vue 线临时 TS5.9 或跳过 vue-tsc 门禁；跟踪 Volar 适配 |
| WebGPU/TSL 迁移成本（自定义 shader 重写） | 中 | 新 shader 优先 TSL 写法（双后端）；WebGL2 作为长期基线 |
| 影视载具版权（DeLorean 等） | 高（法务） | 阶段一已完成权利结构研究；商用前法务意见（docs/06-assets-and-data） |
| 模型资产质量与许可 | 中 | 资产获取策略三阶段制 + 许可档案制度 |

## 6. 下一步架构工作（按优先级）

1. 阶段二：gsap-motion 转场原型 → 定稿转场机制；
2. 阶段二：lighting-and-materials → 车漆基线卡；
3. 阶段二：Vitest + Playwright 门禁进入 CI 习惯（本地脚本）；
4. 阶段三：performance-benchmark → 性能预算 v1；
5. 持续：跟踪 three breaking changes 与 TS7 生态。

---

变更记录：

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-11-05 | v1.0 | 初版：分层架构 + 技术栈决策（双证据）+ 关键机制 + 风险登记 |
