from fastapi import APIRouter

from src.api.v1.chat import router as chat_router
from src.api.v1.health import router as health_router
from src.api.v1.intake import router as intake_router
from src.api.v1.locations import router as locations_router
from src.api.v1.memories import router as memories_router
from src.api.v1.projects import router as projects_router
from src.api.v1.reports import router as reports_router
from src.api.v1.runs import router as runs_router
from src.api.v1.workspaces import router as workspaces_router

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(health_router)
v1_router.include_router(workspaces_router)
v1_router.include_router(projects_router)
v1_router.include_router(locations_router)
v1_router.include_router(runs_router)
v1_router.include_router(reports_router)
v1_router.include_router(memories_router)
v1_router.include_router(chat_router)
v1_router.include_router(intake_router)

