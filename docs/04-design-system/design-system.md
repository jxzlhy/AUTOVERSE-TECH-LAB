# AUTOVERSE 设计系统规范 v1.0

> 文档状态：正式规范 v1.0（基线提案，随设计原型验证迭代）
> 建立日期：2026-11-04
> 效力等级：**项目自身设计规范 > 任何外部 UI Skill / 组件库审美**
> 字体与具体色值将在 lighting-and-materials / 设计原型阶段做视觉验证后定稿

---

## 0. 设计哲学

AUTOVERSE 的视觉语言关键词：**汽车文明 × 数字宇宙 × 展馆感**。

1. **车是主角**：界面永远为车让路。UI 是展馆的灯光与铭牌，不是展厅本身。
2. **光即材质**：以光照与材质表达科技感（玻璃、金属、自发光），而非装饰性渐变堆砌。
3. **信息分层**：漫游时极简；交互时出现；求知时完整。三层体验对应三种信息密度。
4. **克制的高科技**：拒绝廉价赛博朋克。参考真实高端汽车 HMI 与博物馆导视系统的秩序感。

## 1. 三条 UI 产品线

| 线 | 名称 | 载体 | 特征 |
| --- | --- | --- | --- |
| 1 | **AUTOVERSE CORE UI** | 2D 网页层：首页入口、展品详情页、搜索、知识图谱、探索历史 | 清晰、可读性优先、常规 DOM |
| 2 | **AUTOVERSE SPATIAL UI** | 3D 场景内：HUD、玻璃面板、空间标注、转场界面 | 深度感、可融合 3D 光照、低信息密度 |
| 3 | **AUTOVERSE ENGINEERING UI** | 实验室内部工具：原型调试面板、性能监控、资产管理后台 | 信息密度高、等宽字体、效率优先 |

三条线共享 Design Tokens，但布局模式、组件密度、动效幅度各自独立，**不得混用组件**。

## 2. Design Tokens

令牌单一事实来源：`design-tokens.ts`（TS 常量）→ 生成 CSS Custom Properties。命名采用三层结构：`<category>-<concept>-<variant>`。

### 2.1 色彩 Color

**中性色（宇宙底色）**

| Token | 值 | 用途 |
| --- | --- | --- |
| `color-bg-void` | `#05070D` | 最深层背景（宇宙空间） |
| `color-bg-deep` | `#0A0F1A` | 页面/场景基础背景 |
| `color-bg-elevated` | `#111827` | 卡片、面板基底 |
| `color-border-faint` | `rgba(148, 163, 184, 0.12)` | 弱分隔线 |
| `color-border-strong` | `rgba(148, 163, 184, 0.28)` | 强分隔/描边 |
| `color-text-primary` | `#F1F5F9` | 主文本 |
| `color-text-secondary` | `#94A3B8` | 次级文本 |
| `color-text-muted` | `#64748B` | 弱化文本、铭牌辅助信息 |

**品牌主色（THE NEXUS 能量色）**

| Token | 值 | 用途 |
| --- | --- | --- |
| `color-nexus-500` | `#22D3EE` | 主强调：链接、焦点、激活态 |
| `color-nexus-300` | `#67E8F9` | 悬停态、高亮 |
| `color-nexus-700` | `#0E7490` | 按下态、深色填充 |

**展品类型语义色（对应三类展品的显式区分）**

| Token | 值 | 语义 |
| --- | --- | --- |
| `color-exhibit-real` | `#F59E0B` | 现实汽车 REAL（琥珀/实感） |
| `color-exhibit-fiction` | `#A78BFA` | 影视虚构 FICTION（幻彩） |
| `color-exhibit-concept` | `#34D399` | 未来概念 CONCEPT（前瞻） |

**功能色**：`color-success #10B981` ｜ `color-warning #FBBF24` ｜ `color-danger #F87171` ｜ `color-info #38BDF8`

**对比度要求**：正文文本对背景 ≥ 4.5:1；大标题 ≥ 3:1；语义色用作文本时需验证对比度，不达标则提高明度或加衬底（见 §9）。

### 2.2 字体 Typography

| Token | 候选字体 | 许可 | 用途 |
| --- | --- | --- | --- |
| `font-display` | Space Grotesk | OFL（SIL Open Font License） | 拉丁展示标题（空间命名、大数字） |
| `font-body` | Noto Sans SC（思源黑体） | OFL | 中文正文与 UI 文本 |
| `font-mono` | JetBrains Mono | OFL | 数据、代码、性能指标 |

> ⚠️ 字体为提案状态：商用前必须核对 OFL 许可副本随库分发要求；最终美学定稿需在设计原型中验证。

**字号阶梯（含行高）**

| Token | 值 | 用途 |
| --- | --- | --- |
| `text-display-xl` | 56px / 1.1 / -0.02em | 空间命名、首页大标题 |
| `text-display-l` | 40px / 1.15 / -0.01em | 页面标题 |
| `text-title` | 24px / 1.3 | 卡片标题、区块题 |
| `text-body` | 16px / 1.6 | 正文 |
| `text-label` | 13px / 1.4 / +0.06em | 导航、铭牌、按钮（常配大写/加字距） |
| `text-data` | 12px / 1.4（mono） | 数据读数 |

### 2.3 间距与布局 Spacing & Layout

- 间距基数：4px 网格。Token：`space-1..16` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128…
- 圆角：`radius-s 4px`（输入框）/ `radius-m 8px`（按钮、卡片）/ `radius-l 16px`（大面板）/ `radius-full`（胶囊）。
- 栅格：CORE UI 桌面 12 栏（最大宽 1440px，边距 64px），移动 4 栏；SPATIAL UI 不用 DOM 栅格，用**场景空间锚定**（跟随 3D 位置或屏幕角落分区）。
- 屏幕分区（SPATIAL UI 惯例）：左下＝导航；右下＝当前展品信息；顶部中央＝空间名；右上＝全局工具（搜索/设置）。此分区是基线提案，随 3D 原型验证调整。

### 2.4 高度与投影 Elevation

数字宇宙中"高度"用**光与透明度**表达，而非传统投影：

- `elev-1`：`background rgba(17,24,39,.72) + backdrop-blur 12px + 1px border faint`
- `elev-2`：同上 + 外发光 `0 0 24px rgba(34,211,238,.10)`
- `elev-3`（模态/HUD 主面板）：`elev-2` + 更高不透明度 `.88` + 边缘 1px 高光 `inset 0 1px 0 rgba(255,255,255,.08)`
- 3D 场景内面板：优先用材质表达（transmission 玻璃、自发光描边），DOM 叠加仅作降级。

## 3. Glass / Spatial UI 规范

玻璃面板（SPATIAL UI 的基础容器）：

| 属性 | 基线值 | 说明 |
| --- | --- | --- |
| 背景 | `rgba(10, 15, 26, 0.55)` | 深色半透 |
| 模糊 | `backdrop-filter: blur(16px) saturate(1.2)` | 3D 场景上叠加时必须开 |
| 描边 | `1px solid rgba(148,163,184,0.18)` | 外沿 |
| 顶部高光 | `inset 0 1px 0 rgba(255,255,255,0.08)` | 玻璃厚度感 |
| 圆角 | `radius-l` | 统一 |
| 最大信息密度 | 同屏 3 个内容区 | 超出需收起为摘要 |

**3D 材质版玻璃**（用于场景内面板）：`MeshPhysicalMaterial { transmission: 0.9, roughness: 0.15, ior: 1.4, thickness: 0.5 }` 为起点，在 lighting-and-materials 原型中调参验证；性能代价高时降级为 opacity 混合。

## 4. HUD Interface 规范

- HUD 元素必须**锚定语义**：跟随展品（世界空间投影）或锚定屏幕分区（§2.3），禁止自由漂浮；
- 数据读数用 `font-mono`；标签用 `text-label` 大写 + `+0.06em` 字距；
- HUD 激活/悬停反馈用 `color-nexus-500` 描边呼吸动效（§5）；
- 准星/焦点指示：中心点 4px，聚焦展品时展开为四角括号并显示铭牌；
- 载入中：空间名常驻 + 细进度线（不用大遮罩，保持空间可见）。

## 5. Motion Guidelines

**时间基准**

| Token | 值 | 用途 |
| --- | --- | --- |
| `motion-instant` | 80ms | 按钮按压、开关 |
| `motion-fast` | 160ms | 悬停、浮层进出 |
| `motion-normal` | 280ms | 面板展开、卡片过渡 |
| `motion-slow` | 480ms | 页面级转场 |
| `motion-cinematic` | 1.2–2.4s | 3D 镜头运动、场景转场 |

**缓动**

- UI 进出：`cubic-bezier(0.22, 1, 0.36, 1)`（easeOutQuint 系）
- 3D 镜头：`power2.inOut`（GSAP）起步，电影级转场在 gsap-motion 原型中调参；
- 禁止 `linear` 用于 UI（数据循环动画除外）。

**编舞规则（Choreography）**

1. 进场顺序：空间环境 → 展品 → HUD（错峰 80ms）；
2. 同一时刻至多一个 `motion-cinematic` 级动画；
3. 转场期间禁用交互输入（镜头动画不可被拖拽打断，除非设计为可打断）；
4. 所有动效必须尊重 `prefers-reduced-motion`（§9）。

## 6. 响应式规则

| 断点 | 宽度 | 策略 |
| --- | --- | --- |
| `bp-mobile` | < 768px | 3D 场景降级：阴影/后期关闭或降档；HUD 合并为单一面板；触控目标 ≥ 44px |
| `bp-tablet` | 768–1279px | 完整体验，HUD 简化 |
| `bp-desktop` | ≥ 1280px | 完整体验 |

- 3D 画布 DPR 上限：`min(devicePixelRatio, 2)`；
- 移动端性能预算见 [docs/07-performance/performance-research.md](../07-performance/performance-research.md) §2（预算框架 v0）。

## 7. 组件指南（基线清单）

CORE UI：`Button / Input / Select / Tabs / Card / Dialog / Tooltip / Breadcrumb / SearchBar / ExhibitCard / TimelineStrip / GraphCanvas`
SPATIAL UI：`GlassPanel / HUDLabel / FocusReticle / ExhibitPlaque / ProgressBar（场景载入）/ SceneTransition / WorldMap`
ENGINEERING UI：`StatsPanel / LogConsole / AssetInspector / PerfChart`

组件实现约定：

1. Headless Primitives（逻辑与无障碍）+ Bespoke Styling（Tokens）分离；
2. 每个组件必须记录：用途、Tokens 依赖、无障碍要求、DO/DON'T；
3. 组件在验证通过前标注状态：`proposal → prototyped → approved`。

## 8. 文案与本地化

- 空间与功能名用全大写英文 + 中文注释（如 THE NEXUS ｜ 枢纽）；
- 中文文案禁用纯机翻腔；技术术语保留英文原文；
- 展品铭牌必含：名称、类型徽标（REAL/FICTION/CONCEPT）、年代、一句话简介。

## 9. 无障碍 Accessibility

1. 对比度：正文 ≥ 4.5:1（见 §2.1）；
2. 键盘可达：所有 CORE UI 功能可纯键盘完成；3D 场景提供焦点代理（Tab 循环展品热点）；
3. `prefers-reduced-motion: reduce` → 关闭镜头长动画与粒子背景，提供静态构图 + 直接跳转；
4. `prefers-contrast: more` → HUD 切高对比模式（描边加粗、背景不透明度提升）；
5. 语义色不得作为唯一区分手段：REAL/FICTION/CONCEPT 必须同时有文字徽标；
6. 3D 场景必须提供文字替代路径（展品列表 + 详情页），保证"不进 3D 也能用完知识层"。

## 10. Token 治理

- Tokens 变更 = 设计系统变更，需在本文档变更记录中留痕；
- 代码中的 Tokens 实现文件（`design-tokens.ts`）由规范文档驱动，两者不一致时以本文档为准并修复代码；
- 每个原型不得私改色值/字体/动效时间，需新值先提规范修订。

---

变更记录：

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-11-04 | v1.0 | 初版：哲学、三线、Tokens、Glass/HUD/Motion/响应式/组件/无障碍基线 |

---

## 11. 视觉方向基线（V 级验证 2026-11-05）

三方向（AUTOMOTIVE LUXURY / FUTURISTIC SPATIAL / EDITORIAL MUSEUM）设计规则与 AUTOVERSE VISUAL IDENTITY v0 融合配方见 **[visual-directions.md](visual-directions.md)**（V 级对照截图同目录 directions/）。

**生效基线（场景决定语法）**：摄影棚=LUXURY ｜ 能量空间=SPATIAL ｜ 知识页=MUSEUM；三线共享本文件 §2 Tokens 与 §5 编舞；**CORE UI 禁用 backdrop-blur**（玻璃面板为 SPATIAL 专用）。

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-11-05 | §11 新增 | 三方向 V 级验证回写（lighting-and-materials 原型） |
