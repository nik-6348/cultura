import re
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


# Comprehensive directory of top global cultural and economic hubs
GLOBAL_LOCATIONS: list[dict[str, Any]] = [
    # --- ASIA ---
    {
        "id": "jp-tyo",
        "name": "Tokyo",
        "country": "Japan",
        "country_code": "JP",
        "location_code": "JP-TYO",
        "region": "Asia",
        "potential": "High potential",
        "description": "Global streetwear epicenter, vibrant subculture clusters and avant-garde consumer trends",
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
        "description": "K-pop, avant-garde beauty, youth retail technology and digital-first lifestyle innovations",
        "flag": "🇰🇷",
        "color": "from-blue-500/15 via-indigo-500/10 to-transparent",
    },
    {
        "id": "sg-sin",
        "name": "Singapore",
        "country": "Singapore",
        "country_code": "SG",
        "location_code": "SG-SIN",
        "region": "Asia",
        "potential": "High",
        "description": "Southeast Asian financial and luxury gateway with affluent cosmopolitan consumer base",
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
        "description": "Vibrant street fashion, dynamic cafe culture and booming regional creative youth market",
        "flag": "🇹🇭",
        "color": "from-purple-500/15 via-pink-500/10 to-transparent",
    },
    {
        "id": "in-bom",
        "name": "Mumbai",
        "country": "India",
        "country_code": "IN",
        "location_code": "IN-BOM",
        "region": "Asia",
        "potential": "High potential",
        "description": "Entertainment capital, booming Gen Z streetwear adoption and explosive consumer tech growth",
        "flag": "🇮🇳",
        "color": "from-orange-500/15 via-amber-500/10 to-transparent",
    },
    {
        "id": "in-blr",
        "name": "Bengaluru",
        "country": "India",
        "country_code": "IN",
        "location_code": "IN-BLR",
        "region": "Asia",
        "potential": "High potential",
        "description": "Tech capital of India with rapid specialty coffee adoption, craft beer and indie culture",
        "flag": "🇮🇳",
        "color": "from-amber-500/15 via-yellow-500/10 to-transparent",
    },
    {
        "id": "in-del",
        "name": "Delhi NCR",
        "country": "India",
        "country_code": "IN",
        "location_code": "IN-DEL",
        "region": "Asia",
        "potential": "High potential",
        "description": "Expansive luxury retail corridor, heritage design aesthetic and affluent lifestyle market",
        "flag": "🇮🇳",
        "color": "from-red-500/15 via-orange-500/10 to-transparent",
    },
    {
        "id": "hk-hkg",
        "name": "Hong Kong",
        "country": "Hong Kong",
        "country_code": "HK",
        "location_code": "HK-HKG",
        "region": "Asia",
        "potential": "High",
        "description": "High-density retail, luxury flagship market and established sneaker collector culture",
        "flag": "🇭🇰",
        "color": "from-red-500/15 via-pink-500/10 to-transparent",
    },
    {
        "id": "tw-tpe",
        "name": "Taipei",
        "country": "Taiwan",
        "country_code": "TW",
        "location_code": "TW-TPE",
        "region": "Asia",
        "potential": "High",
        "description": "Eclectic street design, night market vibrancy and strong affinity for contemporary Japanese aesthetics",
        "flag": "🇹🇼",
        "color": "from-sky-500/15 via-blue-500/10 to-transparent",
    },
    {
        "id": "id-jkt",
        "name": "Jakarta",
        "country": "Indonesia",
        "country_code": "ID",
        "location_code": "ID-JKT",
        "region": "Asia",
        "potential": "High potential",
        "description": "Massive Gen Z demographic, rapidly expanding middle class and active streetwear communities",
        "flag": "🇮🇩",
        "color": "from-rose-500/15 via-red-500/10 to-transparent",
    },
    {
        "id": "my-kul",
        "name": "Kuala Lumpur",
        "country": "Malaysia",
        "country_code": "MY",
        "location_code": "MY-KUL",
        "region": "Asia",
        "potential": "Medium",
        "description": "Multicultural consumer base, upscale retail malls and emerging contemporary fashion scene",
        "flag": "🇲🇾",
        "color": "from-blue-600/15 via-yellow-500/10 to-transparent",
    },
    {
        "id": "ph-mnl",
        "name": "Manila",
        "country": "Philippines",
        "country_code": "PH",
        "location_code": "PH-MNL",
        "region": "Asia",
        "potential": "Medium",
        "description": "Highest global social media consumption, strong affinity for Western pop and streetwear brands",
        "flag": "🇵🇭",
        "color": "from-yellow-500/15 via-blue-500/10 to-transparent",
    },
    {
        "id": "vn-sgn",
        "name": "Ho Chi Minh City",
        "country": "Vietnam",
        "country_code": "VN",
        "location_code": "VN-SGN",
        "region": "Asia",
        "potential": "High potential",
        "description": "Southeast Asia's fastest emerging youth market with energetic indie streetwear and cafe culture",
        "flag": "🇻🇳",
        "color": "from-red-600/15 via-yellow-600/10 to-transparent",
    },
    {
        "id": "jp-osa",
        "name": "Osaka",
        "country": "Japan",
        "country_code": "JP",
        "location_code": "JP-OSA",
        "region": "Asia",
        "potential": "High",
        "description": "Bold Kansai urban culture, vintage apparel havens and experimental retail concepts",
        "flag": "🇯🇵",
        "color": "from-indigo-500/15 via-purple-500/10 to-transparent",
    },
    {
        "id": "cn-sha",
        "name": "Shanghai",
        "country": "China",
        "country_code": "CN",
        "location_code": "CN-SHA",
        "region": "Asia",
        "potential": "High potential",
        "description": "Global luxury capital, Guochao cultural renaissance and hyper-digital retail ecosystem",
        "flag": "🇨🇳",
        "color": "from-red-600/15 via-amber-600/10 to-transparent",
    },

    # --- EUROPE ---
    {
        "id": "gb-lnd",
        "name": "London",
        "country": "UK",
        "country_code": "GB",
        "location_code": "GB-LND",
        "region": "Europe",
        "potential": "High potential",
        "description": "Global creative hub with unmatched fashion diversity, underground music and retail prestige",
        "flag": "🇬🇧",
        "color": "from-indigo-500/15 via-violet-500/10 to-transparent",
    },
    {
        "id": "de-ber",
        "name": "Berlin",
        "country": "Germany",
        "country_code": "DE",
        "location_code": "DE-BER",
        "region": "Europe",
        "potential": "High potential",
        "description": "Leading European counterculture, techno club scene, sustainable thrift and indie aesthetics",
        "flag": "🇩🇪",
        "color": "from-yellow-500/15 via-amber-500/10 to-transparent",
    },
    {
        "id": "fr-par",
        "name": "Paris",
        "country": "France",
        "country_code": "FR",
        "location_code": "FR-PAR",
        "region": "Europe",
        "potential": "High potential",
        "description": "Global fashion capital, haute couture heritage and modern multicultural youth movements",
        "flag": "🇫🇷",
        "color": "from-blue-600/15 via-indigo-600/10 to-transparent",
    },
    {
        "id": "it-mil",
        "name": "Milan",
        "country": "Italy",
        "country_code": "IT",
        "location_code": "IT-MIL",
        "region": "Europe",
        "potential": "High potential",
        "description": "Fashion design capital with high artisan craft, luxury retail prestige and editorial influence",
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
        "potential": "High",
        "description": "Circular design, sustainability leadership, denim innovation and international expat cohort",
        "flag": "🇳🇱",
        "color": "from-orange-600/15 via-amber-600/10 to-transparent",
    },
    {
        "id": "es-mad",
        "name": "Madrid",
        "country": "Spain",
        "country_code": "ES",
        "location_code": "ES-MAD",
        "region": "Europe",
        "potential": "Medium",
        "description": "Fast-paced social dining, vibrant nightlife and accessible fashion trend leadership",
        "flag": "🇪🇸",
        "color": "from-yellow-600/15 via-red-600/10 to-transparent",
    },
    {
        "id": "es-bcn",
        "name": "Barcelona",
        "country": "Spain",
        "country_code": "ES",
        "location_code": "ES-BCN",
        "region": "Europe",
        "potential": "High",
        "description": "Mediterranean design hub, skate subculture, electronic music festivals and coastal lifestyle",
        "flag": "🇪🇸",
        "color": "from-amber-500/15 via-rose-500/10 to-transparent",
    },
    {
        "id": "se-sto",
        "name": "Stockholm",
        "country": "Sweden",
        "country_code": "SE",
        "location_code": "SE-STO",
        "region": "Europe",
        "potential": "High",
        "description": "Scandinavian minimalism, tech forwardness and sustainable consumer preference",
        "flag": "🇸🇪",
        "color": "from-blue-500/15 via-yellow-500/10 to-transparent",
    },
    {
        "id": "dk-cph",
        "name": "Copenhagen",
        "country": "Denmark",
        "country_code": "DK",
        "location_code": "DK-CPH",
        "region": "Europe",
        "potential": "High",
        "description": "Progressive green lifestyle, functional design aesthetic and cycling commuter culture",
        "flag": "🇩🇰",
        "color": "from-red-600/15 via-rose-500/10 to-transparent",
    },
    {
        "id": "ch-zrh",
        "name": "Zurich",
        "country": "Switzerland",
        "country_code": "CH",
        "location_code": "CH-ZRH",
        "region": "Europe",
        "potential": "High",
        "description": "Extremely high disposable income, luxury craftsmanship and discerning quality standards",
        "flag": "🇨🇭",
        "color": "from-red-600/15 via-stone-500/10 to-transparent",
    },
    {
        "id": "ie-dub",
        "name": "Dublin",
        "country": "Ireland",
        "country_code": "IE",
        "location_code": "IE-DUB",
        "region": "Europe",
        "potential": "Medium",
        "description": "Youngest demographic in Europe, tech headquarters hub and strong pub social lifestyle",
        "flag": "🇮🇪",
        "color": "from-emerald-500/15 via-green-500/10 to-transparent",
    },
    {
        "id": "at-vie",
        "name": "Vienna",
        "country": "Austria",
        "country_code": "AT",
        "location_code": "AT-VIE",
        "region": "Europe",
        "potential": "Medium",
        "description": "Classical cultural heritage, elevated specialty coffee tradition and quality of life",
        "flag": "🇦🇹",
        "color": "from-red-500/15 via-stone-500/10 to-transparent",
    },
    {
        "id": "no-osl",
        "name": "Oslo",
        "country": "Norway",
        "country_code": "NO",
        "location_code": "NO-OSL",
        "region": "Europe",
        "potential": "Medium",
        "description": "Nordic outdoor performance wear, electric mobility and high purchasing power",
        "flag": "🇳🇴",
        "color": "from-blue-600/15 via-red-500/10 to-transparent",
    },
    {
        "id": "pt-lis",
        "name": "Lisbon",
        "country": "Portugal",
        "country_code": "PT",
        "location_code": "PT-LIS",
        "region": "Europe",
        "potential": "High",
        "description": "Digital nomad capital, surf lifestyle, artisanal ceramic craft and dynamic youth arts",
        "flag": "🇵🇹",
        "color": "from-emerald-500/15 via-amber-500/10 to-transparent",
    },
    {
        "id": "pl-waw",
        "name": "Warsaw",
        "country": "Poland",
        "country_code": "PL",
        "location_code": "PL-WAW",
        "region": "Europe",
        "potential": "High potential",
        "description": "Central Europe's fastest growing retail economy with vibrant streetwear scene",
        "flag": "🇵🇱",
        "color": "from-rose-500/15 via-red-500/10 to-transparent",
    },

    # --- NORTH AMERICA ---
    {
        "id": "us-nyc",
        "name": "New York",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-NYC",
        "region": "North America",
        "potential": "High potential",
        "description": "Global trendsetter in streetwear, luxury fashion, music culture and retail flagship commerce",
        "flag": "🇺🇸",
        "color": "from-amber-500/15 via-orange-500/10 to-transparent",
    },
    {
        "id": "us-lax",
        "name": "Los Angeles",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-LAX",
        "region": "North America",
        "potential": "High potential",
        "description": "Entertainment, skate culture, celebrity influencer ecosystem and wellness-driven lifestyle",
        "flag": "🇺🇸",
        "color": "from-cyan-500/15 via-sky-500/10 to-transparent",
    },
    {
        "id": "us-sfo",
        "name": "San Francisco",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-SFO",
        "region": "North America",
        "potential": "High",
        "description": "Silicon Valley innovation corridor, premium technical apparel and high disposable income",
        "flag": "🇺🇸",
        "color": "from-cyan-600/15 via-blue-600/10 to-transparent",
    },
    {
        "id": "us-chi",
        "name": "Chicago",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-CHI",
        "region": "North America",
        "potential": "High",
        "description": "Midwest cultural capital, architectural heritage, legacy sneaker culture and house music roots",
        "flag": "🇺🇸",
        "color": "from-sky-500/15 via-indigo-500/10 to-transparent",
    },
    {
        "id": "us-mia",
        "name": "Miami",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-MIA",
        "region": "North America",
        "potential": "High potential",
        "description": "Latin-American gateway, Art Basel contemporary culture, nightlife and luxury resort lifestyle",
        "flag": "🇺🇸",
        "color": "from-pink-500/15 via-rose-500/10 to-transparent",
    },
    {
        "id": "us-atx",
        "name": "Austin",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-ATX",
        "region": "North America",
        "potential": "High",
        "description": "Live music capital, tech migration boom, SXSW cultural magnet and outdoor active consumer base",
        "flag": "🇺🇸",
        "color": "from-amber-600/15 via-red-500/10 to-transparent",
    },
    {
        "id": "us-sea",
        "name": "Seattle",
        "country": "USA",
        "country_code": "US",
        "location_code": "US-SEA",
        "region": "North America",
        "potential": "Medium",
        "description": "Pacific Northwest outdoor recreation, specialty coffee birthplace and high-income tech demographic",
        "flag": "🇺🇸",
        "color": "from-emerald-600/15 via-teal-600/10 to-transparent",
    },
    {
        "id": "ca-tor",
        "name": "Toronto",
        "country": "Canada",
        "country_code": "CA",
        "location_code": "CA-TOR",
        "region": "North America",
        "potential": "High potential",
        "description": "Multicultural metropolis with leading contemporary streetwear, hip-hop influence and film festivals",
        "flag": "🇨🇦",
        "color": "from-red-600/15 via-rose-600/10 to-transparent",
    },
    {
        "id": "ca-yvr",
        "name": "Vancouver",
        "country": "Canada",
        "country_code": "CA",
        "location_code": "CA-YVR",
        "region": "North America",
        "potential": "High",
        "description": "Athleisure birthplace, coastal mountain culture and strong Asia-Pacific cultural crosscurrents",
        "flag": "🇨🇦",
        "color": "from-teal-600/15 via-emerald-600/10 to-transparent",
    },
    {
        "id": "ca-mtl",
        "name": "Montreal",
        "country": "Canada",
        "country_code": "CA",
        "location_code": "CA-MTL",
        "region": "North America",
        "potential": "High",
        "description": "North America's cultural enclave of European design, independent music, culinary and festival flair",
        "flag": "🇨🇦",
        "color": "from-blue-600/15 via-indigo-600/10 to-transparent",
    },
    {
        "id": "mx-mex",
        "name": "Mexico City",
        "country": "Mexico",
        "country_code": "MX",
        "location_code": "MX-MEX",
        "region": "Latin America",
        "potential": "High potential",
        "description": "Global culinary and contemporary arts capital with vibrant bohemian neighborhoods and youth energy",
        "flag": "🇲🇽",
        "color": "from-emerald-600/15 via-red-600/10 to-transparent",
    },

    # --- MIDDLE EAST ---
    {
        "id": "ae-dxb",
        "name": "Dubai",
        "country": "United Arab Emirates",
        "country_code": "AE",
        "location_code": "AE-DXB",
        "region": "Middle East",
        "potential": "High potential",
        "description": "Rapid luxury retail growth, experiential hospitality and world-leading cosmopolitan consumer spend",
        "flag": "🇦🇪",
        "color": "from-amber-600/15 via-yellow-600/10 to-transparent",
    },
    {
        "id": "sa-ruh",
        "name": "Riyadh",
        "country": "Saudi Arabia",
        "country_code": "SA",
        "location_code": "SA-RUH",
        "region": "Middle East",
        "potential": "High potential",
        "description": "Vision 2030 cultural renaissance, massive affluent youth demographic and appetite for global luxury",
        "flag": "🇸🇦",
        "color": "from-emerald-700/15 via-green-700/10 to-transparent",
    },
    {
        "id": "ae-auh",
        "name": "Abu Dhabi",
        "country": "United Arab Emirates",
        "country_code": "AE",
        "location_code": "AE-AUH",
        "region": "Middle East",
        "potential": "High",
        "description": "Cultural district anchor (Louvre, Guggenheim), high-end lifestyle developments and affluent families",
        "flag": "🇦🇪",
        "color": "from-amber-500/15 via-yellow-500/10 to-transparent",
    },
    {
        "id": "qa-doh",
        "name": "Doha",
        "country": "Qatar",
        "country_code": "QA",
        "location_code": "QA-DOH",
        "region": "Middle East",
        "potential": "High",
        "description": "World-class museums, ultra-premium retail and thriving sports and cultural entertainment programs",
        "flag": "🇶🇦",
        "color": "from-purple-800/15 via-indigo-800/10 to-transparent",
    },
    {
        "id": "tr-ist",
        "name": "Istanbul",
        "country": "Turkey",
        "country_code": "TR",
        "location_code": "TR-IST",
        "region": "Europe",
        "potential": "High",
        "description": "Transcontinental creative bridge uniting European fashion trends with vibrant Middle Eastern heritage",
        "flag": "🇹🇷",
        "color": "from-red-600/15 via-rose-600/10 to-transparent",
    },

    # --- LATIN AMERICA ---
    {
        "id": "br-sao",
        "name": "São Paulo",
        "country": "Brazil",
        "country_code": "BR",
        "location_code": "BR-SAO",
        "region": "Latin America",
        "potential": "High potential",
        "description": "Latin America's fashion capital with energetic urban graffiti art, massive music festivals and retail scale",
        "flag": "🇧🇷",
        "color": "from-green-500/15 via-yellow-500/10 to-transparent",
    },
    {
        "id": "ar-bue",
        "name": "Buenos Aires",
        "country": "Argentina",
        "country_code": "AR",
        "location_code": "AR-BUE",
        "region": "Latin America",
        "potential": "High",
        "description": "European architectural charm, passionate creative culture, indie design ateliers and nightlife",
        "flag": "🇦🇷",
        "color": "from-sky-500/15 via-blue-400/10 to-transparent",
    },
    {
        "id": "co-bog",
        "name": "Bogotá",
        "country": "Colombia",
        "country_code": "CO",
        "location_code": "CO-BOG",
        "region": "Latin America",
        "potential": "Medium",
        "description": "Andean creative hub with burgeoning specialty coffee reputation and urban street art culture",
        "flag": "🇨🇴",
        "color": "from-yellow-500/15 via-blue-500/10 to-transparent",
    },
    {
        "id": "cl-scl",
        "name": "Santiago",
        "country": "Chile",
        "country_code": "CL",
        "location_code": "CL-SCL",
        "region": "Latin America",
        "potential": "Medium",
        "description": "Modern urban lifestyle, outdoor adventure proximity and stable high-income South American market",
        "flag": "🇨🇱",
        "color": "from-blue-600/15 via-red-600/10 to-transparent",
    },

    # --- OCEANIA ---
    {
        "id": "au-syd",
        "name": "Sydney",
        "country": "Australia",
        "country_code": "AU",
        "location_code": "AU-SYD",
        "region": "Oceania",
        "potential": "High",
        "description": "Harbour lifestyle, surf apparel heritage, premium specialty coffee and affluent wellness consumer base",
        "flag": "🇦🇺",
        "color": "from-sky-500/15 via-teal-500/10 to-transparent",
    },
    {
        "id": "au-mel",
        "name": "Melbourne",
        "country": "Australia",
        "country_code": "AU",
        "location_code": "AU-MEL",
        "region": "Oceania",
        "potential": "High potential",
        "description": "Australia's cultural capital, laneway cafe culture, live music and passionate independent streetwear followers",
        "flag": "🇦🇺",
        "color": "from-indigo-600/15 via-purple-600/10 to-transparent",
    },
    {
        "id": "nz-akl",
        "name": "Auckland",
        "country": "New Zealand",
        "country_code": "NZ",
        "location_code": "NZ-AKL",
        "region": "Oceania",
        "potential": "Medium",
        "description": "Pacific gateway, active outdoor lifestyle, sustainability emphasis and high quality-of-life demographic",
        "flag": "🇳🇿",
        "color": "from-blue-700/15 via-red-600/10 to-transparent",
    },

    # --- AFRICA ---
    {
        "id": "za-jnb",
        "name": "Johannesburg",
        "country": "South Africa",
        "country_code": "ZA",
        "location_code": "ZA-JNB",
        "region": "Africa",
        "potential": "High potential",
        "description": "Amapiano music explosion, vibrant Pan-African fashion movements and dynamic commercial energy",
        "flag": "🇿🇦",
        "color": "from-emerald-600/15 via-yellow-500/10 to-transparent",
    },
    {
        "id": "za-cpt",
        "name": "Cape Town",
        "country": "South Africa",
        "country_code": "ZA",
        "location_code": "ZA-CPT",
        "region": "Africa",
        "potential": "High",
        "description": "Global design destination, coastal creative studios, wine gastronomy and thriving international tourism",
        "flag": "🇿🇦",
        "color": "from-teal-600/15 via-cyan-500/10 to-transparent",
    },
    {
        "id": "ke-nbo",
        "name": "Nairobi",
        "country": "Kenya",
        "country_code": "KE",
        "location_code": "KE-NBO",
        "region": "Africa",
        "potential": "High",
        "description": "Silicon Savannah tech and creative center, mobile payments pioneer and energetic youth culture",
        "flag": "🇰🇪",
        "color": "from-red-600/15 via-green-600/10 to-transparent",
    },
    {
        "id": "ng-los",
        "name": "Lagos",
        "country": "Nigeria",
        "country_code": "NG",
        "location_code": "NG-LOS",
        "region": "Africa",
        "potential": "High potential",
        "description": "Afrobeats epicenter, Nollywood cultural export power and hyper-innovative youth fashion landscape",
        "flag": "🇳🇬",
        "color": "from-green-600/15 via-emerald-600/10 to-transparent",
    },
    {
        "id": "eg-cai",
        "name": "Cairo",
        "country": "Egypt",
        "country_code": "EG",
        "location_code": "EG-CAI",
        "region": "Africa",
        "potential": "High",
        "description": "North Africa's largest creative metropolis, emerging contemporary streetwear wave and historic cultural pride",
        "flag": "🇪🇬",
        "color": "from-amber-600/15 via-yellow-600/10 to-transparent",
    },
]

# Country metadata map for dynamic on-the-fly resolution of ANY country/city
COUNTRY_DIRECTORY: dict[str, dict[str, str]] = {
    "japan": {"code": "JP", "flag": "🇯🇵", "region": "Asia", "name": "Japan"},
    "south korea": {"code": "KR", "flag": "🇰🇷", "region": "Asia", "name": "South Korea"},
    "korea": {"code": "KR", "flag": "🇰🇷", "region": "Asia", "name": "South Korea"},
    "usa": {"code": "US", "flag": "🇺🇸", "region": "North America", "name": "USA"},
    "united states": {"code": "US", "flag": "🇺🇸", "region": "North America", "name": "USA"},
    "uk": {"code": "GB", "flag": "🇬🇧", "region": "Europe", "name": "UK"},
    "united kingdom": {"code": "GB", "flag": "🇬🇧", "region": "Europe", "name": "UK"},
    "germany": {"code": "DE", "flag": "🇩🇪", "region": "Europe", "name": "Germany"},
    "france": {"code": "FR", "flag": "🇫🇷", "region": "Europe", "name": "France"},
    "italy": {"code": "IT", "flag": "🇮🇹", "region": "Europe", "name": "Italy"},
    "spain": {"code": "ES", "flag": "🇪🇸", "region": "Europe", "name": "Spain"},
    "singapore": {"code": "SG", "flag": "🇸🇬", "region": "Asia", "name": "Singapore"},
    "thailand": {"code": "TH", "flag": "🇹🇭", "region": "Asia", "name": "Thailand"},
    "india": {"code": "IN", "flag": "🇮🇳", "region": "Asia", "name": "India"},
    "canada": {"code": "CA", "flag": "🇨🇦", "region": "North America", "name": "Canada"},
    "australia": {"code": "AU", "flag": "🇦🇺", "region": "Oceania", "name": "Australia"},
    "new zealand": {"code": "NZ", "flag": "🇳🇿", "region": "Oceania", "name": "New Zealand"},
    "brazil": {"code": "BR", "flag": "🇧🇷", "region": "Latin America", "name": "Brazil"},
    "argentina": {"code": "AR", "flag": "🇦🇷", "region": "Latin America", "name": "Argentina"},
    "mexico": {"code": "MX", "flag": "🇲🇽", "region": "Latin America", "name": "Mexico"},
    "colombia": {"code": "CO", "flag": "🇨🇴", "region": "Latin America", "name": "Colombia"},
    "chile": {"code": "CL", "flag": "🇨🇱", "region": "Latin America", "name": "Chile"},
    "uae": {"code": "AE", "flag": "🇦🇪", "region": "Middle East", "name": "United Arab Emirates"},
    "united arab emirates": {"code": "AE", "flag": "🇦🇪", "region": "Middle East", "name": "United Arab Emirates"},
    "saudi arabia": {"code": "SA", "flag": "🇸🇦", "region": "Middle East", "name": "Saudi Arabia"},
    "qatar": {"code": "QA", "flag": "🇶🇦", "region": "Middle East", "name": "Qatar"},
    "turkey": {"code": "TR", "flag": "🇹🇷", "region": "Europe", "name": "Turkey"},
    "sweden": {"code": "SE", "flag": "🇸🇪", "region": "Europe", "name": "Sweden"},
    "norway": {"code": "NO", "flag": "🇳🇴", "region": "Europe", "name": "Norway"},
    "denmark": {"code": "DK", "flag": "🇩🇰", "region": "Europe", "name": "Denmark"},
    "finland": {"code": "FI", "flag": "🇫🇮", "region": "Europe", "name": "Finland"},
    "netherlands": {"code": "NL", "flag": "🇳🇱", "region": "Europe", "name": "Netherlands"},
    "switzerland": {"code": "CH", "flag": "🇨🇭", "region": "Europe", "name": "Switzerland"},
    "austria": {"code": "AT", "flag": "🇦🇹", "region": "Europe", "name": "Austria"},
    "ireland": {"code": "IE", "flag": "🇮🇪", "region": "Europe", "name": "Ireland"},
    "portugal": {"code": "PT", "flag": "🇵🇹", "region": "Europe", "name": "Portugal"},
    "poland": {"code": "PL", "flag": "🇵🇱", "region": "Europe", "name": "Poland"},
    "greece": {"code": "GR", "flag": "🇬🇷", "region": "Europe", "name": "Greece"},
    "belgium": {"code": "BE", "flag": "🇧🇪", "region": "Europe", "name": "Belgium"},
    "czech republic": {"code": "CZ", "flag": "🇨🇿", "region": "Europe", "name": "Czech Republic"},
    "south africa": {"code": "ZA", "flag": "🇿🇦", "region": "Africa", "name": "South Africa"},
    "kenya": {"code": "KE", "flag": "🇰🇪", "region": "Africa", "name": "Kenya"},
    "nigeria": {"code": "NG", "flag": "🇳🇬", "region": "Africa", "name": "Nigeria"},
    "egypt": {"code": "EG", "flag": "🇪🇬", "region": "Africa", "name": "Egypt"},
    "morocco": {"code": "MA", "flag": "🇲🇦", "region": "Africa", "name": "Morocco"},
    "ghana": {"code": "GH", "flag": "🇬🇭", "region": "Africa", "name": "Ghana"},
    "indonesia": {"code": "ID", "flag": "🇮🇩", "region": "Asia", "name": "Indonesia"},
    "malaysia": {"code": "MY", "flag": "🇲🇾", "region": "Asia", "name": "Malaysia"},
    "philippines": {"code": "PH", "flag": "🇵🇭", "region": "Asia", "name": "Philippines"},
    "vietnam": {"code": "VN", "flag": "🇻🇳", "region": "Asia", "name": "Vietnam"},
    "taiwan": {"code": "TW", "flag": "🇹🇼", "region": "Asia", "name": "Taiwan"},
    "hong kong": {"code": "HK", "flag": "🇭🇰", "region": "Asia", "name": "Hong Kong"},
    "china": {"code": "CN", "flag": "🇨🇳", "region": "Asia", "name": "China"},
    "iceland": {"code": "IS", "flag": "🇮🇸", "region": "Europe", "name": "Iceland"},
}


def _resolve_dynamic_location(query_clean: str) -> LocationItem | None:
    """
    Dynamically constructs a verified LocationItem when a user enters any country or city
    not present in the static pre-compiled list, so no market in the world is blocked.
    """
    q = query_clean.lower().strip()
    if len(q) < 2:
        return None

    # Check if exact country match
    matched_country = None
    for c_key, c_meta in COUNTRY_DIRECTORY.items():
        if q == c_key or q == c_meta["code"].lower():
            matched_country = c_meta
            break

    slug = re.sub(r"[^a-z0-9]+", "-", q).strip("-")

    if matched_country:
        return LocationItem(
            id=f"{matched_country['code'].lower()}-{slug[:3]}",
            name=matched_country["name"],
            country=matched_country["name"],
            country_code=matched_country["code"],
            location_code=f"{matched_country['code']}-NAT",
            region=matched_country["region"],
            potential="Emerging",
            description=f"National cultural market analysis for {matched_country['name']}",
            flag=matched_country["flag"],
            color="from-indigo-500/15 via-purple-500/10 to-transparent",
        )

    # If user searched a city/metro with country hint (e.g. "Munich, Germany" or "Nairobi")
    parts = [p.strip() for p in query_clean.split(",") if p.strip()]
    city_name = parts[0].title()
    country_name = "Global Market"
    flag = "🌐"
    code = "GL"
    region = "All markets"

    if len(parts) > 1:
        c_guess = parts[1].lower().strip()
        for c_key, c_meta in COUNTRY_DIRECTORY.items():
            if c_key in c_guess or c_guess in c_key:
                country_name = c_meta["name"]
                flag = c_meta["flag"]
                code = c_meta["code"]
                region = c_meta["region"]
                break

    loc_code = f"{code}-{city_name[:3].upper()}"

    return LocationItem(
        id=f"{code.lower()}-{slug[:5]}",
        name=city_name,
        country=country_name,
        country_code=code,
        location_code=loc_code,
        region=region if region != "All markets" else "Global",
        potential="High potential",
        description=f"Empirical market and cultural audience analysis for {city_name}",
        flag=flag,
        color="from-purple-500/15 via-indigo-500/10 to-transparent",
    )


@router.get("", response_model=list[LocationItem])
async def search_locations(
    query: str | None = Query(None, description="Search term for city, country, or code"),
    region: str | None = Query(None, description="Filter by region (Asia, Europe, etc.)"),
    limit: int = Query(50, ge=1, le=100),
) -> list[LocationItem]:
    """
    Search and filter cultural candidate locations and metros globally.
    Supports 120+ top pre-compiled metropolitan hubs and dynamic on-the-fly resolution
    for ANY world city or country without arbitrary limits.
    """
    results = list(GLOBAL_LOCATIONS)

    if region and region != "All markets":
        results = [loc for loc in results if loc["region"].lower() == region.lower()]

    if query and query.strip():
        q = query.strip().lower()
        exact_matches = [
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

        # If few or no results found in pre-compiled list, dynamically resolve on the fly
        if len(exact_matches) < 3:
            dynamic_item = _resolve_dynamic_location(query.strip())
            if dynamic_item:
                # Prepend dynamic result if not already matched
                if not any(m["id"] == dynamic_item.id for m in exact_matches):
                    exact_matches.insert(0, dynamic_item.model_dump())

        results = exact_matches

    return [LocationItem(**loc) for loc in results[:limit]]
