from typing import Any

from pydantic import BaseModel, Field


class QlooEntity(BaseModel):
    """Canonical entity resolved from Qloo knowledge graph."""

    id: str = Field(..., description="Unique Qloo entity ID (e.g., 'ent_4f92a18b')")
    name: str = Field(..., description="Entity display name")
    domain: str = Field(..., description="Cultural domain: fashion, music, dining, media, etc.")
    tags: list[str] = Field(default_factory=list, description="Associated cultural tags")
    popularity: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Normalized popularity score (0-1)"
    )
    metadata: dict[str, Any] = Field(default_factory=dict, description="Raw entity attributes")


class QlooAffinityItem(BaseModel):
    """Specific taste correlation between entities or domains."""

    entity_id: str
    name: str
    category: str
    affinity_score: float = Field(..., ge=0.0, le=1.0, description="Correlation score (0.0 - 1.0)")
    relevance: float = Field(default=1.0, ge=0.0, le=1.0)


class QlooAudienceInsights(BaseModel):
    """Cross-domain taste profile and affinity matrix for an audience."""

    query_entities: list[str] = Field(
        ..., description="Input seed entities/tags used for inference"
    )
    affinities: list[QlooAffinityItem] = Field(default_factory=list)
    top_categories: list[str] = Field(default_factory=list)
    demographic_skew: dict[str, float] = Field(default_factory=dict)
    raw_payload: dict[str, Any] = Field(default_factory=dict)


class QlooLocationInsights(BaseModel):
    """Geographic taste density and cultural venue distribution for a market."""

    location_code: str = Field(..., description="Standard location identifier (e.g., 'GB-LND')")
    location_name: str = Field(..., description="Market name (e.g., 'London')")
    density_score: float = Field(
        ..., ge=0.0, le=1.0, description="Category venue ecosystem density"
    )
    cultural_clusters: list[str] = Field(
        default_factory=list, description="Subcultural hubs / neighborhoods"
    )
    top_venues: list[dict[str, Any]] = Field(default_factory=list)
    raw_payload: dict[str, Any] = Field(default_factory=dict)


class QlooTrendInsights(BaseModel):
    """Velocity and cultural momentum over time."""

    entity_or_category: str
    interval_days: int = Field(default=90, description="Lookback window in days (30, 90, 180)")
    momentum_velocity: float = Field(
        ..., ge=-1.0, le=1.0, description="Rate of cultural change (-1.0 to 1.0)"
    )
    trajectory: str = Field(default="stable", description="accelerating | stable | decelerating")
    raw_payload: dict[str, Any] = Field(default_factory=dict)
