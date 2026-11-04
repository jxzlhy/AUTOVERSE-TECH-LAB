# mechanical-lab — 机械实验室：GLB 加载 / 独立 Mesh / 零件拆解

> 状态：**planned**（阶段三执行——对应产品 L2 INTERACTION 层的核心交互验证）

## 目标

验证 AUTOVERSE"机械实验室"体验的技术可行性：真实 GLB 车模加载、部件级交互（选择/高亮/拆解/复位），为展品的"可把玩"能力定型。

## 验收标准（先行定义）

1. 加载含命名部件结构的 GLB（Khronos CC0 测试模型起步，来源与许可见 docs/06-assets-and-data/asset-sources.md）；
2. 部件拾取：raycast 命中 → 高亮描边（OutPass 或自研）→ HUD 铭牌联动（桥接层事件验证）；
3. 爆炸拆解：至少 6 个部件的位移拆解动画（GSAP 驱动，支持逐段与整体复位）；
4. 性能：拆解全程 FPS 与 draw calls 记录（真实浏览器，遵循 framework-comparison F4 结论）；
5. 输出《部件交互规范》：GLB 命名约定、部件元数据 schema、拆解动画参数，回写 docs/02-architecture/。

## 依赖

- gsap-motion 原型结论（动画参数）
- framework-comparison 结论（主路线 Vue3+three 内核）
- 资产许可清单（CC0 模型）
