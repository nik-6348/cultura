# Cultura — AI Cultural Intelligence Platform

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue)](apps/api)
[![Next.js](https://img.shields.io/badge/Next.js-16%20LTS-black)](apps/web)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688)](apps/api)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-orange)](apps/api)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791)](docker-compose.yml)

> **Cultura** is an enterprise AI Cultural Intelligence platform for business market entry decisions. Given a brand/product and target markets, it calculates cultural fit, grounds claims in empirical Qloo consumer taste and affinity data, makes typed Launch / Adapt / Avoid decisions via Jev / TypeSafe, and enables counterfactual what-if strategy simulations.

---

## 🏛 Architecture Overview

Cultura is built as a production-grade modular system:

- **Frontend (`apps/web`)**: Next.js 16 App Router (TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts).
- **Backend API & Engine (`apps/api`)**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 (asyncpg), Alembic.
- **Agent Orchestration**: LangGraph DAG with checkpoint persistence, deterministic scoring formulas, and human-in-the-loop review guards.
- **Cultural Evidence**: Qloo Insights API integration with normalized traceability.
- **System One Decisions**: TypeSafe Jev API adapter with probabilistic routing and fallback guards.
- **Data & Semantic Memory**: PostgreSQL 16 + `pgvector` for structured state and cross-session episodic retrieval.

```text
cultura/
├── apps/
│   ├── api/             # FastAPI backend service & LangGraph worker
│   └── web/             # Next.js 16 App Router frontend
├── packages/            # Shared configurations and OpenAPI contracts
├── docker-compose.yml   # Local PostgreSQL 16 + pgvector stack
└── pnpm-workspace.yaml  # Monorepo workspace configuration
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js >= 20 & pnpm >= 9
- Python >= 3.12

### 1. Clone & Setup Environment
```bash
git clone https://github.com/nik6348/cultura.git
cd cultura
cp .env.example .env
```

### 2. Start PostgreSQL with pgvector
```bash
docker compose up -d
```

### 3. Run Backend (FastAPI)
```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn src.main:app --reload --port 8000
```

### 4. Run Frontend (Next.js 16)
```bash
pnpm install
pnpm --filter web dev
```

---

## 📚 Technical Documentation Suite

- **[Executive White Paper & Real-World Problem Analysis](docs/architecture/05_real_world_problem_and_solution_deep_dive.md)** — Analysis of the $50B retail expansion failure problem and cross-domain taste graph solutions.
- **[REST API Reference Manual](docs/api/README.md)** — Complete endpoint reference, schemas, and cURL examples.
- **[Architecture Decision Records (ADRs)](docs/adr/)**:
  - [ADR 0001: Backend Tech Stack (FastAPI)](docs/adr/0001-backend-tech-stack-fastapi.md)
  - [ADR 0002: PostgreSQL & pgvector](docs/adr/0002-postgres-and-pgvector.md)
  - [ADR 0003: LangGraph Multi-Agent DAG](docs/adr/0003-langgraph-agent-framework.md)
  - [ADR 0004: TypeSafe JEV System One Gating](docs/adr/0004-typesafe-jev-system-one-gating.md)
  - [ADR 0005: Deterministic Fixed-Point Scoring](docs/adr/0005-deterministic-fixed-point-scoring.md)
  - [ADR 0006: 4-Layer Institutional Memory with pgvector](docs/adr/0006-pgvector-4-layer-institutional-memory.md)
  - [ADR 0007: Cryptographic Qloo Audit Ledger](docs/adr/0007-cryptographic-qloo-audit-ledger.md)
- **[Production Operations & Deployment Guide](docs/guides/04_production_deployment_and_operations.md)** — Containerized topology, migrations, and health probes.

---

## 📄 License
Licensed under the [Apache License, Version 2.0](LICENSE).
