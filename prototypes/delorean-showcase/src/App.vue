<script setup lang="ts">
import { ref } from "vue";
import { AvBadge, AvButton, AvCard, AvTabs } from "@atl/design-system";

/** PART 9.3 — DeLorean 专题骨架。
 * 红线（PART 8.4/9.3）：无真实模型不得伪装；真实 DMC-12 与影视改装显式区分（数据层 FICTION/REAL）。
 * IP 提示引自 docs/06-assets-and-data/asset-sources.md §3：DMC 商标 ≠ Universal 影视权，商用前需法务。
 */
type Layer = "real" | "fiction";

const layer = ref<Layer>("real");

interface Exhibit {
  id: string;
  title: string;
  layer: Layer;
  badges: ("REAL" | "FICTION" | "CONCEPT")[];
  status: string;
  points: string[];
  assetGrade: string;
}

const exhibits: Exhibit[] = [
  {
    id: "dmc12-real",
    title: "DeLorean DMC-12（真实车型）",
    layer: "real",
    badges: ["REAL"],
    status: "资料研究完成 · 3D 资产待寻源",
    points: [
      "1981–1982 年产，不锈钢车身（无涂装裸钢）",
      "鸥翼门 / 后置 PRV V6 发动机 / 后窗百叶",
      "数据来源要求：官方资料 + 可核验媒体档案（asset-sources §9.1/9.4）",
    ],
    assetGrade: "目标质量 A（整车 + 独立部件：鸥翼门/车轮/内饰）",
  },
  {
    id: "bttf-machine",
    title: "《回到未来》时空车（影视改装）",
    layer: "fiction",
    badges: ["FICTION"],
    status: "影视资料研究完成 · 3D 资产待寻源 · 法务意见待办",
    points: [
      "基于 DMC-12 的电影道具改装（DeLorean Time Machine）",
      "影视虚构装置不得描述为现实车型原厂配置（总纲 §3）",
      "权利结构：DMC 商标 ≠ Universal/Amblin 影视权（2024 诉讼和解先例）",
    ],
    assetGrade: "目标质量 A（改装件独立部件：反应堆/时光电路/轮辐）",
  },
];
</script>

<template>
  <main class="page">
    <header class="head">
      <span class="kicker">LEGENDS UNIVERSE ｜ PART 9.3 骨架</span>
      <h1>BACK TO THE FUTURE — DeLorean Time Machine</h1>
      <p class="ip-note" role="note">
        ⚠ IP 边界：本页区分 <b>真实 DMC-12</b> 与 <b>影视虚构改装</b> 两条内容线；DeLorean 品牌商标属 DMC
        权利方，《回到未来》影视形象属 Universal/Amblin 权利方——商用前需法务意见（asset-sources.md §3）。
      </p>
    </header>

    <AvTabs
      :tabs="[
        { id: 'real', label: '真实 DMC-12' },
        { id: 'fiction', label: '影视改装 · 时空车' },
      ]"
      @change="(id: string) => (layer = id as Layer)"
    >
      <template #real>
        <AvCard v-for="ex in exhibits.filter((e) => e.layer === 'real')" :key="ex.id" :title="ex.title" tag="REAL">
          <div class="badges"><AvBadge v-for="b in ex.badges" :key="b" :kind="b" /></div>
          <ul class="points">
            <li v-for="pt in ex.points" :key="pt">{{ pt }}</li>
          </ul>
          <p class="meta"><b>资产状态：</b>{{ ex.status }}<br /><b>目标质量：</b>{{ ex.assetGrade }}</p>
        </AvCard>
      </template>
      <template #fiction>
        <AvCard
          v-for="ex in exhibits.filter((e) => e.layer === 'fiction')"
          :key="ex.id"
          :title="ex.title"
          tag="FICTION"
        >
          <div class="badges"><AvBadge v-for="b in ex.badges" :key="b" :kind="b" /></div>
          <ul class="points">
            <li v-for="pt in ex.points" :key="pt">{{ pt }}</li>
          </ul>
          <p class="meta"><b>资产状态：</b>{{ ex.status }}<br /><b>目标质量：</b>{{ ex.assetGrade }}</p>
        </AvCard>
      </template>
    </AvTabs>

    <AvCard title="技术接入点（本骨架 → 完整体）" tag="PLAN">
      <ul class="points">
        <li>3D 视口：复用 packages/three-runtime（SceneManager + LightingManager MUSEUM 预设）</li>
        <li>零件交互：AvPartsTree + XRay/Section 控制器（automotive-studio 已验证的同链路）</li>
        <li>资产寻源：S/A 级拆解模型（CC0/商业 EULA），寻得前本页不出示任何 3D 模型——不伪装（PART 8.4）</li>
        <li>知识层：DeLorean Time Machine → DMC-12 → 鸥翼门 → 不锈钢车身 关系链（domain-engine 规划）</li>
      </ul>
      <div class="badges"><AvButton disabled>3D 视口（待资产）</AvButton><AvButton disabled>零件拆解（待资产）</AvButton></div>
    </AvCard>
  </main>
</template>

<style scoped>
.page { max-width: 960px; margin: 0 auto; padding: 48px 28px 64px; display: flex; flex-direction: column; gap: 20px; }
.head h1 { margin: 6px 0 8px; font-size: 26px; font-weight: 600; }
.kicker { font-size: 11px; letter-spacing: 0.18em; color: var(--av-text-secondary, #94a3b8); }
.ip-note {
  margin: 0; padding: 12px 16px; border-radius: 12px; font-size: 12px; line-height: 1.7;
  border: 1px solid rgba(251, 191, 36, 0.35); background: rgba(251, 191, 36, 0.08);
  color: var(--av-text-secondary, #94a3b8);
}
.badges { display: flex; gap: 8px; margin-bottom: 10px; }
.points { margin: 0; padding-left: 18px; }
.points li { margin: 4px 0; }
.meta { font-size: 12px; color: var(--av-text-muted, #64748b); }
</style>
