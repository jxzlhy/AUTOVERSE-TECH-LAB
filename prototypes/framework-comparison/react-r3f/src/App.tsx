import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Car, Metrics, PAINT_PRESETS, RoomEnv, statsChannel, type StudioStats } from "./scene";
import "./style.css";

export default function App() {
  const [paintId, setPaintId] = useState<(typeof PAINT_PRESETS)[number]["id"]>(PAINT_PRESETS[0].id);
  const [stats, setStats] = useState<StudioStats>(statsChannel.current);

  // 从模块通道轮询指标（与 vue-three 的 0.5s 聚合节奏一致）
  useEffect(() => {
    const t = setInterval(() => setStats(statsChannel.current), 500);
    return () => clearInterval(t);
  }, []);

  const paintColor = PAINT_PRESETS.find((p) => p.id === paintId)!.color;

  return (
    <main className="stage">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [6.2, 2.6, 6.2], fov: 40, near: 0.1, far: 200 }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.0;
        }}
      >
        <color attach="background" args={["#05070D"]} />
        <RoomEnv />
        <Metrics />

        <directionalLight
          position={[5, 8, 3]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[-6, 4, -5]} intensity={0.6} color="#22d3ee" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[30, 64]} />
          <meshStandardMaterial color="#0A0F1A" roughness={0.85} metalness={0.1} />
        </mesh>

        <Car paintColor={paintColor} />

        <OrbitControls
          makeDefault
          target={[0, 0.8, 0]}
          enableDamping
          minDistance={3.5}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      </Canvas>

      <header className="hud hud-top">
        <span className="hud-kicker">AUTOVERSE TECH LAB</span>
        <h1 className="hud-title">
          摄影棚基线 ｜ <span className="route">React 19.3 + R3F 9.8</span>
        </h1>
      </header>

      <footer className="hud hud-bottom">
        <div className="paints" role="group" aria-label="车漆预设">
          {PAINT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`paint-btn${paintId === p.id ? " active" : ""}`}
              style={{ "--paint": p.color } as React.CSSProperties}
              onClick={() => setPaintId(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="stats" aria-live="off">
          <span className="stat">
            <em>{stats.fps}</em> FPS
          </span>
          <span className="stat">
            <em>{stats.drawCalls}</em> DRAWS
          </span>
          <span className="stat">
            <em>{(stats.triangles / 1000).toFixed(1)}K</em> TRIS
          </span>
        </div>
      </footer>
    </main>
  );
}
