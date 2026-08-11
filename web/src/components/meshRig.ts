import { LINK } from '../kinematics/constants';

/**
 * Attachment rig mapping the real CAD parts (public/models/*.stl, exported
 * from robot_nou.SLDASM) onto the DH joint frames computed in
 * forwardKinematics.ts.
 *
 * Each STL part is modeled in its own local coordinate system with its
 * pivot at the local origin and its "outward" direction along local +Z
 * (confirmed by inspecting each part's bounding box: baza/1brat/efector
 * start at local z=0 and extend outward; flansa ends at local z=0 and
 * extends inward). 1brat's own geometry already carries the physical
 * bend from the vertical J1 axis to the horizontal J2 axis (it was
 * modeled pre-bent), so it only needs the bare J1 spin, not the DH
 * frame's built-in -90° tilt. 2brat/3brat need a fixed +90° mounting
 * rotation about Y because their local Z (link-length axis) corresponds
 * to the DH frame's local X (the "a" / link-length axis), not its Z.
 */

export type FrameIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface MeshRigEntry {
  file: string;
  color: string;
  /** If true, this part follows the user-selected body color instead of its fixed `color`. */
  customizable?: boolean;
  /** Frame supplying world position. */
  positionFrame: FrameIndex;
  /** Frame supplying world rotation (usually one ahead of positionFrame — the link has already rotated by its own joint angle). */
  rotationFrame: FrameIndex;
  /** Uniform scale applied to the mesh's local Z axis so it spans the matching DH link length. */
  scaleZ?: number;
  /** Fixed local mounting rotation [x,y,z] radians, applied before the frame rotation. */
  mountEuler?: [number, number, number];
  /** If true, position/rotation use the base J1 spin only (no DH alpha tilt) instead of a DH frame. */
  baseSpinOnly?: boolean;
}

const MOUNT_Y90: [number, number, number] = [0, Math.PI / 2, 0];

// Distance (mm) from each part's local origin (its pivot, at local Z=0) to
// its distal tip (local Z=max) — i.e. the "reach" that has to match the
// corresponding DH link length. Not the same as the full bounding-box span:
// 2brat/3brat/4brat all have material hanging *behind* the pivot too (local
// Z<0, a boss/collar around the joint), which doesn't count toward the reach
// and previously left the scaled part short of the next joint (a visible gap
// at the wrist).
const REACH_1BRAT = 194;
const REACH_2BRAT = 298;
const REACH_3BRAT = 201;
const REACH_4BRAT = 46;

// Pearl-white body matching the real RV-2AJ's factory finish, with the
// amber accent pared back to a small badge (JointCollar in RobotArm.tsx)
// instead of covering a whole link — the real machine is almost entirely
// white/grey with dark joint housings, not a painted shoulder.
const BODY = '#eeece4';
const JOINT = '#2c2f38';

export const MESH_RIG: MeshRigEntry[] = [
  { file: 'baza.stl', color: BODY, customizable: true, positionFrame: 0, rotationFrame: 0 },
  {
    file: '1brat.stl',
    color: BODY,
    customizable: true,
    positionFrame: 0,
    rotationFrame: 0,
    baseSpinOnly: true,
    scaleZ: LINK.L1 / REACH_1BRAT,
  },
  {
    file: '2brat.stl',
    color: BODY,
    customizable: true,
    positionFrame: 1,
    rotationFrame: 2,
    scaleZ: LINK.L2 / REACH_2BRAT,
    mountEuler: MOUNT_Y90,
  },
  {
    file: '3brat.stl',
    color: BODY,
    customizable: true,
    positionFrame: 2,
    rotationFrame: 3,
    scaleZ: LINK.L3 / REACH_3BRAT,
    mountEuler: MOUNT_Y90,
  },
  { file: '4brat.stl', color: JOINT, positionFrame: 3, rotationFrame: 4, scaleZ: LINK.L4 / REACH_4BRAT },
  { file: 'flansa.stl', color: JOINT, positionFrame: 5, rotationFrame: 5 },
  { file: 'efector.stl', color: '#8f95a3', positionFrame: 5, rotationFrame: 5 },
];

// Preset body-color options offered in the viewer controls — the wrist
// (4brat/flansa) and tool (efector) stay fixed dark/metal regardless, same
// as how a real robot's paint job doesn't extend to its motor housings.
export const BODY_COLOR_PRESETS = [
  { id: 'pearl', color: BODY },
  { id: 'graphite', color: '#3a3d44' },
  { id: 'safety-orange', color: '#e8590f' },
  { id: 'industrial-blue', color: '#2f5fa8' },
  { id: 'racing-red', color: '#b3221c' },
  { id: 'safety-yellow', color: '#d9a815' },
] as const;

export type BodyColorId = (typeof BODY_COLOR_PRESETS)[number]['id'];
