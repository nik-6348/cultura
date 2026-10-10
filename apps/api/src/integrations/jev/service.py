import logging
import time
import uuid
from decimal import Decimal
from typing import Any

from src.core.config import get_settings
from src.db.models.decision import Decision
from src.integrations.jev.client import (
    JevError,
    TypeSafeJevClient,
)
from src.integrations.jev.fallback import JevFallbackEngine
from src.integrations.jev.models import (
    EvidenceSufficiency,
    JevQuestionDefinition,
    MarketDecisionResult,
    MarketPosture,
)

logger = logging.getLogger(__name__)


class JevDecisionService:
    """
    High-level decision service bridging LangGraph analysis agents and
    the TypeSafe Jev System One reasoning engine with automatic fallback resilience.
    """

    def __init__(self, client: TypeSafeJevClient | None = None):
        self.client = client or TypeSafeJevClient()
        self.settings = get_settings()

    async def evaluate_market(
        self,
        market_name: str,
        overall_score: float | Decimal,
        coverage_ratio: float | Decimal,
        brand_name: str = "Brand",
        dimension_scores: dict[str, Any] | None = None,
        resolved_entities_count: int = 5,
    ) -> MarketDecisionResult:
        """
        Evaluates a single candidate market through Jev System One or deterministic fallback.
        """
        score_val = float(overall_score)
        cov_val = float(coverage_ratio)
        dim_scores = dimension_scores or {}

        # If fallback is enabled and no API key is set, immediately use deterministic fallback
        if not self.settings.jev_api_key and self.settings.jev_enable_fallback:
            logger.info("JEV_API_KEY not configured. Using deterministic fallback engine.")
            return JevFallbackEngine.evaluate(
                market_name=market_name,
                overall_score=score_val,
                coverage_ratio=cov_val,
                dimension_scores=dim_scores,
            )

        # Build concise structured state snapshot
        state_text = (
            f"Brand: {brand_name}\n"
            f"Market: {market_name}\n"
            f"Overall Cultural Compatibility Score: {score_val:.4f}\n"
            f"Evidence Coverage Ratio: {cov_val:.2f}\n"
            f"Resolved Entities Count: {resolved_entities_count}\n"
            f"Dimension Breakdown: {dim_scores}"
        )

        questions = {
            "market_decision": JevQuestionDefinition(
                type="choice",
                instructions=(
                    "Evaluate cultural market entry posture based on empirical evidence and score"
                ),
                criteria={
                    "launch": "High cultural compatibility and positive momentum (score >= 0.75)",
                    "adapt": (
                        "Moderate compatibility requiring localization and brand adaptation "
                        "(score between 0.50 and 0.75)"
                    ),
                    "avoid": "Low compatibility or cultural friction risks (score < 0.50)",
                },
            ),
            "evidence_sufficiency": JevQuestionDefinition(
                type="choice",
                instructions="Determine whether empirical evidence coverage is adequate",
                criteria={
                    "sufficient": "Coverage ratio >= 0.60 with key taste proxies resolved",
                    "insufficient": "Sparse signals, missing proxies, or coverage < 0.60",
                },
            ),
            "human_review_required": JevQuestionDefinition(
                type="choice",
                instructions="Determine if escalation to a human cultural strategist is required",
                criteria={
                    "yes": "High ambiguity, conflicting signals, or low data coverage",
                    "no": "Clear empirical direction with sufficient data and low ambiguity",
                },
            ),
        }

        start_time = time.perf_counter()
        try:
            response = await self.client.predict(state=state_text, questions=questions)
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)

            if not response.data or not response.data.answers:
                raise JevError("Empty answers returned by Jev")

            answers = response.data.answers
            m_ans = answers.get("market_decision")
            s_ans = answers.get("evidence_sufficiency")
            h_ans = answers.get("human_review_required")

            if not m_ans or not s_ans or not h_ans:
                raise JevError("Missing one or more required question keys in Jev response")

            raw_posture = m_ans.choice.lower()
            posture: MarketPosture = (
                raw_posture if raw_posture in ("launch", "adapt", "avoid") else "adapt"  # type: ignore[assignment]
            )

            raw_suff = s_ans.choice.lower()
            sufficiency: EvidenceSufficiency = (
                "sufficient" if raw_suff == "sufficient" else "insufficient"
            )

            # Check if low confidence triggers human review escalation
            # TC-5.2 constraint: confidence < 0.70 triggers human review
            is_low_confidence = m_ans.confidence < 0.70 or s_ans.confidence < 0.70
            human_review = (h_ans.choice.lower() == "yes") or is_low_confidence

            return MarketDecisionResult(
                market_name=market_name,
                posture=posture,
                posture_confidence=m_ans.confidence,
                posture_probabilities=m_ans.probabilities,
                evidence_sufficiency=sufficiency,
                sufficiency_confidence=s_ans.confidence,
                human_review_required=human_review,
                human_review_confidence=h_ans.confidence,
                model_name=response.data.model,
                latency_ms=response.data.latency_ms or elapsed_ms,
                is_fallback=False,
                rationale=m_ans.rationale,
            )

        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            if self.settings.jev_enable_fallback:
                logger.warning(
                    f"Jev API call failed ({exc}). "
                    f"Executing deterministic fallback engine for {market_name}."
                )

                fallback_res = JevFallbackEngine.evaluate(
                    market_name=market_name,
                    overall_score=score_val,
                    coverage_ratio=cov_val,
                    dimension_scores=dim_scores,
                )
                # Keep track of actual latency
                return fallback_res.model_copy(update={"latency_ms": max(1, elapsed_ms)})
            raise

    async def evaluate_multiple_markets(
        self,
        market_scores_map: dict[str, Any],
        brand_name: str = "Brand",
        normalized_evidence: list[dict[str, Any]] | None = None,
    ) -> dict[str, MarketDecisionResult]:
        """
        Evaluates decisions across all candidate markets in an analysis run.
        """
        results: dict[str, MarketDecisionResult] = {}
        ev_list = normalized_evidence or []

        for market_name, score_info in market_scores_map.items():
            overall_score = score_info.get("overall_score", 0.0)
            coverage = score_info.get("evidence_coverage_ratio", 0.8)
            dim_scores = score_info.get("dimension_scores", {})
            market_ev_count = sum(1 for e in ev_list if e.get("market_name") == market_name)

            decision = await self.evaluate_market(
                market_name=market_name,
                overall_score=overall_score,
                coverage_ratio=coverage,
                brand_name=brand_name,
                dimension_scores=dim_scores,
                resolved_entities_count=max(3, market_ev_count),
            )
            results[market_name] = decision

        return results

    @staticmethod
    def to_db_records(decision_result: MarketDecisionResult, run_id: uuid.UUID) -> list[Decision]:
        """
        Converts a MarketDecisionResult into individual ORM records for the decisions table.
        """
        records: list[Decision] = []
        m_name = decision_result.market_name

        # 1. Market Entry Posture
        records.append(
            Decision(
                id=uuid.uuid4(),
                run_id=run_id,
                question_key=f"{m_name}:market_decision",
                decision_value=decision_result.posture,
                probabilities_json=decision_result.posture_probabilities,
                confidence=decision_result.posture_confidence,
                model_name=decision_result.model_name,
                schema_version="v1.0.0",
                latency_ms=decision_result.latency_ms,
            )
        )

        # 2. Evidence Sufficiency
        records.append(
            Decision(
                id=uuid.uuid4(),
                run_id=run_id,
                question_key=f"{m_name}:evidence_sufficiency",
                decision_value=decision_result.evidence_sufficiency,
                probabilities_json={
                    decision_result.evidence_sufficiency: decision_result.sufficiency_confidence,
                    "other": round(1.0 - decision_result.sufficiency_confidence, 4),
                },
                confidence=decision_result.sufficiency_confidence,
                model_name=decision_result.model_name,
                schema_version="v1.0.0",
                latency_ms=decision_result.latency_ms,
            )
        )

        # 3. Human Review Escalation Guard
        records.append(
            Decision(
                id=uuid.uuid4(),
                run_id=run_id,
                question_key=f"{m_name}:human_review_required",
                decision_value="yes" if decision_result.human_review_required else "no",
                probabilities_json={
                    "yes": 0.90 if decision_result.human_review_required else 0.10,
                    "no": 0.10 if decision_result.human_review_required else 0.90,
                },
                confidence=decision_result.human_review_confidence,
                model_name=decision_result.model_name,
                schema_version="v1.0.0",
                latency_ms=decision_result.latency_ms,
            )
        )

        return records
