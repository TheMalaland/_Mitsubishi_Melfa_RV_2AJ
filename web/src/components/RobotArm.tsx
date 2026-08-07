import { useMemo } from 'react';
import * as THREE from 'three';
import { forwardKinematics } from '../kinematics/forwardKinematics';
import type { JointAngles } from '../kinematics/constants';
import type { Vec3 } from '../kinematics/forwardKinematics';

// mm -> scene units (keeps the viewport in small, camera-friendly numbers)
export const MM_TO_UNIT = 0.01;

export function toScene(v: Vec3): [number, number, number] {
  // Robot Z (up) -> three.js Y (up); robot X/Y stay on the ground plane.
  return [v.x * MM_TO_UNIT, v.z * MM_TO_UNIT, v.y * MM_TO_UNIT];
}

function Segment({ from, to, radius, color }: { from: Vec3; to: Vec3; radius: number; color: string }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...toScene(from));
    const b = new THREE.Vector3(...toScene(to));
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { position: mid, quaternion: quat, length: len };
  }, [from, to]);

  if (length < 1e-6) return null;

  return (
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
    </mesh>
  );
}

function JointBall({ at, radius = 0.09, color = '#e8e8e8' }: { at: Vec3; radius?: number; color?: string }) {
  return (
    <mesh position={toScene(at)} castShadow>
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
    </mesh>
  );
}

function ToolGizmo({ matrix }: { matrix: number[] }) {
  const m = useMemo(() => new THREE.Matrix4().set(...(matrix as unknown as Parameters<THREE.Matrix4['set']>)), [matrix]);
  const origin = new THREE.Vector3().setFromMatrixPosition(m);
  const axisX = new THREE.Vector3(1, 0, 0).transformDirection(m);
  const axisY = new THREE.Vector3(0, 1, 0).transformDirection(m);
  const axisZ = new THREE.Vector3(0, 0, 1).transformDirection(m);
  const scale = 1.4;
  const tip = (axis: THREE.Vector3): Vec3 => ({
    x: origin.x + axis.x * scale * (1 / MM_TO_UNIT),
    y: origin.y + axis.y * scale * (1 / MM_TO_UNIT),
    z: origin.z + axis.z * scale * (1 / MM_TO_UNIT),
  });
  const originMm: Vec3 = { x: origin.x, y: origin.y, z: origin.z };
  return (
    <group>
      <Segment from={originMm} to={tip(axisX)} radius={0.02} color="#ff5555" />
      <Segment from={originMm} to={tip(axisY)} radius={0.02} color="#55ff55" />
      <Segment from={originMm} to={tip(axisZ)} radius={0.02} color="#5599ff" />
    </group>
  );
}

export interface RobotArmProps {
  joints: JointAngles;
  showToolAxes?: boolean;
}

export function RobotArm({ joints, showToolAxes = true }: RobotArmProps) {
  const fk = useMemo(() => forwardKinematics(joints), [joints]);
  const [O0, O1, O2, O3, , O5] = fk.origins;

  return (
    <group>
      {/* Base pedestal */}
      <mesh position={toScene({ x: 0, y: 0, z: -10 })} receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.2, 32]} />
        <meshStandardMaterial color="#3a3f4b" metalness={0.5} roughness={0.4} />
      </mesh>

      <Segment from={O0} to={O1} radius={0.16} color="#5c6470" />
      <Segment from={O1} to={O2} radius={0.13} color="#2f6fed" />
      <Segment from={O2} to={O3} radius={0.11} color="#ed9a2f" />
      <Segment from={O3} to={O5} radius={0.08} color="#2fed7a" />

      <JointBall at={O1} />
      <JointBall at={O2} />
      <JointBall at={O3} />
      <JointBall at={O5} radius={0.07} color="#ffcf5c" />

      {showToolAxes && <ToolGizmo matrix={fk.matrix} />}
    </group>
  );
}
