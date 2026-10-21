# Engineering Guide — Git Workflow & Production Standards

## 1. Core Principles
Cultura is developed as a production-grade SaaS product, not a disposable hackathon demo. To maintain an auditable, high-quality repository:
1. **Never commit directly to `main`**.
2. **Never make monolithic 'WIP' or 'dump' commits**. Every commit must represent a coherent, functional, testable unit of change.
3. **Keep plans and local scratch files out of version control**.

## 2. Branching Strategy

```text
main (Production Releases, Tags v0.1.0, v0.2.0)
  ▲
  │ (Release PR / Fast-Forward)
develop (Integration Branch)
  ▲
  │ (Feature PR / Squash & Merge)
  ├── feat/monorepo-foundation
  ├── feat/db-schema-migrations
  ├── feat/auth-and-workspaces
  ├── feat/qloo-insights-adapter
  ├── feat/langgraph-agent-dag
  └── fix/qloo-timeout-retry
```

### Branch Naming Conventions:
- Features: `feat/<feature-name>` (e.g. `feat/qloo-evidence-layer`)
- Bug fixes: `fix/<issue-name>` (e.g. `fix/pgvector-hnsw-index`)
- Documentation: `docs/<topic>` (e.g. `docs/api-contracts`)
- Refactoring / Chores: `chore/<task>` (e.g. `chore/upgrade-fastapi`)

## 3. Conventional Commit Standard
All commit messages must strictly adhere to the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <short imperative description>

[optional detailed body explaining context and trade-offs]
```

### Commit Types:
- `feat`: A new user-facing or architectural capability.
- `fix`: A bug fix or error mitigation.
- `docs`: Documentation updates only.
- `chore`: Tooling, dependency, or workspace updates.
- `refactor`: Code restructuring without behavioral change.
- `test`: Adding or updating test suites.
- `perf`: Performance or query optimizations.

### Example Production Commits:
- `feat(api): scaffold fastapi application with lifespan context manager and pydantic v2 settings`
- `feat(db): add alembic migrations for users, workspaces, and projects`
- `feat(qloo): implement typed client with exponential backoff and request hashing`
- `fix(agent): handle qloo entity resolution 404 gracefully with fallback proxy`
