# 性能研究：阶段一发现与预算框架 v0

> 核实日期：2026-11-05 ｜ 状态：R+V 混合（量化预算待 performance-benchmark 原型）

## 1. 阶段一实测发现（V 级）

| # | 发现 | 数据 | 出处 |
| --- | --- | --- | --- |
| P1 | three 系单场景 draw calls 基线 21（含阴影 pass）；Babylon 11 | 1280×720，程序化车（10 mesh）+地面 | framework-comparison F5 |
| P2 | 渲染指标有效性依赖环境合成策略：IAB 宿主 rAF 节流至 0 帧/2s（visible 状态下），FPS 读数失真；Babylon engine.getFps 在合成窗口采到 30 | 页面探针实测 | framework-comparison F4 |
| P3 | 构建产物基线：three 线 634KB（gzip 166KB）；Babylon ~1.4MB | Vite 8 构建 | framework-comparison §2 |
| P4 | 构建速度：三应用全部 <1s（Rolldown 内核） | — | 同上 |

**方法论结论（重要）**：性能测试必须在真实常显浏览器（或 CDP headless）中进行；FPS 结论必须附环境说明。此规则已写入 AI_WORKFLOW §2.2。

## 2. AUTOVERSE 性能预算框架（v0，待量化）

| 指标 | 桌面目标（拟） | 移动目标（拟） | 量化方式 |
| --- | --- | --- | --- |
| FPS | ≥ 60（转场/交互） | ≥ 30 | performance-benchmark 实测 |
| 首页场景 draw calls | ≤ 300 | ≤ 150 | 同上 |
| 首屏资源（3D 资产） | ≤ 8MB | ≤ 4MB（KTX2+Draco） | 压缩对比实验 |
| 可交互时间（3D 就绪） | ≤ 3s（缓存热） | ≤ 6s | 同上 |
| 常驻内存 | ≤ 500MB | ≤ 300MB | performance.memory / 探针 |

> 阈值为占位提案，阶段三 benchmark 实测后回填定稿。

## 3. 监控方案雏形

- 内核 PerfMonitor：FPS（EMA）/ draw calls / triangles / 加载耗时，开发期常显 HUD（三原型已内置）；
- 生产期：PerformanceObserver + 采样上报方案，待正式产品架构确定后设计。

---

变更记录：2026-11-05 初版
