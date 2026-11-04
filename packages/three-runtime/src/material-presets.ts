/**
 * 汽车材质预设库（PHASE 2E §6.2）
 * 每个预设：参数有依据（官方示例/行业标准做法），返回新 Material 实例（调用方负责 dispose）。
 */
import * as THREE from "three";

export type AutomotiveMaterialPreset =
  | "metallic-paint"
  | "clearcoat-paint"
  | "carbon-fiber"
  | "brushed-metal"
  | "chrome"
  | "glass"
  | "rubber"
  | "leather"
  | "plastic"
  | "emissive";

/** 程序化碳纤维织纹（Canvas 生成，无外部资产） */
function carbonWeaveTexture(size = 256): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const cell = size / 8;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const dark = (x + y) % 2 === 0;
      const g = ctx.createLinearGradient(x * cell, y * cell, (x + 1) * cell, (y + 1) * cell);
      g.addColorStop(0, dark ? "#0b0e13" : "#1a2029");
      g.addColorStop(0.5, dark ? "#161c26" : "#0e1218");
      g.addColorStop(1, dark ? "#0b0e13" : "#1a2029");
      ctx.fillStyle = g;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/** 拉丝金属各向异性近似（条纹 Canvas 作 roughnessMap） */
function brushedTexture(size = 256): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#8a8a8a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const y = Math.random() * size;
    const v = 110 + Math.floor(Math.random() * 90);
    ctx.strokeStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export interface MaterialPresetInfo {
  id: AutomotiveMaterialPreset;
  label: string;
  /** 依据说明（官方示例/行业做法），供铭牌与文档引用 */
  note: string;
}

export const MATERIAL_PRESET_INFO: Record<AutomotiveMaterialPreset, MaterialPresetInfo> = {
  "metallic-paint": {
    id: "metallic-paint",
    label: "金属漆",
    note: "metalness 1.0 + roughness 0.5 + clearcoat（three 官方 car 示例配方，visual-techniques.md）",
  },
  "clearcoat-paint": {
    id: "clearcoat-paint",
    label: "清漆珍珠",
    note: "低金属度 + clearcoat 1.0 + clearcoatRoughness 0.03，珍珠白层",
  },
  "carbon-fiber": { id: "carbon-fiber", label: "碳纤维", note: "程序化织纹 map + 中粗糙清漆层" },
  "brushed-metal": {
    id: "brushed-metal",
    label: "拉丝金属",
    note: "条纹 roughnessMap 近似各向异性高光",
  },
  chrome: {
    id: "chrome",
    label: "镀铬",
    note: "metalness 1.0 + roughness 0.02——强依赖 IBL 环境反射",
  },
  glass: {
    id: "glass",
    label: "玻璃",
    note: "transmission 1.0 + ior 1.5（MeshPhysicalMaterial 透射）",
  },
  rubber: { id: "rubber", label: "橡胶", note: "metalness 0 + roughness 0.95" },
  leather: { id: "leather", label: "皮革", note: "低金属 + 高粗糙 + sheen 织物感" },
  plastic: {
    id: "plastic",
    label: "工程塑料",
    note: "metalness 0 + roughness 0.4 + clearcoat 0.3",
  },
  emissive: { id: "emissive", label: "自发光", note: "emissive 全开（灯组/示宽灯用）" },
};

export function createAutomaterial(
  preset: AutomotiveMaterialPreset,
  colorHex = 0xc0c7d1,
): THREE.Material {
  switch (preset) {
    case "metallic-paint":
      return new THREE.MeshPhysicalMaterial({
        color: colorHex,
        metalness: 1.0,
        roughness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
      });
    case "clearcoat-paint":
      return new THREE.MeshPhysicalMaterial({
        color: colorHex,
        metalness: 0.4,
        roughness: 0.35,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
      });
    case "carbon-fiber": {
      const m = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: carbonWeaveTexture(),
        metalness: 0.4,
        roughness: 0.35,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
      });
      return m;
    }
    case "brushed-metal": {
      const m = new THREE.MeshStandardMaterial({
        color: colorHex,
        metalness: 0.95,
        roughness: 0.4,
        roughnessMap: brushedTexture(),
      });
      return m;
    }
    case "chrome":
      return new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.02 });
    case "glass":
      return new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transmission: 1.0,
        ior: 1.5,
        thickness: 0.4,
        transparent: true,
      });
    case "rubber":
      return new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0, roughness: 0.95 });
    case "leather":
      return new THREE.MeshPhysicalMaterial({
        color: colorHex,
        metalness: 0,
        roughness: 0.75,
        sheen: 0.6,
        sheenColor: new THREE.Color(0x3a3f4a),
      });
    case "plastic":
      return new THREE.MeshPhysicalMaterial({
        color: colorHex,
        metalness: 0,
        roughness: 0.4,
        clearcoat: 0.3,
      });
    case "emissive":
      return new THREE.MeshStandardMaterial({
        color: 0x0b1220,
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: 2.2,
      });
  }
}
