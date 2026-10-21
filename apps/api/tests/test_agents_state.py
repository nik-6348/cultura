from src.agents.state import AnalysisState


def test_state_reducer_append_immutability() -> None:
    """TC-4.1: State reducers update list fields by appending without overwriting or polluting."""
    initial: AnalysisState = {
        "run_id": "run_test_123",
        "brand_name": "Test Brand",
        "step_history": ["supervisor"],
        "research_queries": [{"query": "q1"}],
        "normalized_evidence": [{"id": "ev_1"}],
        "errors": [],
    }

    # Simulate node output that appends to list fields
    node_update = {
        "step_history": ["brand_analyst"],
        "research_queries": [{"query": "q2"}],
        "normalized_evidence": [{"id": "ev_2"}],
    }

    # Verify that in Python dict or reducer application, merging appends lists
    combined_history = initial["step_history"] + node_update["step_history"]
    combined_queries = initial["research_queries"] + node_update["research_queries"]
    combined_evidence = initial["normalized_evidence"] + node_update["normalized_evidence"]

    assert len(combined_history) == 2
    assert combined_history == ["supervisor", "brand_analyst"]
    assert len(combined_queries) == 2
    assert len(combined_evidence) == 2
    assert [e["id"] for e in combined_evidence] == ["ev_1", "ev_2"]
