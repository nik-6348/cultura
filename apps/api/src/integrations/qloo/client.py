import asyncio
import logging
import random
from typing import Any

import httpx

from src.core.config import get_settings
from src.integrations.qloo.models import (
    QlooAffinityItem,
    QlooAudienceInsights,
    QlooEntity,
    QlooLocationInsights,
    QlooTrendInsights,
)
from src.integrations.qloo.synthetic import (
    generate_synthetic_audience_insights,
    generate_synthetic_entities,
    generate_synthetic_location_insights,
    generate_synthetic_trend_insights,
)

logger = logging.getLogger("cultura.integrations.qloo")


class QlooError(Exception):
    """Base exception for Qloo API operations."""


class QlooRateLimitError(QlooError):
    """Raised when Qloo rate limit (429) is exceeded after max retries."""


class QlooAuthenticationError(QlooError):
    """Raised when Qloo API key is invalid or unauthorized (401/403)."""


class QlooAPIError(QlooError):
    """Raised when Qloo returns a non-retryable 4xx/5xx status."""

    def __init__(self, message: str, status_code: int, response_body: Any = None) -> None:
        super().__init__(f"[{status_code}] {message}")
        self.status_code = status_code
        self.response_body = response_body


class QlooClient:
    """
    Production-grade async client for the Qloo Cultural AI API.

    Includes:
    - Typed responses with Pydantic v2
    - Exponential backoff with jitter on 429 and 5xx
    - Fallback to high-fidelity synthetic data when API key is unconfigured
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 30.0,
        max_retries: int = 3,
        backoff_factor: float = 0.5,
        force_synthetic: bool = False,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.qloo_api_key
        self.base_url = (base_url or settings.qloo_base_url).rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.force_synthetic = force_synthetic or not bool(self.api_key)
        self._external_client = http_client
        self._internal_client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._external_client is not None:
            return self._external_client
        if self._internal_client is None or self._internal_client.is_closed:
            self._internal_client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={
                    "X-Api-Key": self.api_key,
                    "Accept": "application/json",
                    "User-Agent": "Cultura-Intelligence/0.1.0",
                },
            )
        return self._internal_client

    async def close(self) -> None:
        if self._internal_client and not self._internal_client.is_closed:
            await self._internal_client.aclose()
            self._internal_client = None

    async def __aenter__(self) -> "QlooClient":
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.close()

    async def _request_with_retry(
        self,
        method: str,
        endpoint: str,
        params: dict[str, Any] | None = None,
        json_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute HTTP request with exponential backoff and jitter."""
        client = await self._get_client()
        attempt = 0

        target_url = endpoint if endpoint.startswith("http") else f"{self.base_url}{endpoint}"

        while True:
            attempt += 1
            try:
                response = await client.request(
                    method=method,
                    url=target_url,
                    params=params,
                    json=json_data,
                )

                if response.status_code == 200:
                    try:
                        return response.json()  # type: ignore[no-any-return]
                    except Exception as e:
                        raise QlooAPIError(
                            "Invalid JSON received from Qloo", response.status_code
                        ) from e

                if response.status_code in (401, 403):
                    msg = f"Qloo auth failed ({response.status_code}): {response.text}"
                    raise QlooAuthenticationError(msg)

                # Retryable status codes: 429 and 5xx
                if response.status_code == 429 or response.status_code >= 500:
                    if attempt > self.max_retries:
                        if response.status_code == 429:
                            raise QlooRateLimitError(
                                f"Qloo rate limit exceeded after {self.max_retries} retries"
                            )
                        err_msg = (
                            f"Qloo error {response.status_code} after {self.max_retries} retries"
                        )
                        raise QlooAPIError(err_msg, response.status_code, response.text)

                    # Calculate exponential backoff with jitter
                    sleep_time = self.backoff_factor * (2 ** (attempt - 1)) + random.uniform(
                        0.05, 0.25
                    )
                    logger.warning(
                        "Qloo request to %s returned %s, retrying in %.2fs (attempt %d/%d)",
                        endpoint,
                        response.status_code,
                        sleep_time,
                        attempt,
                        self.max_retries,
                    )
                    await asyncio.sleep(sleep_time)
                    continue

                # Any other 4xx error is non-retryable
                raise QlooAPIError(
                    f"Qloo error {response.status_code}: {response.text}",
                    response.status_code,
                    response.text,
                )

            except httpx.RequestError as exc:
                if attempt > self.max_retries:
                    raise QlooAPIError(
                        f"Network failure connecting to Qloo: {exc}",
                        503,
                    ) from exc
                sleep_time = self.backoff_factor * (2 ** (attempt - 1)) + random.uniform(0.05, 0.25)
                logger.warning(
                    "Network error connecting to Qloo (%s), retrying in %.2fs",
                    exc,
                    sleep_time,
                )
                await asyncio.sleep(sleep_time)

    async def resolve_entities(
        self,
        query: str,
        domain: str | None = None,
        limit: int = 10,
    ) -> list[QlooEntity]:
        """
        Search and resolve consumer cultural entities by query.
        GET /v2/insights/entities
        """
        if self.force_synthetic:
            return generate_synthetic_entities(query, domain, limit)

        params: dict[str, Any] = {"query": query, "limit": limit}
        if domain:
            params["domain"] = domain

        data = await self._request_with_retry("GET", "/v2/insights/entities", params=params)
        results: list[QlooEntity] = []
        raw_items = data.get("entities") or data.get("results") or []

        for item in raw_items:
            results.append(
                QlooEntity(
                    id=item.get("id") or item.get("entity_id", "unknown"),
                    name=item.get("name", query),
                    domain=item.get("domain", domain or "general"),
                    tags=item.get("tags", []),
                    popularity=float(item.get("popularity", 0.5)),
                    metadata=item.get("metadata", {}),
                )
            )
        return results

    async def get_audience_affinities(
        self,
        seed_entities: list[str],
        target_categories: list[str] | None = None,
        location: str | None = None,
    ) -> QlooAudienceInsights:
        """
        Calculate cross-domain taste affinity correlations for given seed entities.
        POST /v2/insights/audiences
        """
        if self.force_synthetic:
            return generate_synthetic_audience_insights(seed_entities, target_categories, location)

        body: dict[str, Any] = {
            "entities": seed_entities,
            "target_categories": target_categories or ["fashion", "dining", "music"],
        }
        if location:
            body["location"] = location

        data = await self._request_with_retry("POST", "/v2/insights/audiences", json_data=body)
        raw_affinities = data.get("affinities") or []
        affinities: list[QlooAffinityItem] = []

        for aff in raw_affinities:
            affinities.append(
                QlooAffinityItem(
                    entity_id=aff.get("entity_id", "unknown"),
                    name=aff.get("name", "Unknown Correlation"),
                    category=aff.get("category", "general"),
                    affinity_score=float(aff.get("affinity_score", aff.get("score", 0.5))),
                    relevance=float(aff.get("relevance", 1.0)),
                )
            )

        return QlooAudienceInsights(
            query_entities=seed_entities,
            affinities=affinities,
            top_categories=data.get("top_categories", target_categories or []),
            demographic_skew=data.get("demographic_skew", {}),
            raw_payload=data,
        )

    async def get_location_demographics(
        self,
        location_code: str,
        categories: list[str] | None = None,
    ) -> QlooLocationInsights:
        """
        Retrieve cultural density and subculture hubs for a target geography.
        GET /v2/insights/locations
        """
        if self.force_synthetic:
            return generate_synthetic_location_insights(location_code, categories)

        params: dict[str, Any] = {"location_code": location_code}
        if categories:
            params["categories"] = ",".join(categories)

        data = await self._request_with_retry("GET", "/v2/insights/locations", params=params)
        return QlooLocationInsights(
            location_code=data.get("location_code", location_code),
            location_name=data.get("location_name", location_code),
            density_score=float(data.get("density_score", 0.7)),
            cultural_clusters=data.get("cultural_clusters", []),
            top_venues=data.get("top_venues", []),
            raw_payload=data,
        )

    async def get_taste_trends(
        self,
        entity_or_category: str,
        interval_days: int = 90,
    ) -> QlooTrendInsights:
        """
        Retrieve cultural velocity momentum indicators over time.
        GET /v2/insights/trends
        """
        if self.force_synthetic:
            return generate_synthetic_trend_insights(entity_or_category, interval_days)

        params = {"query": entity_or_category, "interval_days": interval_days}
        data = await self._request_with_retry("GET", "/v2/insights/trends", params=params)

        return QlooTrendInsights(
            entity_or_category=entity_or_category,
            interval_days=interval_days,
            momentum_velocity=float(data.get("momentum_velocity", data.get("velocity", 0.0))),
            trajectory=data.get("trajectory", "stable"),
            raw_payload=data,
        )
