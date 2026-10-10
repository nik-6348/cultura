import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ProjectMarketBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="City or market name")
    country_code: str = Field(..., min_length=2, max_length=10, description="ISO Country Code")
    location_code: str | None = Field(None, max_length=50, description="Qloo location identifier")
    metadata_json: dict[str, Any] = Field(default_factory=dict)


class ProjectMarketCreate(ProjectMarketBase):
    pass


class ProjectMarketRead(ProjectMarketBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Project title")
    objective: str | None = Field(None, description="Primary business launch goal")
    brand_profile_json: dict[str, Any] = Field(
        default_factory=dict, description="Brand positioning, price point, origin"
    )
    product_profile_json: dict[str, Any] = Field(
        default_factory=dict, description="Product category and key attributes"
    )
    audience_profile_json: dict[str, Any] = Field(
        default_factory=dict, description="Target customer demographics and psychographics"
    )


class ProjectCreate(ProjectBase):
    workspace_id: uuid.UUID
    candidate_markets: list[ProjectMarketCreate] = Field(
        default_factory=list, description="Candidate expansion markets to evaluate"
    )


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    objective: str | None = None
    status: str | None = None
    brand_profile_json: dict[str, Any] | None = None
    product_profile_json: dict[str, Any] | None = None
    audience_profile_json: dict[str, Any] | None = None


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    status: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    markets: list[ProjectMarketRead] = Field(default_factory=list)
