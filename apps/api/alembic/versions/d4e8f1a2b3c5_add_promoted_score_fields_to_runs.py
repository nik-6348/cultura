"""add promoted score fields to analysis_runs

Revision ID: d4e8f1a2b3c5
Revises: c7f3d2a1e8b9
Create Date: 2026-10-18 11:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d4e8f1a2b3c5"
down_revision: str | None = "c7f3d2a1e8b9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("analysis_runs", sa.Column("overall_score", sa.Float(), nullable=True))
    op.add_column("analysis_runs", sa.Column("decision_verdict", sa.String(length=50), nullable=True))
    op.add_column("analysis_runs", sa.Column("strategy_summary", sa.Text(), nullable=True))
    op.add_column(
        "analysis_runs",
        sa.Column("scores_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("analysis_runs", "scores_json")
    op.drop_column("analysis_runs", "strategy_summary")
    op.drop_column("analysis_runs", "decision_verdict")
    op.drop_column("analysis_runs", "overall_score")
