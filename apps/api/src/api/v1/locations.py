from typing import Any
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/locations", tags=["Locations & Markets"])


class LocationItem(BaseModel):
    id: str
    name: str
    country: str
    country_code: str
    location_code: str
    region: str
    potential: str
    description: str
    flag: str
    color: str


GLOBAL_LOCATIONS: list[dict[str, Any]] = [
    {
        "id": "jp-tyo",
        "name": "Tokyo",
        "country": "Japan",
        "country_code": "JP",
        "location_code": "JP-TYO",
        "region": "Asia",
        "potential": "High potential",
        "description": "Strong streetwear, music and youth subculture hub",
        "flag": "🇯🇵",
        "color": "from-rose-500/15 via-red-500/10 to-transparent",
    },
    {
        "id": "kr-sel",
        "name": "Seoul",
        "country": "South Korea",
        "country_code": "KR",
        "location_code": "KR-SEL",
        "region": "Asia",
        "potential": "High potential",
        "description": "K-pop, avant-garde fashion and digital-first youth culture",
        "flag": "🇰🇷",
        "color": "from-blue-500/15 via-indigo-500/10 to-transparent",
    },
    {
        "id": "us-nyc",
        "name": "New York",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-NYC",
        "region": "North America",
        "potential": "High potential",
        "description": "Global trendsetter in streetwear, luxury and media innovation",
        "flag": "🇺🇸",
        "color": "from-amber-500/15 via-orange-500/10 to-transparent",
    },
    {
        "id": "gb-lnd",
        "name": "London",
        "country": "UK",
        "country_code": "GB",
        "location_code": "GB-LND",
        "region": "Europe",
        "potential": "Medium",
        "description": "Eclectic creative culture with strong fashion and underground music",
        "flag": "🇬🇧",
        "color": "from-indigo-500/15 via-violet-500/10 to-transparent",
    },
    {
        "id": "sg-sin",
        "name": "Singapore",
        "country": "Singapore",
        "country_code": "SG",
        "location_code": "SG-SIN",
        "region": "Asia",
        "potential": "High",
        "description": "Southeast Asian financial and luxury gateway with affluent consumer base",
        "flag": "🇸🇬",
        "color": "from-emerald-500/15 via-teal-500/10 to-transparent",
    },
    {
        "id": "th-bkk",
        "name": "Bangkok",
        "country": "Thailand",
        "country_code": "TH",
        "location_code": "TH-BKK",
        "region": "Asia",
        "potential": "High",
        "description": "Fast-growing creative hub with vibrant street fashion and cafe lifestyle",
        "flag": "🇹🇭",
        "color": "from-purple-500/15 via-pink-500/10 to-transparent",
    },
    {
        "id": "de-ber",
        "name": "Berlin",
        "country": "Germany",
        "country_code": "DE",
        "location_code": "DE-BER",
        "region": "Europe",
        "potential": "Medium",
        "description": "Leading European counterculture, club scene and indie aesthetics",
        "flag": "🇩🇪",
        "color": "from-yellow-500/15 via-amber-500/10 to-transparent",
    },
    {
        "id": "us-lax",
        "name": "Los Angeles",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-LAX",
        "region": "North America",
        "potential": "High potential",
        "description": "Entertainment, skate culture and influencer-driven lifestyle epicenter",
        "flag": "🇺🇸",
        "color": "from-cyan-500/15 via-sky-500/10 to-transparent",
    },
    {
        "id": "fr-par",
        "name": "Paris",
        "country": "France",
        "country_code": "FR",
        "location_code": "FR-PAR",
        "region": "Europe",
        "potential": "High potential",
        "description": "Global luxury capital, haute couture and refined cultural heritage",
        "flag": "🇫🇷",
        "color": "from-blue-600/15 via-indigo-600/10 to-transparent",
    },
    {
        "id": "ae-dxb",
        "name": "Dubai",
        "country": "United Arab Emirates",
        "country_code": "AE",
        "location_code": "AE-DXB",
        "region": "Middle East",
        "potential": "High potential",
        "description": "Rapid luxury retail growth, experiential hospitality and cosmopolitan market",
        "flag": "🇦🇪",
        "color": "from-amber-600/15 via-yellow-600/10 to-transparent",
    },
    {
        "id": "in-bom",
        "name": "Mumbai",
        "country": "India",
        "country_code": "IN",
        "location_code": "IN-BOM",
        "region": "Asia",
        "potential": "High potential",
        "description": "Bollywood, burgeoning Gen Z streetwear and booming consumer tech adoption",
        "flag": "🇮🇳",
        "color": "from-orange-500/15 via-amber-500/10 to-transparent",
    },
    {
        "id": "au-syd",
        "name": "Sydney",
        "country": "Australia",
        "country_code": "AU",
        "location_code": "AU-SYD",
        "region": "Oceania",
        "potential": "Medium",
        "description": "Outdoor lifestyle, surf apparel and premium specialty coffee culture",
        "flag": "🇦🇺",
        "color": "from-sky-500/15 via-teal-500/10 to-transparent",
    },
    {
        "id": "ca-tor",
        "name": "Toronto",
        "country": "Canada",
        "country_code": "CA",
        "location_code": "CA-TOR",
        "region": "North America",
        "potential": "High",
        "description": "Diverse multicultural market with strong music and contemporary streetwear",
        "flag": "🇨🇦",
        "color": "from-red-600/15 via-rose-600/10 to-transparent",
    },
    {
        "id": "it-mil",
        "name": "Milan",
        "country": "Italy",
        "country_code": "IT",
        "location_code": "IT-MIL",
        "region": "Europe",
        "potential": "High potential",
        "description": "Fashion design capital with high artisan craft and luxury retail prestige",
        "flag": "🇮🇹",
        "color": "from-emerald-600/15 via-green-600/10 to-transparent",
    },
    {
        "id": "nl-ams",
        "name": "Amsterdam",
        "country": "Netherlands",
        "country_code": "NL",
        "location_code": "NL-AMS",
        "region": "Europe",
        "potential": "Medium",
        "description": "Circular design, sustainability leadership and denim innovation",
        "flag": "🇳🇱",
        "color": "from-orange-600/15 via-amber-600/10 to-transparent",
    },
    {
        "id": "hk-hkg",
        "name": "Hong Kong",
        "country": "Hong Kong",
        "country_code": "HK",
        "location_code": "HK-HKG",
        "region": "Asia",
        "potential": "High",
        "description": "High-density retail, luxury flagship market and sneaker collector culture",
        "flag": "🇭🇰",
        "color": "from-red-500/15 via-pink-500/10 to-transparent",
    },
    {
        "id": "br-sao",
        "name": "São Paulo",
        "country": "Brazil",
        "country_code": "BR",
        "location_code": "BR-SAO",
        "region": "Latin America",
        "potential": "High",
        "description": "Latin America's fashion capital with energetic urban art and festival scene",
        "flag": "🇧🇷",
        "color": "from-green-500/15 via-yellow-500/10 to-transparent",
    },
    {
        "id": "es-mad",
        "name": "Madrid",
        "country": "Spain",
        "country_code": "ES",
        "location_code": "ES-MAD",
        "region": "Europe",
        "potential": "Medium",
        "description": "Fast-paced social dining, nightlife and accessible fashion trends",
        "flag": "🇪🇸",
        "color": "from-yellow-600/15 via-red-600/10 to-transparent",
    },
    {
        "id": "sa-ruh",
        "name": "Riyadh",
        "country": "Saudi Arabia",
        "country_code": "SA",
        "location_code": "SA-RUH",
        "region": "Middle East",
        "potential": "High potential",
        "description": "Vision 2030 cultural boom, massive youth demographic and luxury appetite",
        "flag": "🇸🇦",
        "color": "from-emerald-700/15 via-green-700/10 to-transparent",
    },
    {
        "id": "se-sto",
        "name": "Stockholm",
        "country": "Sweden",
        "country_code": "SE",
        "location_code": "SE-STO",
        "region": "Europe",
        "potential": "Medium",
        "description": "Scandinavian minimalism, tech forwardness and sustainable consumer trends",
        "flag": "🇸🇪",
        "color": "from-blue-500/15 via-yellow-500/10 to-transparent",
    },
    {
        "id": "us-sfo",
        "name": "San Francisco",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-SFO",
        "region": "North America",
        "potential": "High",
        "description": "Silicon Valley tech culture, athleisure and high disposable income",
        "flag": "🇺🇸",
        "color": "from-cyan-600/15 via-blue-600/10 to-transparent",
    },
]


@router.get("", response_model=list[LocationItem])
async def search_locations(
    query: str | None = Query(None, description="Search term for city, country, or code"),
    region: str | None = Query(None, description="Filter by region (Asia, Europe, etc.)"),
    limit: int = Query(50, ge=1, le=100),
) -> list[LocationItem]:
    """Search and filter available cultural candidate locations and metros."""
    results = GLOBAL_LOCATIONS

    if region and region != "All markets":
        results = [loc for loc in results if loc["region"].lower() == region.lower()]

    if query and query.strip():
        q = query.strip().lower()
        results = [
            loc
            for loc in results
            if (
                q in loc["name"].lower()
                or q in loc["country"].lower()
                or q in loc["country_code"].lower()
                or q in loc["location_code"].lower()
                or q in loc["region"].lower()
                or q in loc["description"].lower()
            )
        ]

    return [LocationItem(**loc) for loc in results[:limit]]
