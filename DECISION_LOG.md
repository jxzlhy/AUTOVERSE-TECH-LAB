# DECISION_LOG — 技术决策日志

> 与 ADR（docs/03-technology/tech-selection-comparison.md §8）互链：ADR 记录选型层，本文件记录工程实施层决策。
> 格式：决策 / 背景 / 备选 / 理由 / 风险 / 回滚 / 日期。

---

## DL-001 packages/ 工作区采用"演进式抽层"，不机械重建目录

- **决策**：在现有 pnpm workspace（prototypes/*/*）基础上新增 `packages/*` 层（shared / three-runtime / design-system），现有 framework-comparison 原型保持原位不动。
- **背景**：MASTER PLAN §3.4 建议 packages/ 目录；Phase 1 已有可运行的 prototypes 体系（验证过、推送过）。
- **备选**：(a) 全量迁移到 packages 优先结构；(b) 不建 packages，继续在原型内嵌代码。
- **理由**：(a) 违反"保护已有成果"；(b) 无法复用与单测。演进式 = 低风险 + 立即收益。
- **风险**：新旧并存期目录心智成本。**回滚**：删 packages/ 即可，原型零依赖。
- **日期**：2026-11-05

## DL-002 three-runtime 模块采用"命令式内核 + 平台无关 TS"实现

- **决策**：three-runtime 包不依赖 Vue/React，以类+工厂函数暴露；框架适配层留在应用侧。
- **背景**：Phase 1 验证的桥接层模式（createCarStudio 接口）已证明框架正交性。
- **备选**：TresJS 声明式封装。
- **理由**：ADR-002 主路线；TresJS 观望（R 级：无生产就绪声明）。
- **风险**：样板代码多于声明式。**回滚**：接口层薄，可重写适配。
- **日期**：2026-11-05

## DL-003 工程规范工具链：ESLint(flat)+Prettier+Vitest 先行，Playwright 缓一轮

- **决策**：本轮引入 ESLint 9 flat config + typescript-eslint + Prettier + Vitest；Playwright 与 CI 下一轮。
- **背景**：D2 技术债；TS7 生态适配期（F1）。
- **备选**：一次性引入全家桶（含 Playwright）。
- **理由**：先把"能自动跑的门禁"立起来；TS7 × 工具链兼容性逐个验证，避免一次性引入一堆失败。
- **风险**：TS7 与 eslint 兼容受阻 → 降级为 Prettier+Vitest，登记债务。**回滚**：删配置文件。
- **日期**：2026-11-05

## DL-004 首个真实 GLB 资产选 Khronos ToyCar（CC0）

- **决策**：资产管线验证用 Khronos glTF-Sample-Assets 的 ToyCar.glb（CC0），存 assets/models/khronos/ 并建许可档案。
- **背景**：asset-sources.md §4 策略（验证期用 CC0）；three.js ferrari 仅限本地不入库。
- **备选**：poly.pizza Quaternius 低模车（CC0）。
- **理由**：ToyCar 有独立命名部件+PBR 材质，正好支撑零件拾取/拆解验证；CC0 无署名负担。
- **风险**：ToyCar 非真实车型（属工程示意级，质量分级 C→按 §8.2 如实标 SIMULATED）。**回滚**：删文件+档案条目。
- **日期**：2026-11-05

## DL-005 旗舰原型定位 automotive-studio（产品体验整合），spatial-experience 缓行

- **决策**：本轮旗舰 = `prototypes/automotive-studio/`（GLB+灯光预设+零件交互+拆解+Bloom+转场+HUD，双场景验证 Nexus 可行性）；spatial-experience（完整多空间）待 runtime 稳定后下一轮。
- **背景**：MASTER PLAN PART 11/12；PART 12 明确"先确保两个空间稳定"。
- **理由**：单应用内双场景已覆盖转场/加载/释放/状态恢复的验证点，成本远低于两个完整空间。
- **风险**：双场景在同一 Canvas 内实现，与未来"每空间一 Canvas"方案有差异 → 转场接口按可替换设计。**回滚**：原型独立，不影响 packages。
- **日期**：2026-11-05
