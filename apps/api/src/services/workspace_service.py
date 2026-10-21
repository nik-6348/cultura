import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.user import User
from src.db.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from src.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


class WorkspaceService:
    @staticmethod
    async def create_workspace(
        db: AsyncSession,
        user: User,
        data: WorkspaceCreate,
    ) -> Workspace:
        """Create a new workspace and automatically assign the creator as Owner."""
        workspace = Workspace(
            name=data.name,
            domain=data.domain,
            owner_user_id=user.id,
        )
        db.add(workspace)
        await db.flush()

        # Add creator as owner member
        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role=WorkspaceRole.OWNER,
        )
        db.add(member)
        await db.commit()
        await db.refresh(workspace)
        return workspace

    @staticmethod
    async def get_workspace(
        db: AsyncSession,
        workspace_id: uuid.UUID,
    ) -> Workspace | None:
        """Get workspace by ID."""
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_user_workspaces(
        db: AsyncSession,
        user: User,
    ) -> list[Workspace]:
        """List all workspaces where the user is an owner or member."""
        result = await db.execute(
            select(Workspace)
            .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
            .where(WorkspaceMember.user_id == user.id)
            .order_by(Workspace.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_workspace(
        db: AsyncSession,
        workspace: Workspace,
        data: WorkspaceUpdate,
    ) -> Workspace:
        """Update workspace details."""
        if data.name is not None:
            workspace.name = data.name
        if data.domain is not None:
            workspace.domain = data.domain
        await db.commit()
        await db.refresh(workspace)
        return workspace
