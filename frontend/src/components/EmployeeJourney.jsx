import { useEffect, useRef, useState } from 'react';
import { Check, Send, Sparkles, PenLine, Upload, PartyPopper, MapPin, CalendarDays, BadgeCheck, UserRound, FileClock, MessagesSquare } from 'lucide-react';
import { Eyebrow, TaskIcon, TermsTable, CrewPlayer, AgentTag, AgentTypeChip, LockedNote, PersonaProfileCard } from './shared.jsx';
import OfferReviewModal from './OfferReviewModal.jsx';

const DETAIL_FIELDS = [
  { id: 'bank', label: 'Bank', prefilled: true, value: 'First Abu Dhabi Bank — IBAN AE07 0331 2345 6789 0123 456' },
  { id: 'tax', label: 'Tax residency', prefilled: true, value: 'United Arab Emirates — no PIT withholding' },
  { id: 'ec1', label: 'Emergency contact 1', value: 'Salem Al Khoori (spouse) — +971 50 123 4567' },
  { id: 'ec2', label: 'Emergency contact 2', value: 'Moza Al Khoori (mother) — +971 50 765 4321' },
];

const SUGGESTED = [
  "Does the Premier plan cover my daughter's orthodontics?",
  'When will I get my first salary?',
];

export default function EmployeeJourney({ state, act, activity, busy }) {
  const c = state.case;

  return (
    <div className="view">
      <div className="journey-grid">
        <aside className="journey-left">
          <ProfileCard c={c} />
          <div className="card checklist-card">
            <Eyebrow>My onboarding journey</Eyebrow>
            {c.journey.published ? (
              <p className="checklist-by">Personalised & published by <AgentTag name="Journeys Assistant" cKey="HCM_44" /></p>
            ) : (
              <p className="checklist-by muted-text">Your full checklist is published once pre-boarding completes.</p>
            )}
            <ul className="task-list">
              {c.journey.tasks.map((t) => (
                <li key={t.id} className={`task task-st-${t.status}`}>
                  <TaskIcon status={t.status} />
                  <div>
                    <div className="task-label">{t.label}</div>
                    <div className="task-owner">{t.owner}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </aside>

        <div className="journey-right">
          <OfferCard c={c} act={act} activity={activity} busy={busy} />
          <ChatCard state={state} act={act} activity={activity} busy={busy} />
          {c.welcome_pack.ready && <WelcomePack pack={c.welcome_pack} />}
          <DetailsCard c={c} act={act} activity={activity} busy={busy} />
          <BenefitsCard c={c} act={act} activity={activity} busy={busy} />
          {c.probation.status === 'decided' && <OutcomeCard c={c} />}
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ c }) {
  const e = c.employee;
  const facts = [
    { icon: MapPin, text: 'Al Maqam Tower, Abu Dhabi' },
    { icon: UserRound, text: `Manager — ${e.manager}` },
    { icon: CalendarDays, text: `Starts ${e.start_date}` },
  ];
  if (e.employee_number) facts.push({ icon: BadgeCheck, text: `Employee ${e.employee_number}`, hl: true });
  return (
    <PersonaProfileCard
      initials="AA"
      name={e.name}
      pronoun="She/Her"
      title={`${e.role} — ${e.grade}`}
      facts={facts}
      skills={['Policy analysis', 'Economic research', 'Stakeholder engagement', 'Arabic · English']}
    />
  );
}

function OfferCard({ c, act, activity, busy }) {
  const o = c.offer;
  const [reviewOpen, setReviewOpen] = useState(false);
  if (['hr_review', 'awaiting_review'].includes(o.status)) {
    const stepIdx = o.status === 'hr_review' ? 0 : 1;
    return (
      <div className="card">
        <Eyebrow>Conditional offer</Eyebrow>
        <div className="empty-state">
          <span className="empty-icon"><FileClock size={22} /></span>
          <div className="empty-title">
            {o.status === 'hr_review'
              ? 'Your offer is being prepared — awaiting HR approval.'
              : 'Your offer is approved by HR — awaiting manager approval.'}
          </div>
          <p className="empty-sub">
            You'll be notified the moment HR and your manager approve it — nothing needed from you yet.
          </p>
          <div className="mini-steps">
            {['Offer', 'Manager', 'You'].map((s, i) => (
              <span key={s} className={`mini-step ${i < stepIdx ? 'mini-done' : i === stepIdx ? 'mini-current' : ''}`}>
                <span className="mini-dot">{i < stepIdx && <Check size={9} />}</span>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card reveal">
      <Eyebrow>Conditional offer</Eyebrow>
      {o.status === 'sent' ? (
        <>
          <p className="letter-intro">
            Dear Aisha, we are delighted to offer you the position of <strong>Policy Analyst</strong> with
            the Dept. of Economic Development. This offer is conditional on standard verification and
            reflects the terms below.
          </p>
          <TermsTable terms={o.terms} />
          <CrewPlayer activity={activity} action="accept-offer" />
          {!isPlaying(activity, 'accept-offer') && (
            <div className="card-actions">
              <button className="btn btn-primary" data-guide="accept-offer" onClick={() => setReviewOpen(true)} disabled={busy}>
                <PenLine size={14} /> Review offer & e-sign
              </button>
            </div>
          )}
          {o.call_requested && (
            <p className="card-caption">A call with HR has been requested — they'll reach out before the offer deadline.</p>
          )}
          {reviewOpen && (
            <OfferReviewModal
              mode="employee"
              offer={o}
              busy={busy}
              onClose={() => setReviewOpen(false)}
              onApprove={(payload) => { setReviewOpen(false); act('accept-offer', payload); }}
              onRequestCall={() => act('request-call')}
            />
          )}
        </>
      ) : (
        <div className="done-note">
          <Check size={14} />
          <span>
            Offer accepted & e-signed. You are employee <strong>{c.employee.employee_number}</strong> —
            welcome to DGE.
          </span>
        </div>
      )}
    </div>
  );
}

function WelcomePack({ pack }) {
  return (
    <div className="card reveal">
      <Eyebrow>Your welcome pack</Eyebrow>
      <p className="card-caption">
        Assembled by <AgentTag name="Welcome (pre day-one)" cKey="HCM_146" /> · first-day instructions by{' '}
        <AgentTag name="Onboarding Checklist Agent" cKey="HCM_55" />
      </p>
      <div className="pack-grid">
        {pack.items.map((it) => (
          <div key={it.title} className="pack-item">
            <div className="pack-title">{it.title}</div>
            <div className="pack-text">{it.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailsCard({ c, act, activity, busy }) {
  const [values, setValues] = useState(
    Object.fromEntries(DETAIL_FIELDS.map((f) => [f.id, f.value]))
  );
  if (c.details.status === 'locked') return null;
  if (c.details.status === 'submitted' && !isPlaying(activity, 'submit-details')) {
    return (
      <div className="card">
        <Eyebrow>Personal details</Eyebrow>
        <div className="done-note">
          <Check size={14} />
          <span>All sections submitted and validated — bank, tax, and emergency contacts are on file.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="card reveal">
      <Eyebrow>Personal details — guided collection</Eyebrow>
      <p className="card-caption">
        Guided by <AgentTag name="Personal Information Assistant" cKey="HCM_67" /> — pre-filled from your
        offer by <AgentTag name="Onboard Assistant" cKey="HCM_54" />. Defaults are ready — edit any field
        if you like.
      </p>
      <div className="form-grid">
        {DETAIL_FIELDS.map((f) => (
          <div key={f.id} className="form-field">
            <label className="form-label" htmlFor={`fld-${f.id}`}>
              {f.label} {f.prefilled && <span className="prefill-chip">pre-filled</span>}
            </label>
            <input
              id={`fld-${f.id}`}
              className="form-input"
              value={values[f.id]}
              onChange={(e) => setValues({ ...values, [f.id]: e.target.value })}
              disabled={busy}
            />
          </div>
        ))}
      </div>
      <CrewPlayer activity={activity} action="submit-details" />
      {!isPlaying(activity, 'submit-details') && c.details.status === 'available' && (
        <div className="card-actions">
          <button className="btn btn-primary" data-guide="submit-details" onClick={() => act('submit-details', { details: values })} disabled={busy}>
            <Check size={14} /> Submit my details
          </button>
        </div>
      )}
    </div>
  );
}

function BenefitsCard({ c, act, activity, busy }) {
  const b = c.benefits;
  const fileRef = useRef(null);
  const [eidFile, setEidFile] = useState(null); // {name, dataUri}

  function onFileChosen(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) {
      setEidFile({ name: f.name, dataUri: null }); // too large to parse — still accepted
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEidFile({ name: f.name, dataUri: reader.result });
    reader.readAsDataURL(f);
  }
  if (b.status === 'locked') {
    if (c.details.status !== 'submitted') return null;
    return (
      <div className="card">
        <Eyebrow>Benefits enrolment</Eyebrow>
        <LockedNote>Opens on your hire date, once your schedule is confirmed.</LockedNote>
      </div>
    );
  }
  return (
    <div className="card reveal">
      <Eyebrow>Benefits enrolment</Eyebrow>
      {b.status === 'open' && (
        <>
          <p className="card-caption">
            Compared for you by <AgentTag name="Benefits Plan Advisor" cKey="HCM_4" /> · grounded in policy
            by <AgentTag name="Benefits Policy Advisor" cKey="HCM_5" />
          </p>
          <div className="plans-grid">
            {b.plans.map((p) => (
              <div key={p.id} className={`plan ${p.id === 'premier' ? 'plan-recommended' : ''}`}>
                {p.id === 'premier' && <span className="plan-chip"><Sparkles size={11} /> Recommended for you</span>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price">{p.monthly}</div>
                <ul className="plan-cover">
                  {p.cover.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <CrewPlayer activity={activity} action="enrol-benefits" />

      {b.status === 'open' && !isPlaying(activity, 'enrol-benefits') && (
        <div className="card-actions">
          <button className="btn btn-primary" data-guide="enrol-benefits" onClick={() => act('enrol-benefits')} disabled={busy}>
            Enrol in Premier with 2 dependants
          </button>
        </div>
      )}

      {b.status === 'flagged' && !isPlaying(activity, 'enrol-benefits') && (
        <>
          <div className="flag-note">
            <span className="flag-title">Validation issue</span>
            {b.flag}
          </div>
          <CrewPlayer activity={activity} action="upload-eid" />
          {!isPlaying(activity, 'upload-eid') && (
            <div className="card-actions eid-actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="file-hidden"
                onChange={onFileChosen}
                aria-label="Choose Emirates ID file"
              />
              {!eidFile ? (
                <button className="btn btn-outline" data-guide="upload-eid" onClick={() => fileRef.current.click()} disabled={busy}>
                  <Upload size={14} /> Choose Emirates ID file — Mariam
                </button>
              ) : (
                <>
                  <span className="file-chip">{eidFile.name}</span>
                  <button
                    className="btn btn-primary"
                    data-guide="upload-eid"
                    onClick={() => act('upload-eid', { file_b64: eidFile.dataUri, file_name: eidFile.name })}
                    disabled={busy}
                  >
                    <Upload size={14} /> Upload & re-validate
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {b.status === 'enrolled' && (
        <div className="done-note">
          <Check size={14} />
          <span>
            Enrolled in <strong>{b.selection.plan}</strong> ({b.selection.monthly}) — dependants covered:{' '}
            {b.selection.dependants.join(', ')}. Validated against eligibility rules.
          </span>
        </div>
      )}
    </div>
  );
}

function OutcomeCard({ c }) {
  const d = c.probation.decision;
  return (
    <div className="card reveal outcome-card">
      <Eyebrow>Day 90 — probation outcome</Eyebrow>
      {d === 'confirm' ? (
        <div className="outcome-confirm">
          <span className="outcome-icon"><PartyPopper size={18} /></span>
          <div>
            <div className="outcome-title">Confirmed in role</div>
            <p className="outcome-text">
              Congratulations, Aisha — your appointment as Policy Analyst is confirmed
              {c.probation.appointment_date && <> effective <strong>{c.probation.appointment_date}</strong></>}.
              Payroll and IT have been notified, and your development plan for the next quarter is ready
              with your manager.
            </p>
          </div>
        </div>
      ) : (
        <p className="outcome-text">
          {d === 'extend'
            ? 'Your probation period has been extended by 90 days. Your manager will walk you through the development plan.'
            : 'Your employment has ended at probation. HR will contact you regarding the offboarding steps.'}
        </p>
      )}
    </div>
  );
}

function ChatCard({ state, act, activity, busy }) {
  const c = state.case;
  const [draft, setDraft] = useState('');
  const [waiting, setWaiting] = useState(false);
  const scrollRef = useRef(null);
  const playing = isPlaying(activity, 'ask-question');

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [c.chat.length, playing, waiting]);

  async function send(q) {
    const question = (q || draft).trim();
    if (!question) return;
    setDraft('');
    setWaiting(true);
    try {
      await act('ask-question', { question });
    } finally {
      setWaiting(false);
    }
  }

  return (
    <div className="card chat-card">
      <div className="chat-head">
        <span className="chat-head-icon"><MessagesSquare size={16} /></span>
        <Eyebrow>Ask HR anything</Eyebrow>
      </div>
      <p className="card-caption">
        <AgentTag name="Worker Concierge" cKey="HCM_90" /> for general questions ·{' '}
        <AgentTag name="Benefits Analyst" cKey="HCM_2" /> for benefits
      </p>
      <div className="chat-scroll" ref={scrollRef}>
        {c.chat.map((m, i) =>
          m.from === 'employee' ? (
            <div key={i} className="msg msg-me">{m.text}</div>
          ) : (
            <div key={i} className="msg msg-ai">
              <div className="msg-meta">answered by {m.agent} <AgentTypeChip cKey={m.key} /></div>
              {m.text}
            </div>
          )
        )}
        {(waiting || (playing && activity.index < activity.runs.length)) && (
          <div className="msg msg-ai msg-typing">
            <div className="msg-meta">
              {playing ? activity.runs[0].name : 'routing your question…'}
            </div>
            <span className="typing-dots"><i /><i /><i /></span>
          </div>
        )}
      </div>
      <div className="chat-suggest">
        {SUGGESTED.map((q) => (
          <button key={q} className="chip" onClick={() => send(q)} disabled={busy}>{q}</button>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={draft}
          placeholder="Type a question…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={busy}
          aria-label="Ask a question"
        />
        <button className="btn btn-primary btn-icon" onClick={() => send()} disabled={busy || !draft.trim()} aria-label="Send">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function isPlaying(activity, action) {
  return activity && activity.action === action;
}
