from typing import Any

from src.agents.state import AnalysisState
from src.integrations.qloo.client import QlooClient


async def qloo_researcher_node(state: AnalysisState) -> dict[str, Any]:
    """
    Qloo Taste Researcher Node:
    Executes bounded, typed queries against the Qloo Cultural AI engine.
    """
    candidate_markets = state.get("candidate_markets", [])
    brand_proxies = state.get("brand_proxies", [])
    seed_entities = [p["entity_id"] for p in brand_proxies] or ["ent_st_supreme", "ent_st_palace"]

    qloo = QlooClient(fallback_to_synthetic=True)

    queries: list[dict[str, Any]] = []
    raw_evidence_items: list[dict[str, Any]] = []

    for m in candidate_markets:
        m_name = m["name"]
        m_code = m.get("code", "GLOBAL")

        # 1. Audience taste query
        aud_insights = await qloo.get_audience_affinities(
            seed_entities=seed_entities,
            target_categories=["fashion", "dining", "music"],
            location=m_name,
        )
        queries.append(
            {
                "operation": "get_audience_affinities",
                "endpoint": "/v2/insights/audiences",
                "market": m_name,
                "seeds": seed_entities,
            }
        )
        raw_evidence_items.append(
            {
                "type": "audience",
                "market_name": m_name,
                "payload": aud_insights.model_dump(),
            }
        )

        # 2. Location demographics query
        loc_insights = await qloo.get_location_demographics(location_code=m_code)
        queries.append(
            {
                "operation": "get_location_demographics",
                "endpoint": "/v2/insights/locations",
                "market": m_name,
                "location_code": m_code,
            }
        )
        raw_evidence_items.append(
            {
                "type": "location",
                "market_name": m_name,
                "payload": loc_insights.model_dump(),
            }
        )

        # 3. Cultural trend query
        trend_insights = await qloo.get_taste_trends(
            entity_or_category="streetwear", interval_days=90
        )
        queries.append(
            {
                "operation": "get_taste_trends",
                "endpoint": "/v2/insights/trends",
                "market": m_name,
            }
        )
        raw_evidence_items.append(
            {
                "type": "trend",
                "market_name": m_name,
                "payload": trend_insights.model_dump(),
            }
        )

    return {
        "research_queries": queries,
        "raw_evidence": raw_evidence_items,
        "current_step": "qloo_researcher",
        "step_history": ["qloo_researcher"],
    }
