# ADR 0003: LangGraph as Multi-Agent Execution Framework

## Status
Accepted

## Date
2026-10-10

## Context
Market entry decisions require coordinated research across multiple dimensions: brand positioning, localized market culture, demographic audience affinities, and strategic risk synthesis.

We evaluated:
1. **Unconstrained Autonomous Agents (AutoGPT / CrewAI free-loop style)**
2. **Sequential Procedural Python Scripts**
3. **Graph-based State Machine Framework (LangGraph)**

## Decision
We select **LangGraph** as the multi-agent workflow and state persistence engine.

## Rationale
1. **Bounded, Inspectable Execution**: In a B2B decision platform, unconstrained autonomous loops lead to unpredictable latency, explosive token costs, and non-reproducible outputs. LangGraph allows explicit node definitions, strict typing, and conditional branching.
2. **Built-in Resumability & Checkpoints**: Long-running multi-agent runs (45–90 seconds) risk interruption if a worker scales down or restarts. LangGraph automatically persists state checkpoints to PostgreSQL after every node transition, allowing seamless resumption.
3. **Human-in-the-Loop Interrupts**: When Jev flags confidence $< 0.70$ or evidence coverage is incomplete, LangGraph natively supports state suspension (`interrupt`), waiting for explicit user clarification before resuming.
4. **LangSmith Native Tracing**: Deep observability into agent node latency, token usage, tool arguments, and intermediate outputs.

## Consequences
- **Positive**: High reliability, auditability, reproducible runs, fault tolerance.
- **Negative**: Steeper initial learning curve than basic procedural code.
- **Mitigation**: Standardize on Pydantic v2 schemas for all node inputs and outputs to ensure compile-time and runtime type safety.
