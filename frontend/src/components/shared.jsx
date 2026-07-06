import { Check, Lock, Zap, CircleDashed, AlertTriangle, Loader2, Mail, Users } from 'lucide-react';

// Badge vocabulary from the business demo: Oracle Fusion HCM · AI Agent ·
// Custom Agent — plus System (gray) and Human authority (gold).
const BADGE_CLASS = {
  'Oracle Fusion HCM': 'badge badge-oracle',
  'Custom Agent': 'badge badge-custom',
  'AI Agent': 'badge badge-ai',
  'System': 'badge badge-system',
  'Human authority': 'badge badge-human',
};

export function Badge({ kind }) {
  return <span className={BADGE_CLASS[kind] || 'badge'}>{kind}</span>;
}

export function ModeChip({ mode }) {
  if (mode === 'ai') return <Badge kind="AI Agent" />;
  if (mode === 'system') return <Badge kind="System" />;
  return <Badge kind="Human authority" />;
}

export function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}

// Agent type by internal key — used to label agents as Oracle or Custom
// without surfacing the HCM_ codes in the UI.
export const AGENT_TYPE = {
  HCM_40: 'oracle', HCM_53: 'oracle', HCM_92: 'oracle', HCM_146: 'oracle', HCM_55: 'oracle',
  HCM_67: 'oracle', HCM_54: 'oracle', HCM_44: 'oracle', HCM_73: 'oracle', HCM_6: 'oracle',
  HCM_4: 'oracle', HCM_5: 'oracle', HCM_2: 'oracle', HCM_90: 'oracle', HCM_81: 'oracle',
  HCM_31: 'oracle', HCM_1: 'oracle', HCM_76: 'oracle', HCM_52: 'oracle',
  HCM_95: 'custom', HCM_94: 'custom', HCM_89: 'custom', HCM_12: 'custom', HCM_75: 'custom',
  HCM_152: 'custom', HCM_153: 'custom', HCM_97: 'custom', HCM_111: 'custom',
};

export function AgentTypeChip({ cKey, badge }) {
  const t = cKey ? AGENT_TYPE[cKey] : badge === 'Custom Agent' ? 'custom' : 'oracle';
  if (!t) return null;
  return (
    <span className={`agent-type agent-type-${t}`}>
      {t === 'oracle' ? 'Oracle agent' : 'Custom agent'}
    </span>
  );
}

// Small inline attribution: agent name + whether it's an Oracle or Custom agent.
export function AgentTag({ name, cKey }) {
  return (
    <span className="agent-tag">
      <span className="agent-dot" />
      {name}
      <AgentTypeChip cKey={cKey} />
    </span>
  );
}

export function AgentCard({ agent, trigger }) {
  return (
    <div className="agent-card">
      <div className="agent-card-head">
        <span className="agent-name">{agent.name}</span>
      </div>
      <Badge kind={agent.badge} />
      <p className="agent-does">{agent.does}</p>
      {trigger && <p className="agent-trigger">Trigger — {trigger}</p>}
    </div>
  );
}

// Animates the runs of the action currently in flight: done steps get a tick
// and their output line, the current one shimmers "working…", the rest queue.
export function CrewPlayer({ activity, action }) {
  if (!activity || activity.action !== action) return null;
  return (
    <div className="crew-player">
      {activity.runs.map((run, i) => {
        const phase = i < activity.index ? 'done' : i === activity.index ? 'working' : 'queued';
        return <RunRow key={i} run={run} phase={phase} />;
      })}
    </div>
  );
}

export function RunRow({ run, phase = 'done' }) {
  const isSystem = run.type === 'system';
  return (
    <div className={`run-row run-${phase} ${isSystem ? 'run-system' : ''}`}>
      <div className="run-icon">
        {phase === 'done' ? <Check size={14} /> : phase === 'working' ? (isSystem ? <Zap size={14} /> : <Loader2 size={15} className="spin" />) : <CircleDashed size={14} />}
      </div>
      <div className="run-body">
        <div className="run-title">
          {run.name}
          {!isSystem && <AgentTypeChip badge={run.badge} />}
          {phase === 'working' && <span className="working-label">{isSystem ? 'executing' : 'working…'}</span>}
        </div>
        <div className="run-action">{run.action}</div>
        {phase === 'done' && run.output && <div className="run-output">{run.output}</div>}
      </div>
    </div>
  );
}

export function TaskIcon({ status }) {
  if (status === 'done') return <span className="task-ic task-done"><Check size={13} /></span>;
  if (status === 'attention') return <span className="task-ic task-attention"><AlertTriangle size={12} /></span>;
  if (status === 'locked') return <span className="task-ic task-locked"><Lock size={11} /></span>;
  return <span className="task-ic task-pending" />;
}

export function TermsTable({ terms, previous }) {
  const prevByLabel = Object.fromEntries((previous || []).map((t) => [t.label, t.value]));
  return (
    <table className="terms-table">
      <tbody>
        {terms.map((t) => {
          const old = prevByLabel[t.label];
          const changed = old && old !== t.value;
          return (
            <tr key={t.label} className={changed ? 'term-changed' : ''}>
              <td className="term-label">{t.label}</td>
              <td className="term-value">
                {changed && <span className="term-old">{old}</span>}
                <span>{t.value}</span>
                {changed && <span className="term-diff-chip">revised</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function LockedNote({ children }) {
  return (
    <div className="locked-note">
      <Lock size={13} />
      <span>{children}</span>
    </div>
  );
}


// Workday-inspired profile card, shared by all three personas: avatar on a
// brand arc, identity, contact chips, facts, and skills.
export function PersonaProfileCard({ initials, name, pronoun, title, facts, skills }) {
  return (
    <div className="card profile-card">
      <div className="profile-arc" />
      <div className="profile-avatar">{initials}</div>
      <div className="profile-id">
        <div className="profile-name">{name}</div>
        <div className="profile-pronoun">{pronoun}</div>
        <div className="profile-title">{title}</div>
      </div>
      <div className="profile-actions">
        <span className="profile-act"><Mail size={14} /> Email</span>
        <span className="profile-act"><Users size={14} /> Team</span>
      </div>
      <div className="profile-facts">
        {facts.map(({ icon: Icon, text, hl }) => (
          <div key={text} className={`profile-fact ${hl ? 'profile-fact-hl' : ''}`}>
            <Icon size={13} /> {text}
          </div>
        ))}
      </div>
      <div className="profile-skills">
        {skills.map((s) => <span key={s} className="skill-chip">{s}</span>)}
      </div>
    </div>
  );
}
