import { useEffect, useRef, useState } from 'react';
import { X, Pencil, AtSign, ShieldCheck, PenLine, ArrowDown, PhoneCall, Check } from 'lucide-react';
import { AgentTag } from './shared.jsx';

// The human-in-the-middle document review. Mandatory: the reviewer must
// scroll to the end of the letter before Approve unlocks; HR must also leave
// a review comment (with an @tag). HR can edit the housing allowance — shown
// as a tracked change and applied to the letter by Redraft Offer Letters.
export default function OfferReviewModal({ mode, offer, busy, onApprove, onClose, onRequestCall }) {
  const [reachedEnd, setReachedEnd] = useState(false);
  const [comment, setComment] = useState('');
  const [edited, setEdited] = useState(false);
  const scrollRef = useRef(null);

  const isHR = mode === 'hr';
  const isEmployee = mode === 'employee';
  const housingOld = 'AED 90,000 / year';
  const housingNew = 'AED 110,000 / year';
  const showTracked = isEmployee ? false : isHR ? edited : offer.hr_edited;
  const housingValue = showTracked ? housingNew : (offer.terms.find((t) => t.label === 'Housing allowance') || {}).value;

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  function onScroll() {
    const el = scrollRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 12) setReachedEnd(true);
  }

  const canApprove = reachedEnd && (!isHR || comment.trim().length > 0) && !busy;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal doc-modal" role="dialog" aria-modal="true" aria-label="Offer review" onClick={(e) => e.stopPropagation()}>
        <div className="doc-head">
          <div>
            <div className="doc-title">
              {isEmployee ? 'Your conditional offer — review & e-sign' : `Conditional offer — review ${isHR ? '& edit' : '& approve'}`}
            </div>
            <div className="doc-sub">
              {isEmployee ? (
                <>Offer v{offer.version} · Dept. of Economic Development · valid 10 working days</>
              ) : (
                <>
                  Draft v{showTracked && isHR ? 2 : offer.version} · <AgentTag name="Job Offer Creation Advisor" cKey="HCM_40" />
                  {offer.hr_edited && !isHR && <> · tracked change by HR, applied by <AgentTag name="Redraft Offer Letters" cKey="HCM_92" /></>}
                </>
              )}
            </div>
          </div>
          <button className="guide-close" onClick={onClose} aria-label="Close review"><X size={16} /></button>
        </div>

        <div className="doc-scroll" ref={scrollRef} onScroll={onScroll}>
          <p className="doc-p"><strong>Department of Government Enablement — Abu Dhabi</strong><br />
            Conditional Offer of Employment · Ref DGE-2026-0417</p>
          <p className="doc-p">
            Dear Ms. Aisha Al Khoori, further to your application and interviews, we are pleased to extend
            a conditional offer of employment for the position of <strong>Policy Analyst (Grade 8)</strong> in
            the Dept. of Economic Development, reporting to Khalid Al Hammadi.
          </p>

          <div className="doc-terms">
            {offer.terms
              .filter((t) => mode !== 'manager' || !['Base salary', 'Housing allowance'].includes(t.label))
              .map((t) => (
              <div key={t.label} className="doc-term">
                <span className="doc-term-label">{t.label}</span>
                <span className="doc-term-value">
                  {t.label === 'Housing allowance' ? (
                    <>
                      {showTracked ? (
                        <><s className="tracked-old">{housingOld}</s> <ins className="tracked-new">{housingNew}</ins></>
                      ) : (
                        housingValue
                      )}
                      {isHR && !edited && (
                        <button className="doc-edit" onClick={() => setEdited(true)} title="Propose change — align with Grade 8 market band">
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                      {isHR && edited && (
                        <button className="doc-edit doc-edit-undo" onClick={() => setEdited(false)}>undo</button>
                      )}
                    </>
                  ) : (
                    t.value
                  )}
                </span>
              </div>
            ))}
          </div>

          <p className="doc-p"><strong>1. Conditions.</strong> This offer is conditional upon satisfactory completion of
            standard pre-employment verification, right-to-work confirmation, and medical fitness where applicable
            under DGE policy.</p>
          <p className="doc-p"><strong>2. Probation.</strong> The appointment is subject to a probationary period of
            ninety (90) days from the start date, during which structured check-ins are held at day 30, 60, and 90.
            Confirmation is an authority decision of the accountable line manager.</p>
          <p className="doc-p"><strong>3. Working arrangements.</strong> Standard working pattern is Sunday to Thursday.
            The confirmed schedule, work location, and equipment entitlement will be communicated before your first day.</p>
          <p className="doc-p"><strong>4. Benefits.</strong> You will be eligible to enrol in the DGE benefits programme
            from your hire date, including medical, dental, and optical cover for yourself and eligible dependants,
            subject to the DGE Benefits Guide.</p>
          <p className="doc-p"><strong>5. Confidentiality & conduct.</strong> Employment is subject to the Government of
            Abu Dhabi code of conduct, information-security policy, and data-handling standards.</p>
          <p className="doc-p"><strong>6. Acceptance.</strong> Please indicate acceptance via the candidate portal.
            This offer remains valid for ten (10) working days from the date of dispatch.</p>
          <p className="doc-p doc-end">— End of document —</p>
        </div>

        {!reachedEnd && (
          <div className="doc-scroll-hint"><ArrowDown size={13} /> Scroll to the end of the document to enable approval</div>
        )}

        {isEmployee ? (
          <div className="doc-review">
            <label className="doc-review-label" htmlFor="hr-comment">
              Questions or comments for HR <span className="doc-optional">optional</span>
            </label>
            <div className="doc-comment-row">
              <textarea
                id="hr-comment"
                className="doc-comment"
                rows={2}
                placeholder="Anything you'd like to ask or note before signing…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                className="chip doc-tag"
                onClick={() => setComment((v) => (v.includes('@HR') ? v : `${v}${v && !v.endsWith(' ') ? ' ' : ''}@HR `))}
                title="Tag the HR role"
              >
                <AtSign size={12} /> Tag @HR
              </button>
            </div>
          </div>
        ) : isHR ? (
          <div className="doc-review">
            <label className="doc-review-label" htmlFor="hr-comment">
              Review comment <span className="doc-required">required</span>
            </label>
            <div className="doc-comment-row">
              <textarea
                id="hr-comment"
                className="doc-comment"
                rows={2}
                placeholder="Add your review note…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                className="chip doc-tag"
                onClick={() => setComment((v) => (v.includes('@Manager') ? v : `${v}${v && !v.endsWith(' ') ? ' ' : ''}@Manager `))}
                title="Tag the Manager role — routes to whoever holds it"
              >
                <AtSign size={12} /> Tag @Manager
              </button>
            </div>
          </div>
        ) : (
          offer.hr_comment && (
            <div className="doc-hr-note">
              <span className="doc-hr-note-by">HR review — Salma Al Marzooqi</span>
              {offer.hr_comment}
            </div>
          )
        )}

        {isEmployee && (
          <p className="doc-consent">
            By e-signing you accept these terms, including the 90-day probation period.
          </p>
        )}
        <div className="modal-actions doc-actions">
          {isEmployee && (
            offer.call_requested ? (
              <span className="ready-chip ready-done call-chip"><Check size={11} /> Call requested — HR will contact you</span>
            ) : (
              <button className="btn btn-outline" onClick={onRequestCall} disabled={busy}>
                <PhoneCall size={13} /> Request a call to review
              </button>
            )
          )}
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button
            className={isEmployee ? 'btn btn-primary' : 'btn btn-gold'}
            disabled={!canApprove}
            title={!reachedEnd ? 'Read to the end of the document first' : (isHR && !comment.trim() ? 'A review comment is required' : '')}
            onClick={() => onApprove(
              isHR ? { comment: comment.trim(), edited }
                : isEmployee ? { comment: comment.trim() || undefined }
                : {}
            )}
          >
            {isEmployee ? <PenLine size={14} /> : <ShieldCheck size={14} />}
            {isEmployee ? 'Accept & e-sign as Aisha Al Khoori' : isHR ? 'Approve draft & route to manager' : 'Approve & dispatch to the candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}
