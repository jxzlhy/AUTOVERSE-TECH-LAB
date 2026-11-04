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

## DL-006 TypeScript 采用 6/7 双版本 side-by-side

- **决策**：根目录 typescript@6.0.3（供 eslint/typescript-eslint 8.72 与根 typecheck），各应用包保留 typescript@7.0.2（原生编译器 tsc 门禁）。
- **背景**：F12——根安装 TS7 后 typescript-eslint 直接拒绝运行（8.72 明确不支持 TS7.0 API）；TS 官方博客给出 6/7 side-by-side 方案。
- **备选**：(a) 全降 TS6（放弃 TS7 提速）；(b) 等 typescript-eslint 支持 TS7（阻塞 lint）。
- **理由**：lint 门禁不能停；TS6 tsc 对本代码库正确性等价；包内 TS7 门禁继续生效。
- **风险**：双版本语义差异需关注（当前无 TS7 专属语法）。**回滚**：根升级 TS7 并等待 typescript-eslint 适配。
- **日期**：2026-11-05

## DL-007 E2E 执行环境定为 CI（本机仅开发配置）

- **决策**：Playwright 浏览器安装与 E2E 执行在 GitHub Actions ubuntu runner 进行；本机保留规范与配置（e2e/），不装浏览器。
- **背景**：F11——本机网络策略拦截 Playwright CDN（raw.githubusercontent 同类限制），Chromium 下载失败。
- **备选**：手动绕过代理下载（违反"不绕过网络策略"精神）；放弃 E2E。
- **理由**：CI 环境无下载限制且更接近真实用户环境；本机已有 Vitest 19 项 + 浏览器人工验证双兜底。
- **风险**：E2E 结果滞后于本地开发（push 后才见）。**回滚**：本机网络策略放开后 `npx playwright install chromium` 即可本地执行。
- **日期**：2026-11-05
