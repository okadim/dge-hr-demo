import { useEffect, useRef, useState } from 'react';
import { Compass, X, ArrowRight, Check, MousePointerClick, GripHorizontal, MousePointer2 } from 'lucide-react';

// "Next step" coach: reads the shared journey state, tells the user what to do
// next, and — once they're on the right screen — highlights the exact control
// with a pulsing ring (targets are tagged with data-guide attributes).
// Entirely optional: dismiss to a compass button, bring back anytime.
const STEPS = [
  {
    id: 'hr-approve',
    when: (c) => c.offer.status === 'hr_review',
    persona: 'hr', personaLabel: 'HR — Salma',
    target: () => 'review-draft',
    fallback: 'open-candidate',
    text: () => 'The journey starts with you: open Aisha Al Khoori on the dashboard, then click "Review & approve offer draft" — scroll the document to the end, add your comment, and approve.',
  },
  {
    id: 'offer-review',
    when: (c) => c.offer.status === 'awaiting_review',
    persona: 'manager', personaLabel: 'Manager — Khalid',
    target: () => 'review-offer',
    text: () => 'Khalid approves — he does not negotiate terms. Click "Review offer & approve", read to the end of the document, then approve & dispatch.',
  },
  {
    id: 'accept',
    when: (c) => c.offer.status === 'sent',
    persona: 'employee', personaLabel: 'Employee — Aisha',
    target: () => 'accept-offer',
    text: () => 'Aisha accepts her offer — e-sign it and watch the worker record and employee number get created.',
  },
  {
    id: 'details',
    when: (c) => c.details.status === 'available',
    persona: 'employee', personaLabel: 'Employee — Aisha',
    target: () => 'submit-details',
    text: () => 'Submit the pre-filled personal details — they are validated in real time and the journey gets published.',
  },
  {
    id: 'provisioning',
    when: (c) => c.provisioning.status === 'ready',
    persona: 'manager', personaLabel: 'Manager — Khalid',
    target: () => 'run-provisioning',
    text: () => 'Run identity provisioning and watch the pipeline create the AD / SSO account before day 1.',
  },
  {
    id: 'schedule',
    when: (c) => c.schedule.status === 'proposed',
    persona: 'manager', personaLabel: 'Manager — Khalid',
    target: () => 'confirm-schedule',
    text: () => 'Confirm the proposed work schedule — as proposed, or adjust the hours first.',
  },
  {
    id: 'benefits',
    when: (c) => c.benefits.status === 'open',
    persona: 'employee', personaLabel: 'Employee — Aisha',
    target: () => 'enrol-benefits',
    text: () => 'Compare the plans, ask the assistant a question if you like, then enrol with the two dependants.',
  },
  {
    id: 'eid',
    when: (c) => c.benefits.status === 'flagged',
    persona: 'employee', personaLabel: 'Employee — Aisha',
    target: () => 'upload-eid',
    text: () => 'Validation flagged dependant #2 — upload the Emirates ID to clear it and complete enrolment.',
  },
  {
    id: 'evidence',
    when: (c) => c.probation.status === 'ready',
    persona: 'manager', personaLabel: 'Manager — Khalid',
    target: () => 'compile-probation',
    text: () => 'Aisha reaches day 90 — compile the evidence pack for the final probation review.',
  },
  {
    id: 'decision',
    when: (c) => c.probation.status === 'compiled',
    persona: 'manager', personaLabel: 'Manager — Khalid',
    target: () => 'decision',
    text: () => 'The decision is yours alone — no AI on this screen. Confirm, extend, or terminate.',
  },
  {
    id: 'value',
    when: (c) => c.probation.status === 'decided',
    persona: null, personaLabel: 'Value Delivered',
    target: () => null,
    text: () => 'Journey complete — Value Delivered shows the live receipts: runs, hours saved, and what stays human.',
    done: true,
  },
];

export default function Guide({ state, view, persona, setView, setPersona, activity }) {
  const [hidden, setHidden] = useState(false);
  const [pos, setPos] = useState(null); // set once the user drags the popup
  const [pointer, setPointer] = useState(null); // Loom-style click pointer {x, y}
  const cardRef = useRef(null);
  const pointerTimers = useRef([]);

  useEffect(() => () => pointerTimers.current.forEach(clearTimeout), []);

  // Reserve room under the content while the popover is open so it never
  // covers the last cards on a screen (e.g. the probation decision).
  const openNow = !hidden;
  useEffect(() => {
    document.body.classList.toggle('guide-open', openNow);
    return () => document.body.classList.remove('guide-open');
  }, [openNow]);

  // Drag to move — the popup floats and can cover content, so let the user
  // park it anywhere. Buttons inside stay clickable (drag starts elsewhere).
  function onPointerDown(e) {
    if (e.target.closest('button, a, input, textarea')) return;
    const rect = cardRef.current.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    const move = (ev) => {
      setPos({
        x: Math.min(Math.max(8, ev.clientX - ox), window.innerWidth - rect.width - 8),
        y: Math.min(Math.max(8, ev.clientY - oy), window.innerHeight - rect.height - 8),
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  const c = state.case;
  const idx = STEPS.findIndex((s) => s.when(c));
  const step = idx === -1 ? null : STEPS[idx];
  const here = step && (step.persona ? view === 'journey' && persona === step.persona : view === 'value');
  const targetKey = step && here ? step.target(c) : null;

  // Pulse-highlight the target control while the user is on the right screen.
  useEffect(() => {
    if (!targetKey || hidden) return;
    const el =
      document.querySelector(`[data-guide="${targetKey}"]`) ||
      (step.fallback && document.querySelector(`[data-guide="${step.fallback}"]`));
    if (!el) return;
    el.classList.add('guide-target');
    return () => el.classList.remove('guide-target');
  }, [targetKey, hidden, activity, state, step]);

  if (!step) return null;

  if (hidden) {
    return (
      <button className="guide-fab" onClick={() => setHidden(false)} aria-label="Show next-step guidance">
        <Compass size={17} />
      </button>
    );
  }

  const showMe = () => {
    const el =
      (targetKey && document.querySelector(`[data-guide="${targetKey}"]`)) ||
      (step.fallback && document.querySelector(`[data-guide="${step.fallback}"]`));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    pointerTimers.current.forEach(clearTimeout);
    pointerTimers.current = [
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        setPointer({ x: r.left + r.width * 0.72, y: r.top + r.height * 0.68 });
      }, 480),
      setTimeout(() => setPointer(null), 3400),
    ];
  };

  return (
    <aside
      className="guide"
      aria-live="polite"
      ref={cardRef}
      onPointerDown={onPointerDown}
      style={pos ? { left: pos.x, top: pos.y, bottom: 'auto' } : undefined}
    >
      <span className="guide-bubble" aria-hidden="true">
        {step.done ? <Check size={19} /> : <Compass size={19} />}
      </span>
      <div className="guide-head" title="Drag to move">
        <span className="guide-step"><GripHorizontal size={13} className="guide-grip" /> Next step · {idx + 1} of {STEPS.length}</span>
        <button className="guide-close" onClick={() => setHidden(true)} aria-label="Hide guidance">
          <X size={14} />
        </button>
      </div>
      <p className="guide-text">{step.text(c)}</p>
      {pointer && (
        <span className="guide-pointer" style={{ left: pointer.x, top: pointer.y }} aria-hidden="true">
          <span className="guide-click-ring" />
          <span className="guide-click-ring guide-click-ring-2" />
          <MousePointer2 size={26} className="guide-cursor" />
        </span>
      )}
      {here ? (
        step.done ? (
          <span className="guide-here"><Check size={12} /> Journey complete</span>
        ) : (
          <button className="btn btn-outline guide-go" onClick={showMe}>
            <MousePointerClick size={13} /> Show me where
          </button>
        )
      ) : (
        <button
          className="btn btn-primary guide-go"
          onClick={() => { if (step.persona) { setPersona(step.persona); setView('journey'); } else { setView('value'); } }}
        >
          Take me there — {step.personaLabel} <ArrowRight size={13} />
        </button>
      )}
    </aside>
  );
}
