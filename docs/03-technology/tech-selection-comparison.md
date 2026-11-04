# AUTOVERSE 技术选型比较报告 v1.0

> 核实日期：2026-11-04/05 ｜ 状态：决策文档（R 文献 + V 原型双证据）｜ 综合研究员：主 Agent
> 明细证据：frontend-frameworks.md / state-management.md / 3d-engines.md / animation-systems.md / visual-techniques.md（研究中）/ engineering-stack.md（研究中）/ ../prototypes/framework-comparison/README.md

---

## 1. 决策总览

```text
主路线（已定）        备选（保留）        观望/专项
UI：Vue 3.5          React 19.3         ——
3D：three r187 原生   R3F 9.8（React 线） TresJS 5.10（观察）
                     Babylon 9.33（专项）
动画：GSAP 3.15      Motion 14.9（Vue 用 motion-v，待验证）
状态：Pinia 4.1       Zustand 5（跨框架桥接备选）
构建：Vite 8 + pnpm workspace + TypeScript（严格）
```

## 2. UI 框架：Vue 3 vs React 19

| 维度 | Vue 3.5.44 | React 19.3.1 | 判定 |
| --- | --- | --- | --- |
| 当前稳定性 | 3.5 稳定；3.6 RC（Vapor 特性完成未默认） | 19.3 稳定（ViewTransition 稳定） | 平手（R） |
| 3D 生态契合 | three 原生用法为主；TresJS 社区小 | R3F+drei 成熟且官方确认兼容 19.3 | React 略优（R） |
| 与本团队/既有栈 | 与既定技术方向一致 | 需换栈 | **Vue 胜（项目事实）** |
| RSC 影响 | 不涉及 | 官方确认可构建期运行、与纯前端 3D 正交 | 平手（R） |
| 类型检查链路 | ⚠️ vue-tsc 未适配 TS7（V 实测 F1） | tsc 原生通过 TS7（V） | React 略优（V） |
| 许可 | MIT | MIT | 平手 |

**结论：Vue 3（主）**。理由权重：团队技术方向 > 3D 生态差异可由原生 three 内核抹平 > 类型门禁是临时性问题。React+R3F 保留为书面备选。

## 3. 3D 技术路线（核心决策）

| 维度 | Vue3+原生three | React+R3F | Vue3+TresJS | Vue3+Babylon |
| --- | --- | --- | --- | --- |
| npm 周下载（生态代理） | ~3350 万 | ~946 万 | ~5.3 万 | ~36.7 万（R） |
| 车漆/IBL 开箱质量 | RoomEnvironment 一行 | 同 three（drei 辅助） | 同 three | 无内置等价物，V 实测需自建（F2） |
| 场景 draw calls 基线 | 21 | 21（对齐后） | — | 11（V） |
| 3D Runtime 解耦 | 天然（命令式内核） | 声明式组件树，解耦需纪律 | 声明式 | 天然 |
| Vue 集成官方支持 | 无需集成层 | （React 官方级） | 官方级但社区小 | 社区扩展（R） |
| WebGPU 演进 | 官方 three/webgpu+tsl 入口 | v10 alpha WebGPU First | 5.10 新增 webgpu 入口 | 自有 WebGPU 实现（R） |
| 生产风险 | 低 | 低 | 中（无生产就绪声明） | 低（引擎）+ 中（集成层） |
| 本次原型踩坑 | 0 | 2（均修） | 未测 | 1（引擎特性，已修） |

**结论：Vue3 + 原生 three.js（主路线）**；R3F 书面备选；TresJS 观望（季度复核）；Babylon 专项备选（工具/检查器场景）。完整评分见 3d-engines.md 与 ../prototypes/framework-comparison/README.md §6。

## 4. 动画体系

| 层 | 选型 | 依据 |
| --- | --- | --- |
| UI 微交互 | CSS/WAAPI（含 View Transitions 跟踪） | R：够用且零依赖 |
| UI 编舞/复杂时间线 | GSAP 3.15.1 | R：全插件免费可商用（唯一限制：不捆绑竞品 no-code 工具）；ScrollTrigger/SplitText 可用 |
| 3D 镜头 | GSAP 时间线 + camera-controls 3.1.2 | R：官方 ticker 文档 + 社区权威示例；V：待 gsap-motion 原型 |
| 3D 对象动画 | three AnimationMixer（glTF clipAction） | R：官方要求每帧 update(delta) |
| Vue 组件动画备选 | motion-v（Motion 的 Vue 实现）待验证 | R：Motion 14.9.1 MIT；Vue 支持为独立包，成熟度待测 |

## 5. 状态管理

| 场景 | 选型 | 依据 |
| --- | --- | --- |
| 业务/UI 状态（Vue 线） | Pinia 4.1.0 | R：官方推荐、DevTools 完整 |
| 每帧/瞬时 3D 状态 | 内核 plain object + 节流上报（不入响应式） | R+V：原型 stats 通道模式验证 |
| 跨框架桥接（若复用内核于 React 原型） | Zustand 5 vanilla 模式 | R：可脱离 React 使用 |
| 服务端数据（知识层） | TanStack Query 5.105（vue/react 同步发版） | R：官方双框架支持 |

## 6. 视觉技术要点（详见 visual-techniques.md）

- IBL 是车漆必需品：**V 实测 F2 证实**（Babylon 无环境贴图时 metallic 纯黑）；RoomEnvironment+PMREM 为 three 线标准做法；
- WebGPU 已全主线浏览器可用（R），但 three 官方定位 WebGPURenderer 与 WebGLRenderer 并行、无默认切换（R），**AUTOVERSE 以 WebGL2 为基线、TSL 写 shader 保持双后端可能**；
- 后期处理：pmndrs postprocessing 6.39.6 vs 官方 EffectComposer 对比 → three-rendering 原型（阶段二）。

## 7. 工程体系（详见 engineering-stack.md）

- Vite 8（Rolldown）：V 实测构建 <1s，`scene.tsx` 命名规则（F6）；
- pnpm workspace：V 实测支撑三应用并行；
- 测试门禁现状：build ✅ / tsc（react 线）✅ / vue-tsc ⚠️F1 / Vitest+Playwright 阶段二补齐。

## 8. 决策记录（ADR 式）

| # | 决策 | 日期 | 证据 | 复核触发条件 |
| --- | --- | --- | --- | --- |
| ADR-001 | UI 框架 = Vue 3 | 2026-11-05 | §2 | 团队转 React 或 TresJS 成熟声明 |
| ADR-002 | 3D = 原生 three 内核 | 2026-11-05 | §3 + F2/F5 | drei 生态出现必需能力；或团队声明式偏好 |
| ADR-003 | 每帧状态不入响应式 store | 2026-11-05 | §5 | 性能实测推翻 |
| ADR-004 | GSAP 为动画主干 | 2026-11-05 | §4 | 商业条款变化；gsap-motion 原型推翻 |
| ADR-005 | WebGL2 基线 + TSL 面向未来 | 2026-11-05 | §6 | three 官方默认切换 WebGPURenderer |

---

变更记录：

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-11-05 | v1.0 | 初版：五份明细研究 + 三路线原型实证 → 五条 ADR |
