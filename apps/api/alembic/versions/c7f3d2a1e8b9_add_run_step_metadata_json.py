"""add run_step metadata_json

Revision ID: c7f3d2a1e8b9
Revises: 40cb4b24d152
Create Date: 2026-10-18 10:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c7f3d2a1e8b9"
down_revision: str | None = "40cb4b24d152"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "run_steps",
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("run_steps", "metadata_json")
