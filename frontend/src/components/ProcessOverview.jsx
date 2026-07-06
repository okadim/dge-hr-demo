import { useState } from 'react';
import { ArrowRight, User, Users, Briefcase, BarChart3, Check as CheckIcon } from 'lucide-react';
import { STAGES, stageStatus } from '../stages.js';
import { Eyebrow, AgentCard, ModeChip } from './shared.jsx';

const PERSONA_CARDS = [
  { persona: 'hr', icon: Briefcase, name: 'Salma Al Marzooqi', role: 'HR Recruiter', hint: 'Starts the journey: candidate dashboard, offer approval, data quality, compliance' },
  { persona: 'manager', icon: Users, name: 'Khalid Al Hammadi', role: 'Manager', hint: 'Offer approval, identity & schedule before day 1 — probation after' },
  { persona: 'employee', icon: User, name: 'Aisha Al Khoori', role: 'New hire — Policy Analyst', hint: 'Her profile, checklist, benefits, and assistant chat' },
  { persona: null, icon: BarChart3, name: 'Agents leaderboard', role: 'The receipts', hint: 'Live runs, hours saved, and what stays human' },
];

export default function ProcessOverview({ state, setView, setPersona }) {
  const [selected, setSelected] = useState(1);
  const c = state.case;
  const rosterByKey = Object.fromEntries(state.roster.map((a) => [a.key, a]));
  const stage = STAGES.find((s) => s.n === selected);

  return (
    <div className="view">
      <div className="kpi-strip">
        <div className="card kpi">
          <Eyebrow>Journey complete</Eyebrow>
          <div className="kpi-value">{state.kpis.journey_pct}%</div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${state.kpis.journey_pct}%` }} /></div>
        </div>
        <div className="card kpi">
          <Eyebrow>Agent runs this session</Eyebrow>
          <div className="kpi-value">{state.kpis.agent_runs}</div>
          <div className="kpi-sub">by {state.kpis.agents_distinct} distinct agents · {state.kpis.system_events} system events</div>
        </div>
        <div className="card kpi kpi-wide kpi-human">
          <Eyebrow>Next human action</Eyebrow>
          <div className="kpi-next">{state.kpis.next_human_action}</div>
        </div>
      </div>

      <section>
        <Eyebrow>New employee onboarding — end-to-end process map</Eyebrow>
        <div className="stepper">
          {STAGES.map((s, i) => {
            const st = stageStatus(s, c);
            return (
              <button
                key={s.n}
                className={`stepper-item stepper-${st} ${selected === s.n ? 'stepper-selected' : ''}`}
                onClick={() => setSelected(s.n)}
              >
                <span className="stepper-track">
                  <span className={`stepper-seg ${i === 0 ? 'stepper-seg-hidden' : ''}`} />
                  <span className="stepper-circle">{st === 'done' ? <CheckIcon size={14} /> : i + 1}</span>
                  <span className={`stepper-seg ${i === STAGES.length - 1 ? 'stepper-seg-hidden' : ''}`} />
                </span>
                <span className="stepper-label">{s.title}</span>
                <span className={`stage-state stage-state-${st}`}>
                  {st === 'done' ? 'Complete' : st === 'active' ? 'In progress' : 'Upcoming'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {stage && (
        <section className="card stage-panel" key={stage.n}>
          <div className="stage-panel-head">
            <Eyebrow>Step {STAGES.indexOf(stage) + 1} — {stage.title}</Eyebrow>
          </div>
          <div className="stage-panel-grid">
            <div>
              <div className="panel-subhead">Activities</div>
              <ul className="activity-list">
                {stage.activities.map((a, i) => (
                  <li key={a.code} className="activity-row">
                    <span className="activity-code">Step {i + 1}</span>
                    <span className="activity-label">{a.label}</span>
                    {a.persona && <span className="persona-chip">{a.persona}</span>}
                    <ModeChip mode={a.mode} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="panel-subhead">Agent crew</div>
              {stage.activities.some((a) => a.agents) ? (
                <div className="agent-grid">
                  {[...new Set(stage.activities.flatMap((a) => a.agents || []))].map((key) => {
                    const act = stage.activities.find((a) => (a.agents || []).includes(key));
                    return <AgentCard key={key} agent={rosterByKey[key]} trigger={act.trigger} />;
                  })}
                </div>
              ) : (
                <p className="muted-text">No agents in this stage — system automation only.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <section>
        <Eyebrow>Follow the journey — switch users anytime from the profile menu (top right)</Eyebrow>
        <div className="persona-grid">
          {PERSONA_CARDS.map((p) => (
            <button
              key={p.name + p.role}
              className="card persona-card"
              onClick={() => { if (p.persona) { setPersona(p.persona); setView('journey'); } else { setView('value'); } }}
            >
              <span className="persona-icon"><p.icon size={17} /></span>
              <span className="persona-name">{p.name}</span>
              <span className="persona-role">{p.role}</span>
              <span className="persona-hint">{p.hint}</span>
              <span className="persona-go">Open view <ArrowRight size={12} /></span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>Also onboarding now</Eyebrow>
        <div className="bg-hires">
          {state.background_hires.map((h) => (
            <div key={h.name} className="card bg-hire">
              <span className="bg-hire-name">{h.name}</span>
              <span className="bg-hire-role">{h.role}</span>
              <span className="bg-hire-stage">{h.stage}</span>
              <span className="bg-hire-note">{h.note}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
