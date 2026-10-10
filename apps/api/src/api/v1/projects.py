import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_current_user, verify_workspace_access
from src.db.models.user import User
from src.db.session import get_db
from src.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from src.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProjectRead:
    """Create a new business intelligence project with candidate markets."""
    await verify_workspace_access(data.workspace_id, current_user, db)
    project = await ProjectService.create_project(db, current_user, data)
    return ProjectRead.model_validate(project)


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    workspace_id: Annotated[uuid.UUID, Query(description="Filter projects by workspace ID")],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ProjectRead]:
    """List all projects within an authorized workspace."""
    await verify_workspace_access(workspace_id, current_user, db)
    projects = await ProjectService.list_workspace_projects(db, workspace_id)
    return [ProjectRead.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProjectRead:
    """Retrieve project details with its candidate markets."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await verify_workspace_access(project.workspace_id, current_user, db)
    return ProjectRead.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProjectRead:
    """Update project configuration."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await verify_workspace_access(project.workspace_id, current_user, db)
    updated = await ProjectService.update_project(db, project, data)
    return ProjectRead.model_validate(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a project."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await verify_workspace_access(project.workspace_id, current_user, db)
    await ProjectService.delete_project(db, project)
