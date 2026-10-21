import uuid

import pytest

from src.agents.graph import create_analysis_graph
from src.agents.nodes.final_review_guard import final_review_guard_node
from src.agents.state import AnalysisState


@pytest.mark.asyncio
async def test_agent_dag_end_to_end_execution() -> None:
    """Test full LangGraph DAG execution through all 9 sequential agent nodes."""
    graph = create_analysis_graph()

    initial_state: AnalysisState = {
        "run_id": str(uuid.uuid4()),
        "project_id": str(uuid.uuid4()),
        "workspace_id": str(uuid.uuid4()),
        "brand_name": "Nordic Functional Outerwear",
        "objective": "Evaluate London vs Berlin entry priority",
        "candidate_markets": [
            {"name": "London", "code": "GB-LND"},
            {"name": "Berlin", "code": "DE-BER"},
        ],
        "brand_profile": {"category": "streetwear_outerwear", "price_point": "premium"},
        "audience_profile": {"primary_age": "22-38"},
        "step_history": [],
        "research_queries": [],
        "raw_evidence": [],
        "normalized_evidence": [],
        "errors": [],
    }

    final_state = await graph.ainvoke(
        initial_state,
        config={"configurable": {"thread_id": "test_dag_thread"}},
    )

    # 1. Assert status reached completed
    assert final_state["status"] == "completed"

    # 2. Assert step history contains all nodes
    history = final_state["step_history"]
    assert "supervisor" in history
    assert "brand_analyst" in history
    assert "market_analyst" in history
    assert "audience_analyst" in history
    assert "qloo_researcher" in history
    assert "evidence_normalizer" in history
    assert "scorer" in history
    assert "jev_decision_gate" in history
    assert "strategy" in history
    assert "final_review_guard" in history

    # 3. Assert evidence, ranking, and decisions
    assert len(final_state["normalized_evidence"]) > 0
    assert "winner_market" in final_state["market_ranking"]
    assert final_state["market_ranking"]["winner_market"] in ("London", "Berlin")
    assert "market_decisions" in final_state["decisions"]

    # 4. Assert strategy generated with verified audit report
    assert len(final_state["strategy_recommendations"]) > 0
    assert final_state["audit_report"]["is_verified"] is True
    assert final_state["audit_report"]["verdict"] == "PASSED"


@pytest.mark.asyncio
async def test_final_review_guard_fails_on_unsupported_citation() -> None:
    """TC-4.4: FinalReviewGuard fails when a recommendation cites a non-existent evidence_id."""
    state_with_fake_citation: AnalysisState = {
        "normalized_evidence": [{"id": "real_evidence_id_101", "kind": "brand_affinity"}],
        "strategy_recommendations": [
            {
                "title": "Unverified Partnership",
                "action": "Open luxury pop-up store in central plaza.",
                "supporting_evidence_ids": ["FAKE_UNGROUNDED_ID_999"],  # Invalid!
            }
        ],
        "step_history": [],
        "errors": [],
    }

    result = await final_review_guard_node(state_with_fake_citation)

    assert result["status"] == "requires_review"
    assert result["audit_report"]["is_verified"] is False
    assert result["audit_report"]["verdict"] == "FAILED"
    assert len(result["errors"]) == 1
    assert "FAKE_UNGROUNDED_ID_999" in result["errors"][0]
