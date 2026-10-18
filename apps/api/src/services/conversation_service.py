import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.chat import Conversation, Message


class ConversationService:
    """Persists the Analyst Chat conversation so history survives reloads and
    the LLM gets real multi-turn context instead of a single stateless message."""

    @classmethod
    async def get_or_create_conversation(
        cls, db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> Conversation:
        stmt = select(Conversation).where(
            Conversation.project_id == project_id,
            Conversation.user_id == user_id,
        )
        res = await db.execute(stmt)
        convo = res.scalar_one_or_none()
        if convo:
            return convo

        convo = Conversation(project_id=project_id, user_id=user_id)
        db.add(convo)
        await db.flush()
        return convo

    @classmethod
    async def get_history(
        cls, db: AsyncSession, conversation_id: uuid.UUID, limit: int = 20
    ) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        messages = list(res.scalars().all())
        messages.reverse()  # chronological order for prompt building / display
        return messages

    @classmethod
    async def add_message(
        cls,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata_json=metadata or {},
        )
        db.add(msg)
        await db.flush()
        return msg
