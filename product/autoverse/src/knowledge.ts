/**
 * AUTOVERSE 产品——知识图谱数据（LEGENDS UNIVERSE）
 * 与 delorean-showcase 原型同源（DomainGraph），产品侧独立数据文件（PHASE 3 R2 植入）。
 * 每节点三标注必填：layer / certainty / source（PART 9.6）。
 */
import { DomainGraph, type Entity, type Relation } from "@atl/shared";

export type KnowledgeNode = Entity;

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
    blurb: "影视载具作为文化符号的收藏与展示谱系。",
  },
  {
    id: "bond-franchise",
    label: "James Bond 系列",
    kind: "film",
    layer: "FICTION",
    certainty: "VERIFIED",
    source: "EON Productions 公开资料",
    blurb: "007 系列：Aston Martin DB5 是系列最标志性载具。",
  },
  {
    id: "db5",
    label: "Aston Martin DB5",
    kind: "vehicle",
    layer: "FICTION",
    certainty: "VERIFIED",
    source: "EON Productions/官方公开资料",
    blurb: "Bond 座驾：真实车型经影视道具改装（武器/弹射椅均为虚构装置）。",
  },
  {
    id: "batman-franchise",
    label: "Batman 系列",
    kind: "film",
    layer: "FICTION",
    certainty: "VERIFIED",
    source: "DC/Warner Bros. 公开资料",
    blurb: "蝙蝠侠系列：Batmobile 各代设计差异极大（影视改编史的一部分）。",
  },
  {
    id: "batmobile",
    label: "Batmobile",
    kind: "vehicle",
    layer: "FICTION",
    certainty: "VERIFIED",
    source: "DC/Warner Bros. 公开资料",
    blurb: "蝙蝠车：完全虚构载具（无真实车型基底——与 DB5 相反案例）。",
  },
  {
    id: "knight-rider",
    label: "Knight Rider",
    kind: "film",
    layer: "FICTION",
    certainty: "VERIFIED",
    source: "NBC 公开资料",
    blurb: "霹雳游侠：KITT——Pontiac Trans Am 改装的 AI 车（真实基底+虚构智能）。",
  },
  {
    id: "kitt",
    label: "KITT",
    kind: "vehicle",
    layer: "FICTION",
    certainty: "VERIFIED",
    source: "NBC 公开资料",
    blurb: "虚构智能车载：真实 Trans Am 基底（与 Batmobile 相反案例）。",
  },
  {
    id: "john-delorean",
    label: "John Zachary DeLorean",
    kind: "person",
    layer: "REALITY",
    certainty: "VERIFIED",
    source: "公开传记资料",
    blurb: "GM 传奇高管→创立 DMC：DMC-12 背后的企业家故事（1975 创公司）。",
  },
  {
    id: "giugiaro",
    label: "Giorgetto Giugiaro",
    kind: "person",
    layer: "REALITY",
    certainty: "VERIFIED",
    source: "Italdesign 公开资料",
    blurb: "DMC-12 车身设计者（Italdesign）：切角几何语言出自其手。",
  },
  {
    id: "prv-v6",
    label: "PRV V6 发动机",
    kind: "technology",
    layer: "REALITY",
    certainty: "VERIFIED",
    source: "公开技术资料",
    blurb: "Peugeot-Renault-Volvo 联合开发：DMC-12 后置动力（2.85L SOHC V6）。",
  },
  {
    id: "gullwing-lineage",
    label: "鸥翼门谱系（300SL 前例）",
    kind: "technology",
    layer: "REALITY",
    certainty: "RESEARCHED",
    source: "公开汽车史资料",
    blurb: "1954 Mercedes 300SL 首创鸥翼铰链：DMC-12 是大众化再诠释。",
  },
];

const EDGES: Array<Pick<Relation, "from" | "to" | "rel">> = [
  { from: "time-machine", to: "dmc12", rel: "基于改装" },
  { from: "time-machine", to: "bttf", rel: "出现于" },
  { from: "dmc12", to: "delorean-brand", rel: "由制造" },
  { from: "dmc12", to: "gullwing", rel: "采用部件" },
  { from: "dmc12", to: "stainless", rel: "车身材质" },
  { from: "bttf", to: "film-culture", rel: "属于" },
  { from: "time-machine", to: "film-culture", rel: "成为符号" },
  { from: "bond-franchise", to: "film-culture", rel: "属于" },
  { from: "bond-franchise", to: "db5", rel: "标志载具" },
  { from: "batman-franchise", to: "film-culture", rel: "属于" },
  { from: "batman-franchise", to: "batmobile", rel: "标志载具" },
  { from: "knight-rider", to: "film-culture", rel: "属于" },
  { from: "knight-rider", to: "kitt", rel: "标志载具" },
  { from: "dmc12", to: "john-delorean", rel: "创始人推动" },
  { from: "dmc12", to: "giugiaro", rel: "外观设计" },
  { from: "dmc12", to: "prv-v6", rel: "动力单元" },
  { from: "gullwing", to: "gullwing-lineage", rel: "谱系前例" },
];

export const GRAPH = new DomainGraph().addAll(NODES).relateAll(
  EDGES.map((e) => ({
    ...e,
    certainty: "VERIFIED" as const,
    source: "公开资料（详见各节点 source）",
  })),
);

export function relatedFrom(
  id: string,
): { node: KnowledgeNode; rel: string; direction: "out" | "in" }[] {
  return GRAPH.related(id).map((r) => ({ node: r.entity, rel: r.rel, direction: r.direction }));
}
