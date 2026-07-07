import { Layers, ListChecks, Gauge, Sparkles, Building2, UserCheck, Clock, ArrowRight } from 'lucide-react';
import { Eyebrow } from './shared.jsx';
import { STAGES } from '../stages.js';

// One overall view: the level of agentification of the whole onboarding
// process, from the client's mapping (New_Employee_Onboarding_Process_
// Hierarchy_V1_2.xlsx). Verified against the file: 41 highlighted rows =
// 26 AI-managed + 10 system + 5 stays-manual; 37 automatable tasks =
// 26 AI + 10 system + 1 human-decision task.
//
// human = human-in-the-loop approval / sign-off gates across the journey
//   (HR offer review, manager offer approval, candidate e-sign, manager
//    access approval, manager schedule/equipment approval, employee benefits
//    selection, employee goal acknowledgement, manager probation confirmation).
// daysSaved = LLM-estimated end-to-end time incl. eliminated manual waiting
//   (ticket queues, approval loops, external checks), on top of ~10.5h effort.
// Scope from the client's mapping (46 highlighted rows = 30 AI-managed +
// 10 system + 6 stays-manual). 41 automatable tasks = 30 AI + 10 system +
// 1 human-decision task. Oracle/custom counts come live from the roster.
const SCOPE = {
  steps: 8, tasks: 41, ai: 30, system: 10,
  human: 8, hoursActive: 10.5, daysSaved: 6,
};

export default function Dashboard({ state, setView }) {
  const automated = SCOPE.ai + SCOPE.system;
  const pctAutomated = Math.round((automated / SCOPE.tasks) * 100);
  const pctAgent = Math.round((SCOPE.ai / SCOPE.tasks) * 100);
  const oracle = state.roster.filter((a) => a.badge === 'Oracle Fusion HCM').length;
  const custom = state.roster.length - oracle;
  const agentsTotal = oracle + custom;
  const pctOracle = Math.round((oracle / agentsTotal) * 100);

  const tiles = [
    { icon: Gauge, value: `${pctAutomated}%`, label: 'Automated', sub: `${automated} of ${SCOPE.tasks} tasks`, accent: 'green' },
    { icon: Sparkles, value: `${pctAgent}%`, label: 'AI-agent driven', sub: `${SCOPE.ai} of ${SCOPE.tasks} tasks`, accent: 'oracle' },
    { icon: Building2, value: `${pctOracle}%`, label: 'Oracle-driven', sub: `${oracle} Oracle · ${custom} custom agents`, accent: 'oracle' },
    { icon: Layers, value: SCOPE.steps, label: 'Process steps' },
    { icon: ListChecks, value: SCOPE.tasks, label: 'Tasks in scope', sub: 'from the client’s mapping' },
    { icon: UserCheck, value: SCOPE.human, label: 'Human approvals', sub: 'review & sign-off gates', accent: 'human' },
    { icon: Clock, value: `~${SCOPE.daysSaved} days`, label: 'Faster to productive', sub: `${SCOPE.hoursActive}h effort + eliminated waiting · LLM-estimated`, accent: 'green' },
  ];

  return (
    <div className="view">
      <section>
        <Eyebrow>Level of agentification</Eyebrow>
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
        <Eyebrow>The eight process steps</Eyebrow>
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
