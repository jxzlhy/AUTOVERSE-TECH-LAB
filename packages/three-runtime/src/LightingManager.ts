/**
 * LightingManager — 灯光预设（PART 7 §7.1：STUDIO/MUSEUM/NIGHT/ENGINEERING/CINEMATIC）
 * 预设为纯数据（可单测），apply 为 three 逻辑。
 * IBL：RoomEnvironment + PMREM（Phase 1 实证：车漆必须 IBL，见 F2）。
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { LightPreset } from "./types";

export const LIGHT_PRESETS: Record<string, LightPreset> = {
  STUDIO: {
    id: "STUDIO",
    label: "摄影棚",
    background: "#0A0F1A",
    envIntensity: 1.0,
    hemiIntensity: 0.15,
    key: { intensity: 2.2, color: "#FFFFFF", position: [5, 8, 3] },
    rim: { intensity: 0.6, color: "#22D3EE", position: [-6, 4, -5] },
  },
  MUSEUM: {
    id: "MUSEUM",
    label: "展馆",
    background: "#10151F",
    envIntensity: 1.15,
    hemiIntensity: 0.5,
    key: { intensity: 1.4, color: "#FFF6E8", position: [4, 9, 5] },
    rim: { intensity: 0.25, color: "#F1F5F9", position: [-5, 3, -6] },
  },
  NIGHT: {
    id: "NIGHT",
    label: "夜巡",
    background: "#05070D",
    envIntensity: 0.22,
    hemiIntensity: 0.05,
    key: { intensity: 0.9, color: "#BFD8FF", position: [6, 7, 2] },
    rim: { intensity: 1.6, color: "#22D3EE", position: [-7, 3, -4] },
  },
  ENGINEERING: {
    id: "ENGINEERING",
    label: "工程",
    background: "#0D1117",
    envIntensity: 1.3,
    hemiIntensity: 0.75,
    key: { intensity: 1.1, color: "#FFFFFF", position: [0, 10, 0] },
    rim: { intensity: 0.4, color: "#9FC7E8", position: [-4, 2, -6] },
  },
  CINEMATIC: {
    id: "CINEMATIC",
    label: "电影",
    background: "#070B12",
    envIntensity: 0.5,
    hemiIntensity: 0.1,
    key: { intensity: 3.0, color: "#FFD9A8", position: [7, 6, 4] },
    rim: { intensity: 1.1, color: "#0EA5B7", position: [-6, 5, -6] },
  },
};

export type LightPresetId = keyof typeof LIGHT_PRESETS;

export class LightingManager {
  private keyLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private pmrem: THREE.PMREMGenerator;
  private envTexture: THREE.Texture | null = null;
  private current: LightPreset;

  constructor(
    private scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    presetId: LightPresetId = "STUDIO",
  ) {
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.envTexture = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = this.envTexture;

    this.keyLight = new THREE.DirectionalLight(0xffffff, 2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.left = -8;
    this.keyLight.shadow.camera.right = 8;
    this.keyLight.shadow.camera.top = 8;
    this.keyLight.shadow.camera.bottom = -8;
    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x0a0f1a, 0.2);
    scene.add(this.keyLight, this.rimLight, this.hemi);

    this.current = LIGHT_PRESETS[presetId] ?? LIGHT_PRESETS.STUDIO;
    this.apply(this.current);
  }

  get presetId(): string {
    return this.current.id;
  }

  setPreset(id: LightPresetId): void {
    const preset = LIGHT_PRESETS[id];
    if (!preset) throw new Error(`unknown light preset: ${id}`);
    this.current = preset;
    this.apply(preset);
  }

  private apply(preset: LightPreset): void {
    const s = this.scene;
    if (s.background instanceof THREE.Color) s.background.set(preset.background);
    else s.background = new THREE.Color(preset.background);
    s.environmentIntensity = preset.envIntensity;

    this.keyLight.intensity = preset.key.intensity;
    this.keyLight.color.set(preset.key.color);
    this.keyLight.position.set(...preset.key.position);
    this.rimLight.intensity = preset.rim.intensity;
    this.rimLight.color.set(preset.rim.color);
    this.rimLight.position.set(...preset.rim.position);
    this.hemi.intensity = preset.hemiIntensity;
  }

  dispose(): void {
    this.scene.remove(this.keyLight, this.rimLight, this.hemi);
    this.envTexture?.dispose();
    this.pmrem.dispose();
    this.scene.environment = null;
  }
}
