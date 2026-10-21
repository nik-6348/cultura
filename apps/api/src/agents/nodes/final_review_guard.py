from typing import Any

from src.agents.state import AnalysisState


async def final_review_guard_node(state: AnalysisState) -> dict[str, Any]:
    """
    Final Audit & Fact-Check Guard Node:
    Enforces strict zero-hallucination ground truth verification.
    Every recommendation and claim must reference existing Evidence IDs.
    """
    recommendations = state.get("strategy_recommendations", [])
    normalized_evidence = state.get("normalized_evidence", [])
    valid_evidence_ids = {str(ev["id"]) for ev in normalized_evidence}

    violations: list[str] = []
    audited_count = 0

    for idx, rec in enumerate(recommendations, start=1):
        audited_count += 1
        supporting_ids = rec.get("supporting_evidence_ids", [])

        if not supporting_ids:
            violations.append(
                f"Recommendation #{idx} ('{rec.get('title')}') has ZERO backing evidence citations."
            )
            continue

        for eid in supporting_ids:
            if str(eid) not in valid_evidence_ids:
                violations.append(
                    f"Recommendation #{idx} cites unknown or ungrounded evidence_id: '{eid}'."
                )

    is_verified = len(violations) == 0
    final_status = "completed" if is_verified else "requires_review"

    audit_report = {
        "is_verified": is_verified,
        "audited_recommendations_count": audited_count,
        "total_citations_checked": sum(
            len(r.get("supporting_evidence_ids", [])) for r in recommendations
        ),
        "violations": violations,
        "verdict": "PASSED" if is_verified else "FAILED",
    }

    result: dict[str, Any] = {
        "audit_report": audit_report,
        "current_step": "final_review_guard",
        "step_history": ["final_review_guard"],
        "status": final_status,
    }

    if not is_verified:
        result["errors"] = violations

    return result
