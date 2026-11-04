/**
 * EffectManager — 后期处理（PART 7）：Bloom 开关 + 尺寸自适应。
 * r183+ 官方链路：EffectComposer + RenderPass + UnrealBloomPass + OutputPass。
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export interface BloomParams {
  strength: number;
  radius: number;
  threshold: number;
}

export const DEFAULT_BLOOM: BloomParams = { strength: 0.45, radius: 0.6, threshold: 0.85 };

export class EffectManager {
  readonly composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private bloomEnabled = false;
  private output: OutputPass;

  constructor(
    private renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    bloom: BloomParams = DEFAULT_BLOOM,
  ) {
    const size = renderer.getSize(new THREE.Vector2());
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(size, bloom.strength, bloom.radius, bloom.threshold);
    this.composer.addPass(this.bloom);
    this.output = new OutputPass();
    this.composer.addPass(this.output);
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

  setSize(w: number, h: number): void {
    this.composer.setSize(w, h);
  }

  render(): void {
    this.composer.render();
  }

  dispose(): void {
    this.composer.dispose();
  }
}
