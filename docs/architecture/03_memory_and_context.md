# Architecture Specification — Memory, Context & Agent State

## 1. Core Rule
**Chat history is not memory.** In a production decision platform, dumping uncurated chat messages into an LLM context creates hallucination, high latency, and context dilution. Cultura partitions memory into four distinct architectural layers.

## 2. The Four Memory Layers

```mermaid
graph TD
    subgraph LayerA["Layer A: Request Context (Ephemeral)"]
        direction TB
        A1["Current Request Intent"]
        A2["Active Project Profile Snapshot"]
        A3["Dynamic Token Budget Guard"]
    end

    subgraph LayerB["Layer B: Thread Memory (Checkpoints)"]
        direction TB
        B1["LangGraph Postgres Checkpointer"]
        B2["Intermediate Node Outputs & Resumption State"]
        B3["Run Step Status & Tool Call Ledger"]
    end

    subgraph LayerC["Layer C: Project Memory (Durable Structured)"]
        direction TB
        C1["Brand Constants (Values, Price Point, Demographics)"]
        C2["User Corrections (e.g. 'Prioritize Bangalore over Mumbai')"]
        C3["Explicit vs. Inferred Confidence Metadata"]
    end

    subgraph LayerD["Layer D: Semantic Memory (Cross-Run Episodic)"]
        direction TB
        D1["pgvector Embeddings (1536-dim)"]
        D2["Past Run Decision Summaries"]
        D3["Counterfactual Simulation Deltas"]
    end
```

### Layer A — Request Context
- **Lifetime**: Single HTTP request or node invocation.
- **Contents**: The immediate task prompt, active market parameters, and available tool definitions.
- **Handling**: Discarded upon completion of the node.

### Layer B — Thread Memory (Checkpoints)
- **Lifetime**: Entire analysis run thread.
- **Storage**: PostgreSQL via `langgraph-checkpoint-postgres`.
- **Contents**: Complete serialized state machine, step sequences, and tool execution logs.
- **Purpose**: Enables live SSE progress updates, idempotent execution, and resuming interrupted jobs.

### Layer C — Project Memory (Structured Facts)
- **Lifetime**: Project lifespan.
- **Storage**: `memories` table in PostgreSQL.
- **Schema**:
  - `id`: UUID Primary Key
  - `project_id`: Foreign Key
  - `memory_type`: `fact` | `preference` | `constraint` | `correction`
  - `content`: Plain text summary
  - `structured_json`: Typed attributes
  - `source`: `user_explicit` | `agent_inferred`
  - `is_active`: Boolean
  - `is_user_confirmed`: Boolean
- **Conflict Handling**: If a user updates a preference (e.g., changing launch market from Mumbai to Bangalore), the previous memory record is marked `is_active = false` with an audit reason, and the new memory is activated.

### Layer D — Semantic Episodic Memory (`pgvector`)
- **Lifetime**: Workspace / cross-project history.
- **Storage**: PostgreSQL `vector(1536)` column with HNSW index.
- **Purpose**: Retrieves historically relevant decisions, strategy conclusions, and competitor insights when a new analysis is initiated.

## 3. Dynamic ContextBuilder & Token Budgeting
Every LLM call passes through an explicit `ContextBuilder` that enforces strict token budgets to prevent dilution:

| Prompt Section | Budget Allocation | Purpose |
| :--- | :--- | :--- |
| **System & Policy** | 10% | Behavioral constraints, anti-hallucination rules |
| **Project Constants** | 15% | Brand attributes, active market parameters |
| **Active Project Memories** | 10% | Top-k relevant structured facts from Layer C |
| **Qloo Cultural Evidence** | 35% | Filtered, normalized Qloo signals for target markets |
| **Semantic Historical Context** | 10% | Top-3 similar prior decisions from Layer D via pgvector |
| **Task & Output Schema** | 15% | Specific question, Pydantic JSON schema definition |
| **Safety & Validation Buffer** | 5% | Headroom for structured schema compliance |
