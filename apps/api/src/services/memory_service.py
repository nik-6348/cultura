import logging
import uuid
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.memory import Memory
from src.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class MemoryService:
    """
    4-Layer Memory Management Service for Cultura.
    Handles:
    - Layer C: Structured project facts, preferences, constraints, and user corrections.
    - Conflict resolution: Deactivating superseded facts with audit records.
    - Layer D: Semantic episodic memory via pgvector similarity search (<=> cosine distance).
    - Multi-tenant isolation: Strictly filtered by workspace_id.
    """

    @classmethod
    async def create_memory(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        content: str,
        project_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        scope: str = "project",
        memory_type: str = "fact",
        structured_json: dict[str, Any] | None = None,
        source_type: str = "user_explicit",
        source_ref: str | None = None,
        confidence: float = 1.0,
        is_user_confirmed: bool = False,
    ) -> Memory:
        """
        Creates a new memory record, resolves conflicts with existing active memories
        on matching topics/keys, and indexes its vector embedding.
        """
        new_id = uuid.uuid4()
        struct_data = dict(structured_json or {})
        topic_key = struct_data.get("topic") or struct_data.get("key")

        # Conflict resolution for preferences, constraints, and corrections
        # If an active memory with the same topic/key exists in the same scope, deactivate it
        if memory_type in ("preference", "constraint", "correction") and topic_key:
            stmt = select(Memory).where(
                Memory.workspace_id == workspace_id,
                Memory.project_id == project_id,
                Memory.is_active.is_(True),
            )
            res = await db.execute(stmt)
            existing_active = res.scalars().all()

            for old_mem in existing_active:
                old_struct = old_mem.structured_json or {}
                old_topic = old_struct.get("topic") or old_struct.get("key")
                if old_topic == topic_key or old_mem.memory_type == "correction":
                    # Supersede old memory
                    old_mem.is_active = False
                    updated_meta = dict(old_struct)
                    updated_meta["superseded_by"] = str(new_id)
                    updated_meta["deactivated_reason"] = (
                        f"Superseded by {memory_type} update '{content}'"
                    )
                    old_mem.structured_json = updated_meta
                    db.add(old_mem)

        # Generate 1536-dim embedding vector
        embedding_vec = await EmbeddingService.get_embedding(content)

        memory_record = Memory(
            id=new_id,
            workspace_id=workspace_id,
            project_id=project_id,
            user_id=user_id,
            scope=scope,
            memory_type=memory_type,
            content=content,
            structured_json=struct_data,
            embedding=embedding_vec,
            source_type=source_type,
            source_ref=source_ref,
            confidence=confidence,
            is_user_confirmed=is_user_confirmed,
            is_active=True,
        )

        db.add(memory_record)
        await db.commit()
        await db.refresh(memory_record)
        return memory_record

    @classmethod
    async def get_active_memories(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        project_id: uuid.UUID | None = None,
        memory_type: str | None = None,
    ) -> list[Memory]:
        """
        Retrieves all active memories for a given workspace and optional project.
        """
        query = select(Memory).where(
            Memory.workspace_id == workspace_id,
            Memory.is_active.is_(True),
        )

        if project_id is not None:
            query = query.where(Memory.project_id == project_id)
        if memory_type is not None:
            query = query.where(Memory.memory_type == memory_type)

        query = query.order_by(Memory.created_at.desc())
        res = await db.execute(query)
        return list(res.scalars().all())

    @classmethod
    async def search_semantic_memories(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        query_text: str | None = None,
        query_embedding: list[float] | None = None,
        project_id: uuid.UUID | None = None,
        limit: int = 3,
        min_similarity: float = 0.0,
    ) -> list[tuple[Memory, float]]:
        """
        TC-6.1 / TC-6.4:
        Performs semantic similarity search over active memories using pgvector cosine distance.
        Enforces strict multi-tenant workspace isolation.

        Returns list of (Memory, similarity_score) where similarity is in [0.0, 1.0].
        """
        if query_embedding is None:
            if not query_text:
                raise ValueError("Must provide either query_text or query_embedding")
            query_embedding = await EmbeddingService.get_embedding(query_text)

        # In pgvector SQLAlchemy: Memory.embedding.cosine_distance(vec) returns
        # cosine distance in range [0, 2]. Cosine Similarity = 1.0 - cosine_distance
        distance_expr = Memory.embedding.cosine_distance(query_embedding)

        query = select(Memory, distance_expr.label("distance")).where(
            Memory.workspace_id == workspace_id,
            Memory.is_active.is_(True),
            Memory.embedding.isnot(None),
        )

        if project_id is not None:
            query = query.where(Memory.project_id == project_id)

        query = query.order_by(distance_expr.asc()).limit(limit)

        result = await db.execute(query)
        rows = result.all()

        scored_memories: list[tuple[Memory, float]] = []
        for mem, dist in rows:
            # Distance: 0.0 = identical, 1.0 = orthogonal. Similarity: 1.0 - dist
            dist_val = float(dist) if dist is not None else 1.0
            similarity = max(0.0, min(1.0, 1.0 - dist_val))
            if similarity >= min_similarity:
                scored_memories.append((mem, round(similarity, 4)))

        return scored_memories

    @classmethod
    async def deactivate_memory(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        memory_id: uuid.UUID,
        reason: str = "User deactivated",
    ) -> bool:
        """Deactivates a specific memory record with workspace isolation check."""
        stmt = (
            update(Memory)
            .where(
                Memory.id == memory_id,
                Memory.workspace_id == workspace_id,
            )
            .values(is_active=False)
            .returning(Memory.id)
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.scalar_one_or_none() is not None
