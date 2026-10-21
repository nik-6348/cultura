"""Intake API — conversational project setup endpoint."""

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from src.core.security import get_current_user
from src.db.models.user import User
from src.services.intake_service import process_intake_message

router = APIRouter(tags=["Project Intake"])


class IntakeMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class IntakeRequest(BaseModel):
    message: str
    messages: list[IntakeMessage] = []  # full conversation history


class IntakeResponse(BaseModel):
    reply: str
    spec: dict[str, Any] | None = None
    ready: bool = False


@router.post(
    "/intake",
    response_model=IntakeResponse,
    status_code=status.HTTP_200_OK,
    summary="Conversational project setup — AI guides user to collect project details",
)
async def intake_chat(
    payload: IntakeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> IntakeResponse:
    """
    Stateless intake conversation. Client sends full message history each turn.
    Returns AI reply, extracted spec (updated incrementally), and ready flag.
    When ready=true, call POST /projects with the spec to create the project.
    """
    # Build message history for LLM
    history = [{"role": m.role, "content": m.content} for m in payload.messages]
    # Append current user message
    history.append({"role": "user", "content": payload.message})

    result = await process_intake_message(history)
    return IntakeResponse(**result)
