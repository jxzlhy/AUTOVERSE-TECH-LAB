# performance-benchmark — 性能基准实验

> 状态：**planned**（阶段三执行；依赖真实浏览器测试环境，见 framework-comparison F4）

## 目标

建立 AUTOVERSE 的性能预算基线：模型数量、粒子数量、后期处理档位、内存与 FPS 的量化关系。

## 验收标准（先行定义）

1. **测试环境固定并记录**：真实 Chrome（非常显渲染环境会节流 rAF，IAB 环境读数无效——F4 实测结论）+ 固定设备 + 固定分辨率；
2. 实例化车辆铺量：100 / 500 / 1000 / 5000 辆（InstancedMesh），记录 FPS/内存/draw calls 曲线；
3. Draco 与 KTX2 压缩对比：同一车模原始 vs Draco vs Draco+KTX2 的体积、加载耗时、首帧时间（gltf-transform 4.5.1 CLI）；
4. 后期处理开销：Bloom/SSAO/DOF 单开与叠加的帧成本表；
5. 输出《AUTOVERSE 性能预算 v1》：首页展馆的目标档位（桌面/移动分列）。

## 产出位置

- 数据表与本 README 附录；长文结论进 docs/07-performance/
