import uuid
from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    run_id: uuid.UUID | None = None


class CitationItem(BaseModel):
    id: int
    label: str
    entity: str
    kind: str
    source: str = "qloo"


class DimensionChartPoint(BaseModel):
    dimension: str
    scores: dict[str, float]


class EvidenceCard(BaseModel):
    entity: str
    kind: str
    description: str
    score: float


class ChatResponse(BaseModel):
    reply: str
    citations: list[CitationItem] = []
    chart_data: list[DimensionChartPoint] | None = None
    suggested_questions: list[str] = []
    related_evidence: list[EvidenceCard] = []
    run_id: uuid.UUID | None = None
    project_id: uuid.UUID
    context_meta: dict[str, Any] = {}
