import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class DecisionRead(BaseModel):
    """Schema for returning typed probabilistic decision records."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    run_id: uuid.UUID
    question_key: str
    decision_value: str
    probabilities_json: dict[str, Any]
    confidence: float
    model_name: str
    schema_version: str
    latency_ms: int
    created_at: datetime
