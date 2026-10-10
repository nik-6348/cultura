import uuid
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest

from src.integrations.jev.client import (
    JevServiceUnavailable,
    TypeSafeJevClient,
)
from src.integrations.jev.fallback import JevFallbackEngine
from src.integrations.jev.models import (
    JevAnswer,
    JevSystemOneResponse,
    MarketDecisionResult,
)
from src.integrations.jev.service import JevDecisionService


def test_tc_5_1_probability_sum_validation() -> None:
    """
    TC-5.1 (Unit): Jev response parser validates probability sum = 1.0 +/- 0.01.
    Succeeds for valid distributions, normalizes minor drift, and rejects invalid sums.
    """
    # 1. Exact 1.0 sum
    valid_ans = JevAnswer(
        type="choice",
        choice="launch",
        probabilities={"launch": 0.85, "adapt": 0.12, "avoid": 0.03},
        confidence=0.85,
    )
    assert sum(valid_ans.probabilities.values()) == pytest.approx(1.0, abs=1e-4)

    # 2. Minor float rounding drift within +/- 0.01 tolerance is normalized
    drift_ans = JevAnswer(
        type="choice",
        choice="adapt",
        probabilities={"launch": 0.495, "adapt": 0.498},  # sum = 0.993
        confidence=0.75,
    )
    # Drift within tolerance should normalize to approximately 1.0
    assert sum(drift_ans.probabilities.values()) == pytest.approx(1.0, abs=1e-3)

    # 3. Sum far below tolerance raises ValueError
    with pytest.raises(ValueError, match="Probabilities must sum to 1.0"):
        JevAnswer(
            type="choice",
            choice="avoid",
            probabilities={"launch": 0.20, "adapt": 0.20},  # sum = 0.40
            confidence=0.40,
        )

    # 4. Sum far above tolerance raises ValueError
    with pytest.raises(ValueError, match="Probabilities must sum to 1.0"):
        JevAnswer(
            type="choice",
            choice="avoid",
            probabilities={"launch": 0.70, "adapt": 0.60},  # sum = 1.30
            confidence=0.90,
        )


@pytest.mark.asyncio
async def test_tc_5_2_low_confidence_triggers_human_review() -> None:
    """
    TC-5.2 (Unit): Low confidence (< 0.70) properly routes state to human_review_required.
    Even if Jev returned human_review_required='no', a low posture confidence of 0.65
    must automatically trigger human_review_required=True.
    """
    mock_payload = {
        "code": 0,
        "message": "ok",
        "data": {
            "model": "typesafe/jev-1.13",
            "answers": {
                "market_decision": {
                    "type": "choice",
                    "choice": "launch",
                    "probabilities": {"launch": 0.65, "adapt": 0.35, "avoid": 0.0},
                    "confidence": 0.65,  # < 0.70 Low confidence!
                },
                "evidence_sufficiency": {
                    "type": "choice",
                    "choice": "sufficient",
                    "probabilities": {"sufficient": 0.90, "insufficient": 0.10},
                    "confidence": 0.90,
                },
                "human_review_required": {
                    "type": "choice",
                    # Even though Jev answered "no", confidence < 0.70 must escalate!
                    "choice": "no",
                    "probabilities": {"yes": 0.10, "no": 0.90},
                    "confidence": 0.90,
                },
            },
            "latency_ms": 350,
        },
    }

    mock_client = AsyncMock(spec=TypeSafeJevClient)
    mock_client.predict.return_value = JevSystemOneResponse.model_validate(mock_payload)

    service = JevDecisionService(client=mock_client)
    decision: MarketDecisionResult = await service.evaluate_market(
        market_name="London",
        overall_score=0.72,
        coverage_ratio=0.85,
        brand_name="Streetwear Nordic",
    )

    # Must escalate to human review because posture confidence 0.65 < 0.70
    assert decision.posture == "launch"
    assert decision.posture_confidence == 0.65
    assert decision.human_review_required is True


@pytest.mark.asyncio
async def test_tc_5_3_simulated_jev_timeout_activates_deterministic_fallback() -> None:
    """
    TC-5.3 (Integration): Simulated Jev timeout (mock 504 or TimeoutException)
    activates deterministic fallback seamlessly without failing the run.
    """
    mock_client = AsyncMock(spec=TypeSafeJevClient)
    # Simulate HTTP 504 / gateway timeout
    mock_client.predict.side_effect = JevServiceUnavailable(
        "Jev API gateway/server error (504): Gateway Timeout"
    )

    service = JevDecisionService(client=mock_client)
    # Evaluate high scoring market
    decision = await service.evaluate_market(
        market_name="Tokyo",
        overall_score=Decimal("0.8250"),
        coverage_ratio=Decimal("0.8800"),
        brand_name="Nordic Apparel",
    )

    # Fallback must be active, is_fallback=True, model_name='deterministic-fallback-v1'
    assert decision.is_fallback is True
    assert decision.model_name == "deterministic-fallback-v1"
    assert decision.posture == "launch"
    assert decision.evidence_sufficiency == "sufficient"
    assert decision.human_review_required is False
    assert decision.posture_confidence >= 0.75
    assert sum(decision.posture_probabilities.values()) == pytest.approx(1.0, abs=1e-4)


def test_deterministic_fallback_engine_thresholds() -> None:
    """Test deterministic fallback thresholds across launch, adapt, and avoid."""
    # 1. High score -> Launch
    d_launch = JevFallbackEngine.evaluate(
        market_name="London",
        overall_score=0.81,
        coverage_ratio=0.90,
    )
    assert d_launch.posture == "launch"
    assert d_launch.evidence_sufficiency == "sufficient"
    assert d_launch.human_review_required is False

    # 2. Moderate score -> Adapt
    d_adapt = JevFallbackEngine.evaluate(
        market_name="Berlin",
        overall_score=0.62,
        coverage_ratio=0.75,
    )
    assert d_adapt.posture == "adapt"
    assert d_adapt.evidence_sufficiency == "sufficient"
    assert d_adapt.human_review_required is False

    # 3. Low score -> Avoid
    d_avoid = JevFallbackEngine.evaluate(
        market_name="Oslo",
        overall_score=0.42,
        coverage_ratio=0.70,
    )
    assert d_avoid.posture == "avoid"
    assert d_avoid.human_review_required is True

    # 4. Low data coverage (< 0.60) triggers insufficient and review required
    d_low_cov = JevFallbackEngine.evaluate(
        market_name="Madrid",
        overall_score=0.85,
        coverage_ratio=0.45,  # Missing signals!
    )
    assert d_low_cov.evidence_sufficiency == "insufficient"
    assert d_low_cov.human_review_required is True


def test_service_to_db_records_conversion() -> None:
    """Test conversion of MarketDecisionResult to database ORM models."""
    res = JevFallbackEngine.evaluate(
        market_name="London",
        overall_score=0.80,
        coverage_ratio=0.85,
    )
    run_id = uuid.uuid4()
    records = JevDecisionService.to_db_records(res, run_id=run_id)

    assert len(records) == 3
    q_keys = [r.question_key for r in records]
    assert "London:market_decision" in q_keys
    assert "London:evidence_sufficiency" in q_keys
    assert "London:human_review_required" in q_keys

    for r in records:
        assert r.run_id == run_id
        assert r.confidence > 0.0
        assert r.decision_value in ("launch", "sufficient", "no")
        assert isinstance(r.probabilities_json, dict)
