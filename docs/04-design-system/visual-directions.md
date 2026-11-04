# 三视觉方向研究与 AUTOVERSE VISUAL IDENTITY v0（PART 5.5）

> 状态：**V 级对照验证完成（2026-11-05）**——lighting-and-materials 原型三方向截图见 directions/；IDENTITY v0 已回写 design-system.md §11
> 日期：2026-11-05 ｜ 关联：design-system.md（Tokens 基线）

---

## 1. 三个方向的设计规则

### 1.1 AUTOMOTIVE LUXURY（高级展厅/品牌发布会）

| 维度 | 规则 |
| --- | --- |
| 色彩 | 近黑暖灰底（#0C0E12 系）；主色降饱和；强调色仅金属点缀（香槟金/银） |
| 光 | 高对比单主光 + 大面积柔和补光；**禁止彩色 rim 滥用** |
| 材质 | 清漆车漆/拉丝金属/皮革——对应 material-presets 的 metallic-paint/brushed-metal/leather |
| 字体 | 展示字体大字距大写；正文克制（一行 ≤ 60 字符） |
| 构图 | 车永远居中偏下 1/3；留白 ≥ 40% 画面；UI 元素贴边缘分区 |
| 动效 | 慢（cinematic 1.6s+）、单一焦点运动；镜头推近为主，禁弹跳 |
| UI 密度 | 极低：一屏一个信息重点 |

### 1.2 FUTURISTIC SPATIAL（数字宇宙/全息交互）

| 维度 | 规则 |
| --- | --- |
| 色彩 | 深空底（bg-void #05070D）+ NEXUS 青（#22D3EE）为主光；语义色仅作状态 |
| 光 | 自发光为主光源感：Hologram/EnergyFlow/Grid shader 是"照明"而非贴图 |
| 材质 | 玻璃(transmission)/全息壳(X-Ray)/线框——材质即 UI |
| 构图 | 空间分区制（HUD §2.3）：信息锚定 3D 位置或屏幕角落 |
| 动效 | 充能/呼吸/扫描（Teleport/HoloPanel 模式）；数据类动效用 linear |
| UI 密度 | 中：同屏 ≤3 个全息面板（design-system §3） |

### 1.3 EDITORIAL MUSEUM（高级博物馆/杂志排版/档案叙事）

| 维度 | 规则 |
| --- | --- |
| 色彩 | 纸感浅底或暖灰深底；**黑白灰为主 + 单一档案色**（琥珀 = REAL 语义色借用） |
| 字体 | 衬线/宋体标题可用（区别于其他两线）；正文行高 1.8；档案编号体系（如 ATL-1962-003） |
| 构图 | 网格强纪律（12 栏 + 基线网格）；不对称双栏（大图 + 窄注） |
| 材质 | 哑光、无光效；照片/蓝图/扫描件质感 |
| 动效 | 几乎静止：淡入 + 页面翻动隐喻；禁光效 |
| UI 密度 | 高（档案页允许）：信息分层靠排版不靠透明度 |

## 2. AUTOVERSE VISUAL IDENTITY V1（融合提案）

**配方：LUXURY 的材质纪律 × SPATIAL 的空间光效 × MUSEUM 的排版秩序。**

| 层 | 采纳 | 拒绝 |
| --- | --- | --- |
| 底色与光 | SPATIAL：深空底 + NEXUS 光效（能量空间/传送） | 三线通篇霓虹 |
| 展品呈现 | LUXURY：摄影棚布光、清漆材质、单焦点运动（摄影棚场景） | 彩色 rim 滥用、玻璃拟态堆砌 |
| 知识层 | MUSEUM：档案编号、强网格排版、编年体叙事（CORE UI 知识页） | 浅底与深底混用无规则 |
| 边界规则 | 场景决定语法：**摄影棚=LUXURY、能量空间=SPATIAL、知识页=MUSEUM**；三线共享同一套 Tokens（design-system §2）与 Motion 编舞（§5） | 跨语法混用组件 |

**Token 映射（现有基线即此身份）**：`bg-void/bg-deep` ← SPATIAL；`exhibit-real 琥珀` ← MUSEUM 档案色兼 REAL 语义；`motion-cinematic + easeCamera` ← LUXURY；玻璃面板（§3）属 SPATIAL 专用，CORE UI 页面**禁用 backdrop-blur**（改实底 elevated）。

**验证计划**：lighting-and-materials 原型出三方向对照截图后，将本节"提案"升级为 design-system.md 正式条款（回写循环 §10）。

## 3. 核实记录

| 项 | 依据 |
| --- | --- |
| LUXURY 参照 | 高端品牌发布会/展厅惯例（O 级经验，待设计原型对照验证） |
| SPATIAL 参照 | 本仓库已验证组件（AvHoloPanel/AvSceneSelector，V 级） |
| MUSEUM 参照 | 档案/杂志排版惯例（O 级经验） |


## 4. V 级对照验证（2026-11-05，lighting-and-materials 原型 :5180）

同一程序化车辆在三种方向配置下的实测截图（WebGLRenderer + ACES + IBL + 材质预设库）：

| 方向 | 截图 | 配置要点 |
| --- | --- | --- |
| LUXURY | [directions/luxury.png](directions/luxury.png) | 暖黑底 #0C0E12 / 金属漆 / 暖主光 / 无 rim |
| SPATIAL | [directions/spatial.png](directions/spatial.png) | bg-void / 清漆珍珠 / NEXUS 青 rim 2.2 / 冷调地面 |
| MUSEUM | [directions/museum.png](directions/museum.png) | 暖灰底 #151312 / 哑光钢象牙白 / 高补光 / 无 rim |

**结论**：三方向在同一车模上呈现**可辨识的视觉差异**（材质/光/底色三轴独立生效），IDENTITY v0 的"场景决定语法"融合方案成立 → 已回写 design-system.md §11 升为正式基线。
