import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, Line } from '@react-three/drei';
import { RobotArm } from './RobotArm';
import { toScene } from './RobotArm';
import type { JointAngles } from '../kinematics/constants';
import type { Vec3 } from '../kinematics/forwardKinematics';

export interface Scene3DProps {
  joints: JointAngles;
  pathPoints?: Vec3[];
  targetPoint?: Vec3 | null;
}

export function Scene3D({ joints, pathPoints, targetPoint }: Scene3DProps) {
  return (
    <Canvas shadows camera={{ position: [6, 5, 6], fov: 45, near: 0.05, far: 100 }}>
      <color attach="background" args={['#12141c']} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 3, -5]} intensity={0.3} />

      <Grid
        position={[0, -0.1, 0]}
        args={[12, 12]}
        cellSize={0.5}
        cellColor="#2a2f3d"
        sectionSize={2}
        sectionColor="#3d4457"
        fadeDistance={20}
        infiniteGrid
      />

      <RobotArm joints={joints} />

      {pathPoints && pathPoints.length > 1 && (
        <Line points={pathPoints.map((p) => toScene(p))} color="#57c7ff" lineWidth={1.5} dashed={false} />
      )}

      {targetPoint && (
        <mesh position={toScene(targetPoint)}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#ff4d6d" />
        </mesh>
      )}

      <OrbitControls target={[0, 3.5, 0]} minDistance={2} maxDistance={30} enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
