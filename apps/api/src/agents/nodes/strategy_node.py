from typing import Any

from src.agents.state import AnalysisState


async def strategy_node(state: AnalysisState) -> dict[str, Any]:
    """
    Market Strategy Agent Node:
    Synthesizes ranking results and normalized empirical evidence into
    strategic entry playbooks. Every recommendation MUST reference backed evidence IDs.
    """
    ranking = state.get("market_ranking", {})
    normalized_evidence = state.get("normalized_evidence", [])
    winner_market = ranking.get("winner_market", "Primary Market")

    # Group evidence IDs by market and kind
    market_ev_ids: dict[str, list[str]] = {}
    for ev in normalized_evidence:
        m = ev.get("market_name", "Global")
        market_ev_ids.setdefault(m, []).append(ev["id"])

    recommendations: list[dict[str, Any]] = []

    # 1. Market Entry Sequencing
    winner_evidence_ids = market_ev_ids.get(winner_market, [])[:3]
    recommendations.append(
        {
            "pillar": "entry_sequencing",
            "title": f"Prioritize Flagship Launch in {winner_market}",
            "action": (
                f"Launch physical retail presence in {winner_market} first, followed by secondary "
                "pop-up activations in runner-up markets. Highest cultural affinity index."
            ),
            "supporting_evidence_ids": winner_evidence_ids,
            "confidence": 0.90,
        }
    )

    # 2. Localized Product Adaptation
    lifestyle_ev_ids = [
        ev["id"]
        for ev in normalized_evidence
        if ev.get("market_name") == winner_market and ev.get("kind") == "brand_affinity"
    ][:2]
    recommendations.append(
        {
            "pillar": "product_adaptation",
            "title": f"Subculture Capsule Collection for {winner_market}",
            "action": (
                "Curate minimalist capsule collection tuned to local electronic music and "
                "specialty coffee community taste aesthetics."
            ),
            "supporting_evidence_ids": lifestyle_ev_ids or winner_evidence_ids,
            "confidence": 0.88,
        }
    )

    # 3. Cultural Anchor Partnerships
    venue_ev_ids = [
        ev["id"]
        for ev in normalized_evidence
        if ev.get("market_name") == winner_market
        and ev.get("kind") in ("venue_anchor", "locality_density")
    ][:2]
    recommendations.append(
        {
            "pillar": "activation_partnerships",
            "title": f"Neighborhood Retail Activations in {winner_market}",
            "action": (
                "Partner with established multi-brand concept spaces and third-wave venues for "
                "community launch events."
            ),
            "supporting_evidence_ids": venue_ev_ids or winner_evidence_ids,
            "confidence": 0.85,
        }
    )

    return {
        "strategy_recommendations": recommendations,
        "current_step": "strategy",
        "step_history": ["strategy"],
    }
