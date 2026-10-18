import re
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


def _readable_entity_name(entity_ref: str | None, meta: dict[str, Any]) -> str | None:
    """Extract a human-readable display name from metadata or entity_ref URN."""
    # Try structured metadata fields first (most accurate)
    for key in ("item_name", "venue_name", "location_name"):
        if val := meta.get(key):
            return str(val)

    if not entity_ref:
        return None

    parts = entity_ref.split(":")
    if len(parts) < 2:
        return entity_ref

    last = parts[-1]
    # If last segment looks like a bare UUID, use the category segment instead
    if re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", last, re.I):
        label = parts[1] if len(parts) >= 2 else entity_ref
    else:
        label = last

    return label.replace("_", " ").replace("-", " ").title()


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
    entity_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def compute_entity_name(self) -> "EvidenceRead":
        if self.entity_name is None:
            self.entity_name = _readable_entity_name(
                self.entity_ref, self.source_metadata_json or {}
            )
        return self
