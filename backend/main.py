import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import state
from models import ActionBody

app = FastAPI(title="New Employee Onboarding demo", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/state")
def get_state():
    return state.serialize()


@app.post("/api/action/{name}")
def post_action(name: str, body: ActionBody = None):
    try:
        return state.do_action(name, body.model_dump() if body else {})
    except state.ActionError as e:
        raise HTTPException(status_code=409, detail=str(e))


# In the deployed container the built frontend sits in ./static and this app
# serves it directly (single Cloud Run service, no CORS). Absent in local dev,
# where Vite serves the UI and proxies /api. API routes above take precedence.
_static = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_static):
    app.mount("/", StaticFiles(directory=_static, html=True), name="static")
