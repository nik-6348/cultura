import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_current_user, verify_workspace_access
from src.db.models.user import User
from src.db.session import get_db
from src.schemas.chat import ChatRequest, ChatResponse
from src.services.chat_service import ChatService
from src.services.project_service import ProjectService

router = APIRouter(tags=["Analyst Chat"])


@router.post(
    "/projects/{project_id}/chat",
    response_model=ChatResponse,
    summary="Interactive Cultural Analyst conversation grounded in project evidence",
)
async def chat_with_analyst(
    project_id: uuid.UUID,
    payload: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    """
    Submits a conversational query to the AI Cultural Analyst.
    Returns grounded answers citing empirical Qloo evidence and 4-layer memory facts.
    """
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )

    await verify_workspace_access(project.workspace_id, current_user, db)

    response = await ChatService.process_chat(
        db=db,
        project_id=project_id,
        request=payload,
        workspace_id=project.workspace_id,
    )
    return response
