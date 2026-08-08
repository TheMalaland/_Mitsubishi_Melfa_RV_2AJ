import { useState } from 'react';
import { Scene3D } from './components/Scene3D';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ForwardKinematicsPanel } from './components/ForwardKinematicsPanel';
import { InverseKinematicsPanel } from './components/InverseKinematicsPanel';
import { TrajectoryPanel } from './components/TrajectoryPanel';
import { HOME_JOINTS, type JointAngles } from './kinematics/constants';
import type { Vec3 } from './kinematics/forwardKinematics';
import './App.css';

type Tab = 'fk' | 'ik' | 'trajectory';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fk', label: 'Cinemática Directa' },
  { id: 'ik', label: 'Cinemática Inversa' },
  { id: 'trajectory', label: 'Trayectorias' },
];

function App() {
  const [tab, setTab] = useState<Tab>('fk');
  const [joints, setJoints] = useState<JointAngles>(HOME_JOINTS);
  const [pathPoints, setPathPoints] = useState<Vec3[]>([]);
  const [targetPoint, setTargetPoint] = useState<Vec3 | null>(null);

  const handleTab = (t: Tab) => {
    setTab(t);
    setPathPoints([]);
    setTargetPoint(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mitsubishi Melfa RV-2AJ · Simulador Web</h1>
        <p>
          Migración a la web del proyecto original de MATLAB/Simulink para el brazo robótico de 5 ejes Melfa RV-2AJ.
        </p>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={t.id === tab ? 'tab active' : 'tab'} onClick={() => handleTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>

          {tab === 'fk' && <ForwardKinematicsPanel onJointsChange={setJoints} />}
          {tab === 'ik' && <InverseKinematicsPanel onJointsChange={setJoints} onTargetChange={setTargetPoint} />}
          {tab === 'trajectory' && (
            <TrajectoryPanel onJointsChange={setJoints} onPathChange={setPathPoints} onTargetChange={setTargetPoint} />
          )}
        </aside>

        <main className="viewer">
          <ErrorBoundary>
            <Scene3D joints={joints} pathPoints={pathPoints} targetPoint={targetPoint} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
