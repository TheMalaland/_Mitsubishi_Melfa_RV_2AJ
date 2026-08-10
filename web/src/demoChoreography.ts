import { useEffect, useRef } from 'react';
import { HOME_JOINTS, type JointAngles } from './kinematics/constants';

interface Keyframe {
  pose: JointAngles;
  /** How long to hold this pose before moving on, ms. */
  holdMs: number;
}

// A small choreographed routine — reach out, sweep the base, strike a tall
// pose, flourish the wrist — instead of independent per-joint sine waves,
// which read as aimless wobbling rather than something a robot would
// actually be shown doing.
const KEYFRAMES: Keyframe[] = [
  { pose: HOME_JOINTS, holdMs: 700 },
  { pose: { j1: 55, j2: 35, j3: -25, j4: 15, j5: 0 }, holdMs: 500 },
  { pose: { j1: 55, j2: 95, j3: -95, j4: 5, j5: 130 }, holdMs: 750 },
  { pose: { j1: -65, j2: 75, j3: -75, j4: -25, j5: -160 }, holdMs: 650 },
  { pose: { j1: -65, j2: -35, j3: 65, j4: 45, j5: 0 }, holdMs: 550 },
  { pose: { j1: 0, j2: -45, j3: 75, j4: -10, j5: 0 }, holdMs: 700 },
  { pose: HOME_JOINTS, holdMs: 900 },
];

const TRAVEL_MS = 1500;

type Segment = { start: number; end: number; from: JointAngles; to: JointAngles; eased: boolean };

function buildTimeline(): { totalMs: number; segments: Segment[] } {
  const segments: Segment[] = [];
  let t = 0;
  for (let i = 0; i < KEYFRAMES.length; i++) {
    const cur = KEYFRAMES[i];
    segments.push({ start: t, end: t + cur.holdMs, from: cur.pose, to: cur.pose, eased: false });
    t += cur.holdMs;
    const next = KEYFRAMES[(i + 1) % KEYFRAMES.length];
    segments.push({ start: t, end: t + TRAVEL_MS, from: cur.pose, to: next.pose, eased: true });
    t += TRAVEL_MS;
  }
  return { totalMs: t, segments };
}

const smoothstep = (p: number) => p * p * (3 - 2 * p);

function lerpJoints(from: JointAngles, to: JointAngles, p: number): JointAngles {
  return {
    j1: from.j1 + (to.j1 - from.j1) * p,
    j2: from.j2 + (to.j2 - from.j2) * p,
    j3: from.j3 + (to.j3 - from.j3) * p,
    j4: from.j4 + (to.j4 - from.j4) * p,
    j5: from.j5 + (to.j5 - from.j5) * p,
  };
}

/** Cycles the arm through a choreographed pose sequence while active. */
export function useDemoMotion(active: boolean, onFrame: (joints: JointAngles) => void) {
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const timelineRef = useRef(buildTimeline());

  useEffect(() => {
    if (!active) return;
    startRef.current = performance.now();
    const { totalMs, segments } = timelineRef.current;

    const tick = (now: number) => {
      const elapsed = (now - startRef.current) % totalMs;
      const seg = segments.find((s) => elapsed >= s.start && elapsed < s.end) ?? segments[segments.length - 1];
      const rawP = (elapsed - seg.start) / (seg.end - seg.start || 1);
      const p = seg.eased ? smoothstep(rawP) : rawP;
      onFrame(lerpJoints(seg.from, seg.to, p));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
