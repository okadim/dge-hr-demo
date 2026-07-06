import { Layers, ListChecks, Bot, Boxes, Zap, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { Eyebrow } from './shared.jsx';
import { STAGES } from '../stages.js';

// One overall view: the full scope from the client's mapping (green + yellow
// highlighted rows of New_Employee_Onboarding_Process_Hierarchy_V1_2.xlsx).
// Verified against the file: 41 highlighted rows = 26 AI-managed + 10 system
// + 5 stays-manual; 37 automatable tasks = 26 AI + 10 system + 1 human
// decision (the 4 excluded stays-manual rows are external candidate actions).
const SCOPE = { steps: 7, tasks: 37, ai: 26, oracle: 19, custom: 10, system: 10, human: 1, hours: 10.5 };

export default function Dashboard({ state, setView }) {
  const tiles = [
    { icon: Layers, value: SCOPE.steps, label: 'Key process steps' },
    { icon: ListChecks, value: SCOPE.tasks, label: 'Tasks in scope', sub: 'green + yellow in the mapping' },
    { icon: Bot, value: SCOPE.ai, label: 'AI-agent managed', sub: `${SCOPE.oracle} Oracle · ${SCOPE.custom} custom agents`, accent: 'oracle' },
    { icon: Zap, value: SCOPE.system, label: 'System automations', sub: 'run by the workflow itself', accent: 'system' },
    { icon: ShieldCheck, value: SCOPE.human, label: 'Human decision', sub: 'probation confirmation', accent: 'human' },
    { icon: Clock, value: `${SCOPE.hours.toFixed(1)}h`, label: 'Hours saved per hire', sub: 'LLM-estimated', accent: 'green' },
  ];

  return (
    <div className="view">
      <section>
        <Eyebrow>New employee onboarding — at a glance</Eyebrow>
        <div className="dash-grid">
          {tiles.map((t) => (
            <div key={t.label} className={`card dash-tile ${t.accent ? `dash-${t.accent}` : ''}`}>
              <span className="dash-icon"><t.icon size={18} /></span>
              <div className="dash-value">{t.value}</div>
              <div className="dash-label">{t.label}</div>
              {t.sub && <div className="dash-sub">{t.sub}</div>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>The six process steps</Eyebrow>
        <div className="dash-steps">
          {STAGES.map((s, i) => (
            <button key={s.n} className="card dash-step" onClick={() => setView('overview')}>
              <span className="dash-step-num">{i + 1}</span>
              <div>
                <div className="dash-step-title">{s.title}</div>
                <div className="dash-step-meta">
                  {s.activities.length} {s.activities.length === 1 ? 'activity' : 'activities'} ·{' '}
                  {[...new Set(s.activities.flatMap((a) => a.agents || []))].length} agents
                </div>
              </div>
              <ArrowRight size={14} className="dash-step-go" />
            </button>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>Go deeper</Eyebrow>
        <div className="dash-links">
          <button className="card dash-link" onClick={() => setView('overview')}>
            <span className="dash-link-title">Process overview</span>
            <span className="dash-link-sub">The step-by-step map, activities, and agent crews</span>
            <span className="persona-go">Open <ArrowRight size={12} /></span>
          </button>
          <button className="card dash-link" onClick={() => setView('journey')}>
            <span className="dash-link-title">My journey</span>
            <span className="dash-link-sub">The live journey through the HR, manager, and employee lenses</span>
            <span className="persona-go">Open <ArrowRight size={12} /></span>
          </button>
          <button className="card dash-link" onClick={() => setView('value')}>
            <span className="dash-link-title">Agents leaderboard</span>
            <span className="dash-link-sub">Runs this session, hours saved, and what stays human</span>
            <span className="persona-go">Open <ArrowRight size={12} /></span>
          </button>
        </div>
      </section>
    </div>
  );
}
