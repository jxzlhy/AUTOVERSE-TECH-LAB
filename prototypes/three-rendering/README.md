# three-rendering — 科技展厅渲染验证（Three.js）

> 状态：**planned**（阶段二执行）｜ 主路线已定为 Vue 3 + 原生 Three.js（见 ../framework-comparison/README.md §6）

## 目标

在主路线上验证"科技展厅"级渲染组合：Bloom、景深、体积光感、地面反射，为 AUTOVERSE 首页展馆的视觉基调提供依据。

## 验收标准（先行定义）

1. 同一车辆场景分别在 关闭后期 / Bloom / Bloom+DOF / Bloom+DOF+辉光地面 四档下运行；
2. 每档记录 FPS、GPU 内存占用（performance.memory 或 WebGL 探针）、真实浏览器截图；
3. 输出后期处理档位-性能对照表，给出"首页默认档 / 高配档 / 移动档"三档建议；
4. 后期链路基于 pmndrs `postprocessing` 6.39.6 与 three 官方 EffectComposer 各实现一版并对比（研究文档 docs/03-technology/visual-techniques.md 的 R 级结论验证）。

## 依赖

- framework-comparison 结论（已完成）：主路线 Vue3+Three.js
- docs/03-technology/visual-techniques.md（Agent D 研究中）

## 风险

- 后期处理与 WebGL2 回退兼容性（Safari 老版本）
- 移动端 GPU 差异大，档位策略需在真机复测
