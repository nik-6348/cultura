import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_current_user, verify_workspace_access
from src.db.models.user import User
from src.db.session import get_db
from src.schemas.workspace import WorkspaceCreate, WorkspaceRead, WorkspaceUpdate
from src.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    data: WorkspaceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkspaceRead:
    """Create a new workspace with the current user as Owner."""
    workspace = await WorkspaceService.create_workspace(db, current_user, data)
    return WorkspaceRead.model_validate(workspace)


@router.get("", response_model=list[WorkspaceRead])
async def list_workspaces(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[WorkspaceRead]:
    """List all workspaces the authenticated user belongs to."""
    workspaces = await WorkspaceService.list_user_workspaces(db, current_user)
    return [WorkspaceRead.model_validate(w) for w in workspaces]


@router.get("/{workspace_id}", response_model=WorkspaceRead)
async def get_workspace(
    workspace_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkspaceRead:
    """Retrieve workspace details after verifying membership."""
    await verify_workspace_access(workspace_id, current_user, db)
    workspace = await WorkspaceService.get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceRead.model_validate(workspace)


@router.patch("/{workspace_id}", response_model=WorkspaceRead)
async def update_workspace(
    workspace_id: uuid.UUID,
    data: WorkspaceUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkspaceRead:
    """Update workspace details."""
    await verify_workspace_access(workspace_id, current_user, db)
    workspace = await WorkspaceService.get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    updated = await WorkspaceService.update_workspace(db, workspace, data)
    return WorkspaceRead.model_validate(updated)
