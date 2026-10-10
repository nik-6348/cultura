import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.router import api_router
from src.core.config import get_settings
from src.core.logging import setup_logging
from src.db.session import engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Production lifespan manager for startup and graceful shutdown."""
    setup_logging()
    logger.info(
        "Starting %s v%s in %s mode",
        settings.app_name,
        settings.app_version,
        settings.environment,
    )
    yield
    logger.info("Shutting down %s, disposing database connection pool", settings.app_name)
    await engine.dispose()


settings = get_settings()

app = FastAPI(
    title="Cultura API",
    description="Enterprise Cultural Intelligence Platform - Market Launch Intelligence Engine",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Production RFC 7807 global exception handler."""
    logger.exception(
        "Unhandled server exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected server error occurred. Please try again later.",
            "details": str(exc) if settings.environment == "development" else None,
        },
    )


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs",
    }
