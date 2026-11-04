# framework-comparison — 三条技术路线摄影棚基线对比

> 状态：**V 级验证完成**（2026-11-04/05 构建通过 + 真实浏览器运行验证）
> 目的：为 AUTOVERSE 主技术路线选型提供第一手实测证据。配套研究文档：
> `docs/03-technology/3d-engines.md`（文献研究）、`docs/02-architecture/architecture-research.md`（总架构）。

## 1. 对象与规格

| 应用 | 技术栈（实测版本） | 目录 |
| --- | --- | --- |
| vue-three | Vue 3.5.44 + three r187 (0.187.0) + Vite 8.3.5 + TS 7.0.2 | `vue-three/` |
| react-r3f | React 19.3.1 + @react-three/fiber 9.8.2 + drei 10.7.9 + Vite 8.3.5 + TS 7.0.2 | `react-r3f/` |
| vue-babylon | Vue 3.5.44 + @babylonjs/core 9.33.2 + Vite 8.3.5 + TS 7.0.2 | `vue-babylon/` |

**统一场景规格**（三条路线完全一致，保证公平）：

- 程序化车辆（无外部资产）：车身 + 玻璃座舱 + 4 轮 + 4 轮毂，车漆 MeshPhysical/PBR clearcoat；
- 相机：等效机位（three: PerspectiveCamera(6.2, 2.6, 6.2)→target(0,0.8,0)；babylon: ArcRotateCamera r≈8.95, β≈1.37, α≈π/4），轨道交互 + 阻尼 + 距离/俯角限制；
- 光照：key 方向光（2048 阴影）+ 青色 rim + 环境光（见 §4 光照差异）；
- 转台自转 0.25 rad/s；4 组车漆预设（NEXUS/REAL/FICTION/CONCEPT，来自设计系统语义色）；
- HUD 覆盖层：同一份 Design Token 样式（`src/style.css` 三应用同源）；
- 指标：FPS / draw calls / triangles，0.5s 聚合。

## 2. 构建验证结果（V 级实测）

| 应用 | `vite build` | 类型检查 | 产物体积 |
| --- | --- | --- | --- |
| vue-three | ✅ 291ms | ⚠️ vue-tsc 不可用（见 §5-F1） | 634.13 kB（gzip 165.97 kB） |
| react-r3f | ✅ 219–232ms | ✅ `tsc --noEmit` 0 错误 | ≈634 kB（gzip ≈166 kB） |
| vue-babylon | ✅ 802–826ms | ⚠️ vue-tsc 不可用（同 F1） | ≈1.4 MB（gzip 待复测） |

工具链事实：Vite 8.3.5 已内置 Rolldown（构建日志出现 `build.rolldownOptions`）；三应用 build 全部 <1s。

## 3. 运行验证结果（V 级实测，2026-11-04/05）

环境：macOS (arm64, darwin 24.4.0) ｜ ZCode 内嵌浏览器 IAB（Chromium 内核，1280×720）｜ `vite preview` 服务构建产物。

| 应用 | 场景渲染 | 车漆切换交互 | 转台动画 | 指标读数（实测值） |
| --- | --- | --- | --- | --- |
| vue-three | ✅ 截图验证 | ✅ NEXUS→REAL 生效 | ✅ | 21 DRAWS / 1.6K TRIS |
| react-r3f | ✅ 截图验证 | ✅ NEXUS→REAL 生效 | ✅ | 30 FPS / 21 DRAWS / 1.6K TRIS（修复阴影对齐后与 vue-three 完全一致） |
| vue-babylon | ✅ 截图验证 | ✅ NEXUS→REAL 生效 | ✅ | 30 FPS / 11 DRAWS / 0.8K TRIS |

截图证据：会话工件目录（IAB 截图 8 张，含各路线 NEXUS/REAL 两态）。

**FPS 读数限制（重要）**：IAB 宿主对 requestAnimationFrame 按需合成——页面 `visibilityState === "visible"` 但 2 秒内 rAF 触发 0 次（页面内探针实测）。因此 three 系（自管 rAF）的 FPS 数值在本环境不具参考性（显示 0），而 Babylon 的 `engine.getFps()` 在合成窗口能采到 30。**三路线 FPS 对比需在真实常显浏览器中复测**，本阶段仅 draw calls / triangles 可横向对比。

## 4. 实测发现（每条都是本阶段真实踩坑记录）

| # | 发现 | 等级 | 影响 |
| --- | --- | --- | --- |
| F1 | **vue-tsc 3.3.14 不兼容 TypeScript 7.0.2**（peer 要求 <7，运行时 ERR_PACKAGE_PATH_NOT_EXPORTED）。TS 7 为原生编译器版本线 | V | Vue 路线类型检查门禁暂缺；后续选 TS 5.9 或等 Volar 适配。React 路线 tsc 原生通过 |
| F2 | **Babylon PBR metallic=0.9 无环境贴图时整车纯黑**（金属只吃反射光）。three 路线因 RoomEnvironment 无此问题。已用引擎原生 RawCubeTexture 六面渐变程序化 IBL 修复，零外部资产 | V | 证实 IBL 对车漆是必需品而非可选项；Babylon 无 RoomEnvironment 等价内置物，光照搭建 DX 低于 three |
| F3 | **共享样式表只写了 `#app` 高度导致 React 版（`#root`）布局塌陷**。跨框架复用样式时挂载点选择器必须抽象 | V | 已修复（`#app, #root`）并沉淀规则：设计系统的布局 Token 文档必须写"容器高度链"要求 |
| F4 | IAB rAF 节流（见 §3），FPS 类指标依赖运行环境合成策略 | V | 性能基准（performance-benchmark 原型）必须用真实浏览器或 CDP headless |
| F5 | Draw calls 基线：three 系 21（含阴影 pass 重复绘制），Babylon 11（更激进的合批/剔除）。**Babylon 单场景开销更低**，但差异量级不影响选型 | V | 供性能研究引用；真车模场景需重测 |
| F6 | Vite 8 = Rolldown 内核，构建速度极快（<1s）；`scene.ts` 含 JSX 必须命名 `.tsx`（rolldown 对 .ts 不做 JSX 转换） | V | 工程规范：R3F 组件文件一律 .tsx |

**光照方案差异（记录为选型证据）**：three 系用官方 RoomEnvironment + PMREMGenerator（一行 IBL，车漆质感好）；Babylon 无内置等价物，本原型用灯光组 + 程序化 RawCubeTexture 环境实现，视觉基调略亮、反射细节弱于 three。**这一 DX 差异直接支持 three 系作为汽车展馆首选**（见 docs/03-technology/3d-engines.md 结论）。

## 5. 开发体验（DX）定性对比（基于本次实际编码，V 级）

| 维度 | Vue3 + 原生 Three | React + R3F | Vue3 + Babylon |
| --- | --- | --- | --- |
| 场景代码组织 | 命令式内核类/函数，框架层薄封装（`createCarStudio` 接口） | JSX 声明式组件，场景即组件树；drei 提供 OrbitControls 开箱 | 命令式内核，与 Vue 集成方式同 vue-three |
| 生命周期对接 | 手动 onMounted/dispose（约 20 行清理代码） | R3F 自动管理大部分资源，useEffect 清理更少 | 手动 dispose（Engine/Scene/Instrumentation/env） |
| 状态→材质更新 | 显式 `setPaint()` 接口 | props → useEffect → material 引用，声明式但绕一层 ref | 显式 `setPaint()` 接口 |
| 指标采集 | `renderer.info` 直接 | `gl.info` + 模块通道（Canvas 外轮询） | `SceneInstrumentation` + `engine.getFps()`（最完善） |
| 踩坑数（本次） | 0 | 2（#root 塌陷、JSX 扩展名） | 1（metallic 黑屏，根因是引擎特性） |
| 代码量（场景部分） | ~150 行 | ~120 行（JSX 更紧凑） | ~230 行（光照/环境手动搭建更多） |

## 6. 结论与建议（V+R 双证据）

1. **主路线：Vue 3 + 原生 Three.js**。与 3D 引擎研究（R 级）结论一致：生态最大（周下载 3350 万 vs R3F 946 万 / TresJS 5.3 万 / Babylon 36.7 万）、命令式内核天然实现"3D Runtime 与业务 UI 解耦"、车漆/IBL 开箱质量最高。
2. **备选保留：React + R3F**。声明式场景组件与 drei 生态在快速搭原型时有优势；若未来团队转 React 或需要 drei 特性（如 Environment presets、gltfjsx 工作流）可重启评估。本次实测其类型检查链路最完整（tsc 原生过 TS7）。
3. **Babylon 降级为专项备选**：适合重型交互工具（Node Material Editor、检查器）而非展馆主线；无 Vue 官方集成层（社区扩展文档）、 metallic 车漆必须自建 IBL。
4. **TresJS 继续观察**（R 级结论沿用）：活跃但社区规模小、无生产就绪声明。
5. Vue 路线的类型检查门禁：下一步先试 TypeScript 5.9.x + vue-tsc 组合（阶段二验证项）。

## 7. 复现步骤

```bash
pnpm install
pnpm --filter @atl/proto-vue-three build && pnpm --filter @atl/proto-vue-three preview   # :5171
pnpm --filter @atl/proto-react-r3f build && pnpm --filter @atl/proto-react-r3f preview   # :5172
pnpm --filter @atl/proto-vue-babylon build && pnpm --filter @atl/proto-vue-babylon preview # :5173
```

---

变更记录：

| 日期 | 变更 |
| --- | --- |
| 2026-11-05 | 初版：三路线构建+运行验证完成，实测发现 F1–F6 记录 |
