import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { disposeObject3D } from "./ResourceDisposer";
import { AssetRegistry } from "./AssetManager";
import { SceneManager } from "./SceneManager";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { framingForBox } from "./CameraController";
import { LIGHT_PRESETS } from "./LightingManager";
import { validateColorTokens, PAINT_PRESETS } from "@atl/shared";

describe("ResourceDisposer", () => {
  it("释放几何/材质/纹理并报告真实计数", () => {
    const tex = new THREE.Texture();
    const mat = new THREE.MeshStandardMaterial({ map: tex });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, mat));
    const tex2 = new THREE.Texture();
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshStandardMaterial({ map: tex2 }),
      ),
    );

    const spyTex = vi.spyOn(tex, "dispose");
    const report = disposeObject3D(group);
    expect(report.geometries).toBe(2);
    expect(report.materials).toBe(2);
    expect(report.textures).toBe(2);
    expect(spyTex).toHaveBeenCalled();
    expect(geo.dispose()).toBeUndefined();
  });

  it("重复材质只释放一次", () => {
    const mat = new THREE.MeshStandardMaterial();
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), mat));
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), mat));
    const report = disposeObject3D(group);
    expect(report.materials).toBe(1);
  });
});

describe("AssetRegistry", () => {
  it("并发同 key 请求共享同一次加载", async () => {
    const registry = new AssetRegistry<string>();
    let calls = 0;
    const load = () =>
      registry.load("k", () => {
        calls++;
        return new Promise((r) => setTimeout(() => r("value"), 5));
      });
    const [a, b] = await Promise.all([load(), load()]);
    expect(calls).toBe(1);
    expect(a).toBe("value");
    expect(b).toBe("value");
    expect(registry.has("k")).toBe(true);
  });

  it("失败不缓存，允许重试", async () => {
    const registry = new AssetRegistry<string>();
    let attempts = 0;
    const load = () =>
      registry.load("k", () => {
        attempts++;
        return attempts < 2 ? Promise.reject(new Error("boom")) : Promise.resolve("ok");
      });
    await expect(load()).rejects.toThrow("boom");
    await expect(load()).resolves.toBe("ok");
    expect(attempts).toBe(2);
  });
});

describe("SceneManager", () => {
  it("激活/退出生命周期与状态机（两阶段）", async () => {
    const root = new THREE.Group();
    const sm = new SceneManager(root);
    const calls: string[] = [];
    sm.register({
      id: "a",
      object3D: new THREE.Group(),
      onEnter: () => calls.push("enter-a"),
      onExit: () => calls.push("exit-a"),
    });
    sm.register({
      id: "b",
      object3D: new THREE.Group(),
      onEnter: () => calls.push("enter-b"),
      onExit: () => calls.push("exit-b"),
    });

    expect(sm.currentState).toBe("idle");
    await sm.activate("a");
    expect(sm.currentState).toBe("active");
    expect(sm.activeId).toBe("a");
    expect(root.children.length).toBe(1);
    expect(calls).toEqual(["enter-a"]);

    sm.update(0.016);
    await sm.activate("b", { disposeCurrent: false });
    // PHASE 2A 两阶段：目标 onEnter 先于旧场景 onExit（防白屏的关键语义）
    expect(calls).toEqual(["enter-a", "enter-b", "exit-a"]);

    await expect(sm.activate("nope")).rejects.toThrow("not registered");
    await expect(sm.activate("a")).resolves.toBeUndefined(); // 激活后可切回
  });

  it("目标 onEnter 失败：当前场景保持展示（不白屏）", async () => {
    const root = new THREE.Group();
    const sm = new SceneManager(root);
    const a = new THREE.Group();
    const bad = new THREE.Group();
    sm.register({ id: "a", object3D: a });
    sm.register({
      id: "bad",
      object3D: bad,
      onEnter: () => Promise.reject(new Error("asset 404")),
    });
    await sm.activate("a");
    await expect(sm.activate("bad")).rejects.toThrow("asset 404");
    expect(sm.activeId).toBe("a"); // 当前场景仍在
    expect(sm.currentState).toBe("active");
    expect(root.children).toContain(a);
    expect(root.children).not.toContain(bad); // 半成品被清理
  });

  it("两阶段语义：prepare 期间旧场景仍在树上", async () => {
    const root = new THREE.Group();
    const sm = new SceneManager(root);
    let sawAStillMounted = false;
    sm.register({ id: "a", object3D: new THREE.Group() });
    sm.register({
      id: "b",
      object3D: new THREE.Group(),
      onEnter: () => {
        sawAStillMounted = root.children.length === 1; // a 尚未被移除
      },
    });
    await sm.activate("a");
    await sm.activate("b");
    expect(sawAStillMounted).toBe(true);
  });

  it("并发 activate 被拒绝且状态一致", async () => {
    const sm = new SceneManager(new THREE.Group());
    sm.register({ id: "a", object3D: new THREE.Group() });
    sm.register({
      id: "slow",
      object3D: new THREE.Group(),
      onEnter: () => new Promise((r) => setTimeout(r, 30)),
    });
    await sm.activate("a");
    const pending = sm.activate("slow");
    await expect(sm.activate("a")).rejects.toThrow("cannot activate while preparing");
    await pending;
    expect(sm.currentState).toBe("active");
    expect(sm.activeId).toBe("slow");
  });

  it("cancelPending 后陈旧 prepare 的提交被回滚", async () => {
    const root = new THREE.Group();
    const sm = new SceneManager(root);
    const bGroup = new THREE.Group();
    let exitB = 0;
    sm.register({ id: "a", object3D: new THREE.Group() });
    sm.register({
      id: "b",
      object3D: bGroup,
      onEnter: () => new Promise((r) => setTimeout(r, 20)),
      onExit: () => exitB++,
    });
    await sm.activate("a");
    const pending = sm.activate("b");
    sm.cancelPending();
    await pending; // 陈旧提交被吞掉（不抛错），但 b 未上树
    expect(sm.activeId).toBe("a");
    expect(root.children).not.toContain(bGroup);
    expect(exitB).toBe(1); // prepare 回滚走了 onExit
  });

  it("disposeCurrent 物理释放旧场景资源", async () => {
    const sm = new SceneManager(new THREE.Group());
    const geo = new THREE.BoxGeometry();
    const geoSpy = vi.spyOn(geo, "dispose");
    const tex = new THREE.Texture();
    const texSpy = vi.spyOn(tex, "dispose");
    const aGroup = new THREE.Group();
    aGroup.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex })));
    sm.register({ id: "a", object3D: aGroup });
    sm.register({ id: "b", object3D: new THREE.Group() });
    await sm.activate("a");
    await sm.activate("b", { disposeCurrent: true });
    // three 的 dispose() 触发 GPU 侧释放事件（不清 CPU attributes），用 spy 断言真实调用
    expect(geoSpy).toHaveBeenCalledTimes(1);
    expect(texSpy).toHaveBeenCalledTimes(1);
  });

  it("onEnter 抛错时（首个场景）回滚到 idle", async () => {
    const sm = new SceneManager(new THREE.Group());
    sm.register({
      id: "bad",
      object3D: new THREE.Group(),
      onEnter: () => {
        throw new Error("load failed");
      },
    });
    await expect(sm.activate("bad")).rejects.toThrow("load failed");
    expect(sm.currentState).toBe("idle");
    expect(sm.activeId).toBeNull();
  });
});

describe("PerformanceMonitor", () => {
  it("按时间窗聚合 FPS 与 draw calls", () => {
    const info = { render: { calls: 21, triangles: 1600 } };
    const pm = new PerformanceMonitor(() => info, 500);
    const seen: number[] = [];
    pm.onSnapshot((s) => seen.push(s.fps));
    for (let i = 0; i <= 30; i++) pm.sample(i * 20); // t=500ms 时窗口收口：26 帧 / 500ms → 52fps
    expect(seen).toContain(52);
    expect(pm.current.drawCalls).toBe(21);
    expect(pm.current.triangles).toBe(1600);
  });
});

describe("CameraController.framingForBox", () => {
  it("按 FOV 推导取景距离", () => {
    const box = new THREE.Box3(new THREE.Vector3(-2, -1, -1), new THREE.Vector3(2, 1, 1));
    const { distance, target } = framingForBox(box, { fovDeg: 40, padding: 1.25 });
    expect(target.x).toBeCloseTo(0);
    expect(distance).toBeGreaterThan(4); // 半径 2 / sin(20°) ≈ 5.85 × 1.25
    expect(distance).toBeLessThan(10);
  });
});

describe("LIGHT_PRESETS 数据完整性", () => {
  it("五个预设齐全且颜色合法", () => {
    const ids = Object.keys(LIGHT_PRESETS);
    expect(ids).toEqual(["STUDIO", "MUSEUM", "NIGHT", "ENGINEERING", "CINEMATIC"]);
    for (const preset of Object.values(LIGHT_PRESETS)) {
      expect(preset.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.envIntensity).toBeGreaterThan(0);
      expect(preset.key.position).toHaveLength(3);
      expect(preset.rim.position).toHaveLength(3);
    }
  });
});

describe("设计 Tokens（@atl/shared）", () => {
  it("全部颜色 Token 为合法值", () => {
    const { ok, bad } = validateColorTokens();
    expect(bad).toEqual([]);
    expect(ok).toBe(true);
  });
  it("车漆预设覆盖四类语义色", () => {
    expect(PAINT_PRESETS.map((p) => p.id)).toEqual(["nexus", "real", "fiction", "concept"]);
  });
});

describe("computeGlbStats 索引几何（PHASE 2A §2.3）", () => {
  it("索引几何按 index.count 计三角面", async () => {
    const { computeGlbStats } = await import("./AssetManager");
    // 两个三角形共用 4 个顶点：position.count=4（错解 1 tri），index.count=6（正解 2 tris）
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3));
    geo.setIndex([0, 1, 2, 2, 1, 3]);
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial()));
    const stats = computeGlbStats({ scene: group, animations: [] } as never);
    expect(stats.triangles).toBe(2);
    expect(stats.meshes).toBe(1);
  });
});

describe("ResourceLedger 共享资源账本（PHASE 2A §2.4）", () => {
  it("引用归零才释放；超发抛错", async () => {
    const { ResourceLedger } = await import("./ResourceDisposer");
    const ledger = new ResourceLedger();
    const mat = new THREE.MeshStandardMaterial();
    const spy = vi.spyOn(mat, "dispose");
    ledger.acquire(mat, 2);
    ledger.release(mat);
    expect(spy).not.toHaveBeenCalled(); // 仍有 1 引用
    ledger.release(mat);
    expect(spy).toHaveBeenCalledTimes(1); // 归零释放
    expect(() => ledger.release(mat)).toThrow("without matching acquire");
  });
});

describe("createListenerTracker（PHASE 2A §2.6）", () => {
  it("注册记账 / disposeAll 反注册", async () => {
    const { createListenerTracker } = await import("./ResourceDisposer");
    const tracker = createListenerTracker();
    const target = new EventTarget();
    let hits = 0;
    const fn = () => hits++;
    tracker.on(target, "ping", fn);
    expect(tracker.size()).toBe(1);
    target.dispatchEvent(new Event("ping"));
    expect(hits).toBe(1);
    tracker.disposeAll();
    expect(tracker.size()).toBe(0);
    target.dispatchEvent(new Event("ping"));
    expect(hits).toBe(1); // 反注册后不再触发
  });
});
