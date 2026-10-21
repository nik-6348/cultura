from typing import Any

from src.agents.state import AnalysisState
from src.integrations.qloo.client import QlooClient, QlooAPIError


async def qloo_researcher_node(state: AnalysisState) -> dict[str, Any]:
    """
    Qloo Taste Researcher Node:
    Executes real Qloo API queries per candidate market.
    Raises on API failure — no synthetic fallback.
    """
    candidate_markets = state.get("candidate_markets", [])
    brand_proxies = state.get("brand_proxies", [])
    brand_name = state.get("brand_name", "Brand")
    brand_category = state.get("brand_category", "lifestyle")

    # Seed entity names — qloo client will resolve to real UUIDs
    seed_names = [p["entity_id"] for p in brand_proxies if p.get("entity_id")]
    if not seed_names:
        seed_names = [brand_name]

    qloo = QlooClient()

    queries: list[dict[str, Any]] = []
    raw_evidence_items: list[dict[str, Any]] = []

    for m in candidate_markets:
        m_name = m["name"]
        m_code = m.get("code", m.get("location_code", "GLOBAL"))

        # 1. Audience taste affinities — real Qloo scores per brand × market
        try:
            aud_insights = await qloo.get_audience_affinities(
                seed_entities=seed_names,
                target_categories=["fashion", "dining", "music"],
                location=m_name,
            )
            queries.append({
                "operation": "get_audience_affinities",
                "endpoint": "/v2/insights",
                "market": m_name,
                "seeds": seed_names,
            })
            raw_evidence_items.append({
                "type": "audience",
                "market_name": m_name,
                "payload": aud_insights.model_dump(),
            })
        except QlooAPIError as exc:
            raise RuntimeError(
                f"Qloo audience affinity query failed for market '{m_name}': {exc}"
            ) from exc

        # 2. Location demographics — real Qloo destination + venue data
        try:
            loc_insights = await qloo.get_location_demographics(location_code=m_code)
            queries.append({
                "operation": "get_location_demographics",
                "endpoint": "/v2/insights",
                "market": m_name,
                "location_code": m_code,
            })
            raw_evidence_items.append({
                "type": "location",
                "market_name": m_name,
                "payload": loc_insights.model_dump(),
            })
        except QlooAPIError as exc:
            raise RuntimeError(
                f"Qloo location demographics query failed for '{m_code}': {exc}"
            ) from exc

        # 3. Cultural trend — use actual brand name, not hardcoded category
        trend_query = brand_name if brand_name != "Brand" else brand_category
        try:
            trend_insights = await qloo.get_taste_trends(
                entity_or_category=trend_query, interval_days=90
            )
            queries.append({
                "operation": "get_taste_trends",
                "endpoint": "/search",
                "market": m_name,
                "query": trend_query,
            })
            raw_evidence_items.append({
                "type": "trend",
                "market_name": m_name,
                "payload": trend_insights.model_dump(),
            })
        except QlooAPIError as exc:
            raise RuntimeError(
                f"Qloo taste trend query failed for '{trend_query}': {exc}"
            ) from exc

    await qloo.close()

    return {
        "research_queries": queries,
        "raw_evidence": raw_evidence_items,
        "current_step": "qloo_researcher",
        "step_history": ["qloo_researcher"],
    }
