import logging
from typing import Any

from src.agents.state import AnalysisState
from src.integrations.jev.service import JevDecisionService

logger = logging.getLogger(__name__)


async def jev_decision_gate_node(state: AnalysisState) -> dict[str, Any]:
    """
    TypeSafe Jev Decision Gate Node:
    Evaluates candidate markets through TypeSafe Jev System One reasoning
    or deterministic fallback. Synthesizes typed entry postures (launch/adapt/avoid),
    evidence sufficiency flags, and human-in-the-loop review guards.
    """
    market_scores = state.get("market_scores", {})
    brand_name = state.get("brand_name", "Brand")
    normalized_evidence = state.get("normalized_evidence", [])
    market_ranking = state.get("market_ranking", {})
    winner_market = market_ranking.get("winner_market")

    decision_service = JevDecisionService()
    try:
        decisions_map = await decision_service.evaluate_multiple_markets(
            market_scores_map=market_scores,
            brand_name=brand_name,
            normalized_evidence=normalized_evidence,
        )
    except Exception as exc:
        logger.error(f"Error in Jev decision gate: {exc}", exc_info=True)
        # Re-raise or record error
        raise

    decisions_summary = {m_name: res.to_summary_dict() for m_name, res in decisions_map.items()}

    # Evaluate if human review is needed across any candidate market
    requires_human_review = any(res.human_review_required for res in decisions_map.values())
    review_reasons = []
    for m_name, res in decisions_map.items():
        if res.human_review_required:
            review_reasons.append(
                f"{m_name}: Posture confidence ({res.posture_confidence:.2f}) or "
                f"sufficiency ({res.evidence_sufficiency}) triggered review guard."
            )

    winner_decision = decisions_map.get(winner_market) if winner_market else None
    winner_posture = winner_decision.posture if winner_decision else "launch"
    winner_conf = winner_decision.posture_confidence if winner_decision else 0.85

    result: dict[str, Any] = {
        "decisions": {
            "market_decisions": decisions_summary,
            "winner_market": winner_market,
            "winner_posture": winner_posture,
            "winner_confidence": winner_conf,
            "requires_human_review": requires_human_review,
            "review_reasons": review_reasons,
        },
        "current_step": "jev_decision_gate",
        "step_history": ["jev_decision_gate"],
    }

    if requires_human_review:
        result["status"] = "requires_review"

    return result
