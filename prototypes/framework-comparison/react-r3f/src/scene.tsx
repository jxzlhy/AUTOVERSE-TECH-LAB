/**
 * AUTOVERSE TECH LAB — 摄影棚基线场景（R3F 惯用组件版）
 * 规格约束与 vue-three 一致（见 framework-comparison/README.md）。
 */
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** 设计系统语义色（docs/04-design-system §2.1 展品类型语义色） */
export const PAINT_PRESETS = [
  { id: "nexus", label: "NEXUS", color: "#22D3EE" },
  { id: "real", label: "REAL", color: "#F59E0B" },
  { id: "fiction", label: "FICTION", color: "#A78BFA" },
  { id: "concept", label: "CONCEPT", color: "#34D399" },
] as const;

export interface StudioStats {
  fps: number;
  drawCalls: number;
  triangles: number;
}

/** 模块级指标通道：Canvas 内写，Canvas 外读（避免为指标引入状态库） */
export const statsChannel: { current: StudioStats } = {
  current: { fps: 0, drawCalls: 0, triangles: 0 },
};

/** IBL：RoomEnvironment → PMREM（与 vue-three 同规格） */
export function RoomEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** 指标采集：0.5s 聚合写入 statsChannel */
export function Metrics() {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  const last = useRef(performance.now());
  useFrame(() => {
    frames.current++;
    const now = performance.now();
    if (now - last.current >= 500) {
      statsChannel.current = {
        fps: Math.round((frames.current * 1000) / (now - last.current)),
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      };
      frames.current = 0;
      last.current = now;
    }
  });
  return null;
}

/** 程序化车辆：转台组 + 车漆预设切换 */
export function Car({ paintColor }: { paintColor: string }) {
  const turntable = useRef<THREE.Group>(null);
  const paint = useRef<THREE.MeshPhysicalMaterial>(null);

  useEffect(() => {
    paint.current?.color.set(paintColor);
  }, [paintColor]);

  useFrame((_, dt) => {
    if (turntable.current) turntable.current.rotation.y += dt * 0.25;
  });

  return (
    <group ref={turntable}>
      {/* 车身 + 座舱 */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[4.4, 0.72, 1.9]} />
        <meshPhysicalMaterial
          ref={paint}
          color={PAINT_PRESETS[0].color}
          metalness={0.9}
          roughness={0.35}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
        />
      </mesh>
      <mesh position={[-0.25, 1.4, 0]} castShadow>
        <boxGeometry args={[2.3, 0.58, 1.7]} />
        <meshPhysicalMaterial color="#0B1220" metalness={0.1} roughness={0.08} transparent opacity={0.72} />
      </mesh>
      {/* 四轮 + 轮毂 */}
      {(
        [
          [1.45, 0.95],
          [1.45, -0.95],
          [-1.45, 0.95],
          [-1.45, -0.95],
        ] as const
      ).map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0.42, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.34, 32]} />
            <meshStandardMaterial color="#111318" roughness={0.95} metalness={0} />
          </mesh>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.36, 16]} />
            <meshStandardMaterial color="#0F172A" roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
