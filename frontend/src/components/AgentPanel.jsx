import { useState } from 'react';
import { Bot, X, Check, Loader2 } from 'lucide-react';
import { AgentTypeChip, avatarStyle } from './shared.jsx';
import { PERSONAS } from '../personas.js';

// Per-persona agent schema: only the crews that act in this user's part of
// the journey, drawn as a hierarchy (the identity crew nests its sub-agents
// under the orchestrator). Live: running agent pulses, activated agents get
// a check, the rest stay dim.
const TREES = {
  hr: [
    { crew: 'Offer drafting & review', agents: [{ key: 'HCM_40' }, { key: 'HCM_92' }] },
    { crew: 'Acceptance tracking', agents: [{ key: 'HCM_95' }, { key: 'HCM_94' }] },
    { crew: 'Background checks', agents: [{ key: 'HCM_98' }] },
    { crew: 'Data quality', agents: [{ key: 'HCM_31' }, { key: 'HCM_1' }] },
    { crew: 'Compliance reporting', agents: [{ key: 'HCM_153' }] },
  ],
  manager: [
    { crew: 'Offer dispatch', agents: [{ key: 'HCM_53' }] },
    {
      crew: 'Identity & access',
      agents: [{
        key: 'HCM_89',
        children: [{ key: 'HCM_12' }, { key: 'HCM_75' }, { key: 'HCM_152' }],
      }],
    },
    { crew: 'Schedule & equipment', agents: [{ key: 'HCM_73' }, { key: 'HCM_6' }] },
    {
      crew: 'Probation evidence',
      agents: [{ key: 'HCM_97' }, { key: 'HCM_76' }, { key: 'HCM_52' }, { key: 'HCM_81' }, { key: 'HCM_111' }],
    },
  ],
  employee: [
    { crew: 'Journey coordinators', agents: [{ key: 'HCM_54' }, { key: 'HCM_44' }] },
    { crew: 'Welcome & first day', agents: [{ key: 'HCM_146' }, { key: 'HCM_55' }] },
    { crew: 'Guided data collection', agents: [{ key: 'HCM_67' }] },
    {
      crew: 'Benefits & assistant chat',
      agents: [{ key: 'HCM_4' }, { key: 'HCM_5' }, { key: 'HCM_2' }, { key: 'HCM_90' }],
    },
  ],
};

function flatten(nodes) {
  return nodes.flatMap((n) => [n.key, ...(n.children ? flatten(n.children) : [])]);
}

export default function AgentPanel({ state, activity, persona }) {
  const [open, setOpen] = useState(false);
  const byKey = Object.fromEntries(state.roster.map((a) => [a.key, a]));
  const tree = TREES[persona] || [];
  const personaKeys = tree.flatMap((c) => flatten(c.agents));
  const activeKey =
    activity && activity.index < activity.runs.length && activity.runs[activity.index].type === 'agent'
      ? activity.runs[activity.index].key
      : null;
  const ranKeys = new Set(state.agent_runs.filter((r) => r.type === 'agent').map((r) => r.key));
  const ranHere = personaKeys.filter((k) => ranKeys.has(k)).length;
  const activeHere = activeKey && personaKeys.includes(activeKey);
  const who = PERSONAS[persona];

  const Node = ({ node, depth }) => {
    const a = byKey[node.key];
    const isActive = node.key === activeKey;
    const ran = ranKeys.has(node.key);
    return (
      <>
        <li className={`tree-node ${isActive ? 'tree-active' : ran ? 'tree-ran' : 'tree-idle'}`}>
          <span className="tree-status">
            {isActive ? <Loader2 size={12} className="spin" /> : ran ? <Check size={12} /> : <span className="agents-idle" />}
          </span>
          <span className="tree-name">{a.name}</span>
          <AgentTypeChip badge={a.badge} />
          {isActive && <span className="agents-working">working…</span>}
        </li>
        {node.children && (
          <li>
            <ul className="tree-branch">
              {node.children.map((ch) => <Node key={ch.key} node={ch} depth={depth + 1} />)}
            </ul>
          </li>
        )}
      </>
    );
  };

  return (
    <>
      <button
        className={`agents-fab ${activeHere ? 'agents-fab-live' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Show my agents"
        title="My agents — this lens"
      >
        {activeHere ? <Loader2 size={16} className="spin" /> : <Bot size={16} />}
        <span className="agents-fab-label">My agents</span>
        <span className="agents-fab-count">{ranHere}/{personaKeys.length}</span>
      </button>

      {open && (
        <aside className="agents-drawer" aria-label="My agents">
          <div className="agents-drawer-head">
            <span className="eyebrow">Agents in this lens — live</span>
            <button className="guide-close" onClick={() => setOpen(false)} aria-label="Close agent panel">
              <X size={14} />
            </button>
          </div>
          <div className="agents-drawer-scroll">
            <ul className="tree-root-node">
              <li className="tree-persona">
                <span className="persona-avatar tree-avatar" style={avatarStyle(who.name)}>{who.initials}</span>
                <span>
                  <span className="tree-persona-name">{who.name}</span>
                  <span className="tree-persona-role">{who.role}</span>
                </span>
              </li>
              <li>
                <ul className="tree-branch">
                  {tree.map((crew) => (
                    <li key={crew.crew} className="tree-crew-wrap">
                      <div className="tree-crew">{crew.crew}</div>
                      <ul className="tree-branch">
                        {crew.agents.map((n) => <Node key={n.key} node={n} depth={0} />)}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <p className="tree-footnote">
              {ranHere} of {personaKeys.length} agents in this lens have run this session.
              Switch user to see the other lenses' crews.
            </p>
          </div>
        </aside>
      )}
    </>
  );
}
