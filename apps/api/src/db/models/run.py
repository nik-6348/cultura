import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.db.models.decision import Decision
    from src.db.models.evidence import Evidence
    from src.db.models.project import Project
    from src.db.models.report import Report


class AnalysisRun(Base, TimestampMixin):
    """Analysis run representing one multi-agent LangGraph workflow execution."""

    __tablename__ = "analysis_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    parent_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analysis_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    type: Mapped[str] = mapped_column(String(50), default="market_entry", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="queued", index=True, nullable=False)

    input_snapshot_json: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
    )
    result_summary_json: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    workflow_version: Mapped[str] = mapped_column(String(50), default="v1.0.0", nullable=False)
    score_version: Mapped[str] = mapped_column(String(50), default="v1.0.0", nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(50), default="v1.0.0", nullable=False)

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="runs")
    steps: Mapped[list["RunStep"]] = relationship(
        "RunStep",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="RunStep.sequence",
    )
    evidence: Mapped[list["Evidence"]] = relationship(
        "Evidence",
        back_populates="run",
        cascade="all, delete-orphan",
    )
    decisions: Mapped[list["Decision"]] = relationship(
        "Decision",
        back_populates="run",
        cascade="all, delete-orphan",
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report",
        back_populates="run",
        cascade="all, delete-orphan",
    )


class RunStep(Base):
    """Step execution audit trail within a LangGraph analysis run."""

    __tablename__ = "run_steps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analysis_runs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    step_key: Mapped[str] = mapped_column(String(100), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    input_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    output_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    run: Mapped["AnalysisRun"] = relationship("AnalysisRun", back_populates="steps")
