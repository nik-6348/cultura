import operator
from typing import Annotated, Any, TypedDict


class AnalysisState(TypedDict, total=False):
    """
    Shared mutable state dictionary across all LangGraph multi-agent nodes.
    Uses operator.add on collection fields for deterministic append-reduction.
    """

    # Identifiers & Context
    run_id: str
    project_id: str
    workspace_id: str
    brand_name: str
    objective: str
    candidate_markets: list[dict[str, str]]  # [{"name": "London", "code": "GB-LND"}, ...]
    brand_profile: dict[str, Any]
    audience_profile: dict[str, Any]

    # Planning & Analysis Outputs
    execution_plan: list[dict[str, Any]]
    brand_proxies: list[dict[str, Any]]
    brand_category: str
    market_specs: list[dict[str, Any]]
    audience_specs: dict[str, Any]

    # Evidence Accumulation (Appended via operator.add reducer)
    research_queries: Annotated[list[dict[str, Any]], operator.add]
    raw_evidence: Annotated[list[dict[str, Any]], operator.add]
    normalized_evidence: Annotated[list[dict[str, Any]], operator.add]

    # Scoring & Decision Outputs
    market_scores: dict[str, Any]
    market_ranking: dict[str, Any]
    decisions: dict[str, Any]

    # Strategy & Guardrail Verification
    strategy_recommendations: list[dict[str, Any]]
    audit_report: dict[str, Any]

    # Execution Lifecycle
    current_step: str
    step_history: Annotated[list[str], operator.add]
    errors: Annotated[list[str], operator.add]
    status: str  # "queued" | "running" | "completed" | "failed" | "requires_review"
