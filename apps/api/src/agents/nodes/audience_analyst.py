from typing import Any

from src.agents.state import AnalysisState


async def audience_analyst_node(state: AnalysisState) -> dict[str, Any]:
    """
    Audience Demographics Analyst Node:
    Maps target customer persona profiles to quantitative age cohorts and psychographic tags.
    """
    audience_profile = state.get("audience_profile", {})
    age_cohort = audience_profile.get("primary_age", "20-35")
    psychographics = audience_profile.get(
        "psychographics", ["design-conscious", "urban-mobility", "early-adopter"]
    )

    specs = {
        "primary_cohort": age_cohort,
        "psychographics": psychographics,
        "taste_categories": ["fashion", "music", "dining", "print_media"],
        "target_density_threshold": 0.70,
    }

    return {
        "audience_specs": specs,
        "current_step": "audience_analyst",
        "step_history": ["audience_analyst"],
    }
