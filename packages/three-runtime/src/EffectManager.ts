/**
 * EffectManager — 后期处理（PART 7 / PHASE 2E §6.4 实现）
 * 链路：RenderPass → [SSAO] → [Bloom] → [DOF] → [Vignette+ColorGrading] → OutputPass
 * 全部可选懒加载（构建成本高的 pass 只在开启时创建），与 OutputPass 顺序保证色调正确。
 * 性能注记：SSAO（GTAO）最贵——桌面 HIGH 档专用；Vignette/Grading 最便宜。
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";

export interface BloomParams {
  strength: number;
  radius: number;
  threshold: number;
}

export const DEFAULT_BLOOM: BloomParams = { strength: 0.45, radius: 0.6, threshold: 0.85 };

/** Vignette + Color Grading 合一最终 pass（最便宜的电影感组合） */
const VIGNETTE_GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.35 }, // 0=关
    uSaturation: { value: 1.0 }, // 1=原始
    uWarmth: { value: 0.0 }, // -1 冷 → +1 暖
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uSaturation;
    uniform float uWarmth;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - uVignette * smoothstep(0.35, 0.78, d);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, uSaturation);
      c.r *= 1.0 + uWarmth * 0.08;
      c.b *= 1.0 - uWarmth * 0.08;
      gl_FragColor = c;
    }
  `,
};

export interface DoFParams {
  focus: number;
  aperture: number;
  maxblur: number;
}

export const DEFAULT_DOF: DoFParams = { focus: 6.0, aperture: 0.0008, maxblur: 0.008 };

export class EffectManager {
  readonly composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private renderPass: RenderPass;
  private bloomEnabled = false;
  private output: OutputPass;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  // 懒加载 pass（开启才创建，控制 GPU 开销）
  private ssao: GTAOPass | null = null;
  private ssaoEnabled = false;
  private dof: BokehPass | null = null;
  private dofEnabled = false;
  private vignette: ShaderPass | null = null;
  private vignetteParams = { uVignette: 0.35, uSaturation: 1.0, uWarmth: 0.0 };
  private vignetteEnabled = false;

  private rendererRef: THREE.WebGLRenderer;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    bloom: BloomParams = DEFAULT_BLOOM,
  ) {
    this.rendererRef = renderer;
    const size = renderer.getSize(new THREE.Vector2());
    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(size, bloom.strength, bloom.radius, bloom.threshold);
    this.composer.addPass(this.bloom);
    this.output = new OutputPass();
    this.composer.addPass(this.output);
    this.scene = scene;
    this.camera = camera;
  }

  /** 场景切换时更新渲染目标（SceneManager 场景组归属变化） */
  setScene(scene: THREE.Scene): void {
    this.renderPass.scene = scene;
    this.scene = scene;
  }

  setBloom(enabled: boolean, params?: Partial<BloomParams>): void {
    this.bloomEnabled = enabled;
    if (params?.strength !== undefined) this.bloom.strength = params.strength;
    if (params?.radius !== undefined) this.bloom.radius = params.radius;
    if (params?.threshold !== undefined) this.bloom.threshold = params.threshold;
  }

  get isBloomEnabled(): boolean {
    return this.bloomEnabled;
  }

  /** GTAO 环境光遮蔽（最贵；桌面 HIGH 档专用）。懒构建 */
  setSSAO(enabled: boolean): void {
    if (enabled && !this.ssao) {
      const size = new THREE.Vector2();
      this.rendererRef.getSize(size);
      this.ssao = new GTAOPass(this.scene, this.camera, size.x, size.y);
      // 插在 bloom 之前（AO 属几何增强，应在光效前完成）
      const bloomIdx = this.composer.passes.indexOf(this.bloom);
      this.composer.insertPass(this.ssao, bloomIdx);
    }
    if (this.ssao) this.ssao.enabled = enabled;
    this.ssaoEnabled = enabled;
  }

  get isSSAOEnabled(): boolean {
    return this.ssaoEnabled;
  }

  /** Depth of Field（Bokeh）。focus=对焦距离（世界单位） */
  setDOF(enabled: boolean, params?: Partial<DoFParams>): void {
    if (enabled && !this.dof) {
      const p = { ...DEFAULT_DOF, ...params };
      this.dof = new BokehPass(this.scene, this.camera, {
        focus: p.focus,
        aperture: p.aperture,
        maxblur: p.maxblur,
      });
      const bloomIdx = this.composer.passes.indexOf(this.bloom);
      this.composer.insertPass(this.dof, bloomIdx + 1);
    }
    if (this.dof) this.dof.enabled = enabled;
    this.dofEnabled = enabled;
  }

  get isDOFEnabled(): boolean {
    return this.dofEnabled;
  }

  /** Vignette + 饱和度 + 暖冷（最便宜的电影感终帧）。vignette 0=关 */
  setVignette(
    enabled: boolean,
    params?: { vignette?: number; saturation?: number; warmth?: number },
  ): void {
    if (enabled && !this.vignette) {
      this.vignette = new ShaderPass(VIGNETTE_GRADE_SHADER);
      this.composer.insertPass(this.vignette, this.composer.passes.indexOf(this.output));
    }
    if (this.vignette) {
      if (params?.vignette !== undefined) this.vignetteParams.uVignette = params.vignette;
      if (params?.saturation !== undefined) this.vignetteParams.uSaturation = params.saturation;
      if (params?.warmth !== undefined) this.vignetteParams.uWarmth = params.warmth;
      Object.assign(this.vignette.uniforms, this.vignetteParams);
    }
    this.vignetteEnabled = enabled;
    if (this.vignette) this.vignette.enabled = enabled;
  }

  get isVignetteEnabled(): boolean {
    return this.vignetteEnabled;
  }

  setSize(w: number, h: number): void {
    this.composer.setSize(w, h);
    this.ssao?.setSize(w, h);
  }

  render(): void {
    this.composer.render();
  }

  dispose(): void {
    this.composer.dispose();
  }
}
