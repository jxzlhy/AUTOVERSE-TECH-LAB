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
 * Hologram 全息：Fresnel + 扫描线 + 微闪（THE NEXUS 核心/全息展台）。
 * 性能：1×pow + 1×sin，可忽略。
 */
export function makeHologramMaterial(colorHex: number): ShaderHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: COMMON_VERT,
    fragmentShader: /* glsl */ `
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
    `,
    uniforms: { uColor: { value: new THREE.Color(colorHex) }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  return {
    material,
    tick: (t) => (material.uniforms.uTime.value = t),
    dispose: () => material.dispose(),
  };
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

// ---------------------------------------------------------------------------
// PHASE 2E 补齐（Scan / Fresnel / Digital Grid / Outline / Heatmap / Wireframe）
// 统一约定：工厂返回 ShaderHandle（tick/dispose）；颜色/参数可调；性能注记随条目。
// ---------------------------------------------------------------------------

/** Scan 扫描环：以世界 Y 为轴的周期扫描带（工程扫描/展品检视）。成本：1×sin，可忽略 */
export function makeScanMaterial(colorHex: number, bandCount = 8): ShaderHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: COMMON_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 2.0);
        float band = 0.5 + 0.5 * sin(vPosW.y * ${bandCount.toFixed(2)} - uTime * 2.4);
        float a = fresnel * 0.6 + band * fresnel * 0.6;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    uniforms: { uColor: { value: new THREE.Color(colorHex) }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return {
    material,
    tick: (t) => (material.uniforms.uTime.value = t),
    dispose: () => material.dispose(),
  };
}

/** Fresnel 边缘光：纯边缘描边（展品高亮/轮廓强化）。成本：1×pow，可忽略 */
export function makeFresnelMaterial(colorHex: number, power = 2.5): ShaderHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: COMMON_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPower;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float f = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), uPower);
        gl_FragColor = vec4(uColor, f);
      }
    `,
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uPower: { value: power },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return { material, tick: () => {}, dispose: () => material.dispose() };
}

/** Digital Grid 数字网格面：UV 网格 + 呼吸（能量空间地面/全息台）。需 uv；成本：2×fract */
export function makeDigitalGridMaterial(colorHex: number, cells = 24): ShaderHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 g = abs(fract(vUv * ${cells.toFixed(1)}) - 0.5);
        float line = 1.0 - min(min(g.x, g.y) * 8.0, 1.0);
        float breathe = 0.55 + 0.45 * sin(uTime * 1.6 + vUv.x * 6.0);
        gl_FragColor = vec4(uColor, line * breathe * 0.8);
      }
    `,
    uniforms: { uColor: { value: new THREE.Color(colorHex) }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return {
    material,
    tick: (t) => (material.uniforms.uTime.value = t),
    dispose: () => material.dispose(),
  };
}

/** Outline 外描边：背面外扩壳法（壳体放大 + BackSide 纯色），选中态轮廓。成本：一次几何重绘 */
export function makeOutlineMaterial(
  colorHex: number,
  thickness = 0.035,
): { material: THREE.MeshBasicMaterial; thickness: number; tick: () => void; dispose: () => void } {
  const material = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.95,
  });
  return {
    material,
    thickness, // 用法：克隆目标 Mesh，scale.multiplyScalar(1 + thickness)，material 用本工厂
    tick: () => {},
    dispose: () => material.dispose(),
  };
}

/** Heatmap 热力图：按世界高度/自定义输入映射蓝→青→黄→红（工程分析视图）。成本：3×mix */
export function makeHeatmapMaterial(
  lowHex = 0x1d4ed8,
  highHex = 0xf87171,
): ShaderHandle & { setInput: (t: number) => void } {
  const material = new THREE.ShaderMaterial({
    vertexShader: COMMON_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uLow;
      uniform vec3 uHigh;
      uniform float uInput;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        float h = clamp((vPosW.y + 2.0) / 4.0, 0.0, 1.0);
        float v = clamp(h * 0.65 + uInput * 0.35, 0.0, 1.0);
        vec3 mid = mix(uLow, uHigh, v);
        vec3 cool = vec3(0.2, 0.6, 0.9);
        vec3 col = v < 0.5 ? mix(cool, mid, v * 2.0) : mix(mid, uHigh, v * 2.0 - 1.0);
        gl_FragColor = vec4(col, 0.92);
      }
    `,
    uniforms: {
      uLow: { value: new THREE.Color(lowHex) },
      uHigh: { value: new THREE.Color(highHex) },
      uInput: { value: 0.5 },
    },
  });
  return {
    material,
    setInput: (t) => (material.uniforms.uInput.value = Math.min(Math.max(t, 0), 1)),
    tick: () => {},
    dispose: () => material.dispose(),
  };
}

/** Wireframe 帮助器：标准材质线框切换（保存/还原），供 ENGINEERING Wireframe Toggle 复用 */
export function makeWireframeHandle(root: THREE.Object3D): {
  set: (on: boolean) => void;
  dispose: () => void;
} {
  const saved = new Map<THREE.Mesh, boolean>();
  return {
    set(on) {
      if (on) {
        root.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats as THREE.MeshStandardMaterial[]) {
            if (!saved.has(mesh)) saved.set(mesh, mat.wireframe);
            mat.wireframe = true;
          }
        });
      } else {
        for (const [mesh, wf] of saved) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats as THREE.MeshStandardMaterial[]) mat.wireframe = wf;
        }
        saved.clear();
      }
    },
    dispose() {
      this.set(false);
    },
  };
}
