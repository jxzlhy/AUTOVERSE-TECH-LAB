# gsap-motion — 电影级转场与镜头控制

> 状态：**planned**（阶段二执行）

## 目标

验证 AUTOVERSE 的"电影级场景转场"：GSAP 时间线驱动镜头 + 场景切换 + UI 编舞，对应设计系统 Motion Guidelines 的 `motion-cinematic` 档。

## 验收标准（先行定义）

1. 搭建两个场景（摄影棚 ↔ 能量空间简化版），GSAP 时间线完成 A→B 的镜头推进+淡出+场景切换+淡入全流程；
2. camera-controls 3.1.2 与 GSAP ticker 的集成验证（平滑阻尼 + 可打断性测试）；
3. 转场期间输入锁定/解锁机制验证（设计系统 §5 编舞规则 3）；
4. `prefers-reduced-motion` 降级路径实现（静态构图 + 直接跳转）；
5. 输出《转场规格卡》：时长、缓动曲线、镜头路径参数，回写设计系统文档。

## 已有研究结论（R 级，待本原型验证）

- GSAP 3.15.1：Webflow 收购后全插件免费可商用（唯一限制：不得捆绑进竞品 no-code 工具）；
- 镜头层建议：GSAP 时间线 + camera-controls（Promise 化 API）；
- 转场主流：单 renderer + render target 着色器混合；多 Canvas 方案不推荐。
