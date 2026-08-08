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

// Measured local Z spans (mm) from each STL's bounding box.
const SPAN_1BRAT = 194;
const SPAN_2BRAT = 360;
const SPAN_3BRAT = 248;
const SPAN_4BRAT = 103;

// Off-white body with a blue accent shoulder, similar in spirit to the real
// RV-2AJ's ivory-and-blue color scheme.
const BODY = '#e8e6df';
const ACCENT = '#2f6fed';
const JOINT = '#3a3f4b';

export const MESH_RIG: MeshRigEntry[] = [
  { file: 'baza.stl', color: BODY, positionFrame: 0, rotationFrame: 0 },
  { file: '1brat.stl', color: ACCENT, positionFrame: 0, rotationFrame: 0, baseSpinOnly: true, scaleZ: LINK.L1 / SPAN_1BRAT },
  { file: '2brat.stl', color: BODY, positionFrame: 1, rotationFrame: 2, scaleZ: LINK.L2 / SPAN_2BRAT, mountEuler: MOUNT_Y90 },
  { file: '3brat.stl', color: BODY, positionFrame: 2, rotationFrame: 3, scaleZ: LINK.L3 / SPAN_3BRAT, mountEuler: MOUNT_Y90 },
  { file: '4brat.stl', color: JOINT, positionFrame: 3, rotationFrame: 4, scaleZ: LINK.L4 / SPAN_4BRAT },
  { file: 'flansa.stl', color: JOINT, positionFrame: 5, rotationFrame: 5 },
  { file: 'efector.stl', color: '#8f95a3', positionFrame: 5, rotationFrame: 5 },
];
