import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_current_user, verify_workspace_access
from src.db.models.memory import Memory
from src.db.models.user import User
from src.db.session import get_db
from src.schemas.memory import (
    MemoryCreate,
    MemoryRead,
    MemorySearchResult,
    MemorySemanticSearchRequest,
)
from src.services.memory_service import MemoryService

router = APIRouter(tags=["Memory & Context Engine"])


@router.post(
    "/workspaces/{workspace_id}/memories",
    response_model=MemoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a structured memory fact or preference",
)
async def create_memory(
    workspace_id: uuid.UUID,
    payload: MemoryCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MemoryRead:
    """Create a new memory record with conflict resolution and pgvector indexing."""
    await verify_workspace_access(workspace_id, current_user, db)

    memory = await MemoryService.create_memory(
        db=db,
        workspace_id=workspace_id,
        content=payload.content,
        project_id=payload.project_id,
        user_id=current_user.id,
        scope=payload.scope,
        memory_type=payload.memory_type,
        structured_json=payload.structured_json,
        source_type=payload.source_type,
        source_ref=payload.source_ref,
        confidence=payload.confidence,
        is_user_confirmed=payload.is_user_confirmed,
    )
    return MemoryRead.model_validate(memory)


@router.get(
    "/workspaces/{workspace_id}/memories",
    response_model=list[MemoryRead],
    summary="List active memories in a workspace",
)
async def list_memories(
    workspace_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    project_id: uuid.UUID | None = Query(default=None),
    memory_type: str | None = Query(default=None),
) -> list[MemoryRead]:
    """Retrieve active memories filtered by project or memory_type."""
    await verify_workspace_access(workspace_id, current_user, db)

    memories = await MemoryService.get_active_memories(
        db=db,
        workspace_id=workspace_id,
        project_id=project_id,
        memory_type=memory_type,
    )
    return [MemoryRead.model_validate(m) for m in memories]


@router.post(
    "/workspaces/{workspace_id}/memories/search",
    response_model=list[MemorySearchResult],
    summary="Semantic similarity search over episodic memories",
)
async def search_memories(
    workspace_id: uuid.UUID,
    payload: MemorySemanticSearchRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[MemorySearchResult]:
    """
    Search memories using pgvector cosine similarity distance (<=>).
    Enforces strict multi-tenant workspace isolation.
    """
    await verify_workspace_access(workspace_id, current_user, db)

    results = await MemoryService.search_semantic_memories(
        db=db,
        workspace_id=workspace_id,
        query_text=payload.query,
        project_id=payload.project_id,
        limit=payload.limit,
        min_similarity=payload.min_similarity,
    )

    return [
        MemorySearchResult(
            memory=MemoryRead.model_validate(mem),
            similarity=sim,
        )
        for mem, sim in results
    ]


@router.delete(
    "/memories/{memory_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a memory record",
)
async def deactivate_memory(
    memory_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Deactivates a memory record while preserving audit history."""
    stmt = select(Memory).where(Memory.id == memory_id)
    res = await db.execute(stmt)
    mem = res.scalar_one_or_none()
    if not mem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory {memory_id} not found",
        )

    await verify_workspace_access(mem.workspace_id, current_user, db)
    await MemoryService.deactivate_memory(db, mem.workspace_id, memory_id)
