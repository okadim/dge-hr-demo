"""In-memory demo state: one shared journey for Aisha Al Khoori, mutated by the
storyline actions and read by all five views. Deterministic — no clocks, no
randomness. reset() returns the exact seeded start.
"""
import copy

import base64

from agents import ROSTER, CREWS, agent_step, llm_answer, llm_parse_id, parse_png_text

OFFER_TERMS_V1 = [
    {"label": "Position",          "value": "Policy Analyst — Grade 8"},
    {"label": "Department",        "value": "Dept. of Economic Development"},
    {"label": "Reports to",        "value": "Khalid Al Hammadi"},
    {"label": "Base salary",       "value": "AED 28,000 / month"},
    {"label": "Housing allowance", "value": "AED 90,000 / year"},
    {"label": "Start date",        "value": "Sunday, 2 August 2026"},
]

OFFER_TERMS_V2 = [
    dict(t, value="AED 110,000 / year") if t["label"] == "Housing allowance" else t
    for t in OFFER_TERMS_V1
]

BENEFIT_PLANS = [
    {"id": "essential", "name": "Essential", "monthly": "AED 0 employee contribution",
     "cover": ["Medical (network B)", "Dental basic", "Employee only"]},
    {"id": "standard", "name": "Standard", "monthly": "AED 180 / month",
     "cover": ["Medical (network A)", "Dental + optical", "Spouse & children"]},
    {"id": "premier", "name": "Premier", "monthly": "AED 340 / month",
     "cover": ["Medical (network A+, incl. orthodontics)", "Dental + optical enhanced", "Spouse & children", "Annual health screening"]},
]

PROBATION_EVIDENCE = [
    {"label": "Goal attainment",      "value": "4 of 5 goals met", "detail": "Policy briefing pack delivered ahead of schedule; SME licensing study 80% complete."},
    {"label": "Onboarding completion", "value": "100%",            "detail": "All checklist items closed on time — assessed by Onboarding Metrics Maker."},
    {"label": "Skill development",    "value": "On track",         "detail": "Proficient vs role requirements; both recommended courses completed by day 80."},
    {"label": "Training completion",  "value": "100%",             "detail": "All mandatory modules complete, incl. Government Data Handling."},
    {"label": "Attendance",           "value": "97%",              "detail": "One approved absence; punctuality consistently high."},
    {"label": "Feedback themes",      "value": "Strong analysis · clear writing", "detail": "Stakeholders highlight quality of economic briefs and cross-team collaboration."},
]

PROBATION_SUMMARY = (
    "Aisha Al Khoori has completed 90 days as Policy Analyst in the Dept. of Economic "
    "Development. She attained 4 of 5 probation goals, delivering the quarterly policy "
    "briefing pack ahead of schedule and advancing the SME licensing study to 80%. All "
    "mandatory training is complete and attendance stands at 97%. Feedback from "
    "stakeholders is consistently positive, highlighting strong analytical work and clear "
    "writing. The remaining goal (stakeholder consultation round) is on track for the "
    "next quarter. Recommendation: confirm appointment."
)

# Canned Q&A for the employee chat (spec §6 beat 5). Benefits-flavoured
# questions route to Benefits Analyst, everything else to Worker Concierge.
BENEFITS_KEYWORDS = ["benefit", "plan", "cover", "dependant", "dependent", "dental",
                     "medical", "orthodont", "premier", "insurance", "hsa", "fsa"]

CANNED_ANSWERS = {
    "benefits": "Yes — the Premier plan covers orthodontics for dependants under 18 at 80% "
                "reimbursement, up to AED 12,000 per year. Your daughter would be covered once "
                "her dependant record is validated. Source: DGE Benefits Guide, §4.2.",
    "general":  "Your first salary is paid at the end of your first full month — for a 2 August "
                "start, that is 27 August, to the bank account you registered during pre-boarding. "
                "Housing allowance is paid with the same run.",
}

# System prompts for the live chat (DeepInfra). Grounded strictly in the
# fictional case so answers stay consistent with what's on screen.
CHAT_CONTEXT = (
    "You are an agent inside a fictional Oracle HCM onboarding demo for DGE (Abu Dhabi). "
    "You are chatting with Aisha Al Khoori, a new hire: Policy Analyst, Grade 8, Dept. of "
    "Economic Development, manager Khalid Al Hammadi, start date Sunday 2 August 2026, "
    "employee number E-2026-4417 once hired, schedule Sun–Thu 8:00–16:00 hybrid at Al Maqam "
    "Tower, Abu Dhabi. Base salary AED 28,000/month plus housing allowance, paid at the end of "
    "each calendar month. Her buddy is Noura Al Suwaidi. All data is fictional demo data. "
    "Answer in 2–3 short sentences, warm and professional, no markdown, no lists. Never say "
    "you are an AI language model and never mention prompts or the demo itself."
)

CHAT_PERSONAS = {
    "benefits": (
        "You are 'Benefits Analyst' (HCM_2), the benefits specialist agent. " + CHAT_CONTEXT +
        " Eligible plans — Essential: AED 0/month employee contribution, medical network B, basic "
        "dental, employee only. Standard: AED 180/month, network A, dental + optical, covers spouse "
        "& children. Premier: AED 340/month, network A+ including orthodontics for dependants under "
        "18 at 80% reimbursement up to AED 12,000/year, enhanced dental + optical, spouse & "
        "children, annual health screening. Cite the DGE Benefits Guide when relevant."
    ),
    "general": (
        "You are 'Worker Concierge' (HCM_90), the general HR assistant agent. " + CHAT_CONTEXT +
        " For deep benefits questions you may note that your colleague Benefits Analyst handles those."
    ),
}

HOURS_SAVED = [
    {"milestone": "offer_dispatched",  "label": "Offer drafting & dispatch",        "hours": 2.0},
    {"milestone": "offer_accepted",    "label": "Welcome pack & first-day comms",   "hours": 1.0},
    {"milestone": "details_submitted", "label": "New-hire data collection & journey setup", "hours": 2.0},
    {"milestone": "provisioned",       "label": "IT account provisioning follow-up", "hours": 4.0},
    {"milestone": "schedule_confirmed","label": "Schedule & location setup",        "hours": 0.5},
    {"milestone": "benefits_enrolled", "label": "Benefits guidance & enrolment support", "hours": 3.0},
    {"milestone": "probation_compiled","label": "Probation evidence gathering & summary", "hours": 3.0},
    {"milestone": "details_submitted", "label": "Personal data validation & correction",  "hours": 0.5},
    {"milestone": "provisioned",       "label": "Role-based access mapping",              "hours": 1.0},
    {"milestone": "schedule_confirmed","label": "Equipment delivery follow-up",           "hours": 0.5},
    {"milestone": "probation_compiled","label": "Compliance & progress reporting",        "hours": 2.0},
]


def seed():
    return {
        "employee": {
            "name": "Aisha Al Khoori",
            "role": "Policy Analyst",
            "grade": "Grade 8",
            "department": "Dept. of Economic Development",
            "manager": "Khalid Al Hammadi",
            "employee_number": None,
            "start_date": "Sunday, 2 August 2026",
        },
        # The draft already exists when the demo opens: Job Offer Creation
        # Advisor produced it (seeded run below) and it awaits manager review.
        # The agent drafts the offer up front (seeded run below); the human-in-
        # the-middle flow is: HR reviews/edits/approves -> manager reviews &
        # approves -> dispatch.
        "offer": {
            "status": "hr_review",   # hr_review | awaiting_review | sent | accepted
            "version": 1,
            "terms": OFFER_TERMS_V1,
            "previous_terms": None,
            "hr_comment": None,
            "hr_edited": False,
            "employee_comment": None,
        },
        "welcome_pack": {"ready": False, "items": [
            {"title": "Day 1 logistics", "text": "Sunday 2 Aug, 8:00 · Al Maqam Tower reception · smart business dress · parking level P2"},
            {"title": "Your buddy", "text": "Noura Al Suwaidi — Senior Policy Analyst · noura.alsuwaidi@dge.gov.ae"},
            {"title": "Org chart", "text": "Economic Policy team — 12 people, reporting to Khalid Al Hammadi"},
            {"title": "Reading list", "text": "Abu Dhabi Economic Vision · DGE service standards · current SME licensing study"},
        ]},
        "details": {"status": "locked", "values": None},   # locked | available | submitted
        "journey": {
            "published": False,
            "tasks": [
                {"id": "t1", "label": "Review & accept your conditional offer", "owner": "Aisha", "status": "pending"},
                {"id": "t2", "label": "Complete personal details — bank, tax, emergency contacts", "owner": "Aisha", "status": "locked"},
                {"id": "t3", "label": "Read your welcome pack", "owner": "Aisha", "status": "locked"},
                {"id": "t4", "label": "IT account & credentials", "owner": "System / IT", "status": "locked"},
                {"id": "t5", "label": "Confirm work schedule & location", "owner": "Manager", "status": "locked"},
                {"id": "t6", "label": "Enrol in benefits & add dependants", "owner": "Aisha", "status": "locked"},
                {"id": "t6t", "label": "Complete mandatory training & compliance", "owner": "Aisha", "status": "locked"},
                {"id": "t7", "label": "90-day probation review & confirmation", "owner": "Manager", "status": "locked"},
            ],
        },
        "provisioning": {"status": "locked", "credentials": None, "ticket": None},  # locked | ready | done
        "schedule": {
            "status": "locked",  # locked | proposed | confirmed
            "proposed": {"days": "Sun–Thu", "hours": "8:00–16:00", "mode": "Hybrid (2 days remote)",
                         "location": "Al Maqam Tower, Abu Dhabi"},
            "final": None,
        },
        "benefits": {
            "status": "locked",  # locked | open | flagged | enrolled
            "plans": BENEFIT_PLANS,
            "selection": None,
            "flag": None,
        },
        "probation": {
            "status": "locked",  # locked | ready | compiled | decided
            "evidence": None,
            "summary": None,
            "decision": None,
        },
        "chat": [
            {"from": "assistant", "agent": "Worker Concierge", "key": "HCM_90",
             "text": "Marhaba Aisha! I'm here for any HR question — and my colleague Benefits Analyst handles benefits ones. Ask away."},
        ],
        "agent_runs": [
            agent_step("HCM_40", "Drafting conditional offer from approved requisition", 0,
                       "Draft offer ready for Policy Analyst, Grade 8 — awaiting HR review."),
        ],
        "background_hires": [
            {"name": "Omar Al Dhaheri", "role": "Data Engineer", "stage": "Employee Record & Accounts",
             "note": "Identity pipeline running — ServiceNow ticket in progress"},
            {"name": "Fatima Rashed", "role": "HR Business Partner", "stage": "Benefits Enrolment",
             "note": "Comparing plans with Benefits Plan Advisor"},
            {"name": "Yousef Khan", "role": "Procurement Officer", "stage": "Probation & Confirmation",
             "note": "Day-90 evidence pack compiled — awaiting manager decision"},
        ],
    }


STATE = seed()


def _task(state, tid, status):
    for t in state["journey"]["tasks"]:
        if t["id"] == tid:
            t["status"] = status


def _next_human_action(s):
    if s["offer"]["status"] == "hr_review":
        return "HR: review & approve the offer draft"
    if s["offer"]["status"] == "awaiting_review":
        return "Manager: review & approve the offer"
    if s["offer"]["status"] == "sent":
        return "Aisha: accept the conditional offer"
    if s["details"]["status"] == "available":
        return "Aisha: complete personal details"
    if s["provisioning"]["status"] == "ready":
        return "Manager: run identity provisioning"
    if s["schedule"]["status"] == "proposed":
        return "Manager: confirm work schedule"
    if s["benefits"]["status"] == "open":
        return "Aisha: enrol in benefits"
    if s["benefits"]["status"] == "flagged":
        return "Aisha: upload Emirates ID for dependant #2"
    if s["probation"]["status"] == "ready":
        return "Manager: compile the day-90 evidence pack"
    if s["probation"]["status"] == "compiled":
        return "Manager: probation decision (human authority)"
    if s["probation"]["status"] == "decided":
        return "Journey complete"
    return "—"


def _milestones(s):
    return {
        "offer_dispatched": s["offer"]["status"] in ("sent", "accepted"),
        "offer_accepted": s["offer"]["status"] == "accepted",
        "details_submitted": s["details"]["status"] == "submitted",
        "provisioned": s["provisioning"]["status"] == "done",
        "schedule_confirmed": s["schedule"]["status"] == "confirmed",
        "benefits_enrolled": s["benefits"]["status"] == "enrolled",
        "probation_compiled": s["probation"]["status"] in ("compiled", "decided"),
    }


def serialize(last_runs=None):
    s = STATE
    tasks = s["journey"]["tasks"]
    done = sum(1 for t in tasks if t["status"] == "done")
    ms = _milestones(s)
    hours = [dict(h, achieved=ms[h["milestone"]]) for h in HOURS_SAVED]
    return {
        "roster": ROSTER,
        "case": copy.deepcopy({k: v for k, v in s.items() if k not in ("agent_runs", "background_hires")}),
        "agent_runs": copy.deepcopy(s["agent_runs"]),
        "background_hires": s["background_hires"],
        "kpis": {
            "journey_pct": round(100 * done / len(tasks)),
            "agent_runs": sum(1 for r in s["agent_runs"] if r["type"] == "agent"),
            "agents_distinct": len({r["key"] for r in s["agent_runs"] if r["type"] == "agent"}),
            "system_events": sum(1 for r in s["agent_runs"] if r["type"] == "system"),
            "next_human_action": _next_human_action(s),
        },
        "value": {
            "activities_total": 23,
            "ai_run": 16,
            "system_automated": 6,
            "human_decisions": 1,
            "hours_saved": hours,
        },
        "last_runs": copy.deepcopy(last_runs or []),
    }


class ActionError(Exception):
    pass


def _record(runs):
    STATE["agent_runs"].extend(runs)
    return runs


# ---------------------------------------------------------------- actions

def approve_draft(body):
    o = STATE["offer"]
    if o["status"] != "hr_review":
        raise ActionError("The draft is not awaiting HR review.")
    comment = (body.get("comment") or "").strip()
    if not comment:
        raise ActionError("A review comment is required before approval.")
    o["hr_comment"] = comment
    runs = []
    if body.get("edited"):
        # HR's tracked change: Redraft Offer Letters applies it to the letter.
        runs = _record(CREWS["offer_redraft"]())
        o["previous_terms"] = o["terms"]
        o["terms"] = OFFER_TERMS_V2
        o["version"] = 2
        o["hr_edited"] = True
    o["status"] = "awaiting_review"
    return runs


def approve_offer(body):
    o = STATE["offer"]
    if o["status"] != "awaiting_review":
        raise ActionError("The offer is not awaiting manager approval.")
    runs = _record(CREWS["offer_dispatch"]())
    o["status"] = "sent"
    return runs


def accept_offer(body):
    if STATE["offer"]["status"] != "sent":
        raise ActionError("The offer must be dispatched before it can be accepted.")
    comment = (body.get("comment") or "").strip()
    if comment:
        STATE["offer"]["employee_comment"] = comment
    runs = _record(CREWS["accept_offer"]())
    STATE["offer"]["status"] = "accepted"
    STATE["employee"]["employee_number"] = "E-2026-4417"
    STATE["welcome_pack"]["ready"] = True
    STATE["details"]["status"] = "available"
    _task(STATE, "t1", "done")
    _task(STATE, "t2", "pending")
    _task(STATE, "t3", "pending")
    return runs


def submit_details(body):
    if STATE["details"]["status"] != "available":
        raise ActionError("Details are not open for submission.")
    runs = _record(CREWS["submit_details"]())
    STATE["details"]["status"] = "submitted"
    if body.get("details"):
        STATE["details"]["values"] = body["details"]
    STATE["journey"]["published"] = True
    STATE["provisioning"]["status"] = "ready"
    STATE["schedule"]["status"] = "proposed"
    _task(STATE, "t2", "done")
    _task(STATE, "t3", "done")
    _task(STATE, "t4", "pending")
    _task(STATE, "t5", "pending")
    return runs


def run_provisioning(body):
    if STATE["provisioning"]["status"] != "ready":
        raise ActionError("Provisioning is not ready to run.")
    runs = _record(CREWS["provisioning"]())
    STATE["provisioning"].update({
        "status": "done",
        "credentials": {"username": "aisha.alkhoori@dge.gov.ae", "systems": "AD · SSO · M365"},
        "ticket": "RITM0048291",
    })
    _task(STATE, "t4", "done")
    return runs


def confirm_schedule(body):
    if STATE["schedule"]["status"] != "proposed":
        raise ActionError("No schedule proposal awaiting confirmation.")
    adjusted = bool(body.get("adjusted"))
    runs = _record(CREWS["schedule_confirm"](adjusted))
    final = dict(STATE["schedule"]["proposed"])
    if adjusted:
        final["hours"] = "8:30–16:30"
    STATE["schedule"]["final"] = final
    STATE["schedule"]["status"] = "confirmed"
    STATE["benefits"]["status"] = "open"
    _task(STATE, "t5", "done")
    _task(STATE, "t6", "pending")
    _task(STATE, "t6t", "pending")
    return runs


def ask_question(body):
    question = (body.get("question") or "").strip()
    if not question:
        raise ActionError("Ask a question first.")
    is_benefits = any(k in question.lower() for k in BENEFITS_KEYWORDS)
    kind = "benefits" if is_benefits else "general"
    key, name = ("HCM_2", "Benefits Analyst") if is_benefits else ("HCM_90", "Worker Concierge")
    try:
        answer = llm_answer(CHAT_PERSONAS[kind], question)
    except Exception:
        # No key / network / provider hiccup — the demo must not break.
        answer = CANNED_ANSWERS[kind]
    runs = _record([agent_step(key, "Answering Aisha's question", 1100, answer)])
    STATE["chat"].append({"from": "employee", "text": question})
    STATE["chat"].append({"from": "assistant", "agent": name, "key": key, "text": answer})
    return runs


def enrol_benefits(body):
    if STATE["benefits"]["status"] != "open":
        raise ActionError("The enrolment window is not open.")
    runs = _record(CREWS["benefits_enrol"]())
    STATE["benefits"]["selection"] = {
        "plan": "Premier",
        "dependants": ["Salem (spouse)", "Mariam (daughter, 7)"],
        "monthly": "AED 340 / month",
    }
    STATE["benefits"]["status"] = "flagged"
    STATE["benefits"]["flag"] = "Dependant #2 (Mariam): Emirates ID scan missing — upload to complete enrolment."
    _task(STATE, "t6", "attention")
    return runs


def upload_eid(body):
    if STATE["benefits"]["status"] != "flagged":
        raise ActionError("No document is awaited.")
    # Parse the uploaded document: vision LLM first, then the specimen card's
    # PNG metadata, then a graceful generic path — the demo never breaks.
    parsed = None
    data_uri = body.get("file_b64") or ""
    if data_uri.startswith("data:image/"):
        try:
            parsed = llm_parse_id(data_uri)
        except Exception:
            try:
                raw = base64.b64decode(data_uri.split(",", 1)[1])
                meta = parse_png_text(raw)
                if meta.get("eid_name"):
                    parsed = {"name": meta["eid_name"],
                              "id_number": meta.get("eid_number", ""),
                              "dob": meta.get("eid_dob", "")}
            except Exception:
                parsed = None
    STATE["benefits"]["eid_parsed"] = parsed
    runs = _record(CREWS["upload_eid"](parsed))
    STATE["benefits"]["status"] = "enrolled"
    STATE["benefits"]["flag"] = None
    STATE["probation"]["status"] = "ready"
    _task(STATE, "t6", "done")
    _task(STATE, "t7", "pending")
    return runs


def compile_probation(body):
    if STATE["probation"]["status"] != "ready":
        raise ActionError("The probation review opens after onboarding completes (day 90).")
    runs = _record(CREWS["probation_compile"]())
    STATE["probation"]["status"] = "compiled"
    STATE["probation"]["evidence"] = PROBATION_EVIDENCE
    STATE["probation"]["summary"] = PROBATION_SUMMARY
    _task(STATE, "t6t", "done")
    return runs


def decide(body):
    decision = body.get("decision")
    if STATE["probation"]["status"] != "compiled":
        raise ActionError("Compile the evidence pack before the decision.")
    if decision not in ("confirm", "extend", "terminate"):
        raise ActionError("Decision must be confirm, extend, or terminate.")
    # 8.4.2 is human authority — no agent runs here, only the follow-on system event.
    runs = _record(CREWS["probation_close"](decision))
    STATE["probation"]["status"] = "decided"
    STATE["probation"]["decision"] = decision
    _task(STATE, "t7", "done")
    return runs


def reset(body):
    global STATE
    STATE = seed()
    return []


ACTIONS = {
    "approve-draft": approve_draft,
    "approve-offer": approve_offer,
    "accept-offer": accept_offer,
    "submit-details": submit_details,
    "run-provisioning": run_provisioning,
    "confirm-schedule": confirm_schedule,
    "ask-question": ask_question,
    "enrol-benefits": enrol_benefits,
    "upload-eid": upload_eid,
    "compile-probation": compile_probation,
    "decide": decide,
    "reset": reset,
}


def do_action(name, body):
    if name not in ACTIONS:
        raise ActionError(f"Unknown action '{name}'.")
    runs = ACTIONS[name](body or {})
    return serialize(last_runs=runs)
