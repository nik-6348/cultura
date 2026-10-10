# Engineering Guide — Local Development Setup

## 1. System Requirements
- macOS (Apple Silicon or Intel), Linux, or Windows WSL2
- Python 3.12+
- Node.js 20+ & pnpm 9+
- Docker & Docker Compose

## 2. Environment Configuration
Clone the repository and copy the environment template:
```bash
cp .env.example .env
```
Ensure database credentials in `.env` match your local preferences.

## 3. Database Setup (PostgreSQL 16 with pgvector)
Start the PostgreSQL container:
```bash
pnpm db:up
```
Verify the container is running and healthy:
```bash
docker ps --filter "name=cultura_postgres"
```
The database initialization script automatically enables the `uuid-ossp` and `vector` extensions.

## 4. Backend Service (`apps/api`)
Navigate to the API directory and create a virtual environment:
```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Run database migrations:
```bash
alembic upgrade head
```

Start the FastAPI development server with hot reloading:
```bash
uvicorn src.main:app --reload --port 8000
```
Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 5. Frontend Service (`apps/web`)
From the repository root, install dependencies and start the Next.js 16 development server:
```bash
pnpm install
pnpm dev
```
The frontend application will be running at `http://localhost:3000`.
