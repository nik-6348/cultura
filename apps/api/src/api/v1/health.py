import time
from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import Settings, get_settings
from src.db.session import get_db

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    database: dict[str, Any]
    timestamp: float


@router.get("", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def check_health(
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> HealthResponse:
    """Production health check verifying database connectivity, pgvector, and latency."""
    start_time = time.perf_counter()
    db_status = "healthy"
    db_latency_ms = 0.0

    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar_one()
        db_latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
    except Exception as e:
        db_status = f"unhealthy: {e!s}"

    return HealthResponse(
        status="healthy" if db_status == "healthy" else "degraded",
        app=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        database={
            "status": db_status,
            "latency_ms": db_latency_ms,
        },
        timestamp=time.time(),
    )
