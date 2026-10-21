# ADR-0006: 4-Layer Institutional Memory Architecture with pgvector

## Status
**Accepted**

## Context
Brand strategy and international retail expansion decisions are typically executed across multi-quarter or multi-year cycles. Strategists change, corporate memory degrades, and organizations repeatedly make previously resolved mistakes (e.g., repeating sub-optimal neighborhood selection or failing to apply learned channel precedents). LLM context windows are transient and reset between conversations.

## Decision
We implemented a **4-Layer Institutional Memory subsystem powered by PostgreSQL 16 and `pgvector`**:
- Every memory unit is categorized under a strict taxonomy:
  1. `constraint`: Non-negotiable brand boundaries (e.g., *"Flagship stores in Tokyo must be in Harajuku/Shibuya; Le Marais for Paris"*).
  2. `precedent`: Historical market entry outcomes and real-world operational results.
  3. `playbook`: Verified execution steps for pop-ups, influencer collaborations, or boutique retail tiering.
  4. `anti_pattern`: Documented historical expansion mistakes to avoid.
- Each memory record includes:
  - Multi-tenant workspace scoping (`workspace` vs `project`).
  - Strict user-confirmation flag (`is_user_confirmed`).
  - Semantic vector embedding (1536-dimensional or 768-dimensional).
  - Cosine distance similarity search index (`ivfflat` / HNSW via pgvector).
- During Analysis Runs and Interactive Analyst Chat, the engine performs top-K semantic cosine retrieval to ground strategic recommendations in previously confirmed institutional constraints.

## Consequences
### Positive
- Cross-session institutional continuity: Strategists can define rules once and have them automatically enforced across all future expansion analyses.
- Sub-15ms semantic search latency directly within the existing PostgreSQL relational cluster (zero additional vector DB infrastructure required).
- Full auditability of who created, confirmed, or invalidated institutional memory records.

### Negative
- Requires pgvector extension initialization (`CREATE EXTENSION IF NOT EXISTS vector`) in PostgreSQL Docker image.
