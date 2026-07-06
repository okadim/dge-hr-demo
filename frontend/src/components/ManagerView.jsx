import { useEffect, useState } from 'react';
import { Check, FileText, KeyRound, CalendarClock, Play, FolderSearch, ShieldCheck, MapPin, Users as UsersIcon, UserRound, CalendarDays, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { Eyebrow, TermsTable, CrewPlayer, AgentTag, LockedNote, RunRow, Badge, TaskIcon, PersonaProfileCard } from './shared.jsx';
import { PERSONAS } from '../personas.js';
import OfferReviewModal from './OfferReviewModal.jsx';

// One manager, one view: Khalid's tasks surface by journey phase —
// pre-day-one (offer, identity, schedule) then day 1 onwards (check-ins,
// probation review, the human decision).
export default function ManagerView({ state, act, activity, busy }) {
  const c = state.case;
  const p = c.probation;
  const m = PERSONAS.manager;

  return (
    <div className="view">
      <div className="journey-grid">
        <aside className="journey-left">
          <PersonaProfileCard
            initials={m.initials}
            name={m.name}
            pronoun="He/Him"
            title={m.role}
            facts={[
              { icon: MapPin, text: 'Al Maqam Tower, Abu Dhabi' },
              { icon: UsersIcon, text: 'Economic Policy team — 12 people' },
              { icon: UserRound, text: 'Onboarding: Aisha Al Khoori — Policy Analyst' },
              { icon: CalendarDays, text: `Aisha starts ${c.employee.start_date}` },
            ]}
            skills={['Economic policy', 'Team leadership', 'Performance management', 'Arabic · English']}
          />
          <ManagerTasks c={c} />
        </aside>

        <div className="journey-right">
      <Readiness c={c} />

      <section>
        <div className="phase-head phase-head-ruled">
          <Eyebrow>Before day 1</Eyebrow>
        </div>
        <div className="two-col">
          <div className="col">
            <OfferReview c={c} act={act} activity={activity} busy={busy} />
            <IdentityPipeline state={state} act={act} activity={activity} busy={busy} />
            <ScheduleCard c={c} act={act} activity={activity} busy={busy} />
          </div>
          <div className="col">
            <StatusUpdates c={c} />
          </div>
        </div>
      </section>

      <section>
        <div className="phase-head phase-head-ruled">
          <Eyebrow>Day 1 onwards</Eyebrow>
          <Cadence decided={p.status === 'decided'} />
        </div>
        <div className="two-col">
          <div className="col">
            <EvidenceCard p={p} act={act} activity={activity} busy={busy} />
          </div>
          <div className="col">
            {p.status === 'compiled' && <DecisionCard act={act} busy={busy} />}
            {p.status === 'decided' && <ClosedCard c={c} />}
            {['locked', 'ready'].includes(p.status) && (
              <div className="card">
                <div className="card-head-row">
                  <Eyebrow>Decision — probation outcome</Eyebrow>
                  <Badge kind="Human authority" />
                </div>
                <LockedNote>The probation decision opens once the day-90 evidence pack is compiled.</LockedNote>
              </div>
            )}
          </div>
        </div>
      </section>
        </div>
      </div>
    </div>
  );
}

// Khalid's own checklist — mirrors the employee's journey list, statuses live.
function ManagerTasks({ c }) {
  const o = c.offer;
  const items = [
    ['Review & approve the offer', o.status === 'hr_review' ? 'locked' : ['sent', 'accepted'].includes(o.status) ? 'done' : 'pending'],
    ['Approve identity & application access', c.provisioning.status === 'done' ? 'done' : c.provisioning.status === 'ready' ? 'pending' : 'locked'],
    ['Approve schedule, equipment & training', c.schedule.status === 'confirmed' ? 'done' : c.schedule.status === 'proposed' ? 'pending' : 'locked'],
    ['Compile the day-90 evidence pack', ['compiled', 'decided'].includes(c.probation.status) ? 'done' : c.probation.status === 'ready' ? 'pending' : 'locked'],
    ['Confirm the appointment date — human authority', c.probation.status === 'decided' ? 'done' : c.probation.status === 'compiled' ? 'pending' : 'locked'],
  ];
  return (
    <div className="card checklist-card">
      <Eyebrow>My approvals & decisions</Eyebrow>
      <ul className="task-list">
        {items.map(([label, status]) => (
          <li key={label} className={`task task-st-${status}`}>
            <TaskIcon status={status} />
            <div>
              <div className="task-label">{label}</div>
              <div className="task-owner">You — Manager</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Status feed: things Khalid is informed about but never actions.
function StatusUpdates({ c }) {
  const items = [];
  if (['sent', 'accepted'].includes(c.offer.status)) items.push(['Offer dispatched to Aisha — acceptance tracking armed', true]);
  items.push(['Candidate offer acceptance', c.offer.status === 'accepted']);
  items.push(['Background & reference checks initiated', c.offer.status === 'accepted']);
  items.push(['Security clearance — routine check', c.provisioning.status === 'done']);
  items.push(['Pre-boarding data submitted & validated', c.details.status === 'submitted']);
  items.push(['Benefits enrolment completed', c.benefits.status === 'enrolled']);
  items.push(['Training & compliance report filed', ['compiled', 'decided'].includes(c.probation.status)]);
  return (
    <div className="card" id="m-status">
      <Eyebrow>Status updates — no action needed</Eyebrow>
      <div className="status-feed">
        {items.map(([label, done]) => (
          <div key={label} className={`status-item ${done ? 'status-done' : ''}`}>
            <span className="status-ic">{done ? <Check size={12} /> : <span className="agents-idle" />}</span>
            {label}{done ? ' — completed' : ' — pending'}
          </div>
        ))}
      </div>
    </div>
  );
}

function Readiness({ c }) {
  // state: done | active (live now) | locked (waiting on an earlier step)
  const items = [
    ['Offer accepted',
      c.offer.status === 'accepted' ? 'done' : 'active', 'm-offer'],
    ['Pre-boarding data',
      c.details.status === 'submitted' ? 'done' : c.details.status === 'available' ? 'active' : 'locked', 'm-status'],
    ['IT account',
      c.provisioning.status === 'done' ? 'done' : c.provisioning.status === 'ready' ? 'active' : 'locked', 'm-access'],
    ['Schedule',
      c.schedule.status === 'confirmed' ? 'done' : c.schedule.status === 'proposed' ? 'active' : 'locked', 'm-schedule'],
    ['Benefits',
      c.benefits.status === 'enrolled' ? 'done' : ['open', 'flagged'].includes(c.benefits.status) ? 'active' : 'locked', 'm-status'],
  ];
  const doneCount = items.filter(([, st]) => st === 'done').length;

  function jump(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('flash');
    void el.offsetWidth; // restart the highlight animation
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1400);
  }

  return (
    <div className="card readiness-card">
      <div className="readiness-head">
        <span className="readiness-title">Day-1 readiness</span>
        <span className="readiness-count">{doneCount} of {items.length} ready</span>
      </div>
      <div className="readiness-grid">
        {items.map(([label, st, target]) => (
          <div key={label} className="readiness-cell">
            <button className={`ready-chip ready-${st}`} onClick={() => jump(target)} title="Jump to this card">
              {st === 'done' ? <CheckCircle2 size={13} /> : st === 'active' ? <Loader2 size={13} className="spin-slow" /> : <Lock size={11} />}
              {label}
            </button>
            <span className={`readiness-seg readiness-seg-${st}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function OfferReview({ c, act, activity, busy }) {
  const o = c.offer;
  const [reviewOpen, setReviewOpen] = useState(false);
  return (
    <div className={`card ${o.status === 'hr_review' ? 'card-compact' : ''}`} id="m-offer">
      <div className="card-head-row">
        <Eyebrow>Offer approval</Eyebrow>
        <FileText size={15} className="card-head-icon" />
      </div>

      {o.status === 'hr_review' ? (
        <LockedNote>The offer draft is with HR for review — you'll approve it here once routed.</LockedNote>
      ) : (
        <>
          <p className="card-caption">
            Drafted by <AgentTag name="Job Offer Creation Advisor" cKey="HCM_40" />
            {o.hr_edited && <> · HR tracked change applied by <AgentTag name="Redraft Offer Letters" cKey="HCM_92" /></>}
            {' '}— your role is approval only; terms are set by HR.
          </p>

          {o.hr_comment && o.status === 'awaiting_review' && (
            <div className="redraft-note"><strong>HR note:</strong> {o.hr_comment}</div>
          )}
          <TermsTable terms={o.terms.filter((t) => !['Base salary', 'Housing allowance'].includes(t.label))} />

          <CrewPlayer activity={activity} action="approve-offer" />

          {o.status === 'awaiting_review' && !isPlaying(activity, 'approve-offer') && (
            <div className="card-actions">
              <button className="btn btn-primary" data-guide="review-offer" onClick={() => setReviewOpen(true)} disabled={busy}>
                <Check size={14} /> Review offer & approve
              </button>
            </div>
          )}

          {reviewOpen && (
            <OfferReviewModal
              mode="manager"
              offer={o}
              busy={busy}
              onClose={() => setReviewOpen(false)}
              onApprove={() => { setReviewOpen(false); act('approve-offer'); }}
            />
          )}

          {o.status === 'sent' && (
            <div className="done-note">
              <Check size={14} />
              <span>Dispatched by <AgentTag name="Offer Letter Agent" cKey="HCM_53" /> — awaiting Aisha's acceptance.</span>
            </div>
          )}
          {o.status === 'accepted' && (
            <div className="done-note">
              <Check size={14} />
              <span>Accepted & e-signed by Aisha · worker record {c.employee.employee_number} created.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function IdentityPipeline({ state, act, activity, busy }) {
  const c = state.case;
  const p = c.provisioning;
  const playing = isPlaying(activity, 'run-provisioning');
  const doneRuns = state.agent_runs.filter(
    (r) => ['HCM_89', 'HCM_12', 'HCM_75', 'HCM_152'].includes(r.key) || (r.type === 'system' && r.key === '2.2.1')
  );

  return (
    <div className={`card ${p.status === 'locked' && !playing ? 'card-compact' : ''}`} id="m-access">
      <div className="card-head-row">
        <Eyebrow>Access approvals — identity & applications</Eyebrow>
        <KeyRound size={15} className="card-head-icon" />
      </div>
      <p className="card-caption">
        Orchestrated end-to-end by <AgentTag name="User Profile Orchestrator Agent" cKey="HCM_89" />
      </p>

      {p.status === 'locked' && !playing && (
        <LockedNote>Available once Aisha submits her pre-boarding data.</LockedNote>
      )}

      {p.status === 'ready' && !playing && (
        <>
          <p className="muted-text">
            Worker record is ready. Run provisioning to create the AD / SSO account with the correct
            group memberships and role-based application access — before day 1.
          </p>
          <div className="card-actions">
            <button className="btn btn-primary" data-guide="run-provisioning" onClick={() => act('run-provisioning')} disabled={busy}>
              <Play size={14} /> Approve identity & application access
            </button>
          </div>
        </>
      )}

      <CrewPlayer activity={activity} action="run-provisioning" />

      {p.status === 'done' && !playing && (
        <>
          <div className="crew-player">
            {doneRuns.map((r, i) => <RunRow key={i} run={r} phase="done" />)}
          </div>
          <div className="cred-card">
            <div className="cred-row"><span>Account</span><strong>{p.credentials.username}</strong></div>
            <div className="cred-row"><span>Systems</span><strong>{p.credentials.systems}</strong></div>
            <div className="cred-row"><span>ServiceNow</span><strong>{p.ticket}</strong></div>
            <div className="cred-issued"><Check size={13} /> Credentials issued — ready for day 1</div>
          </div>
        </>
      )}
    </div>
  );
}

const EQUIPMENT_ITEMS = [
  { id: 'laptop', label: 'Laptop — ThinkPad X1 (standard build)', mandatory: true },
  { id: 'monitor', label: 'External monitor 27"', mandatory: false },
  { id: 'dock', label: 'Docking station', mandatory: false },
  { id: 'headset', label: 'Headset for calls', mandatory: false },
];
const TRAINING_ITEMS = [
  { id: 'data', label: 'Government Data Handling (mandatory)', mandatory: true },
  { id: 'conduct', label: 'Code of Conduct & Ethics (mandatory)', mandatory: true },
  { id: 'policy', label: 'Policy Analysis Toolkit (role)', mandatory: false },
  { id: 'culture', label: 'DGE Ways of Working', mandatory: false },
];

function PickList({ title, items, picked, onToggle, disabled }) {
  return (
    <div className="pick-block">
      <div className="pick-title">{title}</div>
      <div className="pick-list">
        {items.map((it) => (
          <label key={it.id} className={`pick-row ${it.mandatory ? 'pick-mandatory' : ''}`}>
            <input
              type="checkbox"
              checked={picked.includes(it.id)}
              disabled={disabled || it.mandatory}
              onChange={() => onToggle(it.id)}
            />
            <span>{it.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ScheduleCard({ c, act, activity, busy }) {
  const s = c.schedule;
  const playing = isPlaying(activity, 'confirm-schedule');
  const [equip, setEquip] = useState(EQUIPMENT_ITEMS.map((i) => i.id));
  const [train, setTrain] = useState(TRAINING_ITEMS.map((i) => i.id));
  const toggle = (list, setList) => (id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const selections = () => ({
    equipment: EQUIPMENT_ITEMS.filter((i) => equip.includes(i.id)).map((i) => i.label),
    trainings: TRAINING_ITEMS.filter((i) => train.includes(i.id)).map((i) => i.label),
  });
  return (
    <div className={`card ${s.status === 'locked' ? 'card-compact' : ''}`} id="m-schedule">
      <div className="card-head-row">
        <Eyebrow>Schedule, equipment & training approvals</Eyebrow>
        <CalendarClock size={15} className="card-head-icon" />
      </div>

      {s.status === 'locked' && <LockedNote>Proposed once pre-boarding data is in.</LockedNote>}

      {s.status === 'proposed' && (
        <>
          <p className="card-caption">
            Proposed from the position profile by <AgentTag name="Scheduling Advisor" cKey="HCM_73" />
          </p>
          <div className="schedule-box">
            <div className="sched-row"><span>Days</span><strong>{s.proposed.days}</strong></div>
            <div className="sched-row"><span>Hours</span><strong>{s.proposed.hours}</strong></div>
            <div className="sched-row"><span>Mode</span><strong>{s.proposed.mode}</strong></div>
            <div className="sched-row"><span>Location</span><strong>{s.proposed.location}</strong></div>
          </div>
          <div className="pick-grid">
            <PickList title="Equipment to provision" items={EQUIPMENT_ITEMS} picked={equip} onToggle={toggle(equip, setEquip)} disabled={busy} />
            <PickList title="Training plan to assign" items={TRAINING_ITEMS} picked={train} onToggle={toggle(train, setTrain)} disabled={busy} />
          </div>
          <CrewPlayer activity={activity} action="confirm-schedule" />
          {!playing && (
            <div className="card-actions">
              <button className="btn btn-primary" data-guide="confirm-schedule" onClick={() => act('confirm-schedule', { adjusted: false, ...selections() })} disabled={busy}>
                <Check size={14} /> Approve as proposed
              </button>
              <button className="btn btn-outline" onClick={() => act('confirm-schedule', { adjusted: true, ...selections() })} disabled={busy}>
                Adjust to 8:30–16:30 & confirm
              </button>
            </div>
          )}
        </>
      )}

      {s.status === 'confirmed' && !playing && (
        <>
          <div className="schedule-box">
            <div className="sched-row"><span>Days</span><strong>{s.final.days}</strong></div>
            <div className="sched-row"><span>Hours</span><strong>{s.final.hours}</strong></div>
            <div className="sched-row"><span>Mode</span><strong>{s.final.mode}</strong></div>
            <div className="sched-row"><span>Location</span><strong>{s.final.location}</strong></div>
          </div>
          {(s.equipment || s.trainings) && (
            <div className="pick-approved">
              {(s.equipment || []).map((e) => <span key={e} className="ready-chip ready-done"><Check size={11} /> {e}</span>)}
              {(s.trainings || []).map((t) => <span key={t} className="ready-chip ready-active">{t}</span>)}
            </div>
          )}
          <div className="done-note">
            <Check size={14} />
            <span>
              Applied by <AgentTag name="Change Working Hours Advisor" cKey="HCM_6" /> — equipment
              delivered and receipt confirmed.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Cadence({ decided }) {
  return (
    <div className="cadence cadence-inline">
      <div className="cadence-row">
        <span className="cadence-dot cadence-done"><Check size={11} /> Day 30</span>
        <span className="cadence-line" />
        <span className="cadence-dot cadence-done"><Check size={11} /> Day 60</span>
        <span className="cadence-line" />
        <span className={`cadence-dot ${decided ? 'cadence-done' : 'cadence-due'}`}>
          {decided ? <Check size={11} /> : null} Day 90 — final review
        </span>
      </div>
    </div>
  );
}

function EvidenceCard({ p, act, activity, busy }) {
  const playing = activity && activity.action === 'compile-probation';
  return (
    <div className="card">
      <div className="card-head-row">
        <Eyebrow>Probation review criteria</Eyebrow>
        <FolderSearch size={15} className="card-head-icon" />
      </div>
      <p className="card-caption">
        Evidence by <AgentTag name="Talent Advisor (My Team)" cKey="HCM_81" /> · summary by{' '}
        <AgentTag name="Performance Summary Generator" cKey="HCM_111" />
      </p>

      {p.status === 'locked' && (
        <LockedNote>Opens at day 90 — once Aisha's onboarding journey is complete.</LockedNote>
      )}

      {p.status === 'ready' && !playing && (
        <>
          <p className="muted-text">
            Aisha reaches day 90. Compile the evidence pack — compliance, onboarding progress, skills,
            goals, attendance, and feedback themes — for your final assessment.
          </p>
          <div className="card-actions">
            <button className="btn btn-primary" data-guide="compile-probation" onClick={() => act('compile-probation')} disabled={busy}>
              Compile evidence pack
            </button>
          </div>
        </>
      )}

      <CrewPlayer activity={activity} action="compile-probation" />

      {(p.status === 'compiled' || p.status === 'decided') && !playing && (
        <>
          <div className="evidence-grid">
            {p.evidence.map((e) => (
              <div key={e.label} className="evidence-item">
                <div className="evidence-label">{e.label}</div>
                <div className="evidence-value">{e.value}</div>
                <div className="evidence-detail">{e.detail}</div>
              </div>
            ))}
          </div>
          <div className="summary-box">
            <div className="summary-head">
              90-day summary <span className="summary-by">draft — <AgentTag name="Performance Summary Generator" cKey="HCM_111" /></span>
            </div>
            <Typewriter text={p.summary} instant={p.status === 'decided'} />
          </div>
        </>
      )}
    </div>
  );
}

// The decision screen carries zero AI assistance: no agent names, no
// recommendations, no generated copy — an accountable human decides.
function DecisionCard({ act, busy }) {
  const [pending, setPending] = useState(false);
  const [date, setDate] = useState('2026-11-01');
  const nice = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!pending) return;
    const onKey = (e) => e.key === 'Escape' && setPending(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending]);

  return (
    <div className="card decision-card">
      <div className="card-head-row">
        <Eyebrow>Decision — probation outcome</Eyebrow>
        <Badge kind="Human authority" />
      </div>
      <p className="decision-text">
        You evaluate performance against the review criteria and confirm the appointment, setting its
        effective date. Extending or ending probation is decided by the HR Director.
      </p>
      <div className="decision-actions" data-guide="decision">
        <label className="date-field">
          <span className="date-label">Appointment date</span>
          <input type="date" className="date-input" value={date} onChange={(e) => setDate(e.target.value)} disabled={busy} />
        </label>
        <button className="btn btn-gold" onClick={() => setPending(true)} disabled={busy || !date}>
          Confirm appointment
        </button>
      </div>

      {pending && (
        <div className="modal-backdrop" onClick={() => setPending(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Confirm your decision" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <ShieldCheck size={16} />
              <span>Confirm your decision</span>
            </div>
            <p className="modal-text">
              Confirm <strong>Aisha Al Khoori</strong>'s appointment effective <strong>{nice(date)}</strong>?
              Her status will be updated and payroll, IT, and Aisha will be notified.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" autoFocus onClick={() => setPending(false)}>Cancel</button>
              <button
                className="btn btn-gold"
                onClick={() => { act('decide', { decision: 'confirm', date: nice(date) }); setPending(false); }}
              >
                Confirm appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClosedCard({ c }) {
  return (
    <div className="card decision-card reveal">
      <div className="card-head-row">
        <Eyebrow>Decision — probation outcome</Eyebrow>
        <Badge kind="Human authority" />
      </div>
      <div className="done-note done-gold">
        <Check size={14} />
        <span>
          <strong>Appointment confirmed</strong> — effective {c.probation.appointment_date} · recorded by
          Khalid Al Hammadi.
        </span>
      </div>
      <div className="system-note">
        Work Automation — status updated to Confirmed; payroll, IT, and Aisha notified.
      </div>
    </div>
  );
}

function Typewriter({ text, instant }) {
  const words = text.split(' ');
  const [n, setN] = useState(instant ? words.length : 0);
  useEffect(() => {
    if (instant) return;
    setN(0);
    const id = setInterval(() => {
      setN((v) => {
        if (v >= words.length) { clearInterval(id); return v; }
        return v + 1;
      });
    }, 28);
    return () => clearInterval(id);
  }, [text, instant]);
  return (
    <p className="summary-text">
      {words.slice(0, n).join(' ')}
      {n < words.length && <span className="caret" />}
    </p>
  );
}

function isPlaying(activity, action) {
  return activity && activity.action === action;
}
