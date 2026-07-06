from typing import Optional

from pydantic import BaseModel


class ActionBody(BaseModel):
    """Optional inputs for POST /api/action/{name}."""
    question: Optional[str] = None      # ask-question
    decision: Optional[str] = None      # decide: confirm | extend | terminate
    adjusted: Optional[bool] = None     # confirm-schedule: manager tweaked the hours
    details: Optional[dict] = None      # submit-details: user-edited field values
    file_b64: Optional[str] = None      # upload-eid: uploaded document as a data URI
    file_name: Optional[str] = None     # upload-eid: original file name
    comment: Optional[str] = None       # approve-draft: mandatory HR review comment
    edited: Optional[bool] = None       # approve-draft: HR made the tracked change
