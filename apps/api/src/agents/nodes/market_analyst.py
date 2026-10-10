from typing import Any

from src.agents.state import AnalysisState


async def market_analyst_node(state: AnalysisState) -> dict[str, Any]:
    """
    Market Context Analyst Node:
    Formulates localized research specifications and subcultural hubs for each market.
    """
    candidate_markets = state.get("candidate_markets", [])
    specs: list[dict[str, Any]] = []

    for m in candidate_markets:
        m_name = m["name"]
        m_code = m.get("code", "GLOBAL")
        specs.append(
            {
                "market_name": m_name,
                "location_code": m_code,
                "target_clusters": (
                    ["Shoreditch", "Soho", "Hackney"]
                    if "london" in m_name.lower()
                    else (["Mitte", "Kreuzberg"] if "berlin" in m_name.lower() else ["Central"])
                ),
                "priority_domains": ["fashion", "dining", "music"],
            }
        )

    return {
        "market_specs": specs,
        "current_step": "market_analyst",
        "step_history": ["market_analyst"],
    }
