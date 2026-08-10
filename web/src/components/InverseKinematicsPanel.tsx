import { useState } from 'react';
import { inverseKinematics } from '../kinematics/inverseKinematics';
import type { JointAngles } from '../kinematics/constants';
import { TRAJECTORY_HOME } from '../kinematics/trajectories';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

interface Pose {
  x: number;
  y: number;
  z: number;
  alpha: number;
  beta: number;
}

const DEFAULT_POSE: Pose = { ...TRAJECTORY_HOME };

const FIELDS: { key: keyof Pose; labelKey: TranslationKey; unit: string }[] = [
  { key: 'x', labelKey: 'labelX', unit: 'mm' },
  { key: 'y', labelKey: 'labelY', unit: 'mm' },
  { key: 'z', labelKey: 'labelZ', unit: 'mm' },
  { key: 'alpha', labelKey: 'labelAlpha', unit: '°' },
  { key: 'beta', labelKey: 'labelBeta', unit: '°' },
];

export function InverseKinematicsPanel({
  onJointsChange,
  onTargetChange,
}: {
  onJointsChange: (j: JointAngles) => void;
  onTargetChange: (p: Pose | null) => void;
}) {
  const { t } = useLanguage();
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

  const errorMessage =
    result && !result.ok
      ? result.errorCode === 'workspace'
        ? t('ikErrorWorkspace')
        : t('ikErrorJointRange', {
            joint: result.joint.toUpperCase(),
            value: result.value.toFixed(1),
            min: result.min,
            max: result.max,
          })
      : null;

  return (
    <div className="panel">
      <h2>{t('ikTitle')}</h2>
      <p className="panel-hint">{t('ikHint')}</p>

      {FIELDS.map(({ key, labelKey, unit }) => (
        <div className="field" key={key}>
          <label>
            {t(labelKey)} <span className="value">{pose[key].toFixed(2)} {unit}</span>
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
        {t('ikCompute')}
      </button>
      <button type="button" className="secondary" onClick={() => setPose(DEFAULT_POSE)}>
        {t('ikReset')}
      </button>

      {errorMessage && <p className="status-line error">{errorMessage}</p>}

      {result && result.ok && (
        <div className="results">
          <h3>{t('ikResultsTitle')}</h3>
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
        </div>
      )}
    </div>
  );
}
