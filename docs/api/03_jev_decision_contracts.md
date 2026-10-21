# API Specification — TypeSafe Jev Decision Contracts

## 1. Role of Jev in Cultura
**Jev** (developed by TypeSafe AI) is a specialized System One reasoning engine designed for narrow, typed probabilistic decisions. Jev does not write marketing prose; instead, it outputs structured decision vectors with explicit confidence scores.

## 2. Core Decision Contracts

### 2.1 Decision 1: Evidence Sufficiency Gate (`evidence_sufficiency`)
Determines whether collected Qloo evidence is adequate to recommend a market launch.

**Request Schema:**
```json
{
  "question": "evidence_sufficiency",
  "state": {
    "market": "London",
    "resolved_entities_count": 8,
    "evidence_coverage_ratio": 0.88,
    "missing_signals": []
  }
}
```

**Jev Response Model:**
```json
{
  "decision": "sufficient",
  "confidence": 0.94,
  "probabilities": {
    "sufficient": 0.94,
    "insufficient": 0.06
  },
  "rationale": "High coverage across brand proxies and audience taste graph"
}
```

---

### 2.2 Decision 2: Market Recommendation (`market_decision`)
Evaluates cultural compatibility to classify the entry posture.

**Allowed Values**: `launch` | `adapt` | `avoid`

**Jev Response Model:**
```json
{
  "decision": "launch",
  "confidence": 0.86,
  "probabilities": {
    "launch": 0.86,
    "adapt": 0.11,
    "avoid": 0.03
  },
  "critical_factors": [
    "High overlap with urban creative demographics",
    "Strong category ecosystem density in East London"
  ]
}
```

---

### 2.3 Decision 3: Human Review Guard (`human_review_required`)
Acts as an escalation gate when model uncertainty or conflicting signals occur.

**Triggers for Escalation**:
- Jev confidence $< 0.70$.
- High disagreement between brand affinity and category ecosystem signals.
- Missing core demographic variables in candidate markets.

---

## 3. Fallback Adapter Design
Because Jev is an early-access service, Cultura encapsulates Jev behind a strict `JevDecisionAdapter`:

```python
class JevDecisionAdapter:
    async def evaluate_market_decision(self, state: MarketAnalysisState) -> MarketDecision:
        try:
            return await self.client.predict(question="market_decision", state=state)
        except (JevServiceUnavailable, httpx.TimeoutException):
            logger.warning("Jev API unreachable, executing deterministic heuristic fallback")
            return self.deterministic_fallback(state)
```

The fallback uses deterministic rule thresholds against the Compatibility Scorer metrics, ensuring the application remains 100% operational even during external vendor downtime.
