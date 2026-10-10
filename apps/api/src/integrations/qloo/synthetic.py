from typing import Any

from src.integrations.qloo.models import (
    QlooAffinityItem,
    QlooAudienceInsights,
    QlooEntity,
    QlooLocationInsights,
    QlooTrendInsights,
)

# Known seed database for offline high-fidelity inference
KNOWN_ENTITIES: dict[str, list[dict[str, Any]]] = {
    "streetwear": [
        {
            "id": "ent_st_supreme",
            "name": "Supreme",
            "domain": "fashion",
            "tags": ["streetwear", "skate", "luxury_collab"],
            "popularity": 0.88,
        },
        {
            "id": "ent_st_palace",
            "name": "Palace Skateboards",
            "domain": "fashion",
            "tags": ["streetwear", "british_skate", "london_heritage"],
            "popularity": 0.81,
        },
        {
            "id": "ent_st_aime",
            "name": "Aimé Leon Dore",
            "domain": "fashion",
            "tags": ["streetwear", "prep_street", "new_york"],
            "popularity": 0.85,
        },
        {
            "id": "ent_st_wtaps",
            "name": "WTAPS",
            "domain": "fashion",
            "tags": ["tokyo_streetwear", "military_casual", "harajuku"],
            "popularity": 0.76,
        },
    ],
    "coffee": [
        {
            "id": "ent_cf_bluebottle",
            "name": "Blue Bottle Coffee",
            "domain": "dining",
            "tags": ["specialty_coffee", "third_wave", "minimalist"],
            "popularity": 0.82,
        },
        {
            "id": "ent_cf_monmouth",
            "name": "Monmouth Coffee Company",
            "domain": "dining",
            "tags": ["artisan_roaster", "london_specialty", "borough_market"],
            "popularity": 0.79,
        },
        {
            "id": "ent_cf_barn",
            "name": "The Barn Berlin",
            "domain": "dining",
            "tags": ["nordic_roast", "berlin_third_wave", "specialty"],
            "popularity": 0.80,
        },
    ],
}

LOCATION_DEFAULTS: dict[str, dict[str, Any]] = {
    "london": {
        "location_code": "GB-LND",
        "location_name": "London",
        "density_score": 0.84,
        "cultural_clusters": ["Shoreditch", "Soho", "Hackney", "Dalston", "Brixton"],
        "top_venues": [
            {"name": "Dover Street Market London", "category": "retail", "affinity": 0.92},
            {"name": "Rough Trade East", "category": "music_retail", "affinity": 0.87},
            {"name": "Brilliant Corners", "category": "audiophile_bar", "affinity": 0.89},
        ],
    },
    "berlin": {
        "location_code": "DE-BER",
        "location_name": "Berlin",
        "density_score": 0.76,
        "cultural_clusters": ["Mitte", "Kreuzberg", "Neukölln", "Friedrichshain"],
        "top_venues": [
            {"name": "Voo Store", "category": "retail", "affinity": 0.91},
            {"name": "Hard Wax", "category": "electronic_music", "affinity": 0.93},
            {"name": "Bonanza Coffee Roasters", "category": "specialty_coffee", "affinity": 0.85},
        ],
    },
    "tokyo": {
        "location_code": "JP-TYO",
        "location_name": "Tokyo",
        "density_score": 0.92,
        "cultural_clusters": ["Harajuku", "Shibuya", "Daikanyama", "Shimokitazawa", "Ginza"],
        "top_venues": [
            {"name": "Dover Street Market Ginza", "category": "luxury_street", "affinity": 0.95},
            {"name": "Beams Harajuku", "category": "lifestyle", "affinity": 0.91},
        ],
    },
}


def generate_synthetic_entities(
    query: str, domain: str | None = None, limit: int = 10
) -> list[QlooEntity]:
    """Generate deterministic synthetic entities matching query keywords."""
    query_lower = query.lower()
    matches: list[dict[str, Any]] = []

    for group_key, entities in KNOWN_ENTITIES.items():
        if group_key in query_lower or any(query_lower in e["name"].lower() for e in entities):
            matches.extend(entities)

    if not matches:
        # Generate dynamic deterministic entity
        clean_name = query.strip().title()
        dom = domain or "general_consumer"
        matches.append(
            {
                "id": f"ent_gen_{abs(hash(clean_name)) % 1000000:06d}",
                "name": clean_name,
                "domain": dom,
                "tags": [dom, "cultural_seed"],
                "popularity": 0.72,
            }
        )

    return [QlooEntity(**m) for m in matches[:limit]]


def generate_synthetic_audience_insights(
    seed_entities: list[str],
    target_categories: list[str] | None = None,
    location: str | None = None,
) -> QlooAudienceInsights:
    """Generate realistic cross-domain audience affinities."""
    categories = target_categories or ["fashion", "music", "dining", "art_design"]
    loc_key = (location or "london").lower()
    loc_factor = 0.85 if "london" in loc_key else (0.78 if "berlin" in loc_key else 0.80)

    affinities: list[QlooAffinityItem] = []

    # Generate domain correlations
    sample_entities = [
        ("ent_corr_electronic_music", "Leftfield Electronic & House", "music", 0.86),
        ("ent_corr_specialty_dining", "Third-Wave Micro-Roasteries & Natural Wine", "dining", 0.82),
        ("ent_corr_indie_fashion", "Functional Minimalist Apparel", "fashion", 0.89),
        ("ent_corr_print_publishing", "Independent Design Periodicals", "media", 0.77),
    ]

    for ent_id, name, cat, base_score in sample_entities:
        if not target_categories or cat in categories:
            score = round(min(0.98, max(0.20, base_score * loc_factor)), 3)
            affinities.append(
                QlooAffinityItem(
                    entity_id=ent_id,
                    name=name,
                    category=cat,
                    affinity_score=score,
                    relevance=round(score * 0.95, 3),
                )
            )

    return QlooAudienceInsights(
        query_entities=seed_entities,
        affinities=affinities,
        top_categories=categories,
        demographic_skew={
            "age_20_29": 0.42,
            "age_30_39": 0.38,
            "age_40_plus": 0.20,
            "urban_density": 0.86,
        },
        raw_payload={"synthetic": True, "location": location, "seed_count": len(seed_entities)},
    )


def generate_synthetic_location_insights(
    location_code: str,
    categories: list[str] | None = None,
) -> QlooLocationInsights:
    """Generate locality density and subculture hub distribution."""
    loc_key = location_code.lower()
    matched = None
    for k, v in LOCATION_DEFAULTS.items():
        if k in loc_key or v["location_code"].lower() in loc_key:
            matched = v
            break

    if not matched:
        matched = {
            "location_code": location_code.upper(),
            "location_name": location_code.upper(),
            "density_score": 0.70,
            "cultural_clusters": ["Central District", "Arts Quarter"],
            "top_venues": [],
        }

    return QlooLocationInsights(
        location_code=matched["location_code"],
        location_name=matched["location_name"],
        density_score=matched["density_score"],
        cultural_clusters=matched["cultural_clusters"],
        top_venues=matched["top_venues"],
        raw_payload={"synthetic": True, "location_code": location_code},
    )


def generate_synthetic_trend_insights(
    entity_or_category: str,
    interval_days: int = 90,
) -> QlooTrendInsights:
    """Generate momentum velocity and cultural trajectory."""
    # Deterministic trajectory based on category name
    cat_lower = entity_or_category.lower()
    if any(k in cat_lower for k in ["streetwear", "coffee", "electronic", "sustainability"]):
        velocity = 0.38
        trajectory = "accelerating"
    elif any(k in cat_lower for k in ["fast_fashion", "generic"]):
        velocity = -0.15
        trajectory = "decelerating"
    else:
        velocity = 0.12
        trajectory = "stable"

    return QlooTrendInsights(
        entity_or_category=entity_or_category,
        interval_days=interval_days,
        momentum_velocity=velocity,
        trajectory=trajectory,
        raw_payload={"synthetic": True, "interval_days": interval_days},
    )
