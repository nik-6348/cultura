import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.db.models.memory import Memory
    from src.db.models.run import AnalysisRun
    from src.db.models.user import User
    from src.db.models.workspace import Workspace


class Project(Base, TimestampMixin):
    """Business intelligence unit representing one market expansion problem."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Detailed structured brand/product/audience specifications
    brand_profile_json: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    product_profile_json: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    audience_profile_json: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="projects")
    creator: Mapped["User"] = relationship("User", back_populates="created_projects")
    markets: Mapped[list["ProjectMarket"]] = relationship(
        "ProjectMarket",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    runs: Mapped[list["AnalysisRun"]] = relationship(
        "AnalysisRun",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    memories: Mapped[list["Memory"]] = relationship(
        "Memory",
        back_populates="project",
        cascade="all, delete-orphan",
    )


class ProjectMarket(Base):
    """Candidate geographical market evaluated within a project."""

    __tablename__ = "project_markets"

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
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country_code: Mapped[str] = mapped_column(String(10), nullable=False)
    location_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="markets")
