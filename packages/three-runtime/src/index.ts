export * from "./types";
export * from "./emitter";
export {
  disposeObject3D,
  disposeMaterialTextures,
  disposeRenderTarget,
  createListenerTracker,
  ResourceLedger,
  type DisposalReport,
} from "./ResourceDisposer";
export { SceneManager } from "./SceneManager";
export { AssetManager, AssetRegistry, computeGlbStats } from "./AssetManager";
export { LIGHT_PRESETS, LightingManager, type LightPresetId } from "./LightingManager";
export { CameraController, framingForBox, type CameraViewPreset } from "./CameraController";
export { InteractionManager, type InteractionEvents } from "./InteractionManager";
export { EffectManager, DEFAULT_BLOOM, type BloomParams } from "./EffectManager";
export { PerformanceMonitor } from "./PerformanceMonitor";
export { AnimationManager } from "./AnimationManager";
export {
  makeXRayMaterial,
  makeDissolveMaterial,
  makeEnergyFlowMaterial,
  type ShaderHandle,
} from "./shader-library";
