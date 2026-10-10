import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.db.models.workspace import WorkspaceRole


class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Workspace display name")
    domain: str | None = Field(None, max_length=255, description="Optional corporate domain")


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    domain: str | None = Field(None, max_length=255)


class WorkspaceMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    workspace_id: uuid.UUID
    user_id: uuid.UUID
    role: WorkspaceRole
    created_at: datetime


class WorkspaceRead(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
