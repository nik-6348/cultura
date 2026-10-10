# API Specification — Qloo Integration & Evidence Normalization

## 1. Overview
Qloo is Cultura's primary cultural evidence engine. It provides high-dimensional consumer taste graphs across music, film, dining, fashion, literature, and location affinities.

## 2. Qloo Endpoints Used

| Endpoint | Method | Purpose in Cultura |
| :--- | :--- | :--- |
| `/v2/insights/entities` | GET | Resolve user-entered brand/product names to Qloo canonical entity IDs. |
| `/v2/insights/audiences` | POST | Calculate taste affinity correlations between target customer personas and candidate locations. |
| `/v2/insights/locations` | GET | Retrieve geographical taste heatmaps, dining clusters, and cultural hubs within target cities. |
| `/v2/insights/trends` | GET | Velocity and taste momentum indicators over 30/90/180-day intervals. |

## 3. Resilience & Rate Limiting Strategy
1. **Exponential Backoff with Jitter**:
   - Initial wait: 500 ms
   - Multiplier: 2.0x
   - Max retries: 3 attempts
   - Handles: HTTP 429 (Rate Limit) and 5xx (Server Error).
2. **Deterministic Request Hashing & Caching**:
   - Every outbound Qloo request computes an SHA-256 hash of `endpoint + query_params + sorted_body`.
   - Results are cached in the `qloo_requests` table to prevent duplicate API spend during iterative analysis or what-if runs.

## 4. Evidence Normalization Contract
Every successful Qloo query is normalized into the `evidence` table:

```json
{
  "id": "e4f8b2c1-8765-4321-9876-123456789abc",
  "run_id": "8b9e6712-4214-41d3-92f7-ef65421398bb",
  "project_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "source": "qloo",
  "kind": "brand_affinity",
  "market_name": "London",
  "entity_ref": "qloo:brand:acme_apparel",
  "value_numeric": 0.842,
  "explanation": "High consumer affinity (84.2%) among 20-35 demographic with contemporary electronic music and specialty coffee subcultures in Hackney and Shoreditch.",
  "confidence": 0.92,
  "source_metadata": {
    "qloo_endpoint": "/v2/insights/audiences",
    "request_hash": "a8f5c9...",
    "latency_ms": 320,
    "timestamp": "2026-10-10T07:31:00Z"
  }
}
```

Every claim made in the generated strategic advice must link to one or more `evidence.id` values.
