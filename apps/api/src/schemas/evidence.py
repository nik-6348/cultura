import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EvidenceBase(BaseModel):
    """Base fields for an empirical evidence record."""

    source: str = Field(default="qloo", description="Origin source system (e.g., 'qloo')")
    kind: str = Field(
        ...,
        description="Evidence type (e.g. brand_affinity, locality_density, cultural_momentum)",
    )
    market_name: str | None = Field(default=None, description="Target market name (e.g., 'London')")
    entity_ref: str | None = Field(
        default=None, description="Referenced entity ID or URN (e.g., 'qloo:brand:acme')"
    )
    value_numeric: float | None = Field(
        default=None, ge=0.0, le=1.0, description="Normalized score 0.0 - 1.0"
    )
    value_text: str | None = Field(default=None, description="Optional text representation")
    explanation: str = Field(..., description="Human-readable factual explanation of evidence")
    confidence: float | None = Field(
        default=1.0, ge=0.0, le=1.0, description="Confidence assessment"
    )
    source_metadata_json: dict[str, Any] = Field(
        default_factory=dict, description="Metadata trace (endpoint, latency, hash)"
    )


class EvidenceCreate(EvidenceBase):
    """Schema for registering a new evidence record."""

    run_id: uuid.UUID
    project_id: uuid.UUID


class EvidenceRead(EvidenceBase):
    """Public schema for a persisted evidence record."""

    id: uuid.UUID
    run_id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
