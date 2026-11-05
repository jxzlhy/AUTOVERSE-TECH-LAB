<script setup lang="ts">
import { computed, ref } from "vue";
import { AvBadge, AvButton, AvCard, AvTabs } from "@atl/design-system";
import { GRAPH, NODES, relatedFrom, type KnowledgeNode } from "./knowledge";

/** PART 9.3 — DeLorean 专题骨架。
 * 红线（PART 8.4/9.3）：无真实模型不得伪装；真实 DMC-12 与影视改装显式区分（数据层 FICTION/REAL）。
 * IP 提示引自 docs/06-assets-and-data/asset-sources.md §3：DMC 商标 ≠ Universal 影视权，商用前需法务。
 */
type Layer = "real" | "fiction";

const layer = ref<Layer>("real");
const chainRoot = ref<KnowledgeNode>(NODES.find((n) => n.id === "time-machine")!);
const chain = computed(() => relatedFrom(chainRoot.value.id));
// 枢纽节点：度数排序前 3（DomainGraph.hubs）——"从一辆车到整个文明网络"的入口锚点
const hubs = computed(() => GRAPH.hubs(3));
// 全局搜索（DomainGraph.search）：跨节点检索，结果点击跳转
const searchQ = ref("");
const searchHits = computed(() => (searchQ.value.trim() ? GRAPH.search(searchQ.value) : []));
// byLayer 三分过滤：REALITY/FICTION/FUTURE 数据层分类视图（总纲 §3 展品分类落点）
const layerFilter = ref<"ALL" | "REALITY" | "FICTION" | "FUTURE">("ALL");
const layerEntities = computed(() =>
  layerFilter.value === "ALL" ? [] : GRAPH.byLayer(layerFilter.value),
);
// 二跳可达：traverse(2) 去掉链根与直接邻居后的"远端网络"（PART 2.5 文明网络承诺）
const twoHop = computed(() => {
  const direct = new Set(chain.value.map((c) => c.node.id));
  return GRAPH.traverse(chainRoot.value.id, 2).filter(
    (e) => e.id !== chainRoot.value.id && !direct.has(e.id),
  );
});

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

    <AvCard title="知识分类视图（byLayer 三分）" tag="KNOWLEDGE">
      <div class="layer-row">
        <button
          v-for="opt in ['ALL', 'REALITY', 'FICTION', 'FUTURE'] as const"
          :key="opt"
          class="chip"
          :class="{ active: layerFilter === opt }"
          @click="layerFilter = opt"
        >
          {{ opt === 'ALL' ? '全部' : opt }}
        </button>
        <span class="layer-count">{{ layerFilter === 'ALL' ? GRAPH.size : layerEntities.length }} 实体</span>
      </div>
      <div v-if="layerFilter !== 'ALL'" class="layer-grid">
        <button v-for="e in layerEntities" :key="e.id" class="chain-node" @click="chainRoot = e">
          {{ e.label }}
          <AvBadge :kind="e.layer === 'FICTION' ? 'FICTION' : e.layer === 'FUTURE' ? 'CONCEPT' : 'REAL'" />
        </button>
      </div>
    </AvCard>

    <AvCard title="知识关系链（探索入口示例）" tag="KNOWLEDGE">
      <div class="search-row">
        <input
          v-model="searchQ"
          class="search-box"
          type="search"
          placeholder="全局搜索：品牌 / 部件 / 影视…"
          aria-label="知识图谱搜索"
        />
        <div v-if="searchQ && searchHits.length" class="search-hits">
          <button v-for="e in searchHits" :key="e.id" class="chain-node" @click="chainRoot = e; searchQ = ''">
            {{ e.label }}
          </button>
        </div>
        <p v-if="searchQ && !searchHits.length" class="chain-hint">无匹配节点。</p>
      </div>
      <div class="hub-row">
        <span class="hub-label">枢纽 HUBS</span>
        <button
          v-for="h in hubs"
          :key="h.entity.id"
          class="hub-chip"
          :class="{ current: h.entity.id === chainRoot.id }"
          :title="`关联数 ${h.degree}`"
          @click="chainRoot = h.entity"
        >
          {{ h.entity.label }} <em>{{ h.degree }}</em>
        </button>
      </div>
      <div class="chain-root">
        <AvBadge :kind="chainRoot.layer === 'FICTION' ? 'FICTION' : 'REAL'" />
        <strong>{{ chainRoot.label }}</strong>
        <span class="chain-cert">{{ chainRoot.certainty }} · {{ chainRoot.source }}</span>
      </div>
      <p class="chain-blurb">{{ chainRoot.blurb }}</p>
      <ul class="chain-list">
        <li v-for="link in chain" :key="link.node.id">
          <span class="chain-rel" :class="link.direction">{{ link.direction === "out" ? "→" : "←" }} {{ link.rel }}</span>
          <button class="chain-node" @click="chainRoot = link.node">{{ link.node.label }}</button>
          <AvBadge :kind="link.node.layer === 'FICTION' ? 'FICTION' : link.node.layer === 'FUTURE' ? 'CONCEPT' : 'REAL'" />
        </li>
      </ul>
      <div v-if="twoHop.length" class="twohop">
        <span class="twohop-label">二跳可达（{{ twoHop.length }}）</span>
        <button
          v-for="e in twoHop"
          :key="e.id"
          class="chain-node twohop-node"
          @click="chainRoot = e"
        >
          {{ e.label }}
        </button>
      </div>
      <p class="chain-hint">点击节点跳转探索（总纲 §2.5：从一辆车到整个汽车文明网络）。每条断言带来源与可信度。</p>
    </AvCard>

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
.layer-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.layer-count { font-family: var(--av-font-mono); font-size: 10px; color: var(--av-text-muted, #64748b); }
.layer-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.layer-grid .chain-node { display: inline-flex; align-items: center; gap: 6px; }
.search-row { margin-bottom: 12px; }
.search-box {
  width: 100%; padding: 8px 12px; border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2); background: rgba(13, 17, 23, 0.6);
  color: var(--av-text-primary, #f1f5f9); font-size: 12px;
}
.search-box:focus { outline: none; border-color: var(--av-nexus-500, #22d3ee); }
.search-hits { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.hub-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.hub-label { font-family: var(--av-font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--av-text-muted, #64748b); }
.hub-chip {
  appearance: none; padding: 5px 12px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.2); background: rgba(148, 163, 184, 0.06);
  color: var(--av-text-primary, #f1f5f9); font-size: 12px;
  transition: border-color var(--av-motion-fast, 160ms) var(--av-ease-ui, cubic-bezier(0.22,1,0.36,1));
}
.hub-chip em { font-style: normal; font-family: var(--av-font-mono); font-size: 10px; color: var(--av-nexus-500, #22d3ee); }
.hub-chip:hover, .hub-chip.current { border-color: var(--av-nexus-500, #22d3ee); }
.chain-root { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.chain-root strong { font-size: 15px; }
.chain-cert { font-family: var(--av-font-mono); font-size: 10px; color: var(--av-text-muted, #64748b); }
.chain-blurb { margin: 0 0 12px; font-size: 12px; color: var(--av-text-secondary, #94a3b8); }
.chain-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.chain-list li { display: flex; align-items: center; gap: 10px; }
.chain-rel { font-family: var(--av-font-mono); font-size: 10px; color: var(--av-text-muted, #64748b); min-width: 84px; }
.chain-rel.out { color: var(--av-nexus-500, #22d3ee); }
.chain-node {
  appearance: none; border: 1px solid rgba(148, 163, 184, 0.2); background: rgba(148, 163, 184, 0.06);
  color: var(--av-text-primary, #f1f5f9); padding: 5px 12px; border-radius: 999px;
  font-size: 12px; cursor: pointer;
}
.chain-node:hover { border-color: var(--av-nexus-500, #22d3ee); }
.twohop { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.twohop-label { font-family: var(--av-font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--av-text-muted, #64748b); margin-right: 4px; }
.twohop-node { opacity: 0.75; }
.twohop-node:hover { opacity: 1; }
.chain-hint { margin: 12px 0 0; font-size: 11px; color: var(--av-text-muted, #64748b); }
</style>
