/**
 * Shader 试点（MASTER PLAN §7.2）——Hologram（Fresnel + 扫描线）。
 * GLSL ShaderMaterial 实现（TSL 评估按 visual-techniques.md 结论列下一轮）。
 */
import * as THREE from "three";

export const HOLOGRAM_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosW = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const HOLOGRAM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosW);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 2.2);
    float scan = 0.5 + 0.5 * sin(vPosW.y * 42.0 - uTime * 3.0);
    float flicker = 0.92 + 0.08 * sin(uTime * 23.0);
    float a = (fresnel * 0.85 + scan * 0.12) * flicker;
    gl_FragColor = vec4(uColor * (0.6 + fresnel), a);
  }
`;

export function makeHologramMaterial(colorHex: number, uniforms?: { uTime?: { value: number } }) {
  const material = new THREE.ShaderMaterial({
    vertexShader: HOLOGRAM_VERT,
    fragmentShader: HOLOGRAM_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uTime: uniforms?.uTime ?? { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  return material;
}

/** 粒子云几何：球壳分布（能量空间背景） */
export function makeParticleCloud(count: number, radius: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // 球壳均匀分布
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = radius * (0.55 + Math.random() * 0.45);
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = r * s * Math.cos(theta);
    positions[i * 3 + 1] = r * u;
    positions[i * 3 + 2] = r * s * Math.sin(theta);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geo;
}
