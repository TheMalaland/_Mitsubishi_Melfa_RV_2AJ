import { LINK, type JointAngles } from './constants';
import { chain, dhTransform, translation, type Mat4 } from './mat4';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ForwardKinematicsResult {
  /** Joint origins O0 (base) through O5 (tool center point), in mm. */
  origins: [Vec3, Vec3, Vec3, Vec3, Vec3, Vec3];
  /** Tool center point position, mm. */
  position: Vec3;
  /** Wrist pitch relative to horizontal, degrees (matches MATLAB `beta`). */
  beta: number;
  /** Tool roll about the approach vector, degrees (matches MATLAB `alpha`). */
  alpha: number;
  /** Full end-effector homogeneous transform. */
  matrix: Mat4;
}

const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

/**
 * Forward kinematics for the 5-DOF Melfa RV-2AJ arm, ported from the DH
 * chain built in JacobianMelfa.m (A1..A5) and cross-checked numerically
 * against the closed-form expression in getXYZ.m.
 */
export function forwardKinematics({ j1, j2, j3, j4, j5 }: JointAngles): ForwardKinematicsResult {
  const t1 = deg2rad(j1);
  const t2 = deg2rad(j2);
  const t3 = deg2rad(j3);
  const t4 = deg2rad(j4);
  const t5 = deg2rad(j5);

  const A1 = dhTransform(t1, LINK.L1, 0, -Math.PI / 2);
  const A2 = dhTransform(t2 - Math.PI / 2, 0, LINK.L2, 0);
  const A3 = dhTransform(t3, 0, LINK.L3, 0);
  const A4 = dhTransform(t4 + Math.PI / 2, 0, 0, Math.PI / 2);
  const A5 = dhTransform(t5, LINK.L4, 0, 0);

  const [T01, T02, T03, T04, T05] = chain([A1, A2, A3, A4, A5]);

  const origins: [Vec3, Vec3, Vec3, Vec3, Vec3, Vec3] = [
    { x: 0, y: 0, z: 0 },
    translation(T01),
    translation(T02),
    translation(T03),
    translation(T04),
    translation(T05),
  ];

  const beta = j2 + j3 + j4;
  const alpha = rad2deg(t1 * Math.cos(deg2rad(beta)) + t5);

  return {
    origins,
    position: origins[5],
    beta,
    alpha,
    matrix: T05,
  };
}
