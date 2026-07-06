import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { PERSONAS, PERSONA_ORDER } from '../personas.js';

// Profile dropdown (top-right): shows who you are viewing as, switches users.
export default function PersonaSwitcher({ persona, setPersona, setView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = PERSONAS[persona];

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  function pick(id) {
    setPersona(id);
    setView('journey');
    setOpen(false);
  }

  return (
    <div className="persona-switch" ref={ref}>
      <button
        className="persona-btn"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Viewing as ${current.name} — switch user`}
      >
        <span className="persona-avatar">{current.initials}</span>
        <span className="persona-btn-text">
          <span className="persona-btn-name">{current.name}</span>
          <span className="persona-btn-role">{current.role}</span>
        </span>
        <ChevronDown size={14} className={`persona-chev ${open ? 'persona-chev-open' : ''}`} />
      </button>

      {open && (
        <div className="persona-menu" role="menu">
          <div className="persona-menu-head">Switch user</div>
          {PERSONA_ORDER.map((id) => {
            const p = PERSONAS[id];
            return (
              <button key={id} className="persona-item" role="menuitem" onClick={() => pick(id)}>
                <span className="persona-avatar">{p.initials}</span>
                <span className="persona-item-text">
                  <span className="persona-btn-name">{p.name}</span>
                  <span className="persona-btn-role">{p.role} · {p.org}</span>
                </span>
                {id === persona && <Check size={14} className="persona-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
