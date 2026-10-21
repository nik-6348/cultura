# ADR 0002: Unified PostgreSQL 16 with pgvector for Relational and Semantic Storage

## Status
Accepted

## Date
2026-10-10

## Context
Cultura requires storage for:
1. Strict relational business entities (users, workspaces, projects, memberships, audit logs).
2. Agent thread state and checkpoints (serialized step states, tool records).
3. Evidence records and deterministic score snapshots.
4. Semantic episodic memory (vector embeddings of past run insights and report snippets).

We evaluated using a separate dedicated vector database (Pinecone, ChromaDB, Qdrant) versus integrating vector capabilities directly into PostgreSQL using `pgvector`.

## Decision
We choose **PostgreSQL 16 with the `pgvector` extension** as our single, unified database engine.

## Rationale
1. **Zero Distributed Systems Overhead**: Managing a standalone vector database introduces an additional network hop, distinct authentication credentials, backup synchronization challenges, and potential data divergence.
2. **ACID Transactions Across Relations and Vectors**: With `pgvector`, we can insert an analysis decision, its supporting normalized evidence rows, and its vector embedding in a single atomic database transaction.
3. **Cloud SQL Native Support**: Google Cloud SQL for PostgreSQL provides out-of-the-box managed support for `pgvector` with HNSW and IVFFlat vector indexing.
4. **LangGraph Checkpoint Synergy**: The official `langgraph-checkpoint-postgres` library can share the same database instance, keeping infrastructure costs and operational complexity minimal.

## Consequences
- **Positive**: Single backup strategy, consolidated connection pooling, unified Alembic migrations, atomic transactions.
- **Negative**: Dedicated vector DBs offer specialized vector-filtering optimizations at massive scale (10M+ vectors).
- **Mitigation**: Cultura's workspace-filtered episodic memory will operate well within pgvector's high-performance envelope (<500k vectors), where HNSW indexes deliver single-digit millisecond retrieval.
