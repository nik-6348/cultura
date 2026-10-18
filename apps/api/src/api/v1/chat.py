import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_current_user, verify_workspace_access
from src.db.models.chat import Conversation, Message
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
        user_id=current_user.id,
    )
    return response


@router.post(
    "/projects/{project_id}/chat/stream",
    summary="Streaming variant of the Analyst Chat — Server-Sent Events of live tokens",
)
async def chat_with_analyst_stream(
    project_id: uuid.UUID,
    payload: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> StreamingResponse:
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )

    await verify_workspace_access(project.workspace_id, current_user, db)

    context = await ChatService.prepare_stream(
        db=db,
        project_id=project_id,
        request=payload,
        workspace_id=project.workspace_id,
        user_id=current_user.id,
    )

    return StreamingResponse(
        ChatService.stream_reply(context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/projects/{project_id}/conversations",
    summary="List all Analyst Chat conversations for this project",
)
async def list_conversations(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    await verify_workspace_access(project.workspace_id, current_user, db)

    from src.services.conversation_service import ConversationService
    conversations = await ConversationService.list_conversations(db, project_id, current_user.id)
    result = []
    for convo in conversations:
        # Fetch first and last message for preview
        first_stmt = (
            select(Message)
            .where(Message.conversation_id == convo.id, Message.role == "user")
            .order_by(Message.created_at.asc())
            .limit(1)
        )
        first_res = await db.execute(first_stmt)
        first_msg = first_res.scalar_one_or_none()

        last_stmt = (
            select(Message)
            .where(Message.conversation_id == convo.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_res = await db.execute(last_stmt)
        last_msg = last_res.scalar_one_or_none()

        result.append({
            "id": str(convo.id),
            "title": convo.title,
            "created_at": convo.created_at.isoformat(),
            "updated_at": last_msg.created_at.isoformat() if last_msg else convo.created_at.isoformat(),
            "preview": (first_msg.content[:80] if first_msg else ""),
            "message_count": 0,  # lightweight, skip count query
        })
    return result


@router.get(
    "/projects/{project_id}/conversation",
    summary="Fetch messages for a specific Analyst Chat conversation",
)
async def get_conversation_history(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    conversation_id: uuid.UUID | None = None,
) -> dict:
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    await verify_workspace_access(project.workspace_id, current_user, db)

    if conversation_id:
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.project_id == project_id,
        )
    else:
        # fallback: most-recent conversation for this project/user
        stmt = (
            select(Conversation)
            .where(
                Conversation.project_id == project_id,
                Conversation.user_id == current_user.id,
            )
            .order_by(Conversation.created_at.desc())
            .limit(1)
        )
    res = await db.execute(stmt)
    conversation = res.scalar_one_or_none()
    if not conversation:
        return {"conversation_id": None, "messages": []}

    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    msg_res = await db.execute(msg_stmt)
    messages = list(msg_res.scalars().all())

    return {
        "conversation_id": str(conversation.id),
        "title": conversation.title,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "metadata": m.metadata_json,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }
