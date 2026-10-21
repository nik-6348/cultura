# Cultura API & Agent Engine

FastAPI asynchronous backend service and LangGraph multi-agent execution worker for Cultura.

## Features
- **FastAPI 0.115+** with Pydantic v2 validation
- **SQLAlchemy 2.0 (asyncio)** + **asyncpg** + **pgvector**
- **LangGraph** multi-agent execution engine with PostgreSQL state checkpoints
- **Modular feature structure**: Core, DB, API v1, Qloo adapter, Jev adapter, LangGraph nodes

## Local Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8000
```
