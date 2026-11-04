/**
 * AnimationManager — AnimationMixer 注册与播放控制（PART 6/7）
 * 每帧 update(delta) 驱动所有活动 mixer（官方要求，见 animation-systems.md）。
 */
import * as THREE from "three";

interface MixerEntry {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
}

export class AnimationManager {
  private entries = new Map<THREE.Object3D, MixerEntry>();

  register(root: THREE.Object3D, clips: THREE.AnimationClip[]): void {
    if (this.entries.has(root) || clips.length === 0) return;
    const mixer = new THREE.AnimationMixer(root);
    const actions = new Map<string, THREE.AnimationAction>();
    for (const clip of clips)
      actions.set(clip.name || `clip-${actions.size}`, mixer.clipAction(clip));
    this.entries.set(root, { mixer, actions });
  }

  play(root: THREE.Object3D, clipName?: string, opts: { loop?: boolean } = {}): void {
    const entry = this.entries.get(root);
    if (!entry) return;
    for (const [name, action] of entry.actions) {
      if (clipName === undefined || name === clipName) {
        action.reset();
        action.loop = opts.loop === false ? THREE.LoopOnce : THREE.LoopRepeat;
        action.clampWhenFinished = opts.loop === false;
        action.play();
      }
    }
  }

  stop(root: THREE.Object3D): void {
    for (const action of this.entries.get(root)?.actions.values() ?? []) action.stop();
  }

  update(delta: number): void {
    for (const { mixer } of this.entries.values()) mixer.update(delta);
  }

  unregister(root: THREE.Object3D): void {
    const entry = this.entries.get(root);
    if (!entry) return;
    entry.mixer.stopAllAction();
    entry.mixer.uncacheRoot(root);
    this.entries.delete(root);
  }
}
