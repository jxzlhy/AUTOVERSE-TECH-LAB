/**
 * Shader Library v2（PHASE 2E §6.1，THREE 共享库层）
 * 每个条目：GLSL + 工厂函数（带 uniforms 句柄）+ 适用场景/性能说明。
 * 生命周期：材质 dispose 由调用方（ResourceDisposer 链路）负责；uniforms 不持有 GPU 资源。
 */
import * as THREE from "three";

const COMMON_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosW = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export interface ShaderHandle {
  material: THREE.ShaderMaterial;
  /** 每帧更新（time 类 uniforms） */
  tick: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * X-Ray 透视外壳：Fresnel 边缘发光 + 低不透明度，用于"外壳隐藏/透视模式"（ENGINEERING UI）。
 * 性能：每像素 1 次 fresnel，成本低；与 depthWrite:false 搭配避免排序问题。
 */
export function makeXRayMaterial(colorHex: number, opacity = 0.35): ShaderHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: COMMON_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 1.8);
        gl_FragColor = vec4(uColor, (fresnel * 0.85 + 0.08) * uOpacity);
      }
    `,
    uniforms: { uColor: { value: new THREE.Color(colorHex) }, uOpacity: { value: opacity } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  return {
    material,
    tick: () => {},
    dispose: () => material.dispose(),
  };
}

/**
 * Dissolve 消融：噪声阈值渐隐（经典消融转场/销毁效果）。
 * progress 0→1：先从噪声值高于阈值处开始碎裂消失，边缘可加发光色。
 * 性能：一次 3D 噪声（hash 实现，无纹理采样），成本低。
 */
export function makeDissolveMaterial(
  edgeColorHex = 0x22d3ee,
): ShaderHandle & { setProgress: (t: number) => void } {
  const noiseGLSL = /* glsl */ `
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float noise3(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
        f.z);
    }
  `;
  const material = new THREE.ShaderMaterial({
    vertexShader: COMMON_VERT,
    fragmentShader: /* glsl */ `
      uniform float uProgress;
      uniform vec3 uEdgeColor;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      ${noiseGLSL}
      void main() {
        float n = noise3(vPosW * 3.0);
        if (n < uProgress * 1.05) discard;
        float edge = smoothstep(uProgress * 1.05, uProgress * 1.05 + 0.08, n);
        vec3 base = vec3(0.16, 0.20, 0.28) * (0.35 + 0.65 * abs(dot(normalize(vNormalW), normalize(cameraPosition - vPosW))));
        vec3 col = mix(uEdgeColor, base, edge);
        gl_FragColor = vec4(col, 1.0 - uProgress * 0.4);
      }
    `,
    uniforms: {
      uProgress: { value: 0 },
      uEdgeColor: { value: new THREE.Color(edgeColorHex) },
    },
  });
  return {
    material,
    setProgress: (t: number) => {
      material.uniforms.uProgress.value = Math.min(Math.max(t, 0), 1);
    },
    tick: () => {},
    dispose: () => material.dispose(),
  };
}

/**
 * Energy Flow 能量流：UV 流动条纹（传送门/能量管道用）。
 * 需要 geometry 带 uv；性能：一次 sin，成本可忽略。
 */
export function makeEnergyFlowMaterial(colorHex: number, speed = 1.2): ShaderHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vPosW = worldPos.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        float bands = 0.5 + 0.5 * sin((vUv.y * 24.0) - uTime * ${speed.toFixed(2)} * 3.0);
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 1.5);
        float a = bands * 0.35 + fresnel * 0.5;
        gl_FragColor = vec4(uColor * (0.7 + bands * 0.6), a);
      }
    `,
    uniforms: { uColor: { value: new THREE.Color(colorHex) }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  return {
    material,
    tick: (elapsed) => {
      material.uniforms.uTime.value = elapsed;
    },
    dispose: () => material.dispose(),
  };
}
