import { Check, Bot, Zap, ShieldCheck } from 'lucide-react';
import { Eyebrow, Badge, AgentTypeChip } from './shared.jsx';

export default function ValueDelivered({ state }) {
  const v = state.value;
  const runs = state.agent_runs.filter((r) => r.type === 'agent');

  // Leaderboard — live from this session's run log.
  const counts = {};
  runs.forEach((r) => {
    counts[r.key] = counts[r.key] || { ...r, n: 0 };
    counts[r.key].n += 1;
  });
  const board = Object.values(counts).sort((a, b) => b.n - a.n);
  const maxN = board.length ? board[0].n : 1;

  const achieved = v.hours_saved.filter((h) => h.achieved);
  const totalHours = achieved.reduce((s, h) => s + h.hours, 0);

  return (
    <div className="view">
      <section>
        <Eyebrow>The scope — {v.activities_total} activities in the client's green & yellow rows</Eyebrow>
        <div className="receipt-strip">
          <div className="card receipt">
            <div className="receipt-num">{v.activities_total}</div>
            <div className="receipt-label">activities in scope</div>
          </div>
          <div className="card receipt receipt-ai">
            <div className="receipt-num">{v.ai_run}</div>
            <div className="receipt-label"><Bot size={13} /> AI-agent run</div>
          </div>
          <div className="card receipt receipt-system">
            <div className="receipt-num">{v.system_automated}</div>
            <div className="receipt-label"><Zap size={13} /> system-automated</div>
          </div>
          <div className="card receipt receipt-human">
            <div className="receipt-num">{v.human_decisions}</div>
            <div className="receipt-label"><ShieldCheck size={13} /> human decision</div>
          </div>
        </div>
      </section>

      <div className="two-col">
        <div className="col">
          <div className="card">
            <Eyebrow>Agent leaderboard — runs this session</Eyebrow>
            {board.length === 0 ? (
              <p className="muted-text">No agent runs yet — walk through the journey tabs first.</p>
            ) : (
              <div className="board">
                {board.map((a) => (
                  <div key={a.key} className="board-row">
                    <div className="board-name">
                      {a.name} <AgentTypeChip badge={a.badge} />
                    </div>
                    <div className="board-bar-wrap">
                      <div className="board-bar" style={{ width: `${(a.n / maxN) * 100}%` }} />
                      <span className="board-n">{a.n}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="board-total">
              {state.kpis.agent_runs} agent runs by {board.length} distinct agents · {state.kpis.system_events} system
              events this session. Runs exceed agents when an agent acts more than once (e.g. Benefits Plan
              Advisor presents plans and later guides the selection).
            </p>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <Eyebrow>Estimated hours saved per hire — LLM-estimated</Eyebrow>
            <div className="hours-table">
              {v.hours_saved.map((h) => (
                <div key={h.label} className={`hours-row ${h.achieved ? 'hours-on' : ''}`}>
                  <span className="hours-tick">{h.achieved && <Check size={13} />}</span>
                  <span className="hours-label">{h.label}</span>
                  <span className="hours-val">{h.hours.toFixed(1)} h</span>
                </div>
              ))}
              <div className="hours-total-row">
                <span>Saved so far this session</span>
                <span className="hours-total">{totalHours.toFixed(1)} h</span>
              </div>
            </div>
            <p className="assumption-note">
              Hours are estimated by an LLM from the as-is manual effort described in the client mapping —
              illustrative, not audited. A milestone counts only once completed in this session.
            </p>
          </div>

          <div className="card human-panel">
            <div className="card-head-row">
              <Eyebrow>What stays human — and why</Eyebrow>
              <Badge kind="Human authority" />
            </div>
            <ul className="human-list">
              <li>
                <strong>Probation decision.</strong> Confirm, extend, or terminate stays with the
                accountable manager. The decision screen carries no AI assistance by design.
              </li>
              <li>
                <strong>Offer approval & dispatch.</strong> Agents draft and redraft; the hiring manager
                reviews and approves every offer before it reaches the candidate.
              </li>
              <li>
                <strong>Schedule confirmation.</strong> The advisor proposes from the position profile;
                the manager confirms or adjusts.
              </li>
            </ul>
            <p className="human-why">AI drafts, routes, and validates — accountable humans decide.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
