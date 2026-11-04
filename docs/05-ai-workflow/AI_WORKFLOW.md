# AI_WORKFLOW — AI 开发工作流

> 文档状态：正式规范 v1.0
> 建立日期：2026-11-04
> 配套文件：`AGENTS.md`（行为禁令）、`docs/00-overview/lab-charter.md`（证据分级）

---

## 1. 工作模式总则

AI 代理在本仓库采用**自主规划 + 持续迭代**模式：

1. 接到阶段任务后，先产出阶段计划（TodoList），再逐项执行；
2. 不逐文件请示；阶段性成果立即提交；
3. 遇阻塞（登录/授权/验证码/付费/法律判断）→ 记录待办 → 转做不依赖它的工作；
4. 每阶段结束自审全部成果、修复问题，再输出最终报告。

## 2. 标准任务循环（Research → Prototype → Record）

### 2.1 Research（研究）

- 优先级：官方文档 > 官方 GitHub/Release > 官方 Playground/Demo > 权威社区资料 > 博客；
- 记录四要素：**来源 URL + 核实日期 + 许可/商业限制 + 证据等级（V/R/O/U）**；
- 版本号以 `npm view <pkg> version` 或官方 Release 页为准，不接受记忆值；
- 产出写入 `docs/02-architecture/`、`docs/03-technology/`、`docs/06-assets-and-data/`、`docs/08-research/`。

### 2.2 Prototype（原型验证）

- 每个原型必须**可独立运行**：`pnpm i && pnpm dev` 即可启动，`pnpm build` 必须通过；
- 3D 原型默认挂性能显示（FPS / draw calls / triangles）；
- 验证记录写入原型目录 `README.md`：环境（机器/浏览器/分辨率）、步骤、实测数据、截图路径；
- 通过标准在开工前写明（验收标准先行）。

### 2.3 Record（记录与交接）

- 每阶段更新：`CHANGELOG.md`、`docs/09-handoff/phase-N-handoff.md`、相关研究文档的"核实记录表"；
- 报告三分类：**已完成并验证（V）/ 仅有研究结论（R）/ 未开始**；
- 明确写下"下一步计划"。

## 3. Git 纪律

| 规则 | 说明 |
| --- | --- |
| 提交粒度 | 一个完整的研究/原型/文档单元一个 commit |
| 提交信息 | `<type>: <说明>`，type ∈ docs/feat/fix/refactor/perf/test/chore |
| 提交前检查 | `git diff --staged` 确认无敏感信息、无构建产物、无 node_modules |
| 推送 | 每阶段至少 push 一次；禁止 force push |
| CI | push/PR 触发 `.github/workflows/ci.yml`（quality：lint→typecheck→test→build；e2e：Chromium 冒烟）。**CI 结果确认需经 GitHub 网页（本机 api.github.com 受网络策略拦截）** |
| 断点续跑 | 会话恢复以 `PROJECT_STATE.md` 为唯一入口；资源将尽时先更新该文件再结束 |
| 敏感文件 | `.env*`、密钥、Token 一律不进库；提供 `.env.example`（仅键名） |
| 大文件 | >10MB 二进制先评估 Git LFS 或改为引用外部资源 |

## 4. 依赖管理

引入任何新依赖前：

```text
npm view <pkg> version dist-tags --json   # 核实版本与活跃度
检查许可证（LICENSE / npm view <pkg> license）
写入 docs/08-research/dependency-registry.md：版本、许可、用途、引入理由、风险
```

禁止引入：未评估的 UI 组件库（会冲击自主 Design System）、许可不明的资源包、废弃超过 1 年无维护的核心依赖（无替代时必须在文档标注风险）。

## 5. 设计系统协作规则

- UI Skill / 组件库**只是辅助工具**，项目自身设计规范具有最高优先级；
- 任何 UI 代码必须引用 Design Tokens（`docs/04-design-system/design-system.md` §Tokens）；
- 三条 UI 线（CORE UI / SPATIAL UI / ENGINEERING UI）不得混用：
  - CORE UI：知识层二维界面（搜索、条目页、图谱）；
  - SPATIAL UI：3D 空间内的 HUD/玻璃面板；
  - ENGINEERING UI：实验室与内部工具界面。

## 6. 外部资源处理协议

| 情况 | 行为 |
| --- | --- |
| 需要登录/账号 | 停止该项 → 记入"待项目所有者处理" → 继续其他工作 |
| 需要付费/购买 | 同上，并记录：资源名、用途、价格（若公开）、替代方案 |
| 需要验证码/人机校验 | 同上，不得以任何脚本绕过 |
| 版权/商标判断 | 记录风险与已知权利方信息，标注"需法律意见"，不得自行拍板商用 |

## 7. 阶段交接模板

`docs/09-handoff/phase-N-handoff.md` 必须包含：

1. 本阶段目标与完成判定标准；
2. 已完成并验证清单（附验证方式与数据）；
3. 仅有研究结论清单（附来源与证据等级）；
4. 未开始清单；
5. 已知问题与风险；
6. 待项目所有者处理事项（登录/付费/法务）；
7. 下一步建议（按优先级）。

---

变更记录：

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-11-04 | v1.0 | 初版建立 |
