/**
 * Domain Engine — 统一实体模型静态查询层（PART 10 前身；PART 2.5 全局探索系统数据基座）
 * 原则（MASTER PLAN）：先建合理数据模型与本地静态数据验证，不过早引入后端。
 * 实体与关系全部带三标注（layer/certainty/source）——无来源断言不进模型。
 */

export type ContentClass = "REALITY" | "FICTION" | "FUTURE";
export type Certainty =
  "OFFICIAL" | "VERIFIED" | "RESEARCHED" | "SIMULATED" | "RECONSTRUCTED" | "UNVERIFIED";

export interface Entity {
  id: string;
  label: string;
  kind:
    | "vehicle"
    | "brand"
    | "component"
    | "material"
    | "film"
    | "culture"
    | "person"
    | "technology"
    | "event"
    | "location";
  layer: ContentClass;
  certainty: Certainty;
  source: string;
  /** 车辆实体的年份区间（有据才填） */
  year?: string;
  blurb: string;
}

export interface Relation {
  from: string;
  to: string;
  /** 关系谓词（中文短语）："基于改装"/"采用部件"/"出现于"… */
  rel: string;
  certainty: Certainty;
  source: string;
}

/** 静态数据注册：各专题页/世界空间贡献实体与关系，查询层统一消费 */
export class DomainGraph {
  private entities = new Map<string, Entity>();
  private relations: Relation[] = [];

  add(e: Entity): this {
    this.entities.set(e.id, e);
    return this;
  }

  addAll(list: Entity[]): this {
    for (const e of list) this.add(e);
    return this;
  }

  relate(r: Relation): this {
    if (!this.entities.has(r.from) || !this.entities.has(r.to)) {
      throw new Error(`DomainGraph: relation references unknown entity (${r.from} → ${r.to})`);
    }
    this.relations.push(r);
    return this;
  }

  relateAll(list: Relation[]): this {
    for (const r of list) this.relate(r);
    return this;
  }

  get(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  get size(): number {
    return this.entities.size;
  }

  /** 直接邻居（双向），可选按关系谓词过滤 */
  related(id: string, rel?: string): { entity: Entity; rel: string; direction: "out" | "in" }[] {
    const out = this.relations
      .filter((r) => r.from === id && (!rel || r.rel === rel))
      .map((r) => ({ entity: this.entities.get(r.to)!, rel: r.rel, direction: "out" as const }));
    const inn = this.relations
      .filter((r) => r.to === id && (!rel || r.rel === rel))
      .map((r) => ({ entity: this.entities.get(r.from)!, rel: r.rel, direction: "in" as const }));
    return [...out, ...inn].filter((r) => r.entity);
  }

  /** 多跳遍历（BFS，深度限制防爆炸）；返回路径上全部实体（去重） */
  traverse(id: string, maxDepth = 2): Entity[] {
    const seen = new Set<string>([id]);
    let frontier = [id];
    for (let d = 0; d < maxDepth; d++) {
      const next: string[] = [];
      for (const cur of frontier) {
        for (const nb of this.related(cur)) {
          if (!seen.has(nb.entity.id)) {
            seen.add(nb.entity.id);
            next.push(nb.entity.id);
          }
        }
      }
      frontier = next;
      if (!frontier.length) break;
    }
    return [...seen].map((x) => this.entities.get(x)!);
  }

  /** 按内容类别过滤（REALITY/FICTION/FUTURE 三分——总纲 §3 展品分类的数据层落点） */
  byLayer(layer: ContentClass): Entity[] {
    return [...this.entities.values()].filter((e) => e.layer === layer);
  }

  /** 全局搜索：label/blurb 子串匹配（大小写不敏感） */
  search(q: string): Entity[] {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return [...this.entities.values()].filter(
      (e) => e.label.toLowerCase().includes(needle) || e.blurb.toLowerCase().includes(needle),
    );
  }

  /** 邻接关系数排序（找"枢纽节点"） */
  hubs(topN = 3): { entity: Entity; degree: number }[] {
    const degree = new Map<string, number>();
    for (const r of this.relations) {
      degree.set(r.from, (degree.get(r.from) ?? 0) + 1);
      degree.set(r.to, (degree.get(r.to) ?? 0) + 1);
    }
    return [...degree.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([id, d]) => ({ entity: this.entities.get(id)!, degree: d }));
  }
}
