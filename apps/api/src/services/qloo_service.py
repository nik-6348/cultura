import time
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.evidence import QlooRequest
from src.integrations.qloo.client import QlooClient
from src.integrations.qloo.hasher import compute_request_hash
from src.integrations.qloo.models import (
    QlooAudienceInsights,
    QlooEntity,
    QlooLocationInsights,
    QlooTrendInsights,
)


class QlooService:
    """
    Service layer providing database-backed request caching and audit ledger
    for all Qloo API calls.
    """

    def __init__(self, client: QlooClient | None = None) -> None:
        self.client = client or QlooClient()

    async def resolve_entities(
        self,
        db: AsyncSession,
        query: str,
        domain: str | None = None,
        limit: int = 10,
        run_id: uuid.UUID | None = None,
    ) -> tuple[list[QlooEntity], bool, str]:
        """
        Resolve entities with database caching.
        Returns (entities, is_cache_hit, request_hash).
        """
        endpoint = "/v2/insights/entities"
        params: dict[str, Any] = {"query": query, "limit": limit}
        if domain:
            params["domain"] = domain

        req_hash = compute_request_hash(endpoint, method="GET", params=params)

        # 1. Check cache in database
        stmt = select(QlooRequest).where(QlooRequest.request_hash == req_hash).limit(1)
        result = await db.execute(stmt)
        cached = result.scalar_one_or_none()

        if cached is not None and cached.response_ref:
            raw_entities = cached.response_ref.get("entities", [])
            entities = [QlooEntity(**e) for e in raw_entities]
            return entities, True, req_hash

        # 2. Cache miss -> perform live call
        start_time = time.perf_counter()
        entities = await self.client.resolve_entities(query=query, domain=domain, limit=limit)
        latency_ms = int((time.perf_counter() - start_time) * 1000)

        # 3. Record in ledger
        serialized = [e.model_dump() for e in entities]
        request_record = QlooRequest(
            run_id=run_id,
            operation="resolve_entities",
            endpoint=endpoint,
            request_hash=req_hash,
            latency_ms=latency_ms,
            status_code=200,
            cache_hit=False,
            response_ref={"entities": serialized},
        )
        db.add(request_record)
        await db.commit()

        return entities, False, req_hash

    async def get_audience_affinities(
        self,
        db: AsyncSession,
        seed_entities: list[str],
        target_categories: list[str] | None = None,
        location: str | None = None,
        run_id: uuid.UUID | None = None,
    ) -> tuple[QlooAudienceInsights, bool, str]:
        """
        Get audience affinities with database caching.
        Returns (audience_insights, is_cache_hit, request_hash).
        """
        endpoint = "/v2/insights/audiences"
        body: dict[str, Any] = {
            "entities": sorted(seed_entities),
            "target_categories": sorted(target_categories or ["fashion", "dining", "music"]),
        }
        if location:
            body["location"] = location

        req_hash = compute_request_hash(endpoint, method="POST", body=body)

        # 1. Check database cache
        stmt = select(QlooRequest).where(QlooRequest.request_hash == req_hash).limit(1)
        result = await db.execute(stmt)
        cached = result.scalar_one_or_none()

        if cached is not None and cached.response_ref:
            insights = QlooAudienceInsights(**cached.response_ref)
            return insights, True, req_hash

        # 2. Cache miss -> perform live call
        start_time = time.perf_counter()
        insights = await self.client.get_audience_affinities(
            seed_entities=seed_entities,
            target_categories=target_categories,
            location=location,
        )
        latency_ms = int((time.perf_counter() - start_time) * 1000)

        # 3. Record in ledger
        request_record = QlooRequest(
            run_id=run_id,
            operation="get_audience_affinities",
            endpoint=endpoint,
            request_hash=req_hash,
            latency_ms=latency_ms,
            status_code=200,
            cache_hit=False,
            response_ref=insights.model_dump(),
        )
        db.add(request_record)
        await db.commit()

        return insights, False, req_hash

    async def get_location_demographics(
        self,
        db: AsyncSession,
        location_code: str,
        categories: list[str] | None = None,
        run_id: uuid.UUID | None = None,
    ) -> tuple[QlooLocationInsights, bool, str]:
        """
        Get location demographics with database caching.
        Returns (location_insights, is_cache_hit, request_hash).
        """
        endpoint = "/v2/insights/locations"
        params: dict[str, Any] = {"location_code": location_code}
        if categories:
            params["categories"] = ",".join(sorted(categories))

        req_hash = compute_request_hash(endpoint, method="GET", params=params)

        stmt = select(QlooRequest).where(QlooRequest.request_hash == req_hash).limit(1)
        result = await db.execute(stmt)
        cached = result.scalar_one_or_none()

        if cached is not None and cached.response_ref:
            insights = QlooLocationInsights(**cached.response_ref)
            return insights, True, req_hash

        start_time = time.perf_counter()
        insights = await self.client.get_location_demographics(
            location_code=location_code,
            categories=categories,
        )
        latency_ms = int((time.perf_counter() - start_time) * 1000)

        request_record = QlooRequest(
            run_id=run_id,
            operation="get_location_demographics",
            endpoint=endpoint,
            request_hash=req_hash,
            latency_ms=latency_ms,
            status_code=200,
            cache_hit=False,
            response_ref=insights.model_dump(),
        )
        db.add(request_record)
        await db.commit()

        return insights, False, req_hash

    async def get_taste_trends(
        self,
        db: AsyncSession,
        entity_or_category: str,
        interval_days: int = 90,
        run_id: uuid.UUID | None = None,
    ) -> tuple[QlooTrendInsights, bool, str]:
        """
        Get taste trend velocity with database caching.
        Returns (trend_insights, is_cache_hit, request_hash).
        """
        endpoint = "/v2/insights/trends"
        params: dict[str, Any] = {
            "entity_or_category": entity_or_category,
            "interval_days": interval_days,
        }

        req_hash = compute_request_hash(endpoint, method="GET", params=params)

        stmt = select(QlooRequest).where(QlooRequest.request_hash == req_hash).limit(1)
        result = await db.execute(stmt)
        cached = result.scalar_one_or_none()

        if cached is not None and cached.response_ref:
            insights = QlooTrendInsights(**cached.response_ref)
            return insights, True, req_hash

        start_time = time.perf_counter()
        insights = await self.client.get_taste_trends(
            entity_or_category=entity_or_category,
            interval_days=interval_days,
        )
        latency_ms = int((time.perf_counter() - start_time) * 1000)

        request_record = QlooRequest(
            run_id=run_id,
            operation="get_taste_trends",
            endpoint=endpoint,
            request_hash=req_hash,
            latency_ms=latency_ms,
            status_code=200,
            cache_hit=False,
            response_ref=insights.model_dump(),
        )
        db.add(request_record)
        await db.commit()

        return insights, False, req_hash
