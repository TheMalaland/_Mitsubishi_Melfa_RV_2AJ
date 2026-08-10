import { useCallback, useEffect, useState } from 'react';
import { Scene3D } from './components/Scene3D';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ForwardKinematicsPanel } from './components/ForwardKinematicsPanel';
import { InverseKinematicsPanel } from './components/InverseKinematicsPanel';
import { TrajectoryPanel } from './components/TrajectoryPanel';
import { HOME_JOINTS, type JointAngles } from './kinematics/constants';
import type { Vec3 } from './kinematics/forwardKinematics';
import { useLanguage } from './i18n/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS, type Language } from './i18n/translations';
import type { TranslationKey } from './i18n/translations';
import { useDemoMotion } from './demoChoreography';
import './App.css';

type Tab = 'fk' | 'ik' | 'trajectory';
type Theme = 'dark' | 'light';

const TABS: { id: Tab; labelKey: TranslationKey }[] = [
  { id: 'fk', labelKey: 'tabFk' },
  { id: 'ik', labelKey: 'tabIk' },
  { id: 'trajectory', labelKey: 'tabTrajectory' },
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

function LanguageSelect() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <select
      className="language-select"
      aria-label={t('languageLabel')}
      title={t('languageLabel')}
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
    >
      {LANGUAGES.map((l) => (
        <option key={l} value={l}>
          {LANGUAGE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}

function App() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('fk');
  const [joints, setJoints] = useState<JointAngles>(HOME_JOINTS);
  const [pathPoints, setPathPoints] = useState<Vec3[]>([]);
  const [targetPoint, setTargetPoint] = useState<Vec3 | null>(null);
  const [theme, toggleTheme] = useTheme();
  const [demo, setDemo] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      <header className={headerCollapsed ? 'app-header collapsed' : 'app-header'}>
        {!headerCollapsed && (
          <div className="app-header-text">
            <h1>{t('appTitle')}</h1>
            <p>{t('appSubtitle')}</p>
          </div>
        )}
        <div className="app-header-actions">
          <button
            type="button"
            className="icon-toggle"
            title={headerCollapsed ? t('headerExpand') : t('headerCollapse')}
            onClick={() => setHeaderCollapsed((c) => !c)}
          >
            {headerCollapsed ? '▾' : '▴'}
          </button>
          <LanguageSelect />
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            <span>{theme === 'dark' ? t('themeLight') : t('themeDark')}</span>
          </button>
        </div>
      </header>

      <div className={sidebarCollapsed ? 'app-body sidebar-collapsed' : 'app-body'}>
        <aside className={sidebarCollapsed ? 'sidebar collapsed' : 'sidebar'}>
          {sidebarCollapsed ? (
            <button
              type="button"
              className="icon-toggle sidebar-expand"
              title={t('sidebarExpand')}
              onClick={() => setSidebarCollapsed(false)}
            >
              ▸
            </button>
          ) : (
            <>
              <div className="sidebar-top">
                <nav className="tabs">
                  {TABS.map((tabDef) => (
                    <button
                      key={tabDef.id}
                      className={tabDef.id === tab ? 'tab active' : 'tab'}
                      onClick={() => handleTab(tabDef.id)}
                    >
                      {t(tabDef.labelKey)}
                    </button>
                  ))}
                </nav>
                <button type="button" className="icon-toggle" title={t('sidebarCollapse')} onClick={() => setSidebarCollapsed(true)}>
                  ◂
                </button>
              </div>

              {tab === 'fk' && <ForwardKinematicsPanel onJointsChange={handleJointsChange} />}
              {tab === 'ik' && <InverseKinematicsPanel onJointsChange={handleJointsChange} onTargetChange={setTargetPoint} />}
              {tab === 'trajectory' && (
                <TrajectoryPanel onJointsChange={handleJointsChange} onPathChange={setPathPoints} onTargetChange={setTargetPoint} />
              )}
            </>
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
