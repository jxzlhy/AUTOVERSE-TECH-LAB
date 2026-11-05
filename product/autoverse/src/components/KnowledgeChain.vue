<script setup lang="ts">
/** LEGENDS 知识链完整体验（PHASE 3 R2）：搜索/枢纽/邻居/二跳/byLayer——DomainGraph 五 API 全接线 */
import { computed, ref } from "vue";
import { AvBadge } from "@atl/design-system";
import { GRAPH, relatedFrom, type KnowledgeNode } from "../knowledge";

const chainRoot = ref<KnowledgeNode>(GRAPH.get("time-machine")!);
const chain = computed(() => relatedFrom(chainRoot.value.id));
const hubs = computed(() => GRAPH.hubs(3));
const searchQ = ref("");
const searchHits = computed(() => (searchQ.value.trim() ? GRAPH.search(searchQ.value) : []));
const layerFilter = ref<"ALL" | "REALITY" | "FICTION" | "FUTURE">("ALL");
const layerEntities = computed(() =>
  layerFilter.value === "ALL" ? [] : GRAPH.byLayer(layerFilter.value),
);
const twoHop = computed(() => {
  const direct = new Set(chain.value.map((c) => c.node.id));
  return GRAPH.traverse(chainRoot.value.id, 2).filter(
    (e) => e.id !== chainRoot.value.id && !direct.has(e.id),
  );
});

function jump(e: KnowledgeNode): void {
  chainRoot.value = e;
  searchQ.value = "";
}
function badgeOf(layer: string): "REAL" | "FICTION" | "CONCEPT" {
  return layer === "FICTION" ? "FICTION" : layer === "FUTURE" ? "CONCEPT" : "REAL";
}
</script>

<template>
  <div class="kc">
    <div class="kc-search">
      <input
        v-model="searchQ"
        class="kc-input"
        type="search"
        placeholder="全局搜索：品牌 / 部件 / 影视…"
        aria-label="知识图谱搜索"
      />
      <div v-if="searchQ && searchHits.length" class="kc-hits">
        <button v-for="e in searchHits" :key="e.id" class="kc-node" @click="jump(e)">
          {{ e.label }}
        </button>
      </div>
      <p v-if="searchQ && !searchHits.length" class="kc-hint">无匹配节点。</p>
    </div>

    <div class="kc-hubs">
      <span class="kc-label">枢纽 HUBS</span>
      <button
        v-for="h in hubs"
        :key="h.entity.id"
        class="kc-chip"
        :class="{ current: h.entity.id === chainRoot.id }"
        :title="`关联数 ${h.degree}`"
        @click="jump(h.entity)"
      >
        {{ h.entity.label }} <em>{{ h.degree }}</em>
      </button>
    </div>

    <div class="kc-root">
      <AvBadge :kind="badgeOf(chainRoot.layer)" />
      <strong>{{ chainRoot.label }}</strong>
      <span class="kc-cert">{{ chainRoot.certainty }} · {{ chainRoot.source }}</span>
    </div>
    <p class="kc-blurb">{{ chainRoot.blurb }}</p>

    <ul class="kc-list">
      <li v-for="link in chain" :key="link.node.id">
        <span class="kc-rel" :class="link.direction">
          {{ link.direction === "out" ? "→" : "←" }} {{ link.rel }}
        </span>
        <button class="kc-node" @click="jump(link.node)">{{ link.node.label }}</button>
        <AvBadge :kind="badgeOf(link.node.layer)" />
      </li>
    </ul>

    <div v-if="twoHop.length" class="kc-twohop">
      <span class="kc-label">二跳可达（{{ twoHop.length }}）</span>
      <button v-for="e in twoHop" :key="e.id" class="kc-node dim" @click="jump(e)">
        {{ e.label }}
      </button>
    </div>

    <div class="kc-layer">
      <span class="kc-label">分类</span>
      <button
        v-for="opt in ['ALL', 'REALITY', 'FICTION', 'FUTURE'] as const"
        :key="opt"
        class="kc-chip"
        :class="{ current: layerFilter === opt }"
        @click="layerFilter = opt"
      >
        {{ opt === "ALL" ? "全部" : opt }}
      </button>
      <span class="kc-cert">{{ layerFilter === "ALL" ? GRAPH.size : layerEntities.length }} 实体</span>
    </div>
    <div v-if="layerFilter !== 'ALL'" class="kc-layergrid">
      <button v-for="e in layerEntities" :key="e.id" class="kc-node" @click="jump(e)">
        {{ e.label }} <AvBadge :kind="badgeOf(e.layer)" />
      </button>
    </div>

    <p class="kc-hint">点击节点跳转探索（总纲 §2.5）。每条断言带来源与可信度。</p>
  </div>
</template>

<style scoped>
.kc { display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
.kc-input {
  width: 100%; padding: 8px 12px; border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2); background: rgba(13, 17, 23, 0.6);
  color: var(--av-text-primary, #f1f5f9); font-size: 12px;
}
.kc-input:focus { outline: none; border-color: var(--av-nexus-500, #22d3ee); }
.kc-hits, .kc-hubs, .kc-twohop, .kc-layer, .kc-layergrid { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.kc-label { font-family: var(--av-font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--av-text-muted, #64748b); margin-right: 2px; }
.kc-chip {
  appearance: none; padding: 4px 11px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.2); background: rgba(148, 163, 184, 0.06);
  color: var(--av-text-primary, #f1f5f9); font-size: 11px;
}
.kc-chip em { font-style: normal; font-family: var(--av-font-mono); font-size: 10px; color: var(--av-nexus-500, #22d3ee); }
.kc-chip:hover, .kc-chip.current { border-color: var(--av-nexus-500, #22d3ee); }
.kc-root { display: flex; align-items: center; gap: 10px; }
.kc-root strong { font-size: 14px; }
.kc-cert { font-family: var(--av-font-mono); font-size: 9px; color: var(--av-text-muted, #64748b); }
.kc-blurb { margin: 0; font-size: 11px; color: var(--av-text-secondary, #94a3b8); line-height: 1.6; }
.kc-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.kc-list li { display: flex; align-items: center; gap: 8px; }
.kc-rel { font-family: var(--av-font-mono); font-size: 10px; color: var(--av-text-muted, #64748b); min-width: 76px; }
.kc-rel.out { color: var(--av-nexus-500, #22d3ee); }
.kc-node {
  appearance: none; padding: 4px 11px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.2); background: rgba(148, 163, 184, 0.06);
  color: var(--av-text-primary, #f1f5f9); font-size: 11px; display: inline-flex; align-items: center; gap: 6px;
}
.kc-node:hover { border-color: var(--av-nexus-500, #22d3ee); }
.kc-node.dim { opacity: 0.75; }
.kc-node.dim:hover { opacity: 1; }
.kc-hint { margin: 0; font-size: 10px; color: var(--av-text-muted, #64748b); }
</style>
