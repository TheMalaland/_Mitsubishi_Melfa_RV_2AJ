import { useEffect, useMemo, useState } from 'react';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import * as THREE from 'three';
import { forwardKinematics } from '../kinematics/forwardKinematics';
import type { JointAngles } from '../kinematics/constants';
import type { Mat4, Vec3 } from '../kinematics/forwardKinematics';
import { MESH_RIG } from './meshRig';

// mm -> scene units. The scene keeps the robot's native Z-up convention
// (camera.up and the floor grid are set up to match in Scene3D), so this is
// a plain scale with no axis permutation.
export const MM_TO_UNIT = 0.01;
// The STL files (public/models/*.stl) are exported in meters; convert to
// scene units on top of the per-part mm-based rig scale.
const STL_METERS_TO_SCENE = 1000 * MM_TO_UNIT;

export function toScene(v: Vec3): [number, number, number] {
  return [v.x * MM_TO_UNIT, v.y * MM_TO_UNIT, v.z * MM_TO_UNIT];
}

function quatFromMat4(m: Mat4): THREE.Quaternion {
  const mat = new THREE.Matrix4().set(...(m as unknown as Parameters<THREE.Matrix4['set']>));
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  mat.decompose(pos, quat, scl);
  return quat;
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
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
    </mesh>
  );
}

// The CAD parts don't quite meet edge-to-edge at every axis (their true
// mating surface is slightly inset from the bounding box this rig scales
// against), which leaves a hairline gap at a couple of joints. A small
// collar hides that seam and doubles as a plausible bearing housing.
function JointCollar({ at, radius, color }: { at: Vec3; radius: number; color: string }) {
  return (
    <mesh position={toScene(at)}>
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.5} />
    </mesh>
  );
}

// A real RV-2AJ has a visible cable bundle running along the outside of the
// arm from the base to the wrist — without it the bare CAD links read as an
// unfinished skeleton. This traces a soft tube through each joint, offset
// to one side using that joint's own frame so it rides along consistently
// as the arm moves, rather than cutting straight through the links.
function CableBundle({ fk }: { fk: ReturnType<typeof forwardKinematics> }) {
  const curve = useMemo(() => {
    const sideOffset = (originIdx: 0 | 1 | 2 | 3 | 4 | 5, matIdx: 0 | 1 | 2 | 3 | 4 | 5, distanceMm: number) => {
      const origin = fk.origins[originIdx];
      const m = new THREE.Matrix4().set(...(fk.matrices[matIdx] as unknown as Parameters<THREE.Matrix4['set']>));
      const side = new THREE.Vector3(0, 1, 0).transformDirection(m);
      const p = new THREE.Vector3(...toScene(origin));
      p.addScaledVector(side, distanceMm * MM_TO_UNIT);
      return p;
    };

    const base = sideOffset(0, 0, 92).setZ(0.9);
    const points = [base, sideOffset(1, 1, 80), sideOffset(2, 2, 62), sideOffset(3, 3, 44)];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3);
  }, [fk]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 48, 0.045, 10, false]} />
      <meshStandardMaterial color="#1c1e24" metalness={0.1} roughness={0.75} />
    </mesh>
  );
}

function ToolGizmo({ matrix }: { matrix: Mat4 }) {
  const m = useMemo(() => new THREE.Matrix4().set(...(matrix as unknown as Parameters<THREE.Matrix4['set']>)), [matrix]);
  const origin = new THREE.Vector3().setFromMatrixPosition(m);
  const axisX = new THREE.Vector3(1, 0, 0).transformDirection(m);
  const axisY = new THREE.Vector3(0, 1, 0).transformDirection(m);
  const axisZ = new THREE.Vector3(0, 0, 1).transformDirection(m);
  const scale = 60; // mm
  const tip = (axis: THREE.Vector3): Vec3 => ({
    x: origin.x + axis.x * scale,
    y: origin.y + axis.y * scale,
    z: origin.z + axis.z * scale,
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

// Standalone single-file builds (e.g. the published artifact) can supply
// embedded data: URIs here instead of separate network requests — parsed
// directly from base64 below, never fetched, since sandboxed hosts can
// block fetch()/XHR against data: URIs even though the URI itself is inert.
declare global {
  interface Window {
    __MODEL_ASSETS__?: Record<string, string>;
  }
}

function decodeBase64DataUri(dataUri: string): ArrayBuffer {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function useRigGeometries(): THREE.BufferGeometry[] | null {
  const [geometries, setGeometries] = useState<THREE.BufferGeometry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new STLLoader();

    Promise.all(
      MESH_RIG.map(async (p) => {
        const embedded = window.__MODEL_ASSETS__?.[p.file];
        if (embedded) {
          return loader.parse(decodeBase64DataUri(embedded));
        }
        const res = await fetch(`/models/${p.file}`);
        const buffer = await res.arrayBuffer();
        return loader.parse(buffer);
      })
    ).then((geoms) => {
      if (!cancelled) setGeometries(geoms);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return geometries;
}

function RigPart({
  index,
  geometry,
  fk,
  j1Rad,
}: {
  index: number;
  geometry: THREE.BufferGeometry;
  fk: ReturnType<typeof forwardKinematics>;
  j1Rad: number;
}) {
  const entry = MESH_RIG[index];

  const { position, quaternion, scale } = useMemo(() => {
    let pos: Vec3;
    let quat: THREE.Quaternion;
    if (entry.baseSpinOnly) {
      pos = { x: 0, y: 0, z: 0 };
      quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), j1Rad);
    } else {
      pos = fk.origins[entry.positionFrame];
      quat = quatFromMat4(fk.matrices[entry.rotationFrame]);
    }
    if (entry.mountEuler) {
      quat = quat.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...entry.mountEuler)));
    }
    const s = STL_METERS_TO_SCENE;
    return {
      position: new THREE.Vector3(...toScene(pos)),
      quaternion: quat,
      scale: new THREE.Vector3(s, s, s * (entry.scaleZ ?? 1)),
    };
  }, [entry, fk, j1Rad]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh geometry={geometry} scale={scale} castShadow receiveShadow>
        <meshStandardMaterial color={entry.color} metalness={0.25} roughness={0.55} />
      </mesh>
    </group>
  );
}

export interface RobotArmProps {
  joints: JointAngles;
  showToolAxes?: boolean;
}

export function RobotArm({ joints, showToolAxes = true }: RobotArmProps) {
  const fk = useMemo(() => forwardKinematics(joints), [joints]);
  const geometries = useRigGeometries();
  const j1Rad = (joints.j1 * Math.PI) / 180;

  if (!geometries) return null;

  const [, O1, O2, O3] = fk.origins;

  return (
    <group>
      {MESH_RIG.map((entry, i) => (
        <RigPart key={entry.file} index={i} geometry={geometries[i]} fk={fk} j1Rad={j1Rad} />
      ))}

      <JointCollar at={O1} radius={0.1} color="#3a3f4b" />
      <JointCollar at={O2} radius={0.095} color="#3a3f4b" />
      <JointCollar at={O3} radius={0.075} color="#3a3f4b" />

      <CableBundle fk={fk} />

      {showToolAxes && <ToolGizmo matrix={fk.matrix} />}
    </group>
  );
}
