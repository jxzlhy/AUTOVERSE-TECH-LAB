# lighting-and-materials — 汽车摄影棚：PBR / HDRI / 车漆调参

> 状态：**planned**（阶段二执行，优先级最高——直接服务展品质感）

## 目标

建立 AUTOVERSE 的"车漆材质基线"：在受控摄影棚环境里把 clearcoat 车漆、镀铬件、玻璃、橡胶调到展品级，并验证 HDRI 选择对车漆的影响。

## 验收标准（先行定义）

1. 用真实 GLB 车模（来源与许可见 docs/06-assets-and-data/asset-sources.md：Khronos CC0 或本地实验用 three.js ferrari.glb，后者不入库）替换程序化车辆；
2. 三套 HDRI（Poly Haven CC0：影棚型/室外型/夜景型）× 同一车漆参数，输出对比图与参数表；
3. clearcoat / clearcoatRoughness / metalness / roughness 调参矩阵（至少 8 组），记录每组在三种 HDRI 下的表现；
4. 玻璃座舱 transmission vs opacity 方案对比（性能与观感）；
5. 产出《车漆材质基线卡》：正式产品直接引用的参数与 HDRI 配置。

## 依赖

- assets 采购：Poly Haven HDRI 下载（无需账号，CC0）
- docs/03-technology/visual-techniques.md 结论
