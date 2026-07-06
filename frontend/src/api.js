export async function fetchState() {
  const r = await fetch('/api/state');
  if (!r.ok) throw new Error('Could not load state');
  return r.json();
}

export async function postAction(name, body) {
  const r = await fetch(`/api/action/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.detail || 'Action failed');
  }
  return r.json();
}

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
