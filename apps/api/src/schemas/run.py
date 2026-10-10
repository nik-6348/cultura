import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AnalysisRunCreate(BaseModel):
    """Payload to trigger an analysis run on a project."""

    override_markets: list[dict[str, str]] | None = Field(
        default=None,
        description="Optional candidate markets override: [{'name': 'London', 'code': 'GB-LND'}]",
    )


class RunStepRead(BaseModel):
    """Audit trail record for a single node execution in the agent DAG."""

    id: uuid.UUID
    run_id: uuid.UUID
    step_key: str
    agent_name: str
    status: str
    sequence: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    latency_ms: int | None = None
    output_ref: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisRunRead(BaseModel):
    """Public schema for an analysis run."""

    id: uuid.UUID
    project_id: uuid.UUID
    workspace_id: uuid.UUID
    type: str
    status: str
    workflow_version: str
    score_version: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    input_snapshot_json: dict[str, Any]
    result_summary_json: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisRunDetailedRead(AnalysisRunRead):
    """Detailed analysis run with timeline steps."""

    steps: list[RunStepRead] = Field(default_factory=list)
