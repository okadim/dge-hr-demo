import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { fetchState, postAction, sleep } from './api.js';
import ProcessOverview from './components/ProcessOverview.jsx';
import EmployeeJourney from './components/EmployeeJourney.jsx';
import ManagerView from './components/ManagerView.jsx';
import HRJourney from './components/HRJourney.jsx';
import ValueDelivered from './components/ValueDelivered.jsx';
import PersonaSwitcher from './components/PersonaSwitcher.jsx';
import Guide from './components/Guide.jsx';
import AgentPanel from './components/AgentPanel.jsx';
import dgeLogo from './assets/dge-logo.svg';

const VIEWS = [
  { id: 'overview', label: 'Process Overview' },
  { id: 'journey', label: 'My Journey' },
  { id: 'value', label: 'Value Delivered' },
];

export default function App() {
  const [state, setState] = useState(null);
  const [view, setView] = useState('overview');
  const [persona, setPersona] = useState('hr'); // the journey starts with HR
  const [activity, setActivity] = useState(null); // {action, runs, index}
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const mainRef = useRef(null);
  const firstRender = useRef(true);
  const stateRef = useRef(null);
  const busyRef = useRef(false);
  stateRef.current = state;
  busyRef.current = busy;

  // The journey state is shared across every open tab/viewer. Poll for a
  // revision change so this tab never acts on a stale world (the source of
  // "offer must be dispatched" while the guide says step 3).
  useEffect(() => {
    const id = setInterval(async () => {
      if (busyRef.current || document.hidden) return;
      try {
        const next = await fetchState();
        if (!busyRef.current && next.rev !== stateRef.current?.rev) setState(next);
      } catch { /* transient network blip — next tick retries */ }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Focus the content region on navigation (skill: focus-on-route-change) —
  // skipped on first render so page load doesn't steal focus.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    mainRef.current?.focus({ preventScroll: true });
  }, [view, persona]);

  useEffect(() => {
    load();
  }, []);

  // Auto-dismiss error toasts (4.5 s) — they also dismiss on click.
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 4500);
    return () => clearTimeout(id);
  }, [error]);

  async function load() {
    try {
      setState(await fetchState());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }

  // The heart of the rhythm: POST, then play the returned runs in order —
  // agents get their visible working beat, system events flash — then apply
  // the new state so every lens updates at once.
  async function act(action, body) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await postAction(action, body);
      const runs = next.last_runs || [];
      for (let i = 0; i < runs.length; i++) {
        setActivity({ action, runs, index: i });
        await sleep(runs[i].type === 'system' ? 500 : runs[i].duration_ms || 1100);
      }
      if (runs.length) {
        setActivity({ action, runs, index: runs.length });
        await sleep(350);
      }
      setActivity(null);
      setState(next);
    } catch (e) {
      setActivity(null);
      // The shared journey may have moved on (another tab / a restart).
      // Re-sync immediately so the guide and buttons match reality again.
      try {
        setState(await fetchState());
        setError(`${e.message} — the journey moved on elsewhere, so this view just refreshed.`);
      } catch {
        setError(e.message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (offline) {
    return (
      <div className="boot-screen">
        <div className="card boot-card">
          <div className="wordmark">New Employee Onboarding</div>
          <p>The service is not reachable.</p>
          <p className="boot-hint">
            Start it with <code>uvicorn main:app</code> in <code>backend/</code>, then retry.
          </p>
          <button className="btn btn-primary" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="boot-screen" aria-busy="true" aria-label="Loading">
        <div className="skeleton-stack">
          <div className="skeleton skeleton-bar" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
    );
  }

  const shared = { state, act, activity, busy, setView, setPersona };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark brand-mark-sm" aria-hidden="true">HR</span>
            <span className="brand-text">
              <span className="brand-name">New Employee Onboarding</span>
              <span className="brand-sub">DGE People Services</span>
            </span>
          </div>
          <div className="header-right">
            <button
              className="btn btn-ghost btn-reset"
              onClick={() => act('reset')}
              disabled={busy}
              title="Restart the journey from the beginning"
              aria-label="Restart journey"
            >
              <RotateCcw size={13} /> <span className="reset-label">Restart journey</span>
            </button>
            <PersonaSwitcher persona={persona} setPersona={setPersona} setView={setView} />
            <span className="dge-logo-chip">
              <img className="dge-logo" src={dgeLogo} alt="Department of Government Enablement" />
            </span>
          </div>
        </div>
        <nav className="tabs">
          {VIEWS.map((t) => (
            <button
              key={t.id}
              className={`tab ${view === t.id ? 'tab-active' : ''}`}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <Guide state={state} view={view} persona={persona} setView={setView} setPersona={setPersona} activity={activity} />

      <main className="main" ref={mainRef} tabIndex={-1}>
        <div className="tab-pane" key={`${view}-${view === 'journey' ? persona : ''}`}>
          {view === 'overview' && <ProcessOverview {...shared} />}
          {view === 'journey' && persona === 'hr' && <HRJourney {...shared} />}
          {view === 'journey' && persona === 'manager' && <ManagerView {...shared} />}
          {view === 'journey' && persona === 'employee' && <EmployeeJourney {...shared} />}
          {view === 'value' && <ValueDelivered {...shared} />}
        </div>
      </main>

      <AgentPanel state={state} activity={activity} persona={persona} />

      {error && (
        <div className="toast" role="status" aria-live="polite" onClick={() => setError(null)}>
          {error} <span className="toast-dismiss">dismiss</span>
        </div>
      )}

      <footer className="footer">Proof of concept — all data is fictional.</footer>
    </div>
  );
}
