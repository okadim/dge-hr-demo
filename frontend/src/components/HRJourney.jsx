import { useState } from 'react';
import { Check, ChevronRight, ArrowLeft, Loader2, FileSearch, MapPin, Briefcase, Users as UsersIcon } from 'lucide-react';
import { Eyebrow, CrewPlayer, AgentTag, LockedNote, TaskIcon, PersonaProfileCard, avatarStyle } from './shared.jsx';
import { PERSONAS } from '../personas.js';
import OfferReviewModal from './OfferReviewModal.jsx';

// HR Recruiter lens. Login lands on the candidate dashboard; clicking a
// candidate opens their end-to-end process — sequential, with every step
// showing exactly who acts (HR / Manager / Aisha / System).
export default function HRJourney({ state, act, activity, busy }) {
  const [candidate, setCandidate] = useState(null); // null = dashboard
  const hr = PERSONAS.hr;

  const c = state.case;
  return (
    <div className="view">
      <div className="journey-grid">
        <aside className="journey-left">
          <PersonaProfileCard
            initials={hr.initials}
            name={hr.name}
            pronoun="She/Her"
            title={hr.role}
            facts={[
              { icon: Briefcase, text: hr.org },
              { icon: MapPin, text: 'Al Maqam Tower, Abu Dhabi' },
              { icon: UsersIcon, text: '4 candidates onboarding this month' },
            ]}
            skills={['Talent acquisition', 'Onboarding operations', 'UAE labour policy', 'Arabic · English']}
          />
          <HRTasks c={c} />
        </aside>

        <div className="journey-right">
          {candidate === 'aisha' ? (
            <AishaProcess state={state} act={act} activity={activity} busy={busy} onBack={() => setCandidate(null)} />
          ) : candidate ? (
            <BackgroundCandidate hire={state.background_hires.find((h) => h.name === candidate)} onBack={() => setCandidate(null)} />
          ) : (
            <Dashboard state={state} onOpen={setCandidate} />
          )}
        </div>
      </div>
    </div>
  );
}

// Salma's own checklist — her actions and what she monitors, statuses live.
function HRTasks({ c }) {
  const o = c.offer;
  const items = [
    ['Review & approve the offer draft', o.status === 'hr_review' ? 'pending' : 'done', 'You — HR'],
    ['Track acceptance & pre-boarding data', c.details.status === 'submitted' ? 'done' : ['sent', 'accepted'].includes(o.status) ? 'pending' : 'locked', 'Monitor'],
    ['Compliance report to audit', ['compiled', 'decided'].includes(c.probation.status) ? 'done' : 'locked', 'System agents'],
    ['Confirmation paperwork', c.probation.status === 'decided' ? 'done' : 'locked', 'You — HR'],
  ];
  return (
    <div className="card checklist-card">
      <Eyebrow>My actions & monitoring</Eyebrow>
      <ul className="task-list">
        {items.map(([label, status, owner]) => (
          <li key={label} className={`task task-st-${status}`}>
            <TaskIcon status={status} />
            <div>
              <div className="task-label">{label}</div>
              <div className="task-owner">{owner}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dashboard({ state, onOpen }) {
  const c = state.case;
  return (
    <section>
      <Eyebrow>Onboarding dashboard — select a candidate</Eyebrow>
      <div className="cand-grid">
        <button className="card cand-card cand-live" data-guide="open-candidate" onClick={() => onOpen('aisha')}>
          <span className="persona-avatar" style={avatarStyle('Aisha')}>AA</span>
          <span className="cand-name">Aisha Al Khoori</span>
          <span className="cand-role">Policy Analyst · starts {c.employee.start_date}</span>
          <span className="cand-status">{state.kpis.next_human_action}</span>
          <span className="persona-go">Open journey <ChevronRight size={13} /></span>
        </button>
        {state.background_hires.map((h) => (
          <button key={h.name} className="card cand-card" onClick={() => onOpen(h.name)}>
            <span className="persona-avatar" style={avatarStyle(h.name)}>{h.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
            <span className="cand-name">{h.name}</span>
            <span className="cand-role">{h.role}</span>
            <span className="cand-status">{h.note}</span>
            <span className="persona-go">View status <ChevronRight size={13} /></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function BackgroundCandidate({ hire, onBack }) {
  return (
    <section>
      <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={13} /> Back to dashboard</button>
      <div className="card">
        <Eyebrow>{hire.name} — {hire.role}</Eyebrow>
        <p className="muted-text" style={{ marginTop: 8 }}>
          Currently in <strong>{hire.stage}</strong> — {hire.note}.
        </p>
        <LockedNote>View-only in this proof of concept — the interactive journey follows Aisha Al Khoori.</LockedNote>
      </div>
    </section>
  );
}

// Aisha's end-to-end process, sequential. Each step: status, owner, and what
// happens there. HR's own action (offer review) is live; other personas'
// steps say precisely what they must do.
function AishaProcess({ state, act, activity, busy, onBack }) {
  const c = state.case;
  const [reviewOpen, setReviewOpen] = useState(false);
  const o = c.offer;

  const steps = [
    {
      title: 'Offer draft & HR approval', owner: 'You — HR', ownerKind: 'hr',
      status: o.status === 'hr_review' ? 'action' : 'done',
      body: o.status === 'hr_review'
        ? <>
            <p className="muted-text">
              <AgentTag name="Job Offer Creation Advisor" cKey="HCM_40" /> drafted the conditional offer
              from the approved requisition. Review the document — edit if needed, leave your review
              comment, and approve to route it to the manager.
            </p>
            <CrewPlayer activity={activity} action="approve-draft" />
            {!isPlaying(activity, 'approve-draft') && (
              <div className="card-actions">
                <button className="btn btn-primary" data-guide="review-draft" onClick={() => setReviewOpen(true)} disabled={busy}>
                  <FileSearch size={14} /> Review & approve offer draft
                </button>
              </div>
            )}
          </>
        : <>
            <CrewPlayer activity={activity} action="approve-draft" />
            <div className="done-note"><Check size={14} />
              <span>Approved by you{o.hr_edited ? ' with a tracked change (housing allowance), applied by ' : '. '}
                {o.hr_edited && <AgentTag name="Redraft Offer Letters" cKey="HCM_92" />}
                {o.hr_comment && <> Review note: “{o.hr_comment}”</>}
              </span>
            </div>
          </>,
    },
    {
      title: 'Manager approval & dispatch', owner: 'Khalid — Manager', ownerKind: 'other',
      status: o.status === 'hr_review' ? 'waiting' : o.status === 'awaiting_review' ? 'action' : 'done',
      body: o.status === 'awaiting_review'
        ? <p className="muted-text">With Khalid now: he reviews the letter (and your note), then approves — he does not negotiate terms. On approval the offer is dispatched and acceptance tracking is armed.</p>
        : o.status === 'hr_review'
          ? <p className="muted-text">Next: Khalid reviews and approves the letter — approval only, no changes.</p>
          : <p className="muted-text">Approved and dispatched · <AgentTag name="Task Reminder" cKey="HCM_95" /> tracked the response window.</p>,
    },
    {
      title: 'Candidate acceptance', owner: 'Aisha — Candidate', ownerKind: 'other',
      status: o.status === 'accepted' ? 'done' : o.status === 'sent' ? 'action' : 'waiting',
      body: o.status === 'accepted'
        ? <p className="muted-text">
            Accepted & e-signed — worker record {c.employee.employee_number} created; welcome pack sent.
            {o.employee_comment && <> Aisha's note: “{o.employee_comment}”</>}
          </p>
        : <p className="muted-text">
            Aisha reviews and e-signs in the candidate portal. On acceptance the worker record and employee
            number are created automatically.
            {o.call_requested && <> <strong>Aisha requested a call to review the offer — reach out.</strong></>}
          </p>,
    },
    {
      title: 'Background & reference checks', owner: 'Candidate Checker → HR', ownerKind: 'hr',
      status: c.provisioning.status === 'done' ? 'done' : o.status === 'accepted' ? 'action' : 'waiting',
      body: c.provisioning.status === 'done'
        ? <p className="muted-text"><AgentTag name="Candidate Checker" cKey="HCM_98" /> completed tracking — checks and routine clearance closed with no findings.</p>
        : o.status === 'accepted'
          ? <p className="muted-text"><AgentTag name="Candidate Checker" cKey="HCM_98" /> initiated background & reference checks with the external provider on acceptance — status lands here automatically.</p>
          : <p className="muted-text">Starts automatically the moment Aisha accepts — <AgentTag name="Candidate Checker" cKey="HCM_98" /> tracks the external provider.</p>,
    },
    {
      title: 'Pre-boarding data & quality check', owner: 'Aisha, then HR data agents', ownerKind: 'other',
      status: c.details.status === 'submitted' ? 'done' : c.details.status === 'available' ? 'action' : 'waiting',
      body: c.details.status === 'submitted'
        ? <p className="muted-text">Submitted and validated — <AgentTag name="HR Data Guardian" cKey="HCM_31" /> found no payroll or access blockers; journey published (8 tasks).</p>
        : <p className="muted-text">Aisha completes bank, tax, and emergency contacts (pre-filled). You'll be alerted here only if the data agents flag a gap.</p>,
    },
    {
      title: 'Identity, access & schedule approvals', owner: 'Khalid — Manager', ownerKind: 'other',
      status: c.schedule.status === 'confirmed' ? 'done' : c.provisioning.status === 'ready' || c.schedule.status === 'proposed' ? 'action' : 'waiting',
      body: c.schedule.status === 'confirmed'
        ? <p className="muted-text">Accounts active ({c.provisioning.credentials?.username}) · role-based access granted · schedule confirmed · equipment delivered.</p>
        : <p className="muted-text">Khalid approves identity & application access, then the proposed schedule and equipment — all before day 1.</p>,
    },
    {
      title: 'Benefits enrolment', owner: 'Aisha — Employee', ownerKind: 'other',
      status: c.benefits.status === 'enrolled' ? 'done' : ['open', 'flagged'].includes(c.benefits.status) ? 'action' : 'waiting',
      body: c.benefits.status === 'enrolled'
        ? <p className="muted-text">Enrolled — {c.benefits.selection?.plan}, dependants covered; documents verified.</p>
        : <p className="muted-text">Aisha compares plans with the benefits agents and enrols; the system validates dependant documents.</p>,
    },
    {
      title: 'Training, compliance & reporting', owner: 'System agents → HR', ownerKind: 'hr',
      status: ['compiled', 'decided'].includes(c.probation.status) ? 'done' : 'waiting',
      body: ['compiled', 'decided'].includes(c.probation.status)
        ? <p className="muted-text"><AgentTag name="Reporter (Onboarding)" cKey="HCM_153" /> filed the compliance report — 100% training complete, audit-ready.</p>
        : <p className="muted-text">Mandatory training is tracked automatically; the compliance report lands here at the day-90 review.</p>,
    },
    {
      title: 'Probation review & decision', owner: 'Khalid — Manager', ownerKind: 'other',
      status: c.probation.status === 'decided' ? 'done' : ['ready', 'compiled'].includes(c.probation.status) ? 'action' : 'waiting',
      body: c.probation.status === 'decided'
        ? <p className="muted-text">Appointment confirmed effective {c.probation.appointment_date} — payroll, IT, and Aisha notified. Confirmation paperwork ready.</p>
        : <p className="muted-text">At day 90 Khalid compiles the probation review criteria, evaluates performance, and confirms the appointment date. Extending or ending probation rests with the HR Director.</p>,
    },
  ];

  return (
    <section>
      <div className="hr-process-head">
        <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={13} /> Dashboard</button>
        <Eyebrow>Aisha Al Khoori — end-to-end onboarding process</Eyebrow>
      </div>
      <div className="steps">
        {steps.map((s, i) => (
          <div key={s.title} className={`step step-${s.status}`}>
            <div className="step-rail">
              <span className="step-dot">
                {s.status === 'done' ? <Check size={12} /> : s.status === 'action' ? <Loader2 size={12} className={isBusyStep(activity) ? 'spin' : ''} /> : i + 1}
              </span>
              {i < steps.length - 1 && <span className="step-line" />}
            </div>
            <div className="step-body card">
              <div className="step-head">
                <span className="step-title">Step {i + 1} — {s.title}</span>
                <span className={`step-owner ${s.ownerKind === 'hr' ? 'step-owner-hr' : ''}`}>{s.owner}</span>
              </div>
              {s.body}
            </div>
          </div>
        ))}
      </div>

      {reviewOpen && (
        <OfferReviewModal
          mode="hr"
          offer={o}
          busy={busy}
          onClose={() => setReviewOpen(false)}
          onApprove={(payload) => { setReviewOpen(false); act('approve-draft', payload); }}
        />
      )}
    </section>
  );
}

function isPlaying(activity, action) {
  return activity && activity.action === action;
}
function isBusyStep(activity) {
  return Boolean(activity);
}
