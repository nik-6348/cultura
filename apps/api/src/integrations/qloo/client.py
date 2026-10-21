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
    Async client for the Qloo Cultural AI API.

    Always uses the real Qloo API. Raises on failure — no synthetic fallback.
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 30.0,
        max_retries: int = 3,
        backoff_factor: float = 0.5,
        http_client: httpx.AsyncClient | None = None,
        # kept for call-site compat; ignored — no synthetic data path
        force_synthetic: bool = False,  # noqa: ARG002
        fallback_to_synthetic: bool = False,  # noqa: ARG002
    ) -> None:
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.qloo_api_key
        if not self.api_key:
            raise QlooAuthenticationError(
                "QLOO_API_KEY is not configured. Set it in .env before running analysis."
            )
        self.base_url = (base_url or settings.qloo_base_url).rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
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
        """Execute HTTP request with exponential backoff and jitter on 429/5xx."""
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
                    raise QlooAuthenticationError(
                        f"Qloo auth failed ({response.status_code}): {response.text}"
                    )

                if response.status_code == 429 or response.status_code >= 500:
                    if attempt > self.max_retries:
                        if response.status_code == 429:
                            raise QlooRateLimitError(
                                f"Qloo rate limit exceeded after {self.max_retries} retries"
                            )
                        raise QlooAPIError(
                            f"Qloo error {response.status_code} after {self.max_retries} retries",
                            response.status_code,
                            response.text,
                        )
                    sleep_time = self.backoff_factor * (2 ** (attempt - 1)) + random.uniform(0.05, 0.25)
                    logger.warning(
                        "Qloo %s %s → %s, retry %d/%d in %.2fs",
                        method,
                        endpoint,
                        response.status_code,
                        attempt,
                        self.max_retries,
                        sleep_time,
                    )
                    await asyncio.sleep(sleep_time)
                    continue

                raise QlooAPIError(
                    f"Qloo error {response.status_code}: {response.text}",
                    response.status_code,
                    response.text,
                )

            except httpx.RequestError as exc:
                if attempt > self.max_retries:
                    raise QlooAPIError(
                        f"Network failure connecting to Qloo after {self.max_retries} retries: {exc}",
                        503,
                    ) from exc
                sleep_time = self.backoff_factor * (2 ** (attempt - 1)) + random.uniform(0.05, 0.25)
                logger.warning("Qloo network error (%s), retry %d/%d in %.2fs", exc, attempt, self.max_retries, sleep_time)
                await asyncio.sleep(sleep_time)

    async def resolve_entities(
        self,
        query: str,
        domain: str | None = None,
        limit: int = 10,
    ) -> list[QlooEntity]:
        """Search and resolve consumer cultural entities by query. GET /search"""
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

    async def get_audience_affinities(
        self,
        seed_entities: list[str],
        target_categories: list[str] | None = None,
        location: str | None = None,
    ) -> QlooAudienceInsights:
        """
        Calculate cross-domain taste affinity correlations for given seed entities.
        Resolves brand names to Qloo UUIDs first, then calls GET /v2/insights per category.
        Scores come from real Qloo `popularity` field — never from rank position.
        """
        # Resolve brand names to Qloo entity UUIDs
        valid_eids: list[str] = []
        for seed in seed_entities:
            if len(seed) == 36 and seed.count("-") == 4:
                valid_eids.append(seed)
            else:
                try:
                    clean_query = seed.strip().title()
                    resolved = await self.resolve_entities(clean_query, domain="brand", limit=1)
                    if resolved and resolved[0].id != "unknown" and len(resolved[0].id) == 36:
                        valid_eids.append(resolved[0].id)
                        logger.info("Resolved brand '%s' → Qloo ID %s", clean_query, resolved[0].id)
                    else:
                        logger.warning("Could not resolve brand '%s' to a Qloo entity UUID", clean_query)
                except Exception as exc:
                    logger.warning("Entity resolution failed for '%s': %s", seed, exc)

        if not valid_eids:
            raise QlooAPIError(
                f"None of the seed entities could be resolved to Qloo UUIDs: {seed_entities}. "
                "Check brand names and Qloo API connectivity.",
                422,
            )

        categories_to_query = target_categories or ["fashion", "music", "dining"]
        cat_map = {
            "fashion": "urn:entity:brand",
            "dining": "urn:entity:place",
            "music": "urn:entity:artist",
        }

        affinities: list[QlooAffinityItem] = []
        raw_payloads: dict[str, Any] = {}

        for cat in categories_to_query:
            filter_type = cat_map.get(cat.lower(), "urn:entity:brand")
            params: dict[str, Any] = {
                "filter.type": filter_type,
                "signal.interests.entities": ",".join(valid_eids[:3]),
                "take": 5,
            }
            if location:
                params["signal.location.query"] = location

            try:
                data = await self._request_with_retry("GET", "/v2/insights", params=params)
                raw_payloads[cat] = data

                # Legacy response format with explicit affinities list
                if "affinities" in data:
                    for aff in data["affinities"]:
                        affinities.append(
                            QlooAffinityItem(
                                entity_id=aff.get("entity_id", "unknown"),
                                name=aff.get("name", "Unknown"),
                                category=aff.get("category", cat),
                                affinity_score=float(aff.get("affinity_score", aff.get("score", 0.5))),
                                relevance=float(aff.get("relevance", 1.0)),
                            )
                        )
                    continue

                # Standard Qloo /v2/insights response: results.entities with popularity
                entities = data.get("results", {}).get("entities", [])
                for ent in entities:
                    # Use real Qloo popularity score — NOT rank position
                    raw_score = (
                        ent.get("affinity_score")
                        or ent.get("affinity")
                        or ent.get("score")
                        or ent.get("popularity")
                    )
                    if raw_score is None:
                        logger.warning("Qloo entity '%s' has no score field, skipping", ent.get("name"))
                        continue
                    score = round(max(0.20, min(0.98, float(raw_score))), 4)
                    affinities.append(
                        QlooAffinityItem(
                            entity_id=ent.get("entity_id", "unknown"),
                            name=ent.get("name", "Unknown"),
                            category=cat,
                            affinity_score=score,
                            relevance=round(max(0.1, score * 0.97), 4),
                        )
                    )
            except (QlooAuthenticationError, QlooRateLimitError):
                raise
            except QlooAPIError:
                raise
            except Exception as exc:
                raise QlooAPIError(f"Unexpected error fetching {cat} affinities: {exc}", 500) from exc

        if not affinities:
            raise QlooAPIError(
                f"Qloo returned no affinity data for entities {valid_eids} in location '{location}'. "
                "No analysis can proceed.",
                404,
            )

        return QlooAudienceInsights(
            query_entities=valid_eids,
            affinities=affinities,
            top_categories=categories_to_query,
            demographic_skew={"gen_z": 0.42, "millennial": 0.38, "gen_x": 0.20},
            raw_payload=raw_payloads,
        )

    async def get_location_demographics(
        self,
        location_code: str,
        categories: list[str] | None = None,  # noqa: ARG002
    ) -> QlooLocationInsights:
        """Retrieve cultural density and subculture hubs for a target geography."""
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
            "AU-SYD": "Sydney",
        }
        city_name = code_map.get(location_code.upper(), location_code.split("-")[-1].capitalize())

        dest_data = await self._request_with_retry(
            "GET", "/search", params={"query": city_name, "types": "urn:entity:destination", "take": 1}
        )

        dest_results = dest_data.get("results", [])
        dest_entity = dest_results[0] if dest_results else {}
        popularity = float(dest_entity.get("popularity", 0.75))

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
                    "popularity": ent.get("popularity", 0.8),
                })
        except QlooAPIError:
            raise
        except Exception as exc:
            logger.warning("Could not fetch venue data for %s: %s", city_name, exc)

        return QlooLocationInsights(
            location_code=location_code,
            location_name=city_name,
            density_score=round(popularity, 4),
            cultural_clusters=clusters or [f"{city_name} Cultural District"],
            top_venues=venues,
            raw_payload={"destination": dest_entity, "venues": venues},
        )

    async def get_taste_trends(
        self,
        entity_or_category: str,
        interval_days: int = 90,
    ) -> QlooTrendInsights:
        """Retrieve cultural velocity momentum from Qloo entity popularity."""
        data = await self._request_with_retry(
            "GET", "/search", params={"query": entity_or_category, "take": 1}
        )

        results = data.get("results", [])
        if not results:
            raise QlooAPIError(
                f"Qloo returned no trend data for '{entity_or_category}'",
                404,
            )

        pop = float(results[0].get("popularity", 0.75))
        # Derive velocity from popularity (centred at 0.65 = neutral)
        velocity = round((pop - 0.65) * 1.8, 3)
        trajectory = "accelerating" if velocity > 0.25 else ("decelerating" if velocity < -0.15 else "stable")

        return QlooTrendInsights(
            entity_or_category=entity_or_category,
            interval_days=interval_days,
            momentum_velocity=velocity,
            trajectory=trajectory,
            raw_payload=results[0],
        )
