import uuid

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.evidence import QlooRequest
from src.integrations.qloo.client import QlooClient
from src.services.qloo_service import QlooService


@pytest.mark.asyncio
async def test_qloo_service_cache_hit_bypasses_network(db_session: AsyncSession) -> None:
    """
    TC-2.5: Verify that the first request records to qloo_requests,
    and subsequent identical request hits cache and bypasses external HTTP call.
    """
    network_call_count = 0

    mock_qloo_response = {
        "affinities": [
            {
                "entity_id": "ent_vinyl_shoreditch",
                "name": "Vinyl Independent Records",
                "category": "music",
                "affinity_score": 0.89,
                "relevance": 0.95,
            }
        ],
        "top_categories": ["music", "fashion"],
        "demographic_skew": {"age_20_29": 0.45},
    }

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        nonlocal network_call_count
        network_call_count += 1
        return httpx.Response(200, json=mock_qloo_response)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        qloo_client = QlooClient(api_key="valid_key", http_client=http_client)
        service = QlooService(client=qloo_client)

        seed = [f"ent_seed_{uuid.uuid4().hex[:8]}"]
        categories = ["music", "fashion"]
        location = "London"

        # 1. First execution -> CACHE MISS (Triggers 1 outbound HTTP call)
        insights_1, cache_hit_1, hash_1 = await service.get_audience_affinities(
            db=db_session,
            seed_entities=seed,
            target_categories=categories,
            location=location,
        )
        assert cache_hit_1 is False
        assert network_call_count == 1
        assert len(insights_1.affinities) == 1
        assert insights_1.affinities[0].name == "Vinyl Independent Records"

        # Verify row exists in qloo_requests table
        stmt = select(QlooRequest).where(QlooRequest.request_hash == hash_1)
        res = await db_session.execute(stmt)
        record = res.scalar_one_or_none()
        assert record is not None
        assert record.operation == "get_audience_affinities"
        assert record.cache_hit is False

        # 2. Second execution with identical parameters -> CACHE HIT!
        insights_2, cache_hit_2, hash_2 = await service.get_audience_affinities(
            db=db_session,
            seed_entities=seed,
            target_categories=categories,
            location=location,
        )
        assert cache_hit_2 is True
        assert hash_2 == hash_1
        # Crucial check: network_call_count must STILL be 1 (no outbound request made!)
        assert network_call_count == 1
        assert len(insights_2.affinities) == 1
        assert insights_2.affinities[0].name == "Vinyl Independent Records"


@pytest.mark.asyncio
async def test_qloo_service_synthetic_mode_and_caching(db_session: AsyncSession) -> None:
    """Verify synthetic mode operates seamlessly when no API key is provided and caches results."""
    # When api_key is empty, force_synthetic is True
    client = QlooClient(api_key="", force_synthetic=True)
    service = QlooService(client=client)
    unique_loc = f"LOC-{uuid.uuid4().hex[:8].upper()}"

    # 1. Location demographics call (Cache Miss)
    insights, cache_hit, req_hash = await service.get_location_demographics(
        db=db_session,
        location_code=unique_loc,
    )
    assert cache_hit is False
    assert insights.density_score > 0.0

    # 2. Subsequent call with same location code (Cache Hit)
    insights_cached, cache_hit_2, req_hash_2 = await service.get_location_demographics(
        db=db_session,
        location_code=unique_loc,
    )
    assert cache_hit_2 is True
    assert req_hash_2 == req_hash
    assert insights_cached.density_score == insights.density_score
