# ADR-0004: TypeSafe JEV System One Decision Gating

## Status
**Accepted**

## Context
Market entry decision-making requires both rigorous quantitative analysis (scoring) and clear, decisive operational postures (`LAUNCH`, `ADAPT`, `AVOID`). When enterprise strategists review dozens of potential retail expansion candidate markets, they need unambiguous, type-safe decision gates backed by probabilistic confidence assessments rather than ambiguous natural language paragraphs.

## Decision
We adopted **TypeSafe JEV (v1.13.0)** as our System One cognitive heuristic gating engine.
- Every candidate market is evaluated across three discrete questions:
  1. `market_decision`: Probability distribution across `launch`, `adapt`, and `avoid`.
  2. `evidence_sufficiency`: Probability assessment of whether empirical evidence coverage is `sufficient` or `insufficient`.
  3. `human_review_required`: Flag determining whether executive human review is mandatory (`yes` / `no`).
- The JEV evaluation runs as Node 8 (`jev_decision_gate_agent`) in the LangGraph DAG immediately following deterministic compatibility scoring.
- If the JEV remote API service is unreachable or unconfigured, the system automatically falls back to deterministic rule-based probabilistic bounds based on the 5D compatibility score without blocking pipeline execution.

## Consequences
### Positive
- Decisions are strictly typed and serialized into the `decisions` table in PostgreSQL with full model name, latency, and probability distributions.
- Prevents ambiguous executive indecision by providing mathematical confidence intervals (e.g., $P(\text{Launch}) = 1.0, \text{Confidence} = 1.0$).
- Enables downstream conditional routing in the LangGraph DAG (e.g., routing low-confidence markets to human escalation queues).

### Negative
- Introduces external network latency (~1.5s per candidate market when calling live JEV models).
