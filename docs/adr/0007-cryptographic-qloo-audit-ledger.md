# ADR-0007: Cryptographic Qloo Request Hashing & Audit Ledger

## Status
**Accepted**

## Context
Calling live external Cultural AI APIs (such as Qloo Insights API) incurs network latency, potential rate-limit friction (HTTP 429), and outbound compute costs. Furthermore, enterprise governance and compliance require verifiable audit logs showing the exact payload, timestamp, and status code of every outbound request to third-party data providers.

## Decision
We implemented a **SHA-256 cryptographic request hashing and caching layer in `QlooService` backed by PostgreSQL (`qloo_requests` table)**:
- Every outbound call calculates a deterministic SHA-256 hash across the HTTP method, endpoint URL, query parameters, and JSON body:
  $$\text{Hash} = \text{SHA256}(\text{Method} + \text{Endpoint} + \text{SortedParams} + \text{SortedBody})$$
- Before dispatching a network call, `QlooService` checks PostgreSQL for an existing `qloo_requests` entry matching the hash.
- **Cache Hit**: Returns cached payload immediately (<5ms latency), bypassing external network calls and preserving rate-limit budgets.
- **Cache Miss**: Executes the live HTTP call with exponential backoff and jitter, measures round-trip latency, and persists an immutable audit record containing:
  - `request_hash`
  - `operation` (e.g. `resolve_entities`, `get_audience_affinities`, `get_taste_trends`)
  - `endpoint`
  - `latency_ms`
  - `status_code`
  - `cache_hit` (`false` on initial store, `true` on subsequent reads)
  - `created_at` timestamp

## Consequences
### Positive
- Sub-5ms response times for repeated queries across different team members or simulation runs.
- 100% verifiable compliance audit trail proving outbound data provenance.
- Immune to parameter-ordering cache misses through canonical sorting.

### Negative
- Cache invalidation policy requires TTL management or manual cache purging if external Qloo knowledge graphs update upstream.
