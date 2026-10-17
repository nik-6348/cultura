# Production Deployment & Operations Guide

> **Cultura Infrastructure & Deployment Operations**  
> *Containerized Production Architecture for PostgreSQL, pgvector, FastAPI, and Next.js*

---

## 1. Production Architecture Overview

```
                      Internet / Cloudflare CDN
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │  Reverse Proxy / Ingress  │
                    │      (Nginx / Caddy)      │
                    └─────────────┬─────────────┘
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
     ┌───────────────────┐                 ┌───────────────────┐
     │ Next.js Frontend  │                 │ FastAPI Backend   │
     │ Port 3000         │                 │ Port 8000         │
     │ (Node.js 20 LTS)  │                 │ (Uvicorn Workers) │
     └───────────────────┘                 └─────────┬─────────┘
                                                     │
                                   ┌─────────────────┴─────────────────┐
                                   ▼                                   ▼
                         ┌───────────────────┐               ┌───────────────────┐
                         │ PostgreSQL 16     │               │ Qloo Cultural AI  │
                         │ + pgvector        │               │ Live API Gateway  │
                         │ Port 5432         │               │ (Outbound HTTPS)  │
                         └───────────────────┘               └───────────────────┘
```

---

## 2. Environment Configuration Matrix

Ensure the following environment variables are securely injected in production:

| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Runtime environment mode | `production` |
| `DATABASE_URL` | Async connection string to PostgreSQL | `postgresql+asyncpg://cultura:secpass@postgres:5432/cultura_prod` |
| `QLOO_API_KEY` | Production API key for Qloo Insights | `hack_251bc510f2bfef8a13a995c7cf9b8a3094dfc1d4` |
| `QLOO_BASE_URL` | Base endpoint for Qloo Cultural API | `https://hackathon.api.qloo.com` |
| `JEV_API_KEY` | API Key for TypeSafe JEV System One | `jev_live_key_...` |
| `JEV_BASE_URL` | JEV evaluation service URL | `https://api.typesafe.ai/v1` |
| `NEXT_PUBLIC_API_URL` | Public API endpoint for frontend client | `https://api.cultura.ai/api/v1` |

---

## 3. Database Migrations (Alembic)

Before starting the web services, execute all Alembic schema migrations:

```bash
cd apps/api
# Apply migrations up to the head revision
poetry run alembic upgrade head
```

Verify `vector` extension installation:
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

## 4. Production Docker Compose Stack

```yaml
version: "3.9"

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: cultura_postgres_prod
    restart: always
    environment:
      POSTGRES_USER: cultura
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: cultura_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cultura -d cultura_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: cultura_api_prod
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      ENVIRONMENT: production
      DATABASE_URL: postgresql+asyncpg://cultura:${DB_PASSWORD}@postgres:5432/cultura_prod
      QLOO_API_KEY: ${QLOO_API_KEY}
      QLOO_BASE_URL: https://hackathon.api.qloo.com
    ports:
      - "8000:8000"
    command: ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: cultura_web_prod
    restart: always
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: https://api.cultura.ai/api/v1
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

---

## 5. Health Checks & Diagnostics

Verify system readiness:
```bash
# 1. Health Probe
curl -s http://localhost:8000/api/v1/health | jq .

# 2. Database Latency
# Expect "status": "healthy" and latency_ms < 30ms

# 3. Qloo API Egress Test
curl -s "http://localhost:8000/api/v1/qloo/entities/search?query=Supreme" | jq .
```
