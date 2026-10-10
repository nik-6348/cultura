import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_current_user, verify_workspace_access
from src.db.models.user import User
from src.db.session import get_db
from src.schemas.evidence import EvidenceRead
from src.schemas.run import AnalysisRunCreate, AnalysisRunRead, RunStepRead
from src.services.analysis_run_service import AnalysisRunService
from src.services.project_service import ProjectService

router = APIRouter(tags=["Analysis Runs"])


@router.post(
    "/projects/{project_id}/runs",
    response_model=AnalysisRunRead,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger an analysis run on a project",
)
async def create_analysis_run(
    project_id: uuid.UUID,
    payload: AnalysisRunCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AnalysisRunRead:
    """Trigger a multi-agent LangGraph analysis run for candidate market evaluation."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )

    # Verify workspace membership
    await verify_workspace_access(project.workspace_id, current_user, db)

    run = await AnalysisRunService.create_and_execute_run(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
        override_markets=payload.override_markets,
    )
    return AnalysisRunRead.model_validate(run)


@router.get(
    "/runs/{run_id}",
    response_model=AnalysisRunRead,
    summary="Retrieve analysis run status and results",
)
async def get_analysis_run(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AnalysisRunRead:
    """Get analysis run status, market rankings, and strategy summary."""
    run = await AnalysisRunService.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run {run_id} not found",
        )

    await verify_workspace_access(run.workspace_id, current_user, db)
    return AnalysisRunRead.model_validate(run)


@router.get(
    "/runs/{run_id}/steps",
    response_model=list[RunStepRead],
    summary="Retrieve live timeline execution steps of a run",
)
async def get_analysis_run_steps(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RunStepRead]:
    """Get timeline execution steps for visualizing progress in UI."""
    run = await AnalysisRunService.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run {run_id} not found",
        )

    await verify_workspace_access(run.workspace_id, current_user, db)
    steps = await AnalysisRunService.get_run_steps(db, run_id)
    return [RunStepRead.model_validate(s) for s in steps]


@router.get(
    "/runs/{run_id}/evidence",
    response_model=list[EvidenceRead],
    summary="Retrieve empirical evidence gathered during an analysis run",
)
async def get_analysis_run_evidence(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[EvidenceRead]:
    """Get citable evidence records collected during this run."""
    run = await AnalysisRunService.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run {run_id} not found",
        )

    await verify_workspace_access(run.workspace_id, current_user, db)
    evidence_records = await AnalysisRunService.get_run_evidence(db, run_id)
    return [EvidenceRead.model_validate(e) for e in evidence_records]
