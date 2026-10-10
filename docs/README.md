# Cultura — Engineering & Architecture Documentation

Welcome to the comprehensive technical documentation for **Cultura**, an AI Cultural Intelligence platform for business market entry decisions.

## 📚 Documentation Index

### 1. Architecture (`docs/architecture/`)
Deep-dive architectural specifications, system topology, agent DAGs, and state persistence.
- **[System Overview](architecture/01_system_overview.md)** — Runtime topology, modular monolith architecture, and service boundaries.
- **[Agent Orchestration](architecture/02_agent_orchestration.md)** — LangGraph multi-agent DAG, supervisor, researcher, scorer, and guardrails.
- **[Memory & Context Engine](architecture/03_memory_and_context.md)** — The 4 memory layers (Request, Thread Checkpoint, Project, Semantic `pgvector`).
- **[Cultural Scoring Engine](architecture/04_cultural_scoring_engine.md)** — Deterministic mathematical compatibility scoring without hallucinated metrics.

### 2. API Specifications (`docs/api/`)
Interface contracts, external service integrations, and event streaming.
- **[REST API Specification](api/01_rest_api_specification.md)** — Complete endpoints for Workspaces, Projects, Runs, Chat, and Memory.
- **[Qloo Integration & Evidence Spec](api/02_qloo_integration_spec.md)** — Qloo Insights queries, entity resolution, and evidence normalization.
- **[TypeSafe Jev Decision Contracts](api/03_jev_decision_contracts.md)** — System One probabilistic decisions, typed schemas, and fallbacks.
- **[Streaming & Event Protocol](api/04_streaming_and_events.md)** — SSE protocol for real-time progress updates and Cloud Task payloads.

### 3. Architecture Decision Records (`docs/adr/`)
Historical context, options evaluated, and rationale for foundational design choices.
- **[ADR 0001: Backend Tech Stack (FastAPI)](adr/0001-backend-tech-stack-fastapi.md)** — Why Python FastAPI was chosen over NestJS Fastify.
- **[ADR 0002: PostgreSQL & pgvector](adr/0002-postgres-and-pgvector.md)** — Single unified store for relational entities, checkpoints, and vectors.
- **[ADR 0003: LangGraph Multi-Agent Orchestration](adr/0003-langgraph-agent-framework.md)** — Stateful graph execution vs. unbounded autonomous agents.

### 4. Engineering Guides (`docs/guides/`)
Onboarding, development standards, testing, and production deployment.
- **[Development Setup Guide](guides/01_development_setup.md)** — Local environment, Docker Compose, Python virtualenv, and Next.js 16.
- **[Git Workflow & Commit Standards](guides/02_git_workflow_and_standards.md)** — Branching model (`main`, `develop`, feature branches) and Conventional Commits.
- **[Testing & AI Evaluation Suite](guides/03_testing_and_evaluations.md)** — Unit tests, integration tests, and 20 golden evaluation scenarios.
