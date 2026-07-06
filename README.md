# New Employee Onboarding — DGE (demo v2.0)

A clean, light, government-grade demo of **agentified New Employee Onboarding** for DGE
(Abu Dhabi): one shared journey state, viewed through five lenses, where every AI action is
performed by a real Oracle HCM agent named in the client's Excel mapping — nothing invented.
Everything is mocked and deterministic.

**Scope:** strictly the green- and yellow-highlighted L4 activities of
`New_Employee_Onboarding_Process_Hierarchy_V1_2.xlsx` — 23 activities: 16 AI-agent run,
6 system-automated, 1 human decision (the probation decision, which carries zero AI
assistance by design). 28 named agents, all verbatim from the client mapping.

## Run it

### Local (two terminals)

```bash
# 1 — backend (Python 3.11+)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --port 8000

# 2 — frontend
cd frontend
npm install
npm run dev        # opens on http://localhost:5173 (proxies /api to :8000)
```

### Docker

```bash
docker compose up --build
# frontend on http://localhost:5173, backend on http://localhost:8000
```

A discreet **Reset demo** button sits in the header — it returns the exact seeded start.

### Live chat (optional)

The employee chat (Worker Concierge / Benefits Analyst) can answer free-typed questions through
a real LLM. Put a DeepInfra key in `backend/.env`:

```
DEEPINFRA_API_KEY=...
LLM_MODEL=meta-llama/Llama-3.3-70B-Instruct   # optional override
```

Routing stays deterministic (benefits keywords → Benefits Analyst, everything else → Worker
Concierge), answers are grounded in the fictional case data, and **without a key — or on any
API failure — the chat silently falls back to the scripted answers**, so the presenter flow
never breaks. Everything else in the demo remains fully scripted and deterministic.

## The demo case

**Aisha Al Khoori**, Policy Analyst, Dept. of Economic Development — manager
**Khalid Al Hammadi**. All five tabs read and write the same backend state, so progress made
in one tab is instantly visible in every other. Three background hires (Omar Al Dhaheri,
Fatima Rashed, Yousef Khan) sit muted on the overview so the world doesn't feel empty.

## Presenter storyline (~8 minutes)

1. **Process Overview** — frame the map. Click stage 1, show the offer crew
   (Job Offer Creation Advisor → Offer Letter Agent → Redraft Offer Letters).
2. **Hiring Manager Journey** — the AI-drafted offer reveal → *Request redraft — housing
   allowance* → watch Redraft Offer Letters produce the visible diff → *Approve & dispatch*.
3. **Employee Journey** — Aisha accepts (e-sign) → system events flash (worker record,
   employee number **E-2026-4417**) → welcome pack reveal → guided data collection with
   Personal Information Assistant → journey published by Journeys Assistant.
4. **Hiring Manager Journey** — run the identity pipeline live (User Profile Orchestrator
   Agent → Data Retrieval → ServiceNow User Profile Dispatch Agent → account created,
   credentials issued) → confirm the proposed schedule (Sun–Thu, 8:00–16:00, hybrid).
5. **Employee Journey** — benefits compare → ask the two canned chat questions (watch the
   routing: Benefits Analyst vs Worker Concierge) → enrol → the Emirates ID beat (dependant
   #2 flagged → upload → re-validate → clear).
6. **Manager Journey** — day-90 evidence pack reveal (Talent Advisor (My Team) +
   Performance Summary Generator, typewriter) → the decision screen: three buttons, gold
   **Human authority** badge, confirmation dialog, no AI anywhere near it → *Confirm* →
   system updates & notifies → Aisha's outcome card celebrates quietly.
7. **Value Delivered** — the live receipts: 23 activities · 16 AI-run · 6 system-automated ·
   1 human decision, agent leaderboard, estimated hours saved, and "what stays human and why".

## Architecture — deliberately simple

```
backend/            FastAPI, in-memory state, no DB, no WebSocket
  main.py           app + 2 endpoints: GET /api/state, POST /api/action/{name}
  state.py          the shared case state + seed + the 12 storyline actions
  agents.py         the agent roster (exact Excel names/keys) + scripted crew runs
  models.py         Pydantic request body
frontend/           Vite + React, one page, tab state — no router
  src/App.jsx       tabs + the action runner (plays returned agent runs in order)
  src/components/   one file per view + shared primitives
  src/styles.css    the whole design system (§5 tokens)
```

Every action response carries the full updated state **plus** `last_runs[]` (agent name, key,
action, duration, output) — the frontend animates those in order: agents get a visible
1–1.5 s "working…" beat, system events flash instantly, and the human decision has no agent
anywhere near it.

---

*Proof of concept — all data is fictional.*
