import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class MemoryCreate(BaseModel):
    """Payload to create a new project or workspace memory."""

    content: str
    memory_type: str = "fact"  # fact, preference, constraint, correction
    scope: str = "project"  # project, workspace, brand
    project_id: uuid.UUID | None = None
    structured_json: dict[str, Any] = Field(default_factory=dict)
    source_type: str = "user_explicit"
    source_ref: str | None = None
    confidence: float = 1.0
    is_user_confirmed: bool = False


class MemoryUpdate(BaseModel):
    """Payload to update memory content or structured attributes."""

    content: str | None = None
    memory_type: str | None = None
    structured_json: dict[str, Any] | None = None
    confidence: float | None = None
    is_active: bool | None = None
    is_user_confirmed: bool | None = None


class MemoryRead(BaseModel):
    """Schema for returning memory records."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    project_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    scope: str
    memory_type: str
    content: str
    structured_json: dict[str, Any]
    source_type: str
    source_ref: str | None = None
    confidence: float
    is_user_confirmed: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MemorySemanticSearchRequest(BaseModel):
    """Payload to search episodic memories via pgvector."""

    query: str
    project_id: uuid.UUID | None = None
    limit: int = 3
    min_similarity: float = 0.0


class MemorySearchResult(BaseModel):
    """Result of semantic similarity search with score."""

    memory: MemoryRead
    similarity: float
