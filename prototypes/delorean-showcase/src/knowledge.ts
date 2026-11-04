/**
 * DeLorean 知识关系链（PART 2.5 全局探索系统 → PART 9.3 专题页数据层）
 * 链示例（总纲 §2.5）：Time Machine → DMC-12 → 鸥翼门 → 不锈钢车身 → 影视汽车文化
 * 数据可信度与来源标注为必填（PART 9.6 可信度分级）——UI 不展示无来源断言。
 */
export type Certainty =
  "OFFICIAL" | "VERIFIED" | "RESEARCHED" | "SIMULATED" | "RECONSTRUCTED" | "UNVERIFIED";
export type ContentClass = "REALITY" | "FICTION" | "FUTURE";

export type KnowledgeNode = Entity;
export type KnowledgeEdge = Relation;

export const NODES: KnowledgeNode[] = [
  {
    id: "time-machine",
    label: "DeLorean Time Machine",
    kind: "vehicle",
    layer: "FICTION",
    certainty: "VERIFIED",
    source: "Universal/Amblin 影视设定（公开资料）",
    blurb: "《回到未来》三部曲的核心载具：由 DMC-12 改装，虚构时光电路驱动。",
  },
  {
    id: "dmc12",
    label: "DeLorean DMC-12",
    kind: "vehicle",
    layer: "REALITY",
    certainty: "VERIFIED",
    source: "DMC 官方档案/公开史料",
    blurb: "1981–1982 年产真实车型：不锈钢车身、鸥翼门、后置 PRV V6。",
  },
  {
    id: "delorean-brand",
    label: "DeLorean Motor Company",
    kind: "brand",
    layer: "REALITY",
    certainty: "OFFICIAL",
    source: "DMC 官方",
    blurb: "品牌与商标持有方（商标权 ≠ 影视权，见 asset-sources §3）。",
  },
  {
    id: "gullwing",
    label: "鸥翼门",
    kind: "component",
    layer: "REALITY",
    certainty: "VERIFIED",
    source: "车型公开技术资料",
    blurb: "上翻式车门铰链设计：DMC-12 最具辨识度的部件，拆解交互目标件。",
  },
  {
    id: "stainless",
    label: "不锈钢车身",
    kind: "material",
    layer: "REALITY",
    certainty: "VERIFIED",
    source: "车型公开技术资料",
    blurb: "无涂装裸钢车身：材质呈现难点（金属度/粗糙度/无清漆反射）。",
  },
  {
    id: "bttf",
    label: "《回到未来》",
    kind: "film",
    layer: "FICTION",
    certainty: "VERIFIED",
    source: "公开影视资料",
    blurb: "1985 年电影：时空车影视形象的权利方为 Universal/Amblin。",
  },
  {
    id: "film-culture",
    label: "影视汽车文化",
    kind: "culture",
    layer: "FICTION",
    certainty: "RESEARCHED",
    source: "LEGENDS UNIVERSE 世界观研究",
    blurb: "影视载具作为文化符号的收藏与展示谱系（James Bond/Batman/Knight Rider…）。",
  },
];

export const GRAPH = new DomainGraph().addAll(NODES).relateAll(
  EDGES.map((e) => ({
    ...e,
    certainty: "VERIFIED" as const,
    source: "公开资料（详见各节点 source）",
  })),
);

/** 从某节点出发的关联链（含直接邻居），供关系链 UI 消费 */
export function relatedFrom(
  id: string,
): { node: KnowledgeNode; rel: string; direction: "out" | "in" }[] {
  const out = EDGES.filter((e) => e.from === id).map((e) => ({
    node: NODES.find((n) => n.id === e.to)!,
    rel: e.rel,
    direction: "out" as const,
  }));
  const inn = EDGES.filter((e) => e.to === id).map((e) => ({
    node: NODES.find((n) => n.id === e.from)!,
    rel: e.rel,
    direction: "in" as const,
  }));
  return [...out, ...inn].filter((r) => r.node);
}
