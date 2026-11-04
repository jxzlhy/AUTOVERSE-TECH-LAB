import { describe, expect, it } from "vitest";
import { DomainGraph, type Entity, type Relation } from "./domain-engine";

const E = (id: string, label: string, layer: Entity["layer"] = "REALITY"): Entity => ({
  id,
  label,
  kind: "vehicle",
  layer,
  certainty: "VERIFIED",
  source: "test",
  blurb: `${label} blurb`,
});

const R = (from: string, to: string, rel: string): Relation => ({
  from,
  to,
  rel,
  certainty: "VERIFIED",
  source: "test",
});

function makeGraph(): DomainGraph {
  return new DomainGraph()
    .addAll([
      E("tm", "Time Machine", "FICTION"),
      E("dmc12", "DMC-12"),
      E("gullwing", "鸥翼门"),
      E("steel", "不锈钢"),
      E("film", "回到未来", "FICTION"),
    ])
    .relateAll([
      R("tm", "dmc12", "基于改装"),
      R("dmc12", "gullwing", "采用部件"),
      R("dmc12", "steel", "车身材质"),
      R("tm", "film", "出现于"),
    ]);
}

describe("DomainGraph（PART 10 静态查询层）", () => {
  it("related 双向查询 + 谓词过滤", () => {
    const g = makeGraph();
    const all = g.related("dmc12");
    expect(all).toHaveLength(3);
    const byPart = g.related("dmc12", "采用部件");
    expect(byPart).toHaveLength(1);
    expect(byPart[0].entity.id).toBe("gullwing");
    expect(byPart[0].direction).toBe("out");
  });

  it("traverse 多跳去重（tm 两跳达 5 节点全图）", () => {
    const g = makeGraph();
    expect(g.traverse("tm", 1)).toHaveLength(3); // tm + dmc12 + film
    expect(g.traverse("tm", 2)).toHaveLength(5); // 全图
  });

  it("byLayer 三分过滤（REALITY/FICTION 数据层分类）", () => {
    const g = makeGraph();
    expect(g.byLayer("REALITY")).toHaveLength(3);
    expect(g.byLayer("FICTION")).toHaveLength(2);
  });

  it("search 子串匹配 label 与 blurb", () => {
    const g = makeGraph();
    expect(g.search("dmc")).toHaveLength(1);
    expect(g.search("blurb").length).toBe(5); // blurb 全含
    expect(g.search("  ")).toEqual([]);
  });

  it("hubs 枢纽排序（dmc12 度数最高）", () => {
    const g = makeGraph();
    const [top] = g.hubs(1);
    expect(top.entity.id).toBe("dmc12");
    expect(top.degree).toBe(3);
  });

  it("relate 引用未知实体抛错（数据完整性门禁）", () => {
    const g = new DomainGraph().add(E("a", "A"));
    expect(() => g.relate(R("a", "ghost", "x"))).toThrow(/unknown entity/);
  });
});
