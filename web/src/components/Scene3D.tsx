import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, Line } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import { RobotArm } from './RobotArm';
import { toScene } from './RobotArm';
import type { JointAngles } from '../kinematics/constants';
import type { Vec3 } from '../kinematics/forwardKinematics';

export interface Scene3DProps {
  joints: JointAngles;
  pathPoints?: Vec3[];
  targetPoint?: Vec3 | null;
  theme: 'dark' | 'light';
  demo: boolean;
  onToggleDemo: () => void;
}

type BgPreset = 'dark' | 'light' | 'studio' | 'blueprint';

const BG_STYLE: Record<BgPreset, { background: string }> = {
  dark: { background: 'radial-gradient(ellipse at 50% 30%, #1c1f29 0%, #0b0c11 75%)' },
  light: { background: 'radial-gradient(ellipse at 50% 30%, #f5f6f8 0%, #dbdfe6 100%)' },
  studio: { background: 'radial-gradient(ellipse at 50% 20%, #ffffff 0%, #c9ccd3 100%)' },
  blueprint: { background: 'linear-gradient(160deg, #0c2340 0%, #0a1a30 100%)' },
};

const GRID_COLORS: Record<BgPreset, { cell: string; section: string }> = {
  dark: { cell: '#2a2f3d', section: '#3d4457' },
  light: { cell: '#c3c9d4', section: '#9aa3b5' },
  studio: { cell: '#d6d9de', section: '#aeb3bd' },
  blueprint: { cell: '#25507f', section: '#3f7ab8' },
};

const SWATCH_PREVIEW: Record<BgPreset, string> = {
  dark: 'linear-gradient(135deg, #1c1f29, #0b0c11)',
  light: 'linear-gradient(135deg, #f5f6f8, #dbdfe6)',
  studio: 'linear-gradient(135deg, #ffffff, #c9ccd3)',
  blueprint: 'linear-gradient(135deg, #0c2340, #3f7ab8)',
};

const SWATCH_LABEL: Record<BgPreset, string> = {
  dark: 'Oscuro',
  light: 'Claro',
  studio: 'Estudio',
  blueprint: 'Plano técnico',
};

// The robot's native frame is Z-up (matches the DH/MATLAB convention), so
// the camera and floor grid are set up in Z-up too, instead of remapping
// the robot into a Y-up scene — that remapping would need every mesh
// rotation conjugated by the change of basis to avoid mirroring the
// (asymmetric) CAD parts.
export function Scene3D({ joints, pathPoints, targetPoint, theme, demo, onToggleDemo }: Scene3DProps) {
  const [bg, setBg] = useState<BgPreset>(theme === 'dark' ? 'dark' : 'light');

  // Studio/blueprint are explicit choices that persist across the theme
  // toggle; the plain dark/light backdrop follows the header theme.
  useEffect(() => {
    setBg((prev) => (prev === 'dark' || prev === 'light' ? (theme === 'dark' ? 'dark' : 'light') : prev));
  }, [theme]);

  const grid = GRID_COLORS[bg];

  return (
    <div style={{ position: 'absolute', inset: 0, ...BG_STYLE[bg] }}>
      <Canvas shadows gl={{ alpha: true, antialias: true }} camera={{ position: [8, -8, 6], up: [0, 0, 1], fov: 45, near: 0.05, far: 100 }}>
        <ambientLight intensity={bg === 'dark' || bg === 'blueprint' ? 0.55 : 0.75} />
        <directionalLight
          position={[5, -4, 8]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-4, 5, 3]} intensity={0.3} />

        <Grid
          position={[0, 0, -0.1]}
          rotation={[Math.PI / 2, 0, 0]}
          args={[12, 12]}
          cellSize={0.5}
          cellColor={grid.cell}
          sectionSize={2}
          sectionColor={grid.section}
          fadeDistance={20}
          infiniteGrid
        />

        <Suspense fallback={null}>
          <RobotArm joints={joints} />
        </Suspense>

        {pathPoints && pathPoints.length > 1 && (
          <Line points={pathPoints.map((p) => toScene(p))} color="#2f6fed" lineWidth={1.5} dashed={false} />
        )}

        {targetPoint && (
          <mesh position={toScene(targetPoint)}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#ff4d6d" />
          </mesh>
        )}

        <OrbitControls target={[0, 0, 4]} minDistance={2} maxDistance={30} enableDamping dampingFactor={0.08} />
      </Canvas>

      <div className="viewer-controls">
        <div className="viewer-controls-group">
          {(Object.keys(SWATCH_PREVIEW) as BgPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              title={SWATCH_LABEL[p]}
              aria-label={SWATCH_LABEL[p]}
              className={p === bg ? 'viewer-swatch active' : 'viewer-swatch'}
              style={{ background: SWATCH_PREVIEW[p] }}
              onClick={() => setBg(p)}
            />
          ))}
        </div>
        <button type="button" className={demo ? 'viewer-demo-btn active' : 'viewer-demo-btn'} onClick={onToggleDemo}>
          {demo ? '⏸ Detener demo' : '▶ Demo'}
        </button>
      </div>
    </div>
  );
}
