import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DimensionScore(BaseModel):
    """Calculated score for a single cultural dimension."""

    dimension_key: str = Field(..., description="Key identifier (e.g., 'brand_affinity')")
    name: str = Field(..., description="Human display name")
    weight: float = Field(..., ge=0.0, le=1.0, description="Configured weight (0.0 to 1.0)")
    raw_score: float = Field(..., ge=0.0, le=1.0, description="Normalized raw score (0.0 to 1.0)")
    weighted_score: float = Field(..., ge=0.0, le=1.0, description="weight * raw_score")
    evidence_ids: list[str] = Field(
        default_factory=list, description="IDs of backing Evidence records"
    )
    explanation: str = Field(..., description="Mathematical and factual justification")


class ScoringConfiguration(BaseModel):
    """
    Mathematical weight configuration for the 5-dimension compatibility engine.
    Weights MUST sum strictly to Decimal('1.0000').
    """

    w_brand_affinity: Decimal = Field(default=Decimal("0.25"), description="D1 weight")
    w_category_ecosystem: Decimal = Field(default=Decimal("0.20"), description="D2 weight")
    w_audience_overlap: Decimal = Field(default=Decimal("0.20"), description="D3 weight")
    w_cultural_momentum: Decimal = Field(default=Decimal("0.15"), description="D4 weight")
    w_evidence_coverage: Decimal = Field(default=Decimal("0.20"), description="D5 weight")

    expected_evidence_count: int = Field(default=5, ge=1, description="Threshold for full coverage")

    @field_validator("w_evidence_coverage")
    @classmethod
    def validate_weights_sum(cls, v: Decimal, info: Any) -> Decimal:
        data = info.data
        w1 = data.get("w_brand_affinity", Decimal("0.25"))
        w2 = data.get("w_category_ecosystem", Decimal("0.20"))
        w3 = data.get("w_audience_overlap", Decimal("0.20"))
        w4 = data.get("w_cultural_momentum", Decimal("0.15"))
        w5 = v
        total = w1 + w2 + w3 + w4 + w5
        if abs(total - Decimal("1.00")) > Decimal("0.0001"):
            raise ValueError(f"Scoring weights must sum to 1.0000, current sum is {total}")
        return v


class MarketCompatibilityScore(BaseModel):
    """Complete multi-criteria cultural compatibility evaluation for a candidate market."""

    market_name: str
    location_code: str | None = None
    overall_score: float = Field(..., ge=0.0, le=1.0, description="Deterministic score [0.0, 1.0]")
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Data completeness ratio [0.0, 1.0]"
    )
    confidence_tier: Literal["high", "medium", "low"]
    requires_human_review: bool
    coverage_ratio: float = Field(..., ge=0.0, le=1.0)
    dimension_scores: dict[str, DimensionScore]
    score_version: str = "v1.0.0"
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = ConfigDict(from_attributes=True)


class MarketRankingResult(BaseModel):
    """Ranked comparison across candidate markets with comparative matrix."""

    project_id: uuid.UUID | None = None
    run_id: uuid.UUID | None = None
    score_version: str = "v1.0.0"
    ranked_markets: list[MarketCompatibilityScore]
    winner_market: str
    score_margin: float
    comparative_matrix: dict[str, dict[str, float]]
    recommendation_summary: str
