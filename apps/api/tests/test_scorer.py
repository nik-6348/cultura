import uuid
from decimal import Decimal

import pytest

from src.db.models.evidence import Evidence
from src.scorer.engine import CompatibilityScorer
from src.scorer.models import ScoringConfiguration
from src.scripts.golden_demo_1 import run_golden_demo


def _make_sample_evidence(market_name: str) -> list[Evidence]:
    run_id = uuid.uuid4()
    project_id = uuid.uuid4()
    return [
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="brand_affinity",
            market_name=market_name,
            entity_ref="qloo:fashion:ent_wtaps",
            value_numeric=0.85,
            confidence=0.90,
            explanation="Strong affinity with Japanese streetwear.",
        ),
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="locality_density",
            market_name=market_name,
            entity_ref="qloo:location:GB-LND",
            value_numeric=0.80,
            confidence=0.95,
            explanation="High density of lifestyle and skate venues.",
        ),
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="audience_overlap",
            market_name=market_name,
            entity_ref="qloo:audience:demo",
            value_numeric=0.78,
            confidence=0.88,
            explanation="Urban 20-35 demographic alignment.",
        ),
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="cultural_momentum",
            market_name=market_name,
            entity_ref="qloo:trend:streetwear",
            value_numeric=0.69,
            confidence=0.85,
            explanation="Accelerating cultural velocity.",
        ),
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="venue_anchor",
            market_name=market_name,
            entity_ref="qloo:venue:dsm",
            value_numeric=0.92,
            confidence=0.90,
            explanation="Key anchor retail store fit.",
        ),
    ]


def test_score_calculation_determinism_10k_runs() -> None:
    """TC-3.1: 10,000 runs on identical evidence yield identical results to 4 decimal places."""
    scorer = CompatibilityScorer()
    evidence = _make_sample_evidence("London")

    # Baseline score
    baseline = scorer.calculate_market_score("London", evidence)
    expected_score = baseline.overall_score

    for _ in range(10000):
        res = scorer.calculate_market_score("London", evidence)
        assert res.overall_score == expected_score


def test_missing_data_penalty_triggers_under_threshold() -> None:
    """TC-3.2: Missing data penalty triggers when coverage ratio < 0.60."""
    scorer = CompatibilityScorer(config=ScoringConfiguration(expected_evidence_count=10))
    run_id = uuid.uuid4()
    project_id = uuid.uuid4()

    # Only 2 evidence points out of 10 expected -> coverage ratio = 0.20 (< 0.60)
    sparse_evidence = [
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="brand_affinity",
            market_name="Oslo",
            value_numeric=0.90,
            confidence=0.90,
            explanation="Sparse single affinity signal.",
        ),
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="locality_density",
            market_name="Oslo",
            value_numeric=0.80,
            confidence=0.90,
            explanation="Sparse single density signal.",
        ),
    ]

    score = scorer.calculate_market_score("Oslo", sparse_evidence)

    assert score.coverage_ratio == 0.20
    assert score.confidence_tier == "low"
    assert score.requires_human_review is True
    # Overall score must be capped at coverage ratio (0.20)
    assert score.overall_score <= 0.20


def test_edge_case_zero_affinities_and_divide_by_zero_safety() -> None:
    """TC-3.3: All affinities 0.0 produce valid score without divide-by-zero error."""
    scorer = CompatibilityScorer()
    run_id = uuid.uuid4()
    project_id = uuid.uuid4()

    zero_evidence = [
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="brand_affinity",
            market_name="Antarctica",
            value_numeric=0.0,
            confidence=0.0,  # Zero confidence
            explanation="Zero signal.",
        ),
        Evidence(
            id=uuid.uuid4(),
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="locality_density",
            market_name="Antarctica",
            value_numeric=0.0,
            confidence=0.0,
            explanation="Zero density.",
        ),
    ]

    # Empty evidence list safety
    empty_score = scorer.calculate_market_score("EmptyMarket", [])
    assert empty_score.overall_score == 0.0
    assert empty_score.requires_human_review is True

    # Zero values safety
    zero_score = scorer.calculate_market_score("Antarctica", zero_evidence)
    assert zero_score.overall_score >= 0.0
    assert not isinstance(zero_score.overall_score, complex)


def test_scoring_weights_validation_sums_to_one() -> None:
    """TC-3.4: Dimension weights must strictly sum to 1.0."""
    # Valid default config
    cfg = ScoringConfiguration()
    total = (
        cfg.w_brand_affinity
        + cfg.w_category_ecosystem
        + cfg.w_audience_overlap
        + cfg.w_cultural_momentum
        + cfg.w_evidence_coverage
    )
    assert total == Decimal("1.00")

    # Invalid weights sum must raise ValueError
    with pytest.raises(ValueError) as exc:
        ScoringConfiguration(w_evidence_coverage=Decimal("0.50"))
    assert "must sum to 1.0000" in str(exc.value)


@pytest.mark.asyncio
async def test_golden_demo_1_e2e_pipeline() -> None:
    """TC-3.5: End-to-end golden demo produces market rankings for London vs Berlin."""
    result = await run_golden_demo()

    assert "winner_market" in result
    assert result["winner_market"] in ("London", "Berlin")
    assert len(result["ranked_markets"]) == 2
    assert result["ranked_markets"][0]["overall_score"] > 0.0
    assert "London" in result["comparative_matrix"]
    assert "Berlin" in result["comparative_matrix"]
    assert "brand_affinity" in result["comparative_matrix"]["London"]
    assert result["score_margin"] >= 0.0
