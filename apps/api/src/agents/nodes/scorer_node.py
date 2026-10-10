import uuid
from typing import Any

from src.agents.state import AnalysisState
from src.db.models.evidence import Evidence
from src.scorer.engine import CompatibilityScorer


async def scorer_node(state: AnalysisState) -> dict[str, Any]:
    """
    Deterministic Compatibility Scorer Node:
    Computes 5-dimension cultural compatibility scores and comparative rankings.
    """
    normalized_evidence = state.get("normalized_evidence", [])
    raw_run_id = state.get("run_id")
    raw_proj_id = state.get("project_id")
    try:
        run_id = uuid.UUID(str(raw_run_id)) if raw_run_id else uuid.uuid4()
    except Exception:
        run_id = uuid.uuid4()
    try:
        project_id = uuid.UUID(str(raw_proj_id)) if raw_proj_id else uuid.uuid4()
    except Exception:
        project_id = uuid.uuid4()

    candidate_markets = state.get("candidate_markets", [])
    # Reconstitute into Evidence instances for scorer
    market_ev_map: dict[str, list[Evidence]] = {m["name"]: [] for m in candidate_markets}

    for item in normalized_evidence:
        m_name = item.get("market_name")
        if m_name and m_name in market_ev_map:
            raw_id = item.get("id")
            is_valid_uuid = isinstance(raw_id, str) and raw_id != "None"
            ev_id = uuid.UUID(raw_id) if is_valid_uuid else uuid.uuid4()
            ev = Evidence(
                id=ev_id,
                run_id=run_id,
                project_id=project_id,
                source=item.get("source", "qloo"),
                kind=item["kind"],
                market_name=item.get("market_name"),
                entity_ref=item.get("entity_ref"),
                value_numeric=item.get("value_numeric"),
                value_text=item.get("value_text"),
                explanation=item["explanation"],
                confidence=item.get("confidence", 1.0),
                source_metadata_json=item.get("source_metadata_json", {}),
            )
            market_ev_map[m_name].append(ev)

    scorer = CompatibilityScorer()
    ranking_res = scorer.rank_markets(
        market_evidence_map=market_ev_map,
        project_id=project_id,
        run_id=run_id,
        market_location_map={m["name"]: m.get("code", "GLOBAL") for m in candidate_markets},
    )

    scores_dict = {s.market_name: s.model_dump(mode="json") for s in ranking_res.ranked_markets}

    return {
        "market_scores": scores_dict,
        "market_ranking": ranking_res.model_dump(mode="json"),
        "current_step": "scorer",
        "step_history": ["scorer"],
    }
