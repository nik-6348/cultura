import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    """Payload to trigger report generation for an analysis run."""

    format: str = Field(default="markdown", description="Output format: 'markdown' or 'html'")
    title: str | None = Field(
        default=None, description="Optional custom title for executive report"
    )


class ReportRead(BaseModel):
    """Public schema for a saved executive market entry brief."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    run_id: uuid.UUID
    format: str
    title: str
    content: str | None = None
    storage_uri: str | None = None
    created_at: datetime
