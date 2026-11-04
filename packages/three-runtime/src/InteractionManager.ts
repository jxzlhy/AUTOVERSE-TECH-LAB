/**
 * InteractionManager — Raycast 拾取 / 悬停 / 选中（PART 7）
 * 对已注册的可拾取对象做射线检测；悬停微高亮、选中超高亮（emissive 方案，还原可靠）。
 */
import * as THREE from "three";
import { Emitter } from "./emitter";

export type InteractionEvents = {
  hover: { object: THREE.Object3D | null };
  select: { object: THREE.Object3D | null };
};

interface HoverState {
  emissive: THREE.Color;
  emissiveIntensity: number;
}

const HOVER_TINT = 0x22d3ee;
const SELECT_TINT = 0xf59e0b;

export class InteractionManager {
  readonly events = new Emitter<InteractionEvents>();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pickables: THREE.Object3D[] = [];
  private hovered: THREE.Mesh | null = null;
  private selected: THREE.Mesh | null = null;
  private saved = new Map<THREE.Mesh, HoverState>();
  private canvas: HTMLCanvasElement;
  private camera: THREE.Camera;
  private enabled = true;

  constructor(canvas: HTMLCanvasElement, camera: THREE.Camera) {
    this.canvas = canvas;
    this.camera = camera;
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("click", this.onClick);
  }

  setPickables(...roots: THREE.Object3D[]): void {
    this.pickables = [];
    for (const root of roots) {
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.visible) this.pickables.push(mesh);
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.setHovered(null);
  }

  private pick(event: PointerEvent | MouseEvent): THREE.Mesh | null {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    return (hits[0]?.object as THREE.Mesh) ?? null;
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return;
    this.setHovered(this.pick(event));
  };

  private onClick = (event: MouseEvent): void => {
    if (!this.enabled) return;
    const hit = this.pick(event);
    this.setSelected(hit && hit === this.selected ? null : hit);
  };

  private saveState(mesh: THREE.Mesh): HoverState {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    return {
      emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0),
      emissiveIntensity: mat.emissiveIntensity ?? 1,
    };
  }

  private tint(mesh: THREE.Mesh | null, color: number, intensity: number): void {
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (!mat.emissive) return;
    mat.emissive.set(color);
    mat.emissiveIntensity = intensity;
  }

  private restore(mesh: THREE.Mesh): void {
    const state = this.saved.get(mesh);
    if (!state) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat.emissive) {
      mat.emissive.copy(state.emissive);
      mat.emissiveIntensity = state.emissiveIntensity;
    }
    this.saved.delete(mesh);
  }

  private setHovered(mesh: THREE.Mesh | null): void {
    if (mesh === this.hovered) return;
    if (this.hovered && this.hovered !== this.selected) {
      this.restore(this.hovered);
      this.events.emit("hover", { object: null });
    }
    this.hovered = mesh;
    if (mesh && mesh !== this.selected) {
      this.saved.set(mesh, this.saveState(mesh));
      this.tint(mesh, HOVER_TINT, 0.35);
      this.events.emit("hover", { object: mesh });
    }
  }

  private setSelected(mesh: THREE.Mesh | null): void {
    if (mesh === this.selected) return;
    if (this.selected) {
      this.restore(this.selected);
      if (this.selected === this.hovered) {
        this.saved.set(this.selected, this.saveState(this.selected));
        this.tint(this.selected, HOVER_TINT, 0.35);
      }
    }
    this.selected = mesh;
    if (mesh) {
      this.restore(mesh); // 先清 hover 态存档
      this.saved.set(mesh, this.saveState(mesh));
      this.tint(mesh, SELECT_TINT, 0.55);
    }
    this.events.emit("select", { object: mesh });
  }

  dispose(): void {
    if (this.hovered) this.restore(this.hovered);
    if (this.selected) this.restore(this.selected);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("click", this.onClick);
    this.events.clear();
  }
}
