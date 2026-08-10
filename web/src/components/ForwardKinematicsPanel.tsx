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

export function ForwardKinematicsPanel({ onJointsChange }: { onJointsChange: (j: JointAngles) => void }) {
  const { t } = useLanguage();
  const [joints, setJoints] = useState<JointAngles>(HOME_JOINTS);

  useEffect(() => {
    onJointsChange(joints);
  }, [joints, onJointsChange]);

  const fk = forwardKinematics(joints);

  const setJoint = (key: keyof JointAngles, value: number) => setJoints((j) => ({ ...j, [key]: value }));

  return (
    <div className="panel">
      <h2>{t('fkTitle')}</h2>
      <p className="panel-hint">{t('fkHint')}</p>

      {(Object.keys(JOINT_KEYS) as (keyof JointAngles)[]).map((key) => {
        const [min, max] = JOINT_LIMITS[key];
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
