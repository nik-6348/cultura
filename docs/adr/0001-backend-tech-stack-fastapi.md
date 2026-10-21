# ADR 0001: Selection of Python FastAPI for AI Backend & Agent Orchestration

## Status
Accepted

## Date
2026-10-10

## Context
Cultura is an AI Cultural Intelligence SaaS platform that provides market launch intelligence backed by empirical Qloo taste signals, deterministic scoring, Jev/TypeSafe probabilistic gates, and a multi-agent LangGraph workflow.

We evaluated two primary backend architectures:
1. **Python FastAPI (with Pydantic v2 and SQLAlchemy 2 async)**
2. **NestJS with Fastify Adapter (TypeScript)**

The product operates under a strict 23-day delivery timeline for the Qloo Hackathon and must be built to production-grade SaaS standards (not a mock demo).

## Decision
We select **Python FastAPI** as the primary backend API and agent worker service, paired with a **Next.js 16 App Router (TypeScript)** frontend.

## Rationale
1. **LangGraph Parity**: LangGraph is native to Python. Persistence (`langgraph-checkpoint-postgres`), node reducers, subgraphs, and human-in-the-loop gates have 100% feature maturity in Python. While `@langchain/langgraph` exists for JS, it has less ecosystem documentation, fewer real-world production references, and lags in supporting advanced checkpointer serialization.
2. **Deterministic Cultural Compatibility Scorer**: Cultura explicitly forbids LLMs from hallucinating cultural affinity scores. Scores are calculated by a mathematical compatibility algorithm across multiple dimensions. Python's numerical and data modeling capabilities make this clean, auditable, and testable.
3. **Data & Vector Native**: Native integration with `pgvector` via SQLAlchemy 2 async and `asyncpg` enables both structured ACID transactional data and semantic episodic memory in the same database without operational friction.
4. **AI Observability & Evaluation**: LangSmith tracing, automated evaluation suites (evaluating Qloo grounding and hallucination rate across 20 golden scenarios), and token budgeting tools are standard in Python.
5. **Fast Delivery Without NestJS Overhead**: With a small team and 23 days, NestJS's heavy boilerplate (modules, controllers, services, decorators, DTO mappings) introduces unnecessary friction compared to FastAPI's clean dependency injection (`Depends`) and Pydantic v2 auto-generated OpenAPI schemas.

## Consequences
- **Positive**: Rapid feature iteration, battle-tested LangGraph persistence, seamless AI library integrations, fast async I/O.
- **Negative**: Types are not natively shared across frontend and backend in TypeScript.
- **Mitigation**: Use FastAPI's automatically generated OpenAPI v3 schema with `@hey-api/openapi-ts` to generate type-safe TypeScript clients for the Next.js frontend.
