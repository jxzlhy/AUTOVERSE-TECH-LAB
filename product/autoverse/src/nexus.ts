/**
 * THE NEXUS —— AUTOVERSE 宇宙主入口 3D 场景（PART V §11.1）
 * 视觉方向：FUTURISTIC SPATIAL（visual-directions.md）——深空底 + NEXUS 光效 + 空间节点
 * 空间构图：中央枢纽核心（Hologram）+ 六大空间轨道节点（可点击传送）+ 粒子星环 + 网格地面
 */
import * as THREE from "three";
import { makeHologramMaterial, makeDigitalGridMaterial } from "@atl/three-runtime";

export interface NexusSpace {
  id: string;
  label: string;
  angle: number; // 轨道角度
  node: THREE.Mesh;
  ring: THREE.Mesh;
}

export interface NexusRefs {
  group: THREE.Group;
  spaces: NexusSpace[];
  /** 每帧驱动（自转/呼吸/时间 uniforms） */
  onFrame: (delta: number, elapsed: number) => void;
  /** 屏幕投影：空间节点 → { x, y, visible, dist }[] */
  projectNodes: (
    camera: THREE.Camera,
    w: number,
    h: number,
  ) => Array<{ id: string; x: number; y: number; visible: boolean; dist: number }>;
  dispose: () => void;
}

const SPACES: Array<{ id: string; label: string }> = [
  { id: "supercar", label: "SUPERCAR WORLD" },
  { id: "engineering", label: "ENGINEERING LAB" },
  { id: "legends", label: "LEGENDS UNIVERSE" },
  { id: "museum", label: "CIVILIZATION MUSEUM" },
  { id: "earth", label: "AUTOMOTIVE EARTH" },
  { id: "future", label: "FUTURE MOBILITY" },
];

export function buildNexus(): NexusRefs {
  const group = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];

  // 中央核心：双层 Icosahedron 全息
  const coreHandle = makeHologramMaterial(0x22d3ee);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 3), coreHandle.material);
  core.position.set(0, 2.6, 0);
  const coreWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, 1),
    new THREE.MeshBasicMaterial({
      color: 0x0e7490,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    }),
  );
  coreWire.position.copy(core.position);
  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.85 }),
  );
  coreGlow.position.copy(core.position);
  group.add(core, coreWire, coreGlow);
  disposables.push(
    coreHandle,
    core.geometry as THREE.BufferGeometry,
    coreWire.geometry as THREE.BufferGeometry,
    coreGlow.geometry as THREE.BufferGeometry,
  );

  // 六大空间轨道节点（半径 6，含标识环）
  const spaces: NexusSpace[] = SPACES.map((sp, i) => {
    const angle = (i / SPACES.length) * Math.PI * 2;
    const x = Math.cos(angle) * 6;
    const z = Math.sin(angle) * 6;
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.9,
    });
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 20), nodeMat);
    node.position.set(x, 2.2, z);
    node.name = `space-${sp.id}`;
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0e7490,
      transparent: true,
      opacity: 0.55,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 12, 40), ringMat);
    ring.position.copy(node.position);
    ring.rotation.x = Math.PI / 2;
    group.add(node, ring);
    disposables.push(
      node.geometry as THREE.BufferGeometry,
      nodeMat,
      ring.geometry as THREE.BufferGeometry,
      ringMat,
    );
    return { id: sp.id, label: sp.label, angle, node, ring };
  });

  // 轨道连线环
  const orbitGeo = new THREE.RingGeometry(5.85, 6.15, 96);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0x0e7490,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  orbit.rotation.x = -Math.PI / 2;
  orbit.position.y = 2.2;
  group.add(orbit);
  disposables.push(orbitGeo, orbitMat);

  // 粒子星环（球壳 2600 点）
  const N = 2600;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = 14 * (0.5 + Math.random() * 0.5);
    const sn = Math.sqrt(1 - u * u);
    pos[i * 3] = r * sn * Math.cos(th);
    pos[i * 3 + 1] = r * u + 4;
    pos[i * 3 + 2] = r * sn * Math.sin(th);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0x22d3ee,
    size: 0.06,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  group.add(stars);
  disposables.push(starGeo, starMat);

  // 数字网格地面
  const gridGeo = new THREE.PlaneGeometry(60, 60);
  const gridHandle = makeDigitalGridMaterial(0x155e75, 30);
  const grid = new THREE.Mesh(gridGeo, gridHandle.material);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = -0.02;
  group.add(grid);
  disposables.push(gridGeo, gridHandle);

  let spin = 0;
  return {
    group,
    spaces,
    onFrame: (delta, elapsed) => {
      coreHandle.tick(elapsed);
      spin += delta * 0.06;
      stars.rotation.y = spin;
      core.rotation.y += delta * 0.25;
      core.rotation.x = Math.sin(elapsed * 0.35) * 0.18;
      coreWire.rotation.y -= delta * 0.4;
      coreGlow.scale.setScalar(0.9 + Math.sin(elapsed * 1.6) * 0.12);
      for (const sp of spaces) sp.ring.rotation.z += delta * 0.6;
      for (const sp of spaces) {
        const pulse = 1 + Math.sin(elapsed * 2 + sp.angle * 3) * 0.08;
        sp.node.scale.setScalar(pulse);
      }
    },
    projectNodes: (camera, w, h) =>
      spaces.map((sp) => {
        const p = sp.node.getWorldPosition(new THREE.Vector3());
        const ndc = p.clone().project(camera);
        return {
          id: sp.id,
          x: (ndc.x * 0.5 + 0.5) * w,
          y: (-ndc.y * 0.5 + 0.5) * h,
          visible: ndc.z <= 1,
          dist: camera.position.distanceTo(p),
        };
      }),
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
