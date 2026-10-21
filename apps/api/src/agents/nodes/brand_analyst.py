from typing import Any

from src.agents.state import AnalysisState


async def brand_analyst_node(state: AnalysisState) -> dict[str, Any]:
    """
    Brand & Product Analyst Node:
    Extracts the brand name and primary category as Qloo-resolvable proxies.
    Entity IDs are left as brand name strings so qloo_researcher can resolve
    them to real Qloo UUIDs via the /search endpoint.
    """
    brand_profile = state.get("brand_profile", {})
    brand_name = state.get("brand_name", brand_profile.get("name", "Brand"))
    category = brand_profile.get("category", brand_profile.get("domain", "lifestyle")).lower()

    # Primary proxy: the actual brand itself
    proxies: list[dict[str, Any]] = [
        {
            "entity_id": brand_name,  # string name — qloo_researcher resolves to real UUID
            "name": brand_name,
            "domain": category,
            "affinity_weight": 1.0,
        }
    ]

    # Add secondary proxy brands from profile if provided
    similar_brands = brand_profile.get("similar_brands", brand_profile.get("comparable_brands", []))
    for sb in (similar_brands or [])[:2]:
        sb_name = sb if isinstance(sb, str) else sb.get("name", "")
        if sb_name and sb_name.lower() != brand_name.lower():
            proxies.append({
                "entity_id": sb_name,
                "name": sb_name,
                "domain": category,
                "affinity_weight": 0.75,
            })

    return {
        "brand_proxies": proxies,
        "brand_category": category,
        "current_step": "brand_analyst",
        "step_history": ["brand_analyst"],
    }
