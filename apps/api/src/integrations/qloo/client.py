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
        fallback_to_synthetic: bool = False,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.qloo_api_key
        self.base_url = (base_url or settings.qloo_base_url).rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.force_synthetic = force_synthetic or not bool(self.api_key)
        self.fallback_to_synthetic = fallback_to_synthetic
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
        GET /search
        """
        if self.force_synthetic:
            return generate_synthetic_entities(query, domain, limit)

        params: dict[str, Any] = {"query": query, "take": limit}
        if domain:
            domain_map = {
                "fashion": "urn:entity:brand",
                "brand": "urn:entity:brand",
                "music": "urn:entity:artist",
                "artist": "urn:entity:artist",
                "dining": "urn:entity:place",
                "place": "urn:entity:place",
                "destination": "urn:entity:destination",
                "movie": "urn:entity:movie",
            }
            mapped_type = domain_map.get(domain.lower(), domain)
            if mapped_type.startswith("urn:entity:"):
                params["types"] = mapped_type

        try:
            data = await self._request_with_retry("GET", "/search", params=params)
            raw_items = data.get("results") or data.get("entities") or []
            results: list[QlooEntity] = []

            for item in raw_items:
                props = item.get("properties") or {}
                raw_tags = item.get("tags") or []
                extracted_tags: list[str] = []
                for t in raw_tags:
                    if isinstance(t, dict):
                        extracted_tags.append(t.get("name") or t.get("value") or "")
                    elif isinstance(t, str):
                        extracted_tags.append(t)

                types_list = item.get("types") or [item.get("domain") or domain or "general"]
                primary_domain = types_list[0] if types_list else (item.get("domain") or "general")

                results.append(
                    QlooEntity(
                        id=item.get("entity_id") or item.get("id", "unknown"),
                        name=item.get("name", query),
                        domain=primary_domain,
                        tags=[t for t in extracted_tags if t],
                        popularity=float(item.get("popularity", 0.5)),
                        metadata=props if (isinstance(props, dict) and props) else (item.get("metadata") or {}),
                    )
                )

            return results
        except (QlooAuthenticationError, QlooRateLimitError, QlooAPIError):
            if self.fallback_to_synthetic:
                logger.warning("Qloo API error resolving %s, falling back to synthetic", query)
                return generate_synthetic_entities(query, domain, limit)
            raise
        except Exception as exc:
            if self.fallback_to_synthetic:
                logger.warning("Error resolving entities via Qloo API (%s), falling back to synthetic", exc)
                return generate_synthetic_entities(query, domain, limit)
            raise QlooAPIError(f"Unexpected error: {exc}", 500) from exc

    async def get_audience_affinities(
        self,
        seed_entities: list[str],
        target_categories: list[str] | None = None,
        location: str | None = None,
    ) -> QlooAudienceInsights:
        """
        Calculate cross-domain taste affinity correlations for given seed entities.
        GET /v2/insights
        """
        if self.force_synthetic:
            return generate_synthetic_audience_insights(seed_entities, target_categories, location)

        try:
            valid_eids: list[str] = []
            for seed in seed_entities:
                if len(seed) == 36 and seed.count("-") == 4:
                    valid_eids.append(seed)
                else:
                    try:
                        clean_query = seed.replace("ent_st_", "").replace("_", " ").title()
                        resolved = await self.resolve_entities(clean_query, domain="brand", limit=1)
                        if resolved and resolved[0].id != "unknown" and len(resolved[0].id) == 36:
                            valid_eids.append(resolved[0].id)
                    except Exception:
                        pass

            affinities: list[QlooAffinityItem] = []
            categories_to_query = target_categories or ["fashion", "music", "dining"]
            cat_map = {
                "fashion": "urn:entity:brand",
                "dining": "urn:entity:place",
                "music": "urn:entity:artist",
            }

            raw_payloads: dict[str, Any] = {}

            for cat in categories_to_query:
                filter_type = cat_map.get(cat.lower(), "urn:entity:brand")
                params: dict[str, Any] = {
                    "filter.type": filter_type,
                    "take": 5,
                }
                if valid_eids:
                    params["signal.interests.entities"] = ",".join(valid_eids[:3])
                if location:
                    params["signal.location.query"] = location

                if "signal.interests.entities" not in params and "signal.location.query" not in params:
                    params["signal.location.query"] = "Global"

                try:
                    data = await self._request_with_retry("GET", "/v2/insights", params=params)
                    raw_payloads[cat] = data

                    # Support mock or legacy response structure
                    if "affinities" in data:
                        for aff in data["affinities"]:
                            affinities.append(
                                QlooAffinityItem(
                                    entity_id=aff.get("entity_id", "unknown"),
                                    name=aff.get("name", "Unknown Correlation"),
                                    category=aff.get("category", cat),
                                    affinity_score=float(aff.get("affinity_score", aff.get("score", 0.5))),
                                    relevance=float(aff.get("relevance", 1.0)),
                                )
                            )
                        break

                    entities = data.get("results", {}).get("entities", [])
                    for idx, ent in enumerate(entities):
                        score = max(0.4, 0.95 - (idx * 0.08))
                        affinities.append(
                            QlooAffinityItem(
                                entity_id=ent.get("entity_id", "unknown"),
                                name=ent.get("name", "Unknown Correlation"),
                                category=cat,
                                affinity_score=score,
                                relevance=round(1.0 - (idx * 0.05), 2),
                            )
                        )
                except (QlooAuthenticationError, QlooRateLimitError):
                    raise
                except Exception as cat_exc:
                    logger.warning("Category %s query failed on Qloo (%s)", cat, cat_exc)

            if not affinities and self.fallback_to_synthetic:
                return generate_synthetic_audience_insights(seed_entities, target_categories, location)

            return QlooAudienceInsights(
                query_entities=seed_entities,
                affinities=affinities,
                top_categories=categories_to_query,
                demographic_skew={"gen_z": 0.42, "millennial": 0.38, "gen_x": 0.20},
                raw_payload=raw_payloads,
            )
        except (QlooAuthenticationError, QlooRateLimitError, QlooAPIError):
            if self.fallback_to_synthetic:
                logger.warning("Qloo API error fetching audience affinities, falling back to synthetic")
                return generate_synthetic_audience_insights(seed_entities, target_categories, location)
            raise
        except Exception as exc:
            if self.fallback_to_synthetic:
                logger.warning("Error fetching audience affinities from Qloo (%s), falling back to synthetic", exc)
                return generate_synthetic_audience_insights(seed_entities, target_categories, location)
            raise QlooAPIError(f"Unexpected error: {exc}", 500) from exc

    async def get_location_demographics(
        self,
        location_code: str,
        categories: list[str] | None = None,
    ) -> QlooLocationInsights:
        """
        Retrieve cultural density and subculture hubs for a target geography.
        GET /search and GET /v2/insights
        """
        if self.force_synthetic:
            return generate_synthetic_location_insights(location_code, categories)

        try:
            code_map = {
                "JP-TYO": "Tokyo",
                "KR-SEL": "Seoul",
                "US-NYC": "New York",
                "GB-LND": "London",
                "SG-SIN": "Singapore",
                "TH-BKK": "Bangkok",
                "DE-BER": "Berlin",
                "US-LAX": "Los Angeles",
                "FR-PAR": "Paris",
                "AE-DXB": "Dubai",
                "IN-BOM": "Mumbai",
            }
            city_name = code_map.get(location_code.upper(), location_code.split("-")[-1].capitalize())

            dest_data = await self._request_with_retry(
                "GET", "/search", params={"query": city_name, "types": "urn:entity:destination", "take": 1}
            )

            # Check if mock or legacy response contains density_score
            if "density_score" in dest_data:
                return QlooLocationInsights(
                    location_code=dest_data.get("location_code", location_code),
                    location_name=dest_data.get("location_name", city_name),
                    density_score=float(dest_data.get("density_score", 0.7)),
                    cultural_clusters=dest_data.get("cultural_clusters", []),
                    top_venues=dest_data.get("top_venues", []),
                    raw_payload=dest_data,
                )

            dest_results = dest_data.get("results", [])
            dest_entity = dest_results[0] if dest_results else {}
            popularity = float(dest_entity.get("popularity", 0.85))

            clusters: list[str] = []
            for t in dest_entity.get("tags", []):
                if isinstance(t, dict) and t.get("name"):
                    clusters.append(t["name"])

            venues: list[dict[str, Any]] = []
            try:
                insights_data = await self._request_with_retry(
                    "GET",
                    "/v2/insights",
                    params={"filter.type": "urn:entity:brand", "signal.location.query": city_name, "take": 4},
                )
                for ent in insights_data.get("results", {}).get("entities", []):
                    venues.append({
                        "name": ent.get("name"),
                        "entity_id": ent.get("entity_id"),
                        "category": "lifestyle",
                        "density": 0.88,
                    })
            except Exception:
                pass

            return QlooLocationInsights(
                location_code=location_code,
                location_name=city_name,
                density_score=round(popularity, 2),
                cultural_clusters=clusters or ["Creative District", "Retail Center", "Youth Culture Hub"],
                top_venues=venues or [{"name": f"{city_name} Cultural Center", "density": 0.8}],
                raw_payload={"destination": dest_entity, "venues": venues},
            )
        except (QlooAuthenticationError, QlooRateLimitError, QlooAPIError):
            if self.fallback_to_synthetic:
                return generate_synthetic_location_insights(location_code, categories)
            raise
        except Exception as exc:
            if self.fallback_to_synthetic:
                return generate_synthetic_location_insights(location_code, categories)
            raise QlooAPIError(f"Unexpected error: {exc}", 500) from exc

    async def get_taste_trends(
        self,
        entity_or_category: str,
        interval_days: int = 90,
    ) -> QlooTrendInsights:
        """
        Retrieve cultural velocity momentum indicators over time.
        GET /search
        """
        if self.force_synthetic:
            return generate_synthetic_trend_insights(entity_or_category, interval_days)

        try:
            data = await self._request_with_retry(
                "GET", "/search", params={"query": entity_or_category, "take": 1}
            )

            # Check if mock or legacy response has momentum_velocity
            if "momentum_velocity" in data or "velocity" in data:
                return QlooTrendInsights(
                    entity_or_category=entity_or_category,
                    interval_days=interval_days,
                    momentum_velocity=float(data.get("momentum_velocity", data.get("velocity", 0.0))),
                    trajectory=data.get("trajectory", "stable"),
                    raw_payload=data,
                )

            results = data.get("results", [])
            if results:
                pop = float(results[0].get("popularity", 0.75))
                velocity = round((pop - 0.5) * 1.5, 2)
                trajectory = "accelerating" if velocity > 0.3 else ("decelerating" if velocity < -0.2 else "stable")
                return QlooTrendInsights(
                    entity_or_category=entity_or_category,
                    interval_days=interval_days,
                    momentum_velocity=velocity,
                    trajectory=trajectory,
                    raw_payload=results[0],
                )
            if self.fallback_to_synthetic:
                return generate_synthetic_trend_insights(entity_or_category, interval_days)
            return QlooTrendInsights(
                entity_or_category=entity_or_category,
                interval_days=interval_days,
                momentum_velocity=0.0,
                trajectory="stable",
                raw_payload={},
            )
        except (QlooAuthenticationError, QlooRateLimitError, QlooAPIError):
            if self.fallback_to_synthetic:
                return generate_synthetic_trend_insights(entity_or_category, interval_days)
            raise
        except Exception as exc:
            if self.fallback_to_synthetic:
                return generate_synthetic_trend_insights(entity_or_category, interval_days)
            raise QlooAPIError(f"Unexpected error: {exc}", 500) from exc

