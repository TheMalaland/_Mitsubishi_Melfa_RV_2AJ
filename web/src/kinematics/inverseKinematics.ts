import { JOINT_LIMITS, LINK, type JointAngles } from './constants';

const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

export interface InverseKinematicsInput {
  x: number;
  y: number;
  z: number;
  /** Tool roll about the approach vector, degrees. */
  alpha: number;
  /** Wrist pitch relative to horizontal, degrees. */
  beta: number;
}

export type InverseKinematicsResult =
  | { ok: true; joints: JointAngles }
  | { ok: false; errorCode: 'workspace' }
  | { ok: false; errorCode: 'jointRange'; joint: keyof JointAngles; value: number; min: number; max: number };

function outOfRange(name: keyof JointAngles, value: number): boolean {
  const [min, max] = JOINT_LIMITS[name];
  return value < min || value > max;
}

/**
 * Geometric inverse kinematics for the 5-DOF Melfa RV-2AJ arm, ported from
 * melfa_invk.m. Returns a workspace/reach error instead of the original's
 * silent zeroed output, and range-checks every joint against melfa_invk.m's
 * limits.
 */
export function inverseKinematics({ x, y, z, alpha, beta }: InverseKinematicsInput): InverseKinematicsResult {
  const alphaRad = deg2rad(alpha);
  const betaRad = deg2rad(beta);
  const { L1, L2, L3, L4 } = LINK;

  const theta1 = Math.atan2(y, x);
  const r = Math.sqrt(x * x + y * y);

  const anguloHorizontal = -betaRad + Math.PI / 2;
  const a = L4 * Math.cos(anguloHorizontal);
  const b = L4 * Math.sin(anguloHorizontal);

  const c = Math.sqrt((r - a) ** 2 + (z - b - L1) ** 2);
  const cosC = (L2 ** 2 + L3 ** 2 - c ** 2) / (2 * L2 * L3);
  if (Math.abs(cosC) > 1) {
    return { ok: false, errorCode: 'workspace' };
  }
  const senC = Math.sqrt(1 - cosC ** 2);
  const theta3 = Math.PI - Math.atan2(senC, cosC);

  const gamma = Math.atan2(z - b - L1, r - a);
  const senA = (L3 * senC) / c;
  const cosA = Math.sqrt(1 - senA ** 2);
  const theta2 = Math.PI / 2 - Math.atan2(senA, cosA) - gamma;

  const theta4 = betaRad - theta2 - theta3; // wrist pitch
  const theta5 = alphaRad - theta1 * Math.cos(betaRad); // wrist roll

  const joints: JointAngles = {
    j1: rad2deg(theta1),
    j2: rad2deg(theta2),
    j3: rad2deg(theta3),
    j4: rad2deg(theta4),
    j5: rad2deg(theta5),
  };

  for (const key of Object.keys(joints) as (keyof JointAngles)[]) {
    if (outOfRange(key, joints[key])) {
      const [min, max] = JOINT_LIMITS[key];
      return { ok: false, errorCode: 'jointRange', joint: key, value: joints[key], min, max };
    }
  }

  return { ok: true, joints };
}
