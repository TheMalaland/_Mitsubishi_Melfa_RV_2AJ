import type { InverseKinematicsInput } from './inverseKinematics';

// Reference "home" tool pose used by CirculoPos.m / RectanguloPos.m /
// trianguloPos.m as the anchor point for every generated shape.
export const TRAJECTORY_HOME = {
  x: -66.6,
  y: -278.78,
  z: 279.62,
  alpha: -4.88,
  beta: 176.48,
};

export type TrajectoryShape = 'circle' | 'rectangle' | 'triangle';

const deg2rad = (d: number) => (d * Math.PI) / 180;

function withHomePose(x: number, y: number): InverseKinematicsInput {
  return { x, y, z: TRAJECTORY_HOME.z, alpha: TRAJECTORY_HOME.alpha, beta: TRAJECTORY_HOME.beta };
}

/**
 * Circle centered on the home XY point, ported from CirculoPos.m (which
 * only emitted the 3 points MELFA's controller needs to fit a circular arc
 * through). Here we sample the full circle for animation.
 */
function circleWaypoints(radius: number, segments: number): InverseKinematicsInput[] {
  const cx = TRAJECTORY_HOME.x;
  const cy = TRAJECTORY_HOME.y;
  const points: InverseKinematicsInput[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    points.push(withHomePose(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)));
  }
  return points;
}

/** Rectangle corners, ported directly from RectanguloPos.m, closed into a loop. */
function rectangleWaypoints(height: number, width: number): InverseKinematicsInput[] {
  const { x: Pox, y: Poy } = TRAJECTORY_HOME;
  const corners = [
    withHomePose(Pox, Poy),
    withHomePose(Pox, Poy + height),
    withHomePose(Pox - width, Poy + height),
    withHomePose(Pox - width, Poy),
    withHomePose(Pox, Poy),
  ];
  return corners;
}

/** Equilateral triangle, ported directly from trianguloPos.m, closed into a loop. */
function triangleWaypoints(side: number): InverseKinematicsInput[] {
  const { x: Pox, y: Poy } = TRAJECTORY_HOME;
  const corners = [
    withHomePose(Pox, Poy),
    withHomePose(Pox + side, Poy),
    withHomePose(Pox + side / 2, Poy + side * Math.sin(deg2rad(60))),
    withHomePose(Pox, Poy),
  ];
  return corners;
}

/** Linearly interpolate between polygon corners so playback speed is uniform. */
function densify(corners: InverseKinematicsInput[], segmentsPerEdge: number): InverseKinematicsInput[] {
  const out: InverseKinematicsInput[] = [];
  for (let i = 0; i < corners.length - 1; i++) {
    const a = corners[i];
    const b = corners[i + 1];
    for (let s = 0; s < segmentsPerEdge; s++) {
      const t = s / segmentsPerEdge;
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z,
        alpha: a.alpha,
        beta: a.beta,
      });
    }
  }
  out.push(corners[corners.length - 1]);
  return out;
}

export interface TrajectoryParams {
  shape: TrajectoryShape;
  /** Radius (circle) or width/side, in mm. */
  size: number;
  /** Height, in mm — rectangle only. */
  height?: number;
}

export function generateTrajectory({ shape, size, height }: TrajectoryParams): InverseKinematicsInput[] {
  switch (shape) {
    case 'circle':
      return circleWaypoints(size, 72);
    case 'rectangle':
      return densify(rectangleWaypoints(height ?? size, size), 24);
    case 'triangle':
      return densify(triangleWaypoints(size), 24);
  }
}
