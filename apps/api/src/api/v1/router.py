from fastapi import APIRouter

from src.api.v1.health import router as health_router
from src.api.v1.projects import router as projects_router
from src.api.v1.workspaces import router as workspaces_router

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(health_router)
v1_router.include_router(workspaces_router)
v1_router.include_router(projects_router)
