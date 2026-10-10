import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db.models.project import Project, ProjectMarket
from src.db.models.user import User
from src.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    @staticmethod
    async def create_project(
        db: AsyncSession,
        user: User,
        data: ProjectCreate,
    ) -> Project:
        """Create a new project with candidate markets."""
        project = Project(
            workspace_id=data.workspace_id,
            name=data.name,
            objective=data.objective,
            brand_profile_json=data.brand_profile_json,
            product_profile_json=data.product_profile_json,
            audience_profile_json=data.audience_profile_json,
            created_by=user.id,
        )
        db.add(project)
        await db.flush()

        for market_data in data.candidate_markets:
            market = ProjectMarket(
                project_id=project.id,
                name=market_data.name,
                country_code=market_data.country_code,
                location_code=market_data.location_code,
                metadata_json=market_data.metadata_json,
            )
            db.add(market)

        await db.commit()

        # Re-fetch with loaded markets
        result = await db.execute(
            select(Project).options(selectinload(Project.markets)).where(Project.id == project.id)
        )
        return result.scalar_one()

    @staticmethod
    async def get_project(
        db: AsyncSession,
        project_id: uuid.UUID,
    ) -> Project | None:
        """Get project by ID with candidate markets."""
        result = await db.execute(
            select(Project).options(selectinload(Project.markets)).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_workspace_projects(
        db: AsyncSession,
        workspace_id: uuid.UUID,
    ) -> list[Project]:
        """List all projects within a specific workspace."""
        result = await db.execute(
            select(Project)
            .options(selectinload(Project.markets))
            .where(Project.workspace_id == workspace_id)
            .order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_project(
        db: AsyncSession,
        project: Project,
        data: ProjectUpdate,
    ) -> Project:
        """Update project configuration."""
        if data.name is not None:
            project.name = data.name
        if data.objective is not None:
            project.objective = data.objective
        if data.status is not None:
            project.status = data.status
        if data.brand_profile_json is not None:
            project.brand_profile_json = data.brand_profile_json
        if data.product_profile_json is not None:
            project.product_profile_json = data.product_profile_json
        if data.audience_profile_json is not None:
            project.audience_profile_json = data.audience_profile_json

        await db.commit()

        result = await db.execute(
            select(Project).options(selectinload(Project.markets)).where(Project.id == project.id)
        )
        return result.scalar_one()

    @staticmethod
    async def delete_project(
        db: AsyncSession,
        project: Project,
    ) -> None:
        """Delete project and associated markets/runs."""
        await db.delete(project)
        await db.commit()
