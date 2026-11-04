#!/usr/bin/env node
/**
 * inspect-glb — GLB 资产检查工具（MASTER PLAN §8.5）
 * 用法：node tools/inspect-glb.mjs <path-to-glb>
 * 输出：文件/层级/Mesh/材质/纹理/动画/包围盒/独立部件候选清单（JSON）。
 * 部件语义识别（车身/车轮等）仅给"候选"（按命名启发式 + 置信度），需人工确认（§8.5 要求）。
 */
import { readFileSync } from "node:fs";
// Document 类型未直接使用（NodeIO 内部消费）
import { basename, resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";

const NAME_HINTS = [
  { part: "wheel", patterns: [/wheel|tire|tyre|rim/i], confidence: 0.8 },
  { part: "body", patterns: [/body|shell|car|chassis/i], confidence: 0.6 },
  { part: "glass", patterns: [/glass|window|windshield/i], confidence: 0.7 },
  { part: "light", patterns: [/light|lamp|head/i], confidence: 0.5 },
  { part: "interior", patterns: [/seat|interior|dash/i], confidence: 0.5 },
];

function classify(name) {
  for (const hint of NAME_HINTS) {
    if (hint.patterns.some((p) => p.test(name)))
      return { candidate: hint.part, confidence: hint.confidence };
  }
  return null;
}

async function main() {
  const file = resolve(process.argv[2] ?? "");
  if (!file) {
    console.error("usage: node tools/inspect-glb.mjs <path-to-glb>");
    process.exit(2);
  }
  const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
  const doc = await io.read(file);
  const root = doc.getRoot();

  const nodes = root.listNodes().map((n) => {
    const mesh = n.getMesh();
    let primitives = 0;
    let triangles = 0;
    let materials = [];
    if (mesh) {
      for (const prim of mesh.listPrimitives()) {
        primitives++;
        const indices = prim.getIndices();
        const position = prim.getAttribute("POSITION");
        triangles += indices ? indices.getCount() / 3 : position ? position.getCount() / 3 : 0;
        const m = prim.getMaterial();
        if (m && !materials.includes(m.getName())) materials.push(m.getName());
      }
    }
    const hint = n.getName() ? classify(n.getName()) : null;
    return {
      name: n.getName() || "(unnamed)",
      hasMesh: Boolean(mesh),
      primitives,
      triangles: Math.round(triangles),
      materials,
      partCandidate: hint,
    };
  });

  const meshes = root.listMeshes();
  const materials = root.listMaterials();
  const textures = root.listTextures();
  const animations = root.listAnimations();

  // 全局包围盒：直接遍历 POSITION 元素计算（库的 accessor.getMin() 在部分模型上会崩，见 D-日志）
  const gMin = [Infinity, Infinity, Infinity];
  const gMax = [-Infinity, -Infinity, -Infinity];
  let hasBounds = false;
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      if (!pos) continue;
      const el = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, el);
        for (let a = 0; a < 3; a++) {
          if (el[a] < gMin[a]) gMin[a] = el[a];
          if (el[a] > gMax[a]) gMax[a] = el[a];
        }
      }
      hasBounds = true;
    }
  }
  const bounds = hasBounds
    ? { min: gMin.map((v) => Number(v.toFixed(4))), max: gMax.map((v) => Number(v.toFixed(4))) }
    : null;

  const report = {
    file: basename(file),
    fileSizeBytes: readFileSync(file).byteLength,
    generator: doc.getRoot().getAsset().generator || "(unknown)",
    extensionsUsed: root.listExtensionsUsed().map((e) => e.extensionName),
    counts: {
      scenes: root.listScenes().length,
      nodes: nodes.length,
      meshes: meshes.length,
      materials: materials.length,
      textures: textures.length,
      animations: animations.length,
      triangles: nodes.reduce((s, n) => s + n.triangles, 0),
    },
    bounds: bounds ?? "(模型无 POSITION 数据)",
    materialsList: materials.map((m) => m.getName() || "(unnamed)"),
    animationsList: animations.map((a) => a.getName() || "(unnamed)"),
    nodes,
    qualityNote:
      "modelType=SIMULATED（Khronos 工程示意模型）；mesh 数量多不代表完整拆解（§8.2），部件候选需人工确认。",
  };

  console.info(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("inspect failed:", err.stack ?? err.message);
  process.exit(1);
});
