# 依赖登记册（Dependency Registry）

> 按 AI_WORKFLOW §4 维护：引入任何新依赖前必须在此登记。
> 版本核实方式：npm registry（`npm view`），核实日期 2026-11-04。

## 当前登记（阶段一）

| 依赖 | 版本 | 许可 | 用途 | 引入理由 | 风险与备注 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| vue | ^3.5.44 | MIT | UI 框架（vue-three / vue-babylon） | ADR-001 主路线 | 3.6 RC 观望不追新 | ✅ 在用 |
| react / react-dom | ^19.3.1 | MIT | react-r3f 原型 | 备选路线验证 | 仅存在于 react-r3f | ✅ 在用 |
| three | ^0.187.0 | MIT | 3D 引擎 | ADR-002 | 每版有破坏性变更，锁次版本 | ✅ 在用 |
| @react-three/fiber | ^9.8.2 | MIT | React 声明式 3D | 备选路线验证 | 绑定 React 线 | ✅ 在用 |
| @react-three/drei | ^10.7.9 | MIT | R3F 工具集 | 备选路线验证 | 要求 React ^19 | ✅ 在用 |
| @babylonjs/core | ^9.33.2 | Apache-2.0 | 专项备选引擎 | 备选路线验证 | 包体大（构建产物 ~1.4MB） | ✅ 在用 |
| pinia | ^4.1.0 | MIT | 业务状态（待引入） | 状态管理结论 | 阶段二接入 | 📋 已评估未引入 |
| zustand | ^5.0.16 | MIT | 跨框架桥接备选 | vanilla 模式结论 | 未引入 | 📋 已评估未引入 |
| gsap | ^3.15.1 | Standard 'no charge' license（免费商用，禁捆绑竞品 no-code 工具） | 动画主干 | ADR-004 | gsap-motion 原型引入 | 📋 已评估未引入 |
| camera-controls | ^3.1.2 | MIT | 镜头控制 | 动画研究结论 | gsap-motion 原型引入 | 📋 已评估未引入 |
| postprocessing | ^6.39.6 | **Zlib**（D 代理官方核实，非 MIT） | 后期处理（对比评估用） | 视觉研究 | ⚠️ peer 依赖 three <0.188，three 升级需同步评估；three-rendering 原型引入 | 📋 已评估未引入 |
| vite | ^8.3.5 | MIT | 构建 | Rolldown 内核实测 <1s | F6：.tsx 命名规则 | ✅ 在用 |
| @vitejs/plugin-vue | ^6.0.10 | MIT | Vue 插件 | — | — | ✅ 在用 |
| @vitejs/plugin-react | ^6.2.1 | MIT | React 插件 | — | — | ✅ 在用 |
| typescript | ^7.0.2 | Apache-2.0 | 类型系统 | 严格模式 | ⚠️ F1：vue-tsc 未适配 | ✅ 在用 |
| vue-tsc | ^3.1.0 | MIT | Vue 类型检查 | 门禁 | ⚠️ 与 TS7 不兼容（F1），门禁暂缺 | ⚠️ 受限使用 |
| @types/three | ^0.187.0 | MIT | three 类型 | — | **E 代理核实：three npm 包不自带类型，本包必需**；addons 类型不保证全覆盖 | ✅ 在用 |
| @types/react(-dom) | ^19.2.0 | MIT | React 类型 | — | — | ✅ 在用 |
| @pmndrs/assets | ^1.7.0 | — | pmndrs 官方资产（备用） | — | 未实际引入任何包 | 🔍 观察清单 |
| stats-gl | 4.2.3 | — | 3D 性能面板（备选） | — | 原型暂用自研 HUD；benchmark 时评估 | 🔍 观察清单 |
| @gltf-transform/core+cli | 4.5.1 | MIT | 资产优化流水线 | 资源研究 | performance-benchmark 引入 | 📋 已评估未引入 |

> 说明：`pinia/zustand/gsap` 等出现在各原型 package.json 中的情况以实际文件为准；"📋 已评估未引入"表示研究完成、按计划在后续原型引入。引入时更新状态列并在 CHANGELOG 记录。

## 禁入清单

- 未评估的 UI 组件库（冲击自主 Design System）；
- CC-BY-NC 资源、许可不明的模型/字体包；
- 废弃 >1 年且无替代的核心依赖（如确需必须书面标注风险）。

---

变更记录：

| 日期 | 变更 |
| --- | --- |
| 2026-11-05 | 初版：阶段一全部依赖登记 |
