from typing import Any

from src.agents.state import AnalysisState


async def brand_analyst_node(state: AnalysisState) -> dict[str, Any]:
    """
    Brand & Product Analyst Node:
    Extracts high-dimensional cultural proxies (lifestyle brands, design genres,
    subcultural aesthetics) from brand profile.
    """
    brand_profile = state.get("brand_profile", {})
    brand_name = state.get("brand_name", "Brand")
    category = brand_profile.get("category", "apparel_lifestyle").lower()

    proxies: list[dict[str, Any]] = []
    if "streetwear" in category or "apparel" in category:
        proxies = [
            {
                "entity_id": "ent_st_wtaps",
                "name": "WTAPS",
                "domain": "fashion",
                "affinity_weight": 0.90,
            },
            {
                "entity_id": "ent_st_supreme",
                "name": "Supreme",
                "domain": "fashion",
                "affinity_weight": 0.85,
            },
            {
                "entity_id": "ent_st_palace",
                "name": "Palace Skateboards",
                "domain": "fashion",
                "affinity_weight": 0.88,
            },
        ]
    elif "coffee" in category or "dining" in category or "beverage" in category:
        proxies = [
            {
                "entity_id": "ent_cf_bluebottle",
                "name": "Blue Bottle",
                "domain": "dining",
                "affinity_weight": 0.88,
            },
            {
                "entity_id": "ent_cf_monmouth",
                "name": "Monmouth Coffee",
                "domain": "dining",
                "affinity_weight": 0.85,
            },
        ]
    else:
        proxies = [
            {
                "entity_id": f"ent_proxy_{brand_name.lower().replace(' ', '_')}",
                "name": brand_name,
                "domain": category,
                "affinity_weight": 0.80,
            }
        ]

    return {
        "brand_proxies": proxies,
        "current_step": "brand_analyst",
        "step_history": ["brand_analyst"],
    }
