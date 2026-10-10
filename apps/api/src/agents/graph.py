from typing import Any

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from src.agents.nodes import (
    audience_analyst_node,
    brand_analyst_node,
    evidence_normalizer_node,
    final_review_guard_node,
    jev_decision_gate_node,
    market_analyst_node,
    qloo_researcher_node,
    scorer_node,
    strategy_node,
    supervisor_node,
)
from src.agents.state import AnalysisState


def create_analysis_graph(checkpointer: Any = None) -> Any:
    """
    Constructs and compiles the bounded LangGraph DAG for Cultura multi-agent analysis.

    Flow:
    START -> supervisor -> brand_analyst -> market_analyst -> audience_analyst ->
    qloo_researcher -> evidence_normalizer -> scorer -> jev_decision_gate ->
    strategy -> final_review_guard -> END
    """
    workflow = StateGraph(AnalysisState)

    # 1. Register nodes
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("brand_analyst", brand_analyst_node)
    workflow.add_node("market_analyst", market_analyst_node)
    workflow.add_node("audience_analyst", audience_analyst_node)
    workflow.add_node("qloo_researcher", qloo_researcher_node)
    workflow.add_node("evidence_normalizer", evidence_normalizer_node)
    workflow.add_node("scorer", scorer_node)
    workflow.add_node("jev_decision_gate", jev_decision_gate_node)
    workflow.add_node("strategy", strategy_node)
    workflow.add_node("final_review_guard", final_review_guard_node)

    # 2. Add sequential deterministic edges
    workflow.add_edge(START, "supervisor")
    workflow.add_edge("supervisor", "brand_analyst")
    workflow.add_edge("brand_analyst", "market_analyst")
    workflow.add_edge("market_analyst", "audience_analyst")
    workflow.add_edge("audience_analyst", "qloo_researcher")
    workflow.add_edge("qloo_researcher", "evidence_normalizer")
    workflow.add_edge("evidence_normalizer", "scorer")
    workflow.add_edge("scorer", "jev_decision_gate")
    workflow.add_edge("jev_decision_gate", "strategy")
    workflow.add_edge("strategy", "final_review_guard")
    workflow.add_edge("final_review_guard", END)

    # 3. Compile with checkpoint saver
    saver = checkpointer if checkpointer is not None else MemorySaver()
    return workflow.compile(checkpointer=saver)
