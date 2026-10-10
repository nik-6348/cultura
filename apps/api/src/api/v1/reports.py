import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_current_user, verify_workspace_access
from src.db.models.user import User
from src.db.session import get_db
from src.schemas.report import ReportCreate, ReportRead
from src.services.analysis_run_service import AnalysisRunService
from src.services.report_service import ReportService

router = APIRouter(tags=["Reports"])


@router.post(
    "/runs/{run_id}/reports",
    response_model=ReportRead,
    status_code=status.HTTP_201_CREATED,
    summary="Generate an executive market entry brief for an analysis run",
)
async def generate_run_report(
    run_id: uuid.UUID,
    payload: ReportCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportRead:
    """Compiles a complete publication-grade executive brief from empirical run data."""
    run = await AnalysisRunService.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run {run_id} not found",
        )

    await verify_workspace_access(run.workspace_id, current_user, db)

    report = await ReportService.generate_market_entry_report(
        db=db,
        run_id=run_id,
        format_type=payload.format,
        custom_title=payload.title,
    )
    return ReportRead.model_validate(report)


@router.get(
    "/runs/{run_id}/reports",
    response_model=list[ReportRead],
    summary="List all reports generated for an analysis run",
)
async def list_run_reports(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ReportRead]:
    """Retrieve all historical reports compiled for this analysis run."""
    run = await AnalysisRunService.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run {run_id} not found",
        )

    await verify_workspace_access(run.workspace_id, current_user, db)

    reports = await ReportService.list_run_reports(db, run_id)
    return [ReportRead.model_validate(r) for r in reports]


@router.get(
    "/reports/{report_id}",
    response_model=ReportRead,
    summary="Retrieve report metadata and content by ID",
)
async def get_report(
    report_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportRead:
    """Retrieve saved report by unique ID."""
    report = await ReportService.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found",
        )

    # Verify workspace membership through the run
    run = await AnalysisRunService.get_run_by_id(db, report.run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent analysis run not found",
        )

    await verify_workspace_access(run.workspace_id, current_user, db)
    return ReportRead.model_validate(report)


@router.get(
    "/reports/{report_id}/raw",
    summary="Download or view raw report content (Markdown or HTML)",
)
async def get_raw_report(
    report_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """Download raw report content directly."""
    report = await ReportService.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found",
        )

    run = await AnalysisRunService.get_run_by_id(db, report.run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent analysis run not found",
        )

    await verify_workspace_access(run.workspace_id, current_user, db)

    media_type = "text/html" if report.format == "html" else "text/markdown"
    filename = f"cultura_report_{report.id.hex[:8]}.{'html' if report.format == 'html' else 'md'}"

    return Response(
        content=report.content or "",
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
