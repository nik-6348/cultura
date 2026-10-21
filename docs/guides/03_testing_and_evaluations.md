# Engineering Guide — Testing & AI Evaluation Suite

## 1. Testing Philosophy
Because Cultura makes high-stakes business expansion recommendations, testing combines traditional software verification (unit, integration, load) with **Agentic AI Evaluations** (grounding, determinism, hallucination checks).

## 2. Test Architecture

### 2.1 Backend Unit & Integration Tests (pytest)
Located in `apps/api/tests/`:
- `tests/unit/`: Test deterministic scoring formulas, Pydantic model validation, token budget calculators, and fallback logic without external network calls.
- `tests/integration/`: Test PostgreSQL transactions, pgvector similarity queries, and Alembic migrations against a test database.

Run the test suite:
```bash
cd apps/api
pytest -v
```

---

## 3. The 20 Golden AI Evaluation Scenarios
Before production deployment, all agent graph versions are benchmarked against 20 curated real-world golden scenarios:

| ID | Brand Profile | Candidate Markets | Critical Evaluation Check |
| :--- | :--- | :--- | :--- |
| **GS-01** | Japanese Minimalist Streetwear | London, Berlin | High affinity with East London & Kreuzberg creative clusters. |
| **GS-02** | Plant-Based Oat Milk Brand | Mumbai, Bangalore | High lactose intolerance signal, urban Gen-Z coffee shop alignment in Bangalore. |
| **GS-03** | Luxury Swiss Watchmaker | Dubai, Singapore | Wealth demographic clustering, duty-free retail corridor heatmaps. |
| **GS-04** | American Direct-to-Consumer Mattress | Paris, Madrid | European apartment logistics constraint & localized retail habits. |
| **GS-05** | Scandinavian Specialty Coffee | Seoul, Tokyo | Extremely dense specialty coffee culture, high category competition index. |
| **GS-06 – GS-20** | Emerging brands across F&B, Apparel, Tech, and Hospitality | Global metros | Bounded latency (<75s), zero hallucinated scores, 100% evidence linkage. |

### Evaluation Metrics Tracked:
1. **Evidence Grounding Rate**: Percentage of claims in the generated strategy that cite a verified `evidence_id` (Target: 100%).
2. **Unsupported Claim Rate**: Claims flagged by the Final Audit Guard as lacking Qloo backing (Target: 0%).
3. **Determinism Verification**: Rerunning the Compatibility Scorer on identical inputs must yield identical numerical scores down to 4 decimal places.
4. **Jev Confidence Calibration**: Low confidence signals ($< 0.70$) must trigger human review or additional research without silent failures.
