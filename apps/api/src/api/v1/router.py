from fastapi import APIRouter
from apps.api.src.api.v1.health import router as health_router

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(health_router)
