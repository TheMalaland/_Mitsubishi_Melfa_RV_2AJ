import { useState } from 'react';
import { inverseKinematics } from '../kinematics/inverseKinematics';
import type { JointAngles } from '../kinematics/constants';
import { TRAJECTORY_HOME } from '../kinematics/trajectories';

interface Pose {
  x: number;
  y: number;
  z: number;
  alpha: number;
  beta: number;
}

const DEFAULT_POSE: Pose = { ...TRAJECTORY_HOME };

const FIELDS: { key: keyof Pose; label: string; unit: string }[] = [
  { key: 'x', label: 'X', unit: 'mm' },
  { key: 'y', label: 'Y', unit: 'mm' },
  { key: 'z', label: 'Z', unit: 'mm' },
  { key: 'alpha', label: 'Alpha', unit: '°' },
  { key: 'beta', label: 'Beta', unit: '°' },
];

export function InverseKinematicsPanel({
  onJointsChange,
  onTargetChange,
}: {
  onJointsChange: (j: JointAngles) => void;
  onTargetChange: (p: Pose | null) => void;
}) {
  const [pose, setPose] = useState<Pose>(DEFAULT_POSE);
  const [result, setResult] = useState<ReturnType<typeof inverseKinematics> | null>(null);

  const setField = (key: keyof Pose, value: number) => setPose((p) => ({ ...p, [key]: value }));

  const compute = () => {
    const r = inverseKinematics(pose);
    setResult(r);
    if (r.ok) {
      onJointsChange(r.joints);
      onTargetChange(pose);
    } else {
      onTargetChange(pose);
    }
  };

  return (
    <div className="panel">
      <h2>Cinemática Inversa</h2>
      <p className="panel-hint">Ingresa una posición y orientación deseada del efector final para calcular los ángulos.</p>

      {FIELDS.map(({ key, label, unit }) => (
        <div className="field" key={key}>
          <label>
            {label} <span className="value">{pose[key].toFixed(2)} {unit}</span>
          </label>
          <input
            type="number"
            step={0.5}
            value={pose[key]}
            onChange={(e) => setField(key, Number(e.target.value))}
          />
        </div>
      ))}

      <button type="button" onClick={compute}>
        Calcular ángulos
      </button>
      <button type="button" className="secondary" onClick={() => setPose(DEFAULT_POSE)}>
        Restablecer
      </button>

      <div className="results">
        {result && !result.ok && <p className="error">⚠ {result.reason}</p>}
        {result && result.ok && (
          <>
            <h3>Ángulos calculados</h3>
            <dl>
              <dt>J1</dt>
              <dd>{result.joints.j1.toFixed(2)}°</dd>
              <dt>J2</dt>
              <dd>{result.joints.j2.toFixed(2)}°</dd>
              <dt>J3</dt>
              <dd>{result.joints.j3.toFixed(2)}°</dd>
              <dt>J4</dt>
              <dd>{result.joints.j4.toFixed(2)}°</dd>
              <dt>J5</dt>
              <dd>{result.joints.j5.toFixed(2)}°</dd>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
