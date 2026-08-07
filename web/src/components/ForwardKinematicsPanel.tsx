import { useEffect, useState } from 'react';
import { forwardKinematics } from '../kinematics/forwardKinematics';
import { HOME_JOINTS, JOINT_LIMITS, type JointAngles } from '../kinematics/constants';

const JOINT_LABELS: Record<keyof JointAngles, string> = {
  j1: 'J1 · Base',
  j2: 'J2 · Hombro',
  j3: 'J3 · Codo',
  j4: 'J4 · Muñeca (pitch)',
  j5: 'J5 · Muñeca (roll)',
};

export function ForwardKinematicsPanel({ onJointsChange }: { onJointsChange: (j: JointAngles) => void }) {
  const [joints, setJoints] = useState<JointAngles>(HOME_JOINTS);

  useEffect(() => {
    onJointsChange(joints);
  }, [joints, onJointsChange]);

  const fk = forwardKinematics(joints);

  const setJoint = (key: keyof JointAngles, value: number) => setJoints((j) => ({ ...j, [key]: value }));

  return (
    <div className="panel">
      <h2>Cinemática Directa</h2>
      <p className="panel-hint">Ingresa los ángulos de cada articulación y observa la posición del efector final.</p>

      {(Object.keys(JOINT_LABELS) as (keyof JointAngles)[]).map((key) => {
        const [min, max] = JOINT_LIMITS[key];
        return (
          <div className="field" key={key}>
            <label>
              {JOINT_LABELS[key]} <span className="value">{joints[key].toFixed(1)}°</span>
            </label>
            <input
              type="range"
              min={min}
              max={max}
              step={0.5}
              value={joints[key]}
              onChange={(e) => setJoint(key, Number(e.target.value))}
            />
            <input
              type="number"
              min={min}
              max={max}
              step={0.5}
              value={joints[key]}
              onChange={(e) => setJoint(key, Number(e.target.value))}
            />
          </div>
        );
      })}

      <button type="button" className="secondary" onClick={() => setJoints(HOME_JOINTS)}>
        Restablecer a posición home
      </button>

      <div className="results">
        <h3>Pose del efector final</h3>
        <dl>
          <dt>X</dt>
          <dd>{fk.position.x.toFixed(2)} mm</dd>
          <dt>Y</dt>
          <dd>{fk.position.y.toFixed(2)} mm</dd>
          <dt>Z</dt>
          <dd>{fk.position.z.toFixed(2)} mm</dd>
          <dt>Alpha</dt>
          <dd>{fk.alpha.toFixed(2)}°</dd>
          <dt>Beta</dt>
          <dd>{fk.beta.toFixed(2)}°</dd>
        </dl>
        <h3>Matriz de transformación</h3>
        <table className="matrix">
          <tbody>
            {[0, 1, 2, 3].map((row) => (
              <tr key={row}>
                {[0, 1, 2, 3].map((col) => (
                  <td key={col}>{fk.matrix[row * 4 + col].toFixed(3)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
