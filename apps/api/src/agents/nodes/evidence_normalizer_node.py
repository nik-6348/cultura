import uuid
from typing import Any

from src.agents.state import AnalysisState
from src.integrations.qloo.models import (
    QlooAudienceInsights,
    QlooLocationInsights,
    QlooTrendInsights,
)
from src.services.evidence_normalizer import EvidenceNormalizer


async def evidence_normalizer_node(state: AnalysisState) -> dict[str, Any]:
    """
    Evidence Normalizer Node:
    Transforms raw Qloo payloads into canonical, citable Evidence records
    with unique IDs, confidence scores, and explanations.
    """
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

    raw_evidence = state.get("raw_evidence", [])
    normalized_items: list[dict[str, Any]] = []

    for item in raw_evidence:
        ev_type = item.get("type")
        market_name = item.get("market_name", "Global")
        payload = item.get("payload", {})

        if ev_type == "audience":
            insights = QlooAudienceInsights(**payload)
            orm_items = EvidenceNormalizer.normalize_audience_insights(
                insights=insights,
                run_id=run_id,
                project_id=project_id,
                market_name=market_name,
                request_hash=f"req_{market_name.lower()}_aud",
            )
            for oi in orm_items:
                normalized_items.append(
                    {
                        "id": str(oi.id),
                        "kind": oi.kind,
                        "market_name": oi.market_name,
                        "entity_ref": oi.entity_ref,
                        "value_numeric": oi.value_numeric,
                        "explanation": oi.explanation,
                        "confidence": oi.confidence,
                        "source": oi.source,
                        "source_metadata_json": oi.source_metadata_json,
                    }
                )

        elif ev_type == "location":
            loc_insights = QlooLocationInsights(**payload)
            orm_items = EvidenceNormalizer.normalize_location_insights(
                insights=loc_insights,
                run_id=run_id,
                project_id=project_id,
                market_name=market_name,
                request_hash=f"req_{market_name.lower()}_loc",
            )
            for oi in orm_items:
                normalized_items.append(
                    {
                        "id": str(oi.id),
                        "kind": oi.kind,
                        "market_name": oi.market_name,
                        "entity_ref": oi.entity_ref,
                        "value_numeric": oi.value_numeric,
                        "explanation": oi.explanation,
                        "confidence": oi.confidence,
                        "source": oi.source,
                        "source_metadata_json": oi.source_metadata_json,
                    }
                )

        elif ev_type == "trend":
            tr_insights = QlooTrendInsights(**payload)
            orm_items = EvidenceNormalizer.normalize_trend_insights(
                insights=tr_insights,
                run_id=run_id,
                project_id=project_id,
                market_name=market_name,
                request_hash=f"req_{market_name.lower()}_trend",
            )
            for oi in orm_items:
                normalized_items.append(
                    {
                        "id": str(oi.id),
                        "kind": oi.kind,
                        "market_name": oi.market_name,
                        "entity_ref": oi.entity_ref,
                        "value_numeric": oi.value_numeric,
                        "value_text": oi.value_text,
                        "explanation": oi.explanation,
                        "confidence": oi.confidence,
                        "source": oi.source,
                        "source_metadata_json": oi.source_metadata_json,
                    }
                )

    return {
        "normalized_evidence": normalized_items,
        "current_step": "evidence_normalizer",
        "step_history": ["evidence_normalizer"],
    }
