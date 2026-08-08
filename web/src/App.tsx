import { useCallback, useEffect, useRef, useState } from 'react';
import { Scene3D } from './components/Scene3D';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ForwardKinematicsPanel } from './components/ForwardKinematicsPanel';
import { InverseKinematicsPanel } from './components/InverseKinematicsPanel';
import { TrajectoryPanel } from './components/TrajectoryPanel';
import { HOME_JOINTS, type JointAngles } from './kinematics/constants';
import type { Vec3 } from './kinematics/forwardKinematics';
import './App.css';

type Tab = 'fk' | 'ik' | 'trajectory';
type Theme = 'dark' | 'light';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fk', label: 'Cinemática Directa' },
  { id: 'ik', label: 'Cinemática Inversa' },
  { id: 'trajectory', label: 'Trayectorias' },
];

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof localStorage === 'undefined') return 'light';
    return (localStorage.getItem('melfa-theme') as Theme | null) ?? 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('melfa-theme', theme);
  }, [theme]);

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

// Gentle idle sweep so the arm feels alive when nobody is touching the controls.
function useDemoMotion(active: boolean, onFrame: (joints: JointAngles) => void) {
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;
      onFrame({
        j1: Math.sin(t * 0.5) * 45,
        j2: 30 + Math.sin(t * 0.7 + 1) * 25,
        j3: -35 + Math.sin(t * 0.6 + 2) * 30,
        j4: Math.sin(t * 0.9 + 0.5) * 30,
        j5: Math.sin(t * 0.4) * 60,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

function App() {
  const [tab, setTab] = useState<Tab>('fk');
  const [joints, setJoints] = useState<JointAngles>(HOME_JOINTS);
  const [pathPoints, setPathPoints] = useState<Vec3[]>([]);
  const [targetPoint, setTargetPoint] = useState<Vec3 | null>(null);
  const [theme, toggleTheme] = useTheme();
  const [demo, setDemo] = useState(false);

  useDemoMotion(demo, setJoints);

  // Any manual interaction with a panel takes over from the idle demo.
  // Stable identity so panels' effects don't re-fire (and cancel the demo)
  // on every render the demo loop causes.
  const handleJointsChange = useCallback((j: JointAngles) => {
    setDemo(false);
    setJoints(j);
  }, []);

  const handleTab = (t: Tab) => {
    setTab(t);
    setPathPoints([]);
    setTargetPoint(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-text">
          <h1>Mitsubishi Melfa RV-2AJ · Simulador Web</h1>
          <p>
            Migración a la web del proyecto original de MATLAB/Simulink para el brazo robótico de 5 ejes Melfa RV-2AJ.
          </p>
        </div>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'} <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
        </button>
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

          {tab === 'fk' && <ForwardKinematicsPanel onJointsChange={handleJointsChange} />}
          {tab === 'ik' && <InverseKinematicsPanel onJointsChange={handleJointsChange} onTargetChange={setTargetPoint} />}
          {tab === 'trajectory' && (
            <TrajectoryPanel onJointsChange={handleJointsChange} onPathChange={setPathPoints} onTargetChange={setTargetPoint} />
          )}
        </aside>

        <main className="viewer">
          <ErrorBoundary>
            <Scene3D
              joints={joints}
              pathPoints={pathPoints}
              targetPoint={targetPoint}
              theme={theme}
              demo={demo}
              onToggleDemo={() => setDemo((d) => !d)}
            />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
