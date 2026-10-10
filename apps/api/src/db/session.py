from collections.abc import AsyncGenerator
from typing import Any
from pgvector.asyncpg import register_vector
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from apps.api.src.core.config import get_settings

settings = get_settings()


async def init_connection(conn: Any) -> None:
    """Register pgvector type with asyncpg connection."""
    raw_connection = await conn.get_raw_connection()
    await register_vector(raw_connection.driver_connection)


engine: AsyncEngine = create_async_engine(
    settings.database_url,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_pre_ping=True,
    echo=(settings.environment == "development" and settings.log_level == "DEBUG"),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an asynchronous database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
