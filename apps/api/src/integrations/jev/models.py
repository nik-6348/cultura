from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class JevQuestionDefinition(BaseModel):
    """Definition of a question posed to the Jev System One reasoning engine."""

    model_config = ConfigDict(frozen=True)

    type: Literal["choice", "score", "noul"] = "choice"
    instructions: str
    criteria: dict[str, str]


class JevSystemOneRequest(BaseModel):
    """Payload sent to POST /api/v1/systemone."""

    model_config = ConfigDict(frozen=True)

    model: str = "typesafe/jev-1.13"
    state: str | dict[str, Any]
    questions: dict[str, JevQuestionDefinition]


class JevAnswer(BaseModel):
    """Individual typed probabilistic answer returned by Jev."""

    model_config = ConfigDict(frozen=True)

    type: str = "choice"
    choice: str
    probabilities: dict[str, float]
    confidence: float
    rationale: str | None = None

    @field_validator("probabilities", mode="after")
    @classmethod
    def validate_and_normalize_probabilities(cls, probs: dict[str, float]) -> dict[str, float]:
        """
        Validates that probabilities sum to 1.0 (allowing for minor rounding tolerance +/- 0.01).
        Normalizes probabilities if floating-point drift occurs.
        """
        if not probs:
            raise ValueError("Probabilities dictionary cannot be empty")

        total = sum(probs.values())
        if not (0.98 <= total <= 1.02):
            raise ValueError(
                f"Probabilities must sum to 1.0 +/- 0.01, but received sum={total:.4f}"
            )

        # Normalize to exact floating sum if slightly drifted
        if total != 1.0 and total > 0:
            return {k: round(v / total, 4) for k, v in probs.items()}
        return {k: round(v, 4) for k, v in probs.items()}


class JevResponseData(BaseModel):
    """Data payload inside a successful Jev response."""

    model_config = ConfigDict(frozen=True)

    model: str
    answers: dict[str, JevAnswer]
    usage: dict[str, int] | None = None
    credits: dict[str, int] | None = None
    latency_ms: int | None = None


class JevSystemOneResponse(BaseModel):
    """Root envelope returned by the Jev System One API."""

    model_config = ConfigDict(frozen=True)

    code: int = 0
    message: str = "ok"
    data: JevResponseData | None = None


MarketPosture = Literal["launch", "adapt", "avoid"]
EvidenceSufficiency = Literal["sufficient", "insufficient"]


class MarketDecisionResult(BaseModel):
    """
    Standardized typed cultural market decision output synthesized from Jev
    or deterministic fallback for a single candidate market.
    """

    market_name: str
    posture: MarketPosture
    posture_confidence: float = Field(ge=0.0, le=1.0)
    posture_probabilities: dict[str, float]
    evidence_sufficiency: EvidenceSufficiency
    sufficiency_confidence: float = Field(ge=0.0, le=1.0)
    human_review_required: bool
    human_review_confidence: float = Field(ge=0.0, le=1.0)
    model_name: str = "typesafe-jev-1.13"
    latency_ms: int = 0
    is_fallback: bool = False
    rationale: str | None = None

    def to_summary_dict(self) -> dict[str, Any]:
        """Convert decision result to JSON-serializable dictionary."""
        return {
            "market_name": self.market_name,
            "posture": self.posture,
            "posture_confidence": self.posture_confidence,
            "posture_probabilities": self.posture_probabilities,
            "evidence_sufficiency": self.evidence_sufficiency,
            "sufficiency_confidence": self.sufficiency_confidence,
            "human_review_required": self.human_review_required,
            "human_review_confidence": self.human_review_confidence,
            "model_name": self.model_name,
            "latency_ms": self.latency_ms,
            "is_fallback": self.is_fallback,
            "rationale": self.rationale,
        }
