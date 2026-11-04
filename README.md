# AUTOVERSE TECH LAB

> AUTOVERSE（融合型汽车文明数字宇宙）的技术研究中心、架构验证平台、设计规范库与 AI 开发知识库。
> **本仓库不是 AUTOVERSE 产品本身**，它为未来正式产品输出经过验证的技术方案。

**一个宇宙，多个世界，无限探索。**

---

## 实验室是什么

| 职责 | 说明 |
| --- | --- |
| 产品规划与世界观研究 | [docs/01-product](docs/01-product/) |
| 技术选型（框架/引擎/动画/视觉） | [docs/03-technology](docs/03-technology/)，核心结论见 [选型比较报告](docs/03-technology/tech-selection-comparison.md) |
| 架构验证 | [docs/02-architecture](docs/02-architecture/) + [prototypes](prototypes/) |
| 设计体系 | [docs/04-design-system/design-system.md](docs/04-design-system/design-system.md)（自主 Design System，不依附现成组件库） |
| AI 开发规范 | [AGENTS.md](AGENTS.md) + [docs/05-ai-workflow](docs/05-ai-workflow/) |
| 资产与许可研究 | [docs/06-assets-and-data](docs/06-assets-and-data/) |
| 性能研究 | [docs/07-performance](docs/07-performance/) |
| 资源索引 | [docs/08-research/research-index.md](docs/08-research/research-index.md) |
| 阶段交接 | [docs/09-handoff](docs/09-handoff/) |

与 GEWU（格物）是完全独立的两个产品：允许借鉴通用技术经验，禁止混淆代码与业务边界。

## 阶段一核心结论（2026-11-05）

| 决策 | 结论 | 证据等级 |
| --- | --- | --- |
| UI 框架 | **Vue 3.5**（React 19.3 书面备选） | R+V |
| 3D 引擎 | **原生 three r187 命令式内核**（R3F 备选、Babylon 专项、TresJS 观望） | R+V |
| 动画 | GSAP 3.15（免费商用已核实）+ AnimationMixer + CSS/WAAPI | R |
| 状态 | Pinia（业务）+ 内核外置对象（每帧状态不入响应式） | R+V |
| 关键实证 | 车漆必须 IBL（Babylon 无环境贴图 metallic 纯黑实测）；vue-tsc 未适配 TS7；Vite 8=Rolldown | **V 实测** |

三条技术路线原型均已构建通过并在真实浏览器中验证渲染与交互：[对比报告](prototypes/framework-comparison/README.md)。

## 快速开始

```bash
pnpm install
pnpm --filter @atl/proto-vue-three build && pnpm --filter @atl/proto-vue-three preview    # :5171
pnpm --filter @atl/proto-react-r3f build && pnpm --filter @atl/proto-react-r3f preview    # :5172
pnpm --filter @atl/proto-vue-babylon build && pnpm --filter @atl/proto-vue-babylon preview # :5173
```

要求：Node ≥ 22，pnpm ≥ 12。

## 目录结构

```text
docs/          研究与规范（00-overview … 09-handoff 十个分区）
prototypes/    可独立运行的技术验证原型（含验收标准与验证记录）
experiments/   一次性实验
assets/        实验室自有素材（仅限许可明确资源）
reports/       阶段总结报告
```

## 仓库纪律（摘要）

- 所有 AI 代理先读 [AGENTS.md](AGENTS.md)；证据分级 V/R/O/U（[章程](docs/00-overview/lab-charter.md) §4）；
- 不提交敏感信息与构建产物；不 force push；新依赖必须登记（[依赖登记册](docs/08-research/dependency-registry.md)）；
- 研究结论必须附来源、核实日期与许可；查不到就写"未能核实"。

---

维护：AUTOVERSE TECH LAB（AI Agent 代行 + 项目所有者决策）
变更记录见 [CHANGELOG.md](CHANGELOG.md)
