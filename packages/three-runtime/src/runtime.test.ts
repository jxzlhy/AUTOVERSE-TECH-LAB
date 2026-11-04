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
  it("激活/退出生命周期与状态机", async () => {
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
    expect(calls).toEqual(["enter-a", "exit-a", "enter-b"]);

    await expect(sm.activate("nope")).rejects.toThrow("not registered");
    await expect(sm.activate("a")).resolves.toBeUndefined(); // 激活后可切回
  });

  it("onEnter 抛错时回滚到 idle", async () => {
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
