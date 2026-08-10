import { useEffect, useMemo, useRef, useState } from 'react';
import { inverseKinematics } from '../kinematics/inverseKinematics';
import { generateTrajectory, type TrajectoryShape } from '../kinematics/trajectories';
import type { JointAngles } from '../kinematics/constants';
import type { Vec3 } from '../kinematics/forwardKinematics';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { PauseIcon, PlayIcon, StopIcon } from './icons';

const SHAPE_KEYS: Record<TrajectoryShape, TranslationKey> = {
  circle: 'shapeCircle',
  rectangle: 'shapeRectangle',
  triangle: 'shapeTriangle',
};

export function TrajectoryPanel({
  onJointsChange,
  onPathChange,
  onTargetChange,
}: {
  onJointsChange: (j: JointAngles) => void;
  onPathChange: (p: Vec3[]) => void;
  onTargetChange: (p: Vec3 | null) => void;
}) {
  const { t } = useLanguage();
  const [shape, setShape] = useState<TrajectoryShape>('circle');
  const [size, setSize] = useState(60);
  const [height, setHeight] = useState(60);
  const [speed, setSpeed] = useState(12); // waypoints per second
  const [playing, setPlaying] = useState(false);
  const [unreachableCount, setUnreachableCount] = useState(0);

  const indexRef = useRef(0);
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const { jointPath, cartesianPath } = useMemo(() => {
    const cartesian = generateTrajectory({ shape, size, height });
    const joints: JointAngles[] = [];
    const reachable: Vec3[] = [];
    let unreachable = 0;
    for (const p of cartesian) {
      const ik = inverseKinematics(p);
      if (ik.ok) {
        joints.push(ik.joints);
        reachable.push(p);
      } else {
        unreachable++;
      }
    }
    setUnreachableCount(unreachable);
    return { jointPath: joints, cartesianPath: reachable };
  }, [shape, size, height]);

  useEffect(() => {
    onPathChange(cartesianPath);
    indexRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartesianPath]);

  useEffect(() => {
    if (!playing || jointPath.length === 0) return;

    const msPerStep = 1000 / speed;
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      if (now - lastTickRef.current >= msPerStep) {
        lastTickRef.current = now;
        const i = indexRef.current % jointPath.length;
        onJointsChange(jointPath[i]);
        onTargetChange(cartesianPath[i]);
        indexRef.current = i + 1;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, jointPath, cartesianPath, speed]);

  const stop = () => {
    setPlaying(false);
    indexRef.current = 0;
  };

  return (
    <div className="panel">
      <h2>{t('trajTitle')}</h2>
      <p className="panel-hint">{t('trajHint')}</p>

      <div className="field">
        <label>{t('trajShape')}</label>
        <select value={shape} onChange={(e) => setShape(e.target.value as TrajectoryShape)}>
          {(Object.keys(SHAPE_KEYS) as TrajectoryShape[]).map((s) => (
            <option key={s} value={s}>
              {t(SHAPE_KEYS[s])}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>
          {shape === 'circle' ? t('trajRadius') : shape === 'triangle' ? t('trajSide') : t('trajWidth')}{' '}
          <span className="value">{size} mm</span>
        </label>
        <input type="range" min={20} max={180} step={5} value={size} onChange={(e) => setSize(Number(e.target.value))} />
      </div>

      {shape === 'rectangle' && (
        <div className="field">
          <label>
            {t('trajHeight')} <span className="value">{height} mm</span>
          </label>
          <input type="range" min={20} max={180} step={5} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
        </div>
      )}

      <div className="field">
        <label>
          {t('trajSpeed')} <span className="value">{speed} {t('unitPtsPerSec')}</span>
        </label>
        <input type="range" min={2} max={40} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
      </div>

      <div className="button-row">
        <button type="button" onClick={() => setPlaying((p) => !p)} disabled={jointPath.length === 0}>
          {playing ? <PauseIcon /> : <PlayIcon />}
          {playing ? t('trajPause') : t('trajPlay')}
        </button>
        <button type="button" className="secondary" onClick={stop}>
          <StopIcon />
          {t('trajStop')}
        </button>
      </div>

      {unreachableCount > 0 && (
        <p className="status-line warning">{t('trajWarningUnreachable', { count: unreachableCount })}</p>
      )}
      {jointPath.length === 0 && <p className="status-line error">{t('trajErrorNone')}</p>}
    </div>
  );
}
