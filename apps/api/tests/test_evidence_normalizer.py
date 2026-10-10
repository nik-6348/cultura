import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.project import Project
from src.db.models.run import AnalysisRun
from src.db.models.user import User
from src.db.models.workspace import Workspace, WorkspaceMember
from src.integrations.qloo.models import (
    QlooAffinityItem,
    QlooAudienceInsights,
    QlooLocationInsights,
    QlooTrendInsights,
)
from src.services.evidence_normalizer import EvidenceNormalizer


@pytest.mark.asyncio
async def test_evidence_normalizer_contract(db_session: AsyncSession) -> None:
    """TC-2.4: Evidence Normalizer maps raw Qloo payloads into canonical Evidence ORM models."""
    # 1. Setup workspace, project, and analysis run
    user = User(
        firebase_uid=f"fuid_{uuid.uuid4().hex[:8]}",
        email=f"eval_{uuid.uuid4().hex[:6]}@cultura.local",
        name="Eval Lead",
    )
    db_session.add(user)
    await db_session.flush()

    workspace = Workspace(name="Test Normalizer WS", owner_user_id=user.id)
    db_session.add(workspace)
    await db_session.flush()

    member = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner")
    db_session.add(member)
    await db_session.flush()

    project = Project(
        workspace_id=workspace.id,
        name="Scandinavian Denim Expansion",
        objective="Analyze Stockholm vs Oslo",
        created_by=user.id,
    )
    db_session.add(project)
    await db_session.flush()

    run = AnalysisRun(
        project_id=project.id,
        workspace_id=workspace.id,
        created_by=user.id,
        status="running",
        input_snapshot_json={},
    )
    db_session.add(run)
    await db_session.flush()

    # 2. Test Audience Normalization
    audience_insights = QlooAudienceInsights(
        query_entities=["ent_acne_studios"],
        affinities=[
            QlooAffinityItem(
                entity_id="ent_specialty_coffee",
                name="Nordic Specialty Coffee",
                category="dining",
                affinity_score=0.885,
                relevance=0.92,
            ),
            QlooAffinityItem(
                entity_id="ent_ambient_techno",
                name="Deep Ambient Techno",
                category="music",
                affinity_score=0.742,
                relevance=0.85,
            ),
        ],
        top_categories=["dining", "music"],
    )

    norm_affinities = EvidenceNormalizer.normalize_audience_insights(
        insights=audience_insights,
        run_id=run.id,
        project_id=project.id,
        market_name="Stockholm",
        request_hash="hash_aud_123",
        latency_ms=145,
    )
    assert len(norm_affinities) == 2
    ev1 = norm_affinities[0]
    assert ev1.source == "qloo"
    assert ev1.kind == "brand_affinity"
    assert ev1.market_name == "Stockholm"
    assert ev1.entity_ref == "qloo:dining:ent_specialty_coffee"
    assert ev1.value_numeric == 0.885
    assert "88.5%" in ev1.explanation
    assert ev1.confidence == 0.92
    assert ev1.source_metadata_json["request_hash"] == "hash_aud_123"

    # 3. Test Location Normalization
    location_insights = QlooLocationInsights(
        location_code="SE-STO",
        location_name="Stockholm",
        density_score=0.81,
        cultural_clusters=["Södermalm", "Östermalm"],
        top_venues=[{"name": "Nitty Gritty", "category": "menswear", "affinity": 0.94}],
    )
    norm_locations = EvidenceNormalizer.normalize_location_insights(
        insights=location_insights,
        run_id=run.id,
        project_id=project.id,
        market_name="Stockholm",
        request_hash="hash_loc_456",
        latency_ms=180,
    )
    assert len(norm_locations) == 2  # 1 density record + 1 venue anchor
    loc_density = norm_locations[0]
    assert loc_density.kind == "locality_density"
    assert loc_density.value_numeric == 0.81
    assert "Södermalm" in loc_density.explanation

    # 4. Test Trend Normalization
    trend_insights = QlooTrendInsights(
        entity_or_category="sustainable_denim",
        interval_days=90,
        momentum_velocity=0.45,
        trajectory="accelerating",
    )
    norm_trends = EvidenceNormalizer.normalize_trend_insights(
        insights=trend_insights,
        run_id=run.id,
        project_id=project.id,
        market_name="Stockholm",
        request_hash="hash_tr_789",
        latency_ms=120,
    )
    assert len(norm_trends) == 1
    trend_ev = norm_trends[0]
    assert trend_ev.kind == "cultural_momentum"
    assert trend_ev.value_text == "accelerating"
    assert trend_ev.value_numeric == 0.725  # (0.45 + 1.0) / 2.0

    # 5. Persist batch and verify deduplication
    all_evidence = norm_affinities + norm_locations + norm_trends
    persisted = await EvidenceNormalizer.persist_evidence_batch(db_session, all_evidence)
    assert len(persisted) == 5

    # Re-persisting the same batch should deduplicate and return 0 new inserts
    re_persisted = await EvidenceNormalizer.persist_evidence_batch(db_session, all_evidence)
    assert len(re_persisted) == 0
