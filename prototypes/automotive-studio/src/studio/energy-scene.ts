/**
 * 能量空间场景（Scene B）：粒子云 + Hologram 核心 + 网格地面
 * ——Shader 试点（Hologram/Fresnel+扫描线）与 NIGHT/CINEMATIC 灯光适配的演示空间。
 */
import * as THREE from "three";
import { makeHologramMaterial, makeParticleCloud } from "./shaders";

export interface EnergyRefs {
  group: THREE.Group;
  onFrame: (delta: number, elapsed: number) => void;
  dispose: () => void;
}

export function buildEnergyScene(): EnergyRefs {
  const group = new THREE.Group();

  // 粒子云（3,000 点，加色混合）
  const cloudGeo = makeParticleCloud(3000, 9);
  const cloudMat = new THREE.PointsMaterial({
    color: 0x22d3ee,
    size: 0.05,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cloud = new THREE.Points(cloudGeo, cloudMat);
  group.add(cloud);

  // Hologram 核心（Icosahedron + Fresnel 扫描线）
  const uniforms = { uTime: { value: 0 } };
  const holoMat = makeHologramMaterial(0x22d3ee, { uTime: uniforms.uTime });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 3), holoMat);
  core.position.set(0, 2.0, 0);
  group.add(core);

  const coreInner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 1),
    new THREE.MeshBasicMaterial({
      color: 0x0e7490,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    }),
  );
  coreInner.position.copy(core.position);
  group.add(coreInner);

  // 网格地面
  const grid = new THREE.GridHelper(40, 40, 0x0e7490, 0x123043);
  grid.position.y = 0.001;
  group.add(grid);

  const rotationSpeed = 0.12;

  return {
    group,
    onFrame: (delta, elapsed) => {
      uniforms.uTime.value = elapsed;
      cloud.rotation.y += delta * rotationSpeed;
      core.rotation.y += delta * 0.3;
      core.rotation.x = Math.sin(elapsed * 0.4) * 0.2;
      core.position.y = 2.0 + Math.sin(elapsed * 0.9) * 0.15;
      coreInner.rotation.y -= delta * 0.5;
    },
    dispose: () => {
      cloudGeo.dispose();
      cloudMat.dispose();
      core.geometry.dispose();
      holoMat.dispose();
      coreInner.geometry.dispose();
      (coreInner.material as THREE.Material).dispose();
      grid.dispose();
    },
  };
}
