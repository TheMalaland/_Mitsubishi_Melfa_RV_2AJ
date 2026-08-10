import { Canvas, useThree } from '@react-three/fiber';
import { Grid, OrbitControls, Line, ContactShadows } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RobotArm } from './RobotArm';
import { toScene } from './RobotArm';
import type { JointAngles } from '../kinematics/constants';
import type { Vec3 } from '../kinematics/forwardKinematics';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { PauseIcon, PlayIcon } from './icons';

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
  dark: { background: 'radial-gradient(ellipse at 50% 30%, #221f19 0%, #100f0c 75%)' },
  light: { background: 'radial-gradient(ellipse at 50% 30%, #f0eee3 0%, #d6d2c1 100%)' },
  studio: { background: 'radial-gradient(ellipse at 50% 20%, #ffffff 0%, #cfccc0 100%)' },
  blueprint: { background: 'linear-gradient(160deg, #0c2340 0%, #0a1a30 100%)' },
};

const GRID_COLORS: Record<BgPreset, { cell: string; section: string }> = {
  dark: { cell: '#332f26', section: '#4a4536' },
  light: { cell: '#c2bda9', section: '#9d977e' },
  studio: { cell: '#d6d3c6', section: '#aeaa98' },
  blueprint: { cell: '#25507f', section: '#3f7ab8' },
};

const SWATCH_PREVIEW: Record<BgPreset, string> = {
  dark: 'linear-gradient(135deg, #221f19, #100f0c)',
  light: 'linear-gradient(135deg, #f0eee3, #d6d2c1)',
  studio: 'linear-gradient(135deg, #ffffff, #cfccc0)',
  blueprint: 'linear-gradient(135deg, #0c2340, #3f7ab8)',
};

const SWATCH_LABEL_KEY: Record<BgPreset, TranslationKey> = {
  dark: 'viewerBgDark',
  light: 'viewerBgLight',
  studio: 'viewerBgStudio',
  blueprint: 'viewerBgBlueprint',
};

// Soft studio-style reflections on the robot's glossy clearcoat material,
// generated from a procedural room (three's bundled RoomEnvironment) instead
// of a fetched HDRI — keeps this working with no network access, which
// matters for the sandboxed single-file artifact build.
function StudioReflections() {
  const { gl, scene } = useThree();
  const room = useMemo(() => new RoomEnvironment(), []);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    return () => {
      target.texture.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene, room]);

  return null;
}

// The robot's native frame is Z-up (matches the DH/MATLAB convention), so
// the camera and floor grid are set up in Z-up too, instead of remapping
// the robot into a Y-up scene — that remapping would need every mesh
// rotation conjugated by the change of basis to avoid mirroring the
// (asymmetric) CAD parts.
export function Scene3D({ joints, pathPoints, targetPoint, theme, demo, onToggleDemo }: Scene3DProps) {
  const { t } = useLanguage();
  const [bg, setBg] = useState<BgPreset>(theme === 'dark' ? 'dark' : 'light');
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  // Studio/blueprint are explicit choices that persist across the theme
  // toggle; the plain dark/light backdrop follows the header theme.
  useEffect(() => {
    setBg((prev) => (prev === 'dark' || prev === 'light' ? (theme === 'dark' ? 'dark' : 'light') : prev));
  }, [theme]);

  const grid = GRID_COLORS[bg];

  return (
    <div style={{ position: 'absolute', inset: 0, ...BG_STYLE[bg] }}>
      <Canvas shadows gl={{ alpha: true, antialias: true }} camera={{ position: [8, -8, 6], up: [0, 0, 1], fov: 45, near: 0.05, far: 100 }}>
        <StudioReflections />

        <ambientLight intensity={bg === 'dark' || bg === 'blueprint' ? 0.45 : 0.6} />
        <directionalLight
          position={[5, -4, 8]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-4, 5, 4]} intensity={0.45} />
        <directionalLight position={[0, -6, 1]} intensity={0.2} />

        <ContactShadows
          position={[0, 0, -0.095]}
          rotation={[0, 0, 0]}
          opacity={0.55}
          scale={12}
          blur={2.2}
          far={3}
          resolution={512}
          color="#000000"
        />

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
          <RobotArm joints={joints} onReady={() => setModelReady(true)} />
        </Suspense>

        {pathPoints && pathPoints.length > 1 && (
          <Line points={pathPoints.map((p) => toScene(p))} color="#52e0c4" lineWidth={1.5} dashed={false} />
        )}

        {targetPoint && (
          <mesh position={toScene(targetPoint)}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#ff8a1f" />
          </mesh>
        )}

        <OrbitControls
          target={[0, 0, 4]}
          minDistance={2}
          maxDistance={30}
          enableDamping
          dampingFactor={0.08}
          autoRotate={demo}
          autoRotateSpeed={1.1}
        />
      </Canvas>

      <a className="viewer-credit" href="https://themalaland.github.io/dev" target="_blank" rel="noopener noreferrer">
        {t('creditText')}
      </a>

      {!modelReady && (
        <div className="viewer-loading">
          <div className="viewer-loading-bar">
            <span />
          </div>
          <p>{t('viewerLoading')}</p>
        </div>
      )}

      <button
        type="button"
        className="icon-toggle viewer-controls-toggle"
        title={controlsCollapsed ? t('viewerControlsExpand') : t('viewerControlsCollapse')}
        onClick={() => setControlsCollapsed((c) => !c)}
      >
        {controlsCollapsed ? '◂' : '▸'}
      </button>

      {!controlsCollapsed && (
        <div className="viewer-controls">
          <div className="viewer-controls-group">
            {(Object.keys(SWATCH_PREVIEW) as BgPreset[]).map((p) => (
              <button
                key={p}
                type="button"
                title={t(SWATCH_LABEL_KEY[p])}
                aria-label={t(SWATCH_LABEL_KEY[p])}
                className={p === bg ? 'viewer-swatch active' : 'viewer-swatch'}
                style={{ background: SWATCH_PREVIEW[p] }}
                onClick={() => setBg(p)}
              />
            ))}
          </div>
          <button type="button" className={demo ? 'viewer-demo-btn active' : 'viewer-demo-btn'} onClick={onToggleDemo}>
            {demo ? <PauseIcon /> : <PlayIcon />}
            {demo ? t('viewerDemoStop') : t('viewerDemoPlay')}
          </button>
        </div>
      )}
    </div>
  );
}
