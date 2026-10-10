from decimal import Decimal
from typing import Any

from src.integrations.jev.models import (
    EvidenceSufficiency,
    MarketDecisionResult,
    MarketPosture,
)


class JevFallbackEngine:
    """
    Deterministic fallback engine that evaluates market entry posture,
    evidence sufficiency, and escalation requirements when the Jev System One
    API is unreachable or encounters vendor downtime.
    """

    @classmethod
    def evaluate(
        cls,
        market_name: str,
        overall_score: float | Decimal,
        coverage_ratio: float | Decimal,
        dimension_scores: dict[str, Any] | None = None,
        missing_signals: list[str] | None = None,
    ) -> MarketDecisionResult:
        """
        Calculates deterministic decision outputs using strict rule thresholds.
        """
        score_val = float(overall_score)
        cov_val = float(coverage_ratio)

        # 1. Evaluate Market Entry Posture
        if score_val >= 0.75:
            posture: MarketPosture = "launch"
            p_launch = min(0.95, max(0.75, score_val))
            p_adapt = round(1.0 - p_launch, 4)
            p_avoid = 0.0
            posture_probs = {"launch": round(p_launch, 4), "adapt": p_adapt, "avoid": p_avoid}
            posture_conf = round(p_launch, 4)
            rationale = (
                f"High deterministic cultural compatibility score ({score_val:.3f} >= 0.75) "
                f"indicating strong market entry receptivity."
            )
        elif score_val >= 0.50:
            posture = "adapt"
            posture_probs = {"launch": 0.20, "adapt": 0.65, "avoid": 0.15}
            posture_conf = 0.80
            rationale = (
                f"Moderate cultural compatibility score ({score_val:.3f}); entry requires "
                f"localized positioning and subcultural tuning."
            )
        else:
            posture = "avoid"
            posture_probs = {"launch": 0.05, "adapt": 0.20, "avoid": 0.75}
            posture_conf = 0.85
            rationale = (
                f"Low cultural compatibility score ({score_val:.3f} < 0.50); severe cultural "
                f"friction or absence of relevant taste affinity."
            )

        # 2. Evaluate Evidence Sufficiency
        if cov_val >= 0.60:
            evidence_suff: EvidenceSufficiency = "sufficient"
            p_suff = min(0.95, max(0.60, cov_val))
            suff_conf = round(p_suff, 4)
        else:
            evidence_suff = "insufficient"
            suff_conf = 0.85

        # 3. Evaluate Human Review Escalation Guard
        # Triggers: low data coverage (< 0.60), low score (< 0.50), or low confidence (< 0.70)
        review_required = (cov_val < 0.60) or (score_val < 0.50) or (posture_conf < 0.70)
        review_conf = 0.90

        return MarketDecisionResult(
            market_name=market_name,
            posture=posture,
            posture_confidence=posture_conf,
            posture_probabilities=posture_probs,
            evidence_sufficiency=evidence_suff,
            sufficiency_confidence=suff_conf,
            human_review_required=review_required,
            human_review_confidence=review_conf,
            model_name="deterministic-fallback-v1",
            latency_ms=1,
            is_fallback=True,
            rationale=rationale,
        )
