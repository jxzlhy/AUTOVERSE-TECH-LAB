# PROJECT_STATE — 项目状态（断点续跑入口）

> 本文件是所有会话/工具恢复工作的第一入口。每轮工作结束前必须更新。
> 配套：DECISION_LOG.md（技术决策）、docs/09-handoff/（阶段交接）、CHANGELOG.md。

---

## 当前快照（更新于 2026-11-05 凌晨）

| 项 | 值 |
| --- | --- |
| 当前阶段 | **MASTER PLAN 执行中**（总指令 V1.0，见 docs/05-ai-workflow/FOUNDATION_AND_OVERNIGHT_EVOLUTION_MASTER_PLAN.md） |
| 上一里程碑 | Phase 1 基础建设完成（2026-11-05，见 docs/09-handoff/phase-1-handoff.md） |
| 最新 Commit | d577e4e（推送时点） |
| 分支 | main（与 origin/main 同步） |
| 工作区 | 干净（本轮开工时审计确认） |
| 执行模式 | FULL AUTONOMOUS（通宵自主进化） |

## 已完成（可信成果）

- **知识库**：章程/总纲/AGENTS/AI_WORKFLOW/设计系统 v1.0/六份技术研究/架构报告/选型报告(ADR-001~005)/资产许可/性能研究/依赖登记/资源索引/交接报告
- **原型**：framework-comparison 三路线（vue-three / react-r3f / vue-babylon）构建+浏览器双验证，实测发现 F1–F6
- **技术基线**：Vue 3.5 + 原生 three r187 + GSAP 3.15 + Pinia + Vite 8(Rolldown) + TS 7.0.2

## 正在进行

- MASTER PLAN PHASE 0→1：审计✅ → 总指令落盘✅ → PROJECT_STATE/DECISION_LOG（本文件）→ 工程规范（ESLint/Prettier/Vitest）→ packages 体系 → 旗舰原型

## 未完成 / 本轮计划

按依赖顺序（详见 DECISION_LOG 与 MASTER PLAN PART 16）：

1. 工程规范落地（ESLint flat + Prettier + Vitest；TS7 兼容性实测，受阻则降级记录）
2. `packages/shared`（Design Tokens 代码化）+ `packages/three-runtime`（SceneManager/AssetManager/CameraController/LightingManager(5 预设)/InteractionManager/EffectManager/ResourceDisposer/PerformanceMonitor）+ 单元测试
3. 资产管线：Khronos CC0 GLB 入库 + `tools/inspect-glb.mjs` 检查工具 + 许可档案
4. 旗舰原型 `prototypes/automotive-studio/`：真实 GLB + 灯光预设 + 零件拾取/爆炸拆解 + Bloom + 场景转场 + 性能 HUD
5. `prototypes/design-playground/`：CORE UI 组件与状态展示
6. Shader 试点（Hologram/Fresnel/Dissolve/X-Ray）进入能量空间场景
7. 浏览器视觉审查 + 修复；文档同步；最终演进报告（PART 21 A–J）

## 技术债（PHASE 0 审计结论）

| # | 债 | 影响 | 处置 |
| --- | --- | --- | --- |
| D1 | vue-tsc 3.3.14 × TS 7.0.2 不兼容 | Vue 线无类型门禁 | 试 TS5.9 组合；受阻则保持 tsc(react 线)+构建门禁，登记在案 |
| D2 | 无 ESLint/Prettier/Vitest/Playwright | 代码质量无自动门禁 | 本轮补齐前三者；Playwright 下一轮 |
| D3 | Runtime 逻辑内嵌在原型 app 里 | 无法复用/测试 | 本轮抽出 packages/three-runtime |
| D4 | 无真实 GLB 资产与检查工具 | 交互演示停留在程序化几何 | 本轮引入 CC0 资产 + 检查工具 |
| D5 | IAB 环境 FPS 读数失真（F4） | 性能结论受限 | benchmark 用真实浏览器；已在文档标注 |
| D6 | 无场景管理/转场系统 | 多空间不可行 | 本轮 SceneManager + GSAP 转场试点 |

## 已知问题

- F1–F6 见 prototypes/framework-comparison/README.md §4
- K5：影视载具版权（DeLorean）商用前需法务意见

## 用户待处理事项（无阻塞）

- 暂无。Sketchfab 登录/付费资产/法务意见为远期事项，本轮不依赖。

## 下一步（断点续跑指令）

若会话中断：读本文件 → 读 DECISION_LOG.md → git log 确认最新提交 → 从"未完成/本轮计划"列表第一个未勾选项继续。
