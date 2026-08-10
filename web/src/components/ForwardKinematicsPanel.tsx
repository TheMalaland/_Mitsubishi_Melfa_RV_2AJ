import { useEffect, useState } from 'react';
import { forwardKinematics } from '../kinematics/forwardKinematics';
import { HOME_JOINTS, JOINT_LIMITS, type JointAngles } from '../kinematics/constants';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

const JOINT_KEYS: Record<keyof JointAngles, TranslationKey> = {
  j1: 'jointJ1',
  j2: 'jointJ2',
  j3: 'jointJ3',
  j4: 'jointJ4',
  j5: 'jointJ5',
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// J2 (shoulder) and J3 (elbow) are independently within range up near their
// own maximums, but *together* they fold the forearm back into the shoulder
// housing — the real machine's mechanical stops prevent that combination,
// our per-axis limits alone don't. Capping their sum keeps the slider from
// driving the mesh into that self-intersecting corner.
const J2_J3_SUM_LIMIT = 210;

// Separately, a large positive J2 together with a sufficiently negative J3
// swings the forearm link's own mounting boss into the upper-arm link's
// body at the elbow — a different self-intersecting corner than the one
// above (that one is both joints large and *positive*; this one is J2
// positive and J3 negative). Capping how far apart they can drift keeps the
// slider out of that corner too.
const J2_J3_DIFF_LIMIT = 90;

export function ForwardKinematicsPanel({ onJointsChange }: { onJointsChange: (j: JointAngles) => void }) {
  const { t } = useLanguage();
  const [joints, setJoints] = useState<JointAngles>(HOME_JOINTS);

  useEffect(() => {
    onJointsChange(joints);
  }, [joints, onJointsChange]);

  const fk = forwardKinematics(joints);

  const setJoint = (key: keyof JointAngles, value: number) =>
    setJoints((j) => {
      const next = { ...j, [key]: value };
      if (key === 'j2') {
        const j3Max = clamp(J2_J3_SUM_LIMIT - next.j2, JOINT_LIMITS.j3[0], JOINT_LIMITS.j3[1]);
        const j3Min = clamp(next.j2 - J2_J3_DIFF_LIMIT, JOINT_LIMITS.j3[0], JOINT_LIMITS.j3[1]);
        if (next.j3 > j3Max) next.j3 = j3Max;
        if (next.j3 < j3Min) next.j3 = j3Min;
      } else if (key === 'j3') {
        const j2Max = Math.min(
          clamp(J2_J3_SUM_LIMIT - next.j3, JOINT_LIMITS.j2[0], JOINT_LIMITS.j2[1]),
          clamp(next.j3 + J2_J3_DIFF_LIMIT, JOINT_LIMITS.j2[0], JOINT_LIMITS.j2[1])
        );
        if (next.j2 > j2Max) next.j2 = j2Max;
      }
      return next;
    });

  return (
    <div className="panel">
      <h2>{t('fkTitle')}</h2>
      <p className="panel-hint">{t('fkHint')}</p>

      {(Object.keys(JOINT_KEYS) as (keyof JointAngles)[]).map((key) => {
        const [naturalMin, naturalMax] = JOINT_LIMITS[key];
        const min =
          key === 'j3' ? clamp(joints.j2 - J2_J3_DIFF_LIMIT, naturalMin, naturalMax) : naturalMin;
        const max =
          key === 'j2'
            ? clamp(Math.min(J2_J3_SUM_LIMIT - joints.j3, joints.j3 + J2_J3_DIFF_LIMIT), naturalMin, naturalMax)
            : key === 'j3'
              ? clamp(J2_J3_SUM_LIMIT - joints.j2, naturalMin, naturalMax)
              : naturalMax;
        return (
          <div className="field" key={key}>
            <label>
              {t(JOINT_KEYS[key])} <span className="value">{joints[key].toFixed(1)}°</span>
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
        {t('fkReset')}
      </button>

      <div className="results">
        <h3>{t('fkResultsTitle')}</h3>
        <dl>
          <dt>{t('labelX')}</dt>
          <dd>{fk.position.x.toFixed(2)} mm</dd>
          <dt>{t('labelY')}</dt>
          <dd>{fk.position.y.toFixed(2)} mm</dd>
          <dt>{t('labelZ')}</dt>
          <dd>{fk.position.z.toFixed(2)} mm</dd>
          <dt>{t('labelAlpha')}</dt>
          <dd>{fk.alpha.toFixed(2)}°</dd>
          <dt>{t('labelBeta')}</dt>
          <dd>{fk.beta.toFixed(2)}°</dd>
        </dl>
        <h3>{t('fkMatrixTitle')}</h3>
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
