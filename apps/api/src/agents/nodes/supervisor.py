from typing import Any

from src.agents.state import AnalysisState


async def supervisor_node(state: AnalysisState) -> dict[str, Any]:
    """
    Supervisor Agent Node:
    Decomposes analysis objective into discrete market research tasks.
    Validates candidate markets and initializes workflow plan.
    """
    candidate_markets = state.get("candidate_markets", [])
    brand_name = state.get("brand_name", "Brand")
    objective = state.get("objective", "Evaluate market entry")

    if not candidate_markets:
        # Fallback default candidate markets if none specified
        candidate_markets = [
            {"name": "London", "code": "GB-LND"},
            {"name": "Berlin", "code": "DE-BER"},
        ]

    plan: list[dict[str, Any]] = []
    for m in candidate_markets:
        plan.append(
            {
                "market_name": m["name"],
                "location_code": m.get("code", "UNKNOWN"),
                "objective": objective,
                "tasks": [
                    f"Extract {brand_name} cultural proxies for {m['name']}",
                    f"Query audience taste correlations in {m['name']}",
                    f"Evaluate {m['name']} venue ecosystem and trend velocity",
                ],
                "status": "planned",
            }
        )

    return {
        "candidate_markets": candidate_markets,
        "execution_plan": plan,
        "current_step": "supervisor",
        "step_history": ["supervisor"],
        "status": "running",
    }
