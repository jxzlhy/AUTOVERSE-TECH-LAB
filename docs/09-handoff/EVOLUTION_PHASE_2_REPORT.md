# EVOLUTION PHASE 2 REPORT — 工程强化与视觉进化

> 执行窗口：2026-11-05 ｜ 执行者：AI Agent（FULL AUTONOMOUS）
> 承接 Commit：`01e0677` ｜ 最终 Commit：见仓库 HEAD（本报告随终验提交推送）

---

## 1. 实际完成内容（对照 MASTER PLAN PART 14 优先级）

### PHASE 2A — Runtime Stability ✅（最高优先级，全部复核后修复）

| 项 | 复核结论 | 修复 | 测试 |
| --- | --- | --- | --- |
| SceneManager 失败恢复 | **缺陷属实**：目标 onEnter 失败时旧场景已被移除→白屏 | 两阶段激活（prepare→commit），失败保留当前场景；generation 防陈旧提交；cancelPending | 5 项新用例 |
| AssetManager 解码器竞态 | **缺陷属实**：Draco 漂浮 async import，loadGLB 可先于解码器就绪 | decoderReady 门控 + KTX2（detectSupport）/Meshopt 可选初始化 | 门控链路（间接经 build+运行） |
| GLB 统计准确性 | **缺陷属实**：indexed geometry 用 position.count/3（ToyCar HUD 25.8K vs inspector 108.9K，4 倍偏差实锤） | index.count/3 修正 | 索引几何专项用例 |
| ResourceDisposer 共享资源 | 部分属实：单树内已去重，跨场景无所有权 | ResourceLedger 引用账本 + 骨骼纹理 + InstancedMesh.dispose + disposeRenderTarget + createListenerTracker | 3 项新用例 |
| App 生命周期 | **缺陷属实**：unhandledrejection 未反注册、gsap 未 kill | 命名监听器反注册 + contextlost/restored + killTweensOf | createListenerTracker 用例 |

### PHASE 2B — Automated Testing & CI ✅

- CI：`.github/workflows/ci.yml`（quality：install→lint→typecheck→test→build；e2e：CI 内装 Chromium 跑冒烟）
- E2E：`e2e/smoke.spec.ts` 三套件（Playground/基线/旗舰，含控制台零错误断言与 F3 布局回归哨兵）
- 类型门禁：根 `pnpm typecheck`（TS6 tsc）覆盖 shared/three-runtime/studio/react-r3f；各应用包内 tsc 为 TS7 原生
- **F11/F12 记录**：Playwright CDN 被本机网络策略拦截（E2E 执行定 CI，DL-007）；typescript-eslint 拒绝 TS7（根 TS6 side-by-side，DL-006）

### PHASE 2C — Real Performance Benchmark ✅（harness 层面）

- `prototypes/performance-benchmark/`：六场景（A 单车/B 实例化×100/D 600 Mesh/G 100k 粒子/H Bloom/J 长跑），URL 参数驱动，avg/P95 帧时 + 资源计数 + 环境自记录（UA/DPR/渲染器名/SwiftShader 嫌疑标记）
- **诚实边界**：GPU 显存 = NOT_MEASURABLE；headless/IAB 读数不代表真实 GPU（页面内明示）——真实数据需用户日常浏览器执行（PROJECT_STATE 待办 #1）
- **harness 端到端实测**：A 场景 6s 跑通，RESULT 面板 + JSON 输出验证

### PHASE 2D/2E — 首个切片 ✅

- Shader Library v2 进 runtime 共享层：X-Ray / Dissolve（噪声消融）/ Energy Flow（每条带场景+性能说明，Handle 统一生命周期）
- CORE UI v0.1：AvTabs（WAI-ARIA roving tabindex + 方向键）、AvToast（role=status）；Playground 增补真实交互

## 2. 测试与验证结果

- **Vitest 19/19**（Phase 1 的 11 项 + PHASE 2A 新增 8 项边界）
- **lint 0 ｜ typecheck 0 ｜ 六应用 build 全绿**（含新 benchmark）
- 基准 harness 浏览器实测（截图）：RESULT 面板正确渲染（fpsAvg/frameAvg/p95/draws/tris/headlessSuspected）
- CI 已随 push 触发，E2E 结果以 GitHub Actions 页为准（首跑确认列下轮待办）

## 3. 修改文件概览

packages/three-runtime（SceneManager/AssetManager/ResourceDisposer/shader-library/index/types）｜ packages/design-system（AvTabs/AvToast）｜ prototypes/automotive-studio/src/App.vue（生命周期）｜ prototypes/performance-benchmark/*（新增）｜ e2e/*（新增）｜ .github/workflows/ci.yml（新增）｜ 根配置（tsconfig×2/scripts/eslint 修正）｜ 文档五处

## 4. 已知问题

- F1 vue-tsc × TS7 未解（Vue 线组件类型门禁缺位；DL-006 side-by-side 不覆盖）
- F11 本机无法执行 E2E（CI-only，DL-007）
- IAB/headless 性能读数不可信（方法论已固化，待真机执行）
- SceneState 契约变更（"activating"→"preparing/switching"）：对外属内部包 API，无外部消费者

## 5. 未完成（下一轮）

见 PROJECT_STATE.md"未完成"清单（真机基准执行 → CI 首跑确认 → 2G Engineering Lab → 2H DeLorean 专题 → 2D 深化）。

## 6. Git

本轮提交链：`057edee 前序`… 本轮 PHASE 2：总指令落盘 → cd2cafc（2A）→ b14a56d（2B-1）→ d34799d（2B CI）→ 7ffedfb（2C）→ 03fb128（2D/2E）→ 939c6d3/a0ced6e/6b05d16（门禁收敛）→ [本报告提交]；全部 push 成功，无 force push。

## 7. 下一轮建议

**首选：真机性能基准执行**（harness 已就绪，用户打开 `:5176/?scenario=A&autostart=1` 逐场景跑完交回 JSON，即可产出性能预算 v1）+ **CI E2E 首跑确认**。其后按 PART 14 推进 2G/2H。

---

签署：AI Agent ｜ EVOLUTION PHASE 2 首轮 ｜ 2026-11-05
