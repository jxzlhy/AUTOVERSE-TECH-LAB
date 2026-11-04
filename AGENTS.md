# AGENTS.md — AI 开发代理规范

> 本文件是所有 AI 开发工具（Claude Code、Cursor、Copilot、ZCode 等）在本仓库工作的**最高行为规范**。
> 首次进入本仓库的 AI 代理必须先完整阅读本文件与 docs/05-ai-workflow/AI_WORKFLOW.md。

---

## 0. 你在哪里

这里是 **AUTOVERSE TECH LAB**——AUTOVERSE（融合型汽车文明数字宇宙）的技术实验室，负责技术选型、原型验证、设计规范与 AI 开发知识库建设。

- 它**不是** AUTOVERSE 产品仓库；
- 它与 **GEWU（格物）** 是完全独立的产品：允许借鉴通用技术经验，禁止复制代码、混淆定位。

开工前先读：

1. `docs/00-overview/lab-charter.md` — 实验室章程（证据分级、决策规则）
2. `docs/01-product/autoverse-product-overview.md` — 产品总纲（方向共识）
3. `docs/04-design-system/design-system.md` — 设计系统规范
4. `docs/05-ai-workflow/AI_WORKFLOW.md` — 工作流细则

## 1. 硬性禁令（违反即回滚）

1. **不得擅自改变核心技术架构**。架构级变更（引擎、框架、目录体系、构建方案）必须先在 `docs/02-architecture/` 写出变更研究，由项目所有者确认。
2. **不得随意引入依赖**。新依赖必须：核实版本与许可 → 记录引入理由 → 更新 `docs/08-research/dependency-registry.md`。
3. **不得破坏 Design System**。UI 不得引入外部组件库的整体视觉风格；必须使用 `docs/04-design-system/` 的 Design Tokens。
4. **不得提交敏感信息**：API Key、Token、密码、.env、私有 URL、个人信息。提交前检查 `git diff --staged`。
5. **不得使用许可不明或不可商用的资源**（模型、贴图、字体、音效）。来源与许可必须写入 `docs/06-assets-and-data/`。
6. **不得编造**：版本号、API、性能数据、来源链接、验证结果。查不到就写"未能核实"。
7. **不得把未验证内容写成已验证**。证据分级见章程第 4 节（V/R/O/U）。
8. **不得绕过外部登录、授权、验证码、付费墙**。遇到时集中记录到待办（见 §4），交项目所有者处理。
9. **不得删除或覆盖他人/历史的有价值资料**。修改前先读，重命名或迁移需在 CHANGELOG 说明。
10. **不得用 `git push --force`**。

## 2. 必做流程（每个任务）

```text
1. 读规范      先读本文件 + 相关 docs/，确认边界
2. 先研究      新问题先查官方文档/仓库，记录来源与核实日期
3. 小步实施    原型代码放在 prototypes/ 或 experiments/，不动无关文件
4. 真实验证    运行、构建、测试；记录实际输出（含报错）
5. 更新文档    实现了什么/未实现什么/已知问题/下一步
6. Git 纪律    检查 diff → 有意义的 commit message → push
7. 交接        阶段结束在 docs/09-handoff/ 生成阶段报告
```

## 3. 编码约定

- **语言**：TypeScript 优先；文档用中文（技术名词保留英文）。
- **目录**：研究文档进 `docs/`；可运行验证进 `prototypes/`；**可复用代码进 `packages/`**（shared/three-runtime/design-system）；一次性脚本进 `experiments/`；工具进 `tools/`；报告进 `reports/`。
- **Runtime 纪律**：引擎改动必须走 `packages/three-runtime` 并补单测；两阶段场景激活、解码器门控、ResourceLedger 所有权语义不得回退（见 DECISION_LOG）。
- **workspace 依赖纪律**：应用内 import 任何新 `packages/*` 包时，必须同步写入该应用 package.json 的 dependencies（已两次踩坑：design-system/motion-system）——build:all 是唯一可靠检查。
- **3D Runtime 与业务 UI 解耦**：场景代码不得直接引用 UI 框架组件；通信走明确的接口层（事件/store），模式见 `docs/02-architecture/`。
- **性能红线**：任何原型默认挂 FPS/draw call 显示；提交性能结论必须附实测环境说明（设备、浏览器、分辨率）；GPU 显存不可测即标注 NOT_MEASURABLE，禁止伪造。
- **文件命名**：kebab-case；文档带编号前缀时遵循现有体系。

## 4. 阻塞与上报

遇到以下情况，**停止该项工作，记录到当前阶段报告的"待项目所有者处理"清单，转做其他不依赖它的工作**：

- 需要登录/授权/验证码（GitHub 网页操作、第三方平台账号等）；
- 需要购买或申请许可的付费资源；
- 需要法律判断的版权/商标问题；
- 与规范冲突且无先例可循的决策。

## 5. 提交规范

```text
<type>: <一句话说明>

type ∈ {docs, feat, fix, refactor, perf, test, chore}
示例：docs: 新增 3D 引擎选型研究报告（v1，文献级）
```

- 阶段性成果完成后立即 commit + push，不要攒大包；
- commit 前必须 `git diff` 自查，确认无敏感信息与无关文件；
- 禁止提交：`node_modules`、构建产物（`dist/`）、大型二进制资源（>10MB 需先评估 Git LFS）。

## 6. 快速自检清单

```text
[ ] 我读过 AGENTS.md 和 AI_WORKFLOW.md 了吗？
[ ] 我改动的范围在授权任务内吗？
[ ] 新依赖有版本/许可/理由记录吗？
[ ] 我写的"已验证"是真的运行过吗？
[ ] 性能结论有实测环境和数据吗？
[ ] git diff 里没有敏感信息和产物吗？
[ ] 文档更新了吗（实现/未实现/问题/下一步）？
```

---

变更记录：

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-11-04 | v1.0 | 初版建立 |
