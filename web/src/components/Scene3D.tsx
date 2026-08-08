import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, Line } from '@react-three/drei';
import { Suspense } from 'react';
import { RobotArm } from './RobotArm';
import { toScene } from './RobotArm';
import type { JointAngles } from '../kinematics/constants';
import type { Vec3 } from '../kinematics/forwardKinematics';

export interface Scene3DProps {
  joints: JointAngles;
  pathPoints?: Vec3[];
  targetPoint?: Vec3 | null;
}

// The robot's native frame is Z-up (matches the DH/MATLAB convention), so
// the camera and floor grid are set up in Z-up too, instead of remapping
// the robot into a Y-up scene — that remapping would need every mesh
// rotation conjugated by the change of basis to avoid mirroring the
// (asymmetric) CAD parts.
export function Scene3D({ joints, pathPoints, targetPoint }: Scene3DProps) {
  return (
    <Canvas shadows camera={{ position: [8, -8, 6], up: [0, 0, 1], fov: 45, near: 0.05, far: 100 }}>
      <color attach="background" args={['#12141c']} />
      <ambientLight intensity={0.55} />
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
        cellColor="#2a2f3d"
        sectionSize={2}
        sectionColor="#3d4457"
        fadeDistance={20}
        infiniteGrid
      />

      <Suspense fallback={null}>
        <RobotArm joints={joints} />
      </Suspense>

      {pathPoints && pathPoints.length > 1 && (
        <Line points={pathPoints.map((p) => toScene(p))} color="#57c7ff" lineWidth={1.5} dashed={false} />
      )}

      {targetPoint && (
        <mesh position={toScene(targetPoint)}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#ff4d6d" />
        </mesh>
      )}

      <OrbitControls target={[0, 0, 4]} minDistance={2} maxDistance={30} enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
