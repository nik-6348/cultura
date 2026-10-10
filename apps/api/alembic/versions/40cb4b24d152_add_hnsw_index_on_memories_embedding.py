"""add_hnsw_index_on_memories_embedding

Revision ID: 40cb4b24d152
Revises: 8649666730d3
Create Date: 2026-10-10 09:52:23.926943

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = '40cb4b24d152'
down_revision: Union[str, Sequence[str], None] = '8649666730d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema with HNSW cosine index on memories.embedding."""
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_memories_embedding_hnsw "
        "ON memories USING hnsw (embedding vector_cosine_ops);"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS ix_memories_embedding_hnsw;")

