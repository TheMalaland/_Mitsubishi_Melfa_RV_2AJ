// Mitsubishi Melfa RV-2AJ link lengths (mm), ported from GetDHParameters.m /
// JacobianMelfa.m / melfa_invk.m in the original MATLAB project.
export const LINK = {
  L1: 300, // base -> shoulder height
  L2: 250, // shoulder -> elbow (upper arm)
  L3: 160, // elbow -> wrist (forearm)
  L4: 72, // wrist -> tool flange
};

export interface JointAngles {
  j1: number; // base rotation
  j2: number; // shoulder pitch
  j3: number; // elbow pitch
  j4: number; // wrist pitch
  j5: number; // wrist roll
}

// Joint limits (degrees), ported from the range checks in melfa_invk.m.
export const JOINT_LIMITS: Record<keyof JointAngles, [number, number]> = {
  j1: [-150, 150],
  j2: [-60, 120],
  j3: [-110, 120],
  j4: [-90, 90],
  j5: [-200, 200],
};

export const HOME_JOINTS: JointAngles = { j1: 0, j2: 0, j3: 0, j4: 0, j5: 0 };
