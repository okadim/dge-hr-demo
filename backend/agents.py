"""The agent roster — STRICTLY the green- and yellow-highlighted rows of
New_Employee_Onboarding_Process_Hierarchy_V1_2.xlsx (spec §2, extended by the
client on 5 Jul 2026: 1.1.2 made green + the yellow rows added to scope).

Never add a name here that is not in the client's Excel mapping.
"""
import json
import os
import urllib.request

# --- optional live LLM for the employee chat (DeepInfra, OpenAI-compatible).
# Key comes from backend/.env or the environment; without it, or on any
# failure, callers fall back to the scripted answers so the demo never breaks.

def _load_env():
    path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


_load_env()
DEEPINFRA_API_KEY = os.environ.get("DEEPINFRA_API_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "meta-llama/Llama-3.3-70B-Instruct")
VISION_MODEL = os.environ.get("VISION_MODEL", "Qwen/Qwen2.5-VL-32B-Instruct")


def llm_answer(system, question):
    """One chat completion via DeepInfra. Raises on any problem — the caller
    decides what the scripted fallback is."""
    if not DEEPINFRA_API_KEY:
        raise RuntimeError("DEEPINFRA_API_KEY not set")
    req = urllib.request.Request(
        "https://api.deepinfra.com/v1/openai/chat/completions",
        data=json.dumps({
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": question},
            ],
            "max_tokens": 220,
            "temperature": 0.4,
        }).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPINFRA_API_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        out = json.load(r)
    return out["choices"][0]["message"]["content"].strip()


def llm_parse_id(image_data_uri):
    """Read an uploaded ID card with a vision model; returns
    {name, id_number, dob} or raises. Caller has offline fallbacks."""
    if not DEEPINFRA_API_KEY:
        raise RuntimeError("DEEPINFRA_API_KEY not set")
    prompt = ('Extract from this identity card image: the full name, the ID number, and the '
              'date of birth. Reply with ONLY a JSON object: '
              '{"name": "...", "id_number": "...", "dob": "..."}. No other text.')
    req = urllib.request.Request(
        "https://api.deepinfra.com/v1/openai/chat/completions",
        data=json.dumps({
            "model": VISION_MODEL,
            "max_tokens": 150,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_data_uri}},
            ]}],
        }).encode(),
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {DEEPINFRA_API_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        text = json.load(r)["choices"][0]["message"]["content"]
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    parsed = json.loads(text)
    if not parsed.get("name"):
        raise ValueError("no name extracted")
    return parsed


def parse_png_text(data):
    """Read tEXt metadata chunks from a PNG (stdlib only) — offline fallback
    for the specimen card, which carries its fields as metadata."""
    out = {}
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return out
    i = 8
    while i + 8 <= len(data):
        length = int.from_bytes(data[i:i + 4], "big")
        ctype = data[i + 4:i + 8]
        if ctype == b"tEXt":
            k, _, v = data[i + 8:i + 8 + length].partition(b"\x00")
            out[k.decode("latin-1")] = v.decode("latin-1")
        i += 12 + length
    return out


ORACLE = "Oracle Fusion HCM"
CUSTOM = "Custom Agent"

ROSTER = [
    {"key": "HCM_40",  "name": "Job Offer Creation Advisor",             "badge": ORACLE, "activity": "1.1.1", "does": "Drafts the conditional offer from the approved requisition, role details, and compensation parameters."},
    {"key": "HCM_53",  "name": "Offer Letter Agent",                     "badge": ORACLE, "activity": "1.1.1", "does": "Composes and dispatches the offer letter."},
    {"key": "HCM_92",  "name": "Redraft Offer Letters",                  "badge": ORACLE, "activity": "1.1.1", "does": "Revises the draft on manager change-request."},
    {"key": "HCM_95",  "name": "Task Reminder",                          "badge": CUSTOM, "activity": "1.1.2", "does": "Monitors elapsed time and auto-sends reminders to candidates who have not responded, escalating to the recruiter after a threshold."},
    {"key": "HCM_94",  "name": "Candidate Mover",                        "badge": CUSTOM, "activity": "1.1.2", "does": "Moves the candidate through the pipeline as responses arrive."},
    {"key": "HCM_98",  "name": "Candidate Checker",                      "badge": CUSTOM, "activity": "1.2.1", "does": "Triggers background-check requests to the external provider and tracks status updates automatically."},
    {"key": "HCM_146", "name": "Welcome (pre day-one)",                  "badge": ORACLE, "activity": "1.3.1", "does": "Assembles the personalised welcome pack (org chart, buddy name, dress code, location map)."},
    {"key": "HCM_55",  "name": "Onboarding Checklist Agent",             "badge": ORACLE, "activity": "1.3.1", "does": "Attaches first-day instructions and the checklist."},
    {"key": "HCM_67",  "name": "Personal Information Assistant",         "badge": ORACLE, "activity": "1.3.2", "does": "Guided collection of bank, tax, and emergency contact details."},
    {"key": "HCM_54",  "name": "Onboard Assistant",                      "badge": ORACLE, "activity": "1.3.2 + 1.3.3", "does": "Pre-fills data from the offer and triggers the onboarding journey."},
    {"key": "HCM_44",  "name": "Journeys Assistant",                     "badge": ORACLE, "activity": "1.3.3", "does": "Personalises the journey and task checklist by role, location, and department."},
    {"key": "HCM_31",  "name": "HR Data Guardian",                       "badge": ORACLE, "activity": "2.1.3", "does": "Proactively checks for missing or inconsistent fields (NI number, bank account, gender, DOB) and notifies HR before payroll cut-off."},
    {"key": "HCM_1",   "name": "Personal Data Advisor",                  "badge": ORACLE, "activity": "2.1.3", "does": "Advises on and cross-checks personal data records for completeness."},
    {"key": "HCM_89",  "name": "User Profile Orchestrator Agent",        "badge": CUSTOM, "activity": "2.2.1", "does": "Orchestrates identity provisioning end-to-end."},
    {"key": "HCM_12",  "name": "Data Retrieval",                         "badge": CUSTOM, "activity": "2.2.1", "does": "Pulls the new worker record from Oracle Fusion."},
    {"key": "HCM_75",  "name": "ServiceNow User Profile Dispatch Agent", "badge": CUSTOM, "activity": "2.2.1", "does": "Dispatches the provisioning request to ServiceNow / AD."},
    {"key": "HCM_152", "name": "Connector (Onboarding)",                 "badge": CUSTOM, "activity": "2.2.3", "does": "Maps the position / job to the required Fusion security roles and submits the access request; IT approves exceptions."},
    {"key": "HCM_73",  "name": "Scheduling Advisor",                     "badge": ORACLE, "activity": "3.1.3", "does": "Proposes schedule and location from the position profile."},
    {"key": "HCM_6",   "name": "Change Working Hours Advisor",           "badge": ORACLE, "activity": "3.1.3", "does": "Applies the manager's adjustments to the work schedule."},
    {"key": "HCM_4",   "name": "Benefits Plan Advisor",                  "badge": ORACLE, "activity": "4.1.2 + 4.2.1", "does": "Presents eligible plans, compares options, and guides selection and dependants."},
    {"key": "HCM_5",   "name": "Benefits Policy Advisor",                "badge": ORACLE, "activity": "4.1.2", "does": "Grounds recommendations in policy rules."},
    {"key": "HCM_2",   "name": "Benefits Analyst",                       "badge": ORACLE, "activity": "4.1.3", "does": "Answers free-text benefits questions instantly."},
    {"key": "HCM_90",  "name": "Worker Concierge",                       "badge": ORACLE, "activity": "4.1.3", "does": "Answers general HR questions in the employee chat."},
    {"key": "HCM_153", "name": "Reporter (Onboarding)",                  "badge": CUSTOM, "activity": "5.3.3", "does": "Generates the compliance status report showing completion rates by department, role, and location."},
    {"key": "HCM_97",  "name": "Onboarding Metrics Maker",               "badge": CUSTOM, "activity": "8.2.2", "does": "Reviews task and training completion against the plan and highlights gaps."},
    {"key": "HCM_76",  "name": "Skill Recommendation Agent",             "badge": ORACLE, "activity": "8.3.2", "does": "Assesses current skills vs. role requirements and recommends additional learning."},
    {"key": "HCM_52",  "name": "My Learning Assistant",                  "badge": ORACLE, "activity": "8.3.2", "does": "Tracks recommended learning and training completion."},
    {"key": "HCM_81",  "name": "Talent Advisor (My Team)",               "badge": ORACLE, "activity": "8.4.1", "does": "Assembles team, goal, and attendance insight for the probation review."},
    {"key": "HCM_111", "name": "Performance Summary Generator",          "badge": CUSTOM, "activity": "8.4.1", "does": "Drafts the 90-day probation summary."},
]

BY_KEY = {a["key"]: a for a in ROSTER}


def agent_step(key, action, duration_ms, output):
    a = BY_KEY[key]
    return {
        "type": "agent", "key": key, "name": a["name"], "badge": a["badge"],
        "action": action, "duration_ms": duration_ms, "output": output,
    }


def system_step(activity, action, output):
    return {
        "type": "system", "key": activity, "name": "Work Automation", "badge": "System",
        "action": action, "duration_ms": 450, "output": output,
    }


# Scripted, deterministic crew runs (spec §3). Each returns the ordered list of
# steps the frontend animates: agents get a visible working beat, system events
# are near-instant.
CREWS = {
    "offer_draft": lambda: [
        agent_step("HCM_40", "Drafting conditional offer from approved requisition", 1400,
                   "Draft offer ready for Policy Analyst, Grade 8 — routed to the manager for review."),
    ],
    "offer_dispatch": lambda: [
        agent_step("HCM_53", "Composing & dispatching offer letter", 1200,
                   "Conditional offer letter composed and released for dispatch."),
        system_step("1.1.2", "Transmit offer via portal / email",
                    "Offer transmitted to Aisha Al Khoori via candidate portal and email — delivery logged."),
        agent_step("HCM_95", "Arming acceptance tracking & reminders", 1000,
                   "Acceptance tracking armed — reminder at 48h, recruiter escalation after 5 days of no response."),
    ],
    "offer_redraft": lambda: [
        agent_step("HCM_92", "Applying HR's tracked change to the letter", 1400,
                   "Housing allowance revised from AED 90,000 to AED 110,000 per year — tracked change applied, v2 routed to the manager."),
    ],
    "accept_offer": lambda: [
        agent_step("HCM_94", "Recording acceptance & moving candidate", 1000,
                   "Acceptance recorded — Aisha moved to 'Offer accepted' in the recruiting pipeline; reminders cancelled."),
        system_step("1.1.2", "Notify hiring manager of acceptance",
                    "Khalid Al Hammadi notified — Aisha accepted the offer; pre-boarding is starting."),
        agent_step("HCM_98", "Initiating background & reference checks", 1100,
                   "Background & reference checks initiated with the external provider — status tracked automatically."),
        system_step("2.1.1", "Convert candidate to employee in HCM",
                    "Candidate record converted to worker record with the correct work relationship."),
        system_step("2.1.2", "Assign employee number & org unit",
                    "Employee number E-2026-4417 assigned · org unit: Dept. of Economic Development."),
        agent_step("HCM_146", "Assembling personalised welcome pack", 1300,
                   "Welcome pack ready: Day 1 logistics, org chart, buddy contact, and a reading list for Policy Analyst."),
        agent_step("HCM_55", "Attaching first-day instructions & checklist", 1000,
                   "First-day instructions attached: arrival 8:00, Al Maqam Tower reception, dress code, parking."),
    ],
    "submit_details": lambda: [
        agent_step("HCM_67", "Validating bank, tax & emergency contact entries", 1300,
                   "All sections complete and valid — IBAN verified, emergency contacts confirmed."),
        agent_step("HCM_31", "Proactive personal-data completeness check", 1100,
                   "No missing or inconsistent fields — bank, DOB, and IDs all present; no payroll blockers."),
        agent_step("HCM_1", "Cross-checking personal data records", 1000,
                   "Records cross-checked and consistent — data ready for first payroll cut-off."),
        agent_step("HCM_54", "Pre-filling worker profile & triggering journey", 1100,
                   "Profile updated from offer data; onboarding journey triggered."),
        agent_step("HCM_44", "Personalising journey & task checklist", 1200,
                   "Journey personalised for Policy Analyst, Abu Dhabi HQ, Dept. of Economic Development — 8 tasks published."),
    ],
    "provisioning": lambda: [
        agent_step("HCM_89", "Planning identity provisioning", 1200,
                   "Provisioning plan ready: AD account, SSO, M365, and group memberships for Policy Analyst."),
        agent_step("HCM_12", "Pulling worker record from Oracle Fusion", 1000,
                   "Worker record E-2026-4417 retrieved with role, org unit, and manager assignment."),
        agent_step("HCM_75", "Dispatching provisioning request to ServiceNow / AD", 1400,
                   "ServiceNow ticket RITM0048291 raised; AD account created with correct group memberships."),
        agent_step("HCM_152", "Mapping role to application access", 1200,
                   "Policy Analyst mapped to Fusion security roles — role-based access granted: ERP, DMS, analytics."),
        system_step("2.2.1", "AD / SSO account activated",
                    "Credentials issued: aisha.alkhoori@dge.gov.ae · SSO and M365 active."),
    ],
    "schedule_confirm": lambda adjusted: [
        agent_step("HCM_73", "Proposing schedule & location from position profile", 1100,
                   "Proposed: Sun–Thu, 8:00–16:00, hybrid (2 days remote) · Al Maqam Tower, Abu Dhabi."),
        agent_step("HCM_6", "Applying the manager's confirmation", 1000,
                   ("Manager adjustment applied: Sun–Thu, 8:30–16:30, hybrid (2 days remote)."
                    if adjusted else
                    "Schedule confirmed as proposed: Sun–Thu, 8:00–16:00, hybrid (2 days remote).")),
        system_step("3.2.3", "Track equipment delivery & confirm receipt",
                    "Equipment delivery tracked — laptop & peripherals delivered to Al Maqam Tower; receipt confirmed."),
    ],
    "benefits_enrol": lambda: [
        system_step("4.1.1", "Trigger new-hire enrolment event",
                    "New-hire enrolment window opened for Aisha Al Khoori."),
        agent_step("HCM_4", "Presenting eligible plans & contribution estimates", 1300,
                   "3 eligible plans compared — Essential, Standard, Premier — with contribution impact per plan."),
        agent_step("HCM_5", "Grounding recommendation in policy rules", 1000,
                   "Recommendation checked against DGE benefits policy: Premier eligible for Grade 8 with dependants."),
        agent_step("HCM_4", "Guiding plan selection & dependant entry", 1200,
                   "Premier plan selected; 2 dependants added with document upload."),
        system_step("4.2.2", "Validate enrolment & dependant eligibility",
                    "Validation issue — Dependant #2 (Mariam): Emirates ID scan missing."),
    ],
    "upload_eid": lambda parsed: [
        system_step("4.2.2", "Re-validate enrolment & dependant eligibility",
                    (f"Emirates ID parsed — {parsed['name']} · {parsed.get('id_number', '—')} · "
                     f"DOB {parsed.get('dob', '—')}. Identity matches the dependant record; "
                     "enrolment confirmed: Premier plan, 2 dependants covered.")
                    if parsed else
                    "Document received and routed for verification. Enrolment confirmed: "
                    "Premier plan, 2 dependants covered."),
    ],
    "probation_compile": lambda: [
        agent_step("HCM_153", "Generating compliance status report", 1100,
                   "Compliance report generated — 100% of mandatory training complete; zero overdue items."),
        agent_step("HCM_97", "Assessing onboarding progress against checklist", 1100,
                   "Onboarding checklist assessed — all tasks closed on time; no gaps against the plan."),
        agent_step("HCM_76", "Assessing skills vs role requirements", 1200,
                   "Skills assessed against Policy Analyst requirements — proficient; 2 growth areas with recommended learning."),
        agent_step("HCM_52", "Tracking recommended learning completion", 1000,
                   "Both recommended courses completed by day 80 — development plan on track."),
        agent_step("HCM_81", "Assembling team, goal & attendance insight", 1400,
                   "Evidence pack ready: 4 of 5 goals attained, training 100%, attendance 97%, feedback themes compiled."),
        agent_step("HCM_111", "Drafting the 90-day probation summary", 1500,
                   "Draft summary ready for the manager's final assessment."),
    ],
    "probation_close": lambda date: [
        system_step("8.4.3", "Update employee status & notify",
                    f"Employment status updated to Confirmed — appointment effective {date}. "
                    "Payroll, IT, and Aisha notified."),
    ],
}
