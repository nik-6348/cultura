import time
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.graph import create_analysis_graph
from src.agents.state import AnalysisState
from src.core.security_guard import PromptInjectionGuard
from src.db.models.decision import Decision
from src.db.models.evidence import Evidence
from src.db.models.project import Project, ProjectMarket
from src.db.models.run import AnalysisRun, RunStep
from src.scorer.engine import SCORE_VERSION


class AnalysisRunService:
    """
    Orchestration service that executes LangGraph analysis runs,
    persists step-by-step audit timelines in run_steps, and stores normalized evidence.
    """

    @staticmethod
    async def create_and_execute_run(
        db: AsyncSession,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        override_markets: list[dict[str, str]] | None = None,
    ) -> AnalysisRun:
        """Create and run a complete multi-agent analysis for a project."""
        # 1. Fetch Project & Markets
        proj_stmt = select(Project).where(Project.id == project_id)
        proj_res = await db.execute(proj_stmt)
        project = proj_res.scalar_one_or_none()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Get candidate markets
        if override_markets:
            markets_payload = override_markets
        else:
            m_stmt = select(ProjectMarket).where(ProjectMarket.project_id == project_id)
            m_res = await db.execute(m_stmt)
            db_markets = m_res.scalars().all()
            if db_markets:
                markets_payload = [
                    {"name": m.name, "code": m.location_code or "GLOBAL"} for m in db_markets
                ]
            else:
                markets_payload = [
                    {"name": "London", "code": "GB-LND"},
                    {"name": "Berlin", "code": "DE-BER"},
                ]

        # 2. Create AnalysisRun record
        run = AnalysisRun(
            project_id=project_id,
            workspace_id=project.workspace_id,
            created_by=user_id,
            type="market_entry",
            status="running",
            input_snapshot_json={
                "brand_name": PromptInjectionGuard.sanitize_untrusted_input(project.name),
                "objective": PromptInjectionGuard.sanitize_untrusted_input(
                    project.objective or "Market entry strategy"
                ),
                "candidate_markets": markets_payload,
                "brand_profile": PromptInjectionGuard.validate_and_sanitize_dict(
                    project.brand_profile_json or {}
                ),
                "audience_profile": PromptInjectionGuard.validate_and_sanitize_dict(
                    project.audience_profile_json or {}
                ),
            },
            workflow_version="v1.0.0",
            score_version=SCORE_VERSION,
            prompt_version="v1.0.0",
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)

        # 3. Setup initial state for LangGraph
        initial_state: AnalysisState = {
            "run_id": str(run.id),
            "project_id": str(project.id),
            "workspace_id": str(project.workspace_id),
            "brand_name": project.name,
            "objective": project.objective or "Market entry analysis",
            "candidate_markets": markets_payload,
            "brand_profile": project.brand_profile_json or {},
            "audience_profile": project.audience_profile_json or {},
            "status": "running",
            "step_history": [],
            "research_queries": [],
            "raw_evidence": [],
            "normalized_evidence": [],
            "errors": [],
        }

        # 4. Compile and stream/execute graph with step recording
        graph = create_analysis_graph()
        thread_config = {"configurable": {"thread_id": str(run.id)}}

        current_state = initial_state
        step_sequence = 0
        step_start_perf = time.perf_counter()
        step_start_ts = datetime.now(UTC)

        # Execute through graph stream
        async for output in graph.astream(initial_state, config=thread_config):
            step_end_perf = time.perf_counter()
            step_end_ts = datetime.now(UTC)
            step_latency_ms = int((step_end_perf - step_start_perf) * 1000)

            for node_name, node_update in output.items():
                step_sequence += 1

                # Merge update into current state
                current_state.update(node_update)

                # Record step in run_steps
                step_record = RunStep(
                    run_id=run.id,
                    step_key=node_name,
                    agent_name=f"{node_name}_agent",
                    status="completed",
                    sequence=step_sequence,
                    started_at=step_start_ts,
                    completed_at=step_end_ts,
                    latency_ms=max(1, step_latency_ms),
                    output_ref=str(node_update.get("current_step", node_name)),
                )
                db.add(step_record)
                await db.commit()

            # Advance timestamp and timer for the next agent node execution
            step_start_perf = time.perf_counter()
            step_start_ts = datetime.now(UTC)

        # 5. Persist normalized evidence records into database
        normalized_ev = current_state.get("normalized_evidence", [])
        for ev_data in normalized_ev:
            raw_ev_id = ev_data.get("id")
            ev_id = (
                uuid.UUID(raw_ev_id)
                if (isinstance(raw_ev_id, str) and raw_ev_id != "None")
                else uuid.uuid4()
            )
            ev_record = Evidence(
                id=ev_id,
                run_id=run.id,
                project_id=project.id,
                source=ev_data.get("source", "qloo"),
                kind=ev_data["kind"],
                market_name=ev_data.get("market_name"),
                entity_ref=ev_data.get("entity_ref"),
                value_numeric=ev_data.get("value_numeric"),
                value_text=ev_data.get("value_text"),
                explanation=ev_data["explanation"],
                confidence=ev_data.get("confidence", 1.0),
                source_metadata_json=ev_data.get("source_metadata_json", {}),
            )
            db.add(ev_record)

        # 5b. Persist decisions records into database
        decisions_state = current_state.get("decisions", {})
        market_decisions = decisions_state.get("market_decisions", {})
        for m_name, dec_info in market_decisions.items():
            posture = dec_info.get("posture", "launch")
            posture_conf = float(dec_info.get("posture_confidence", 0.90))
            posture_probs = dec_info.get("posture_probabilities", {posture: 1.0})
            model_name = str(dec_info.get("model_name", "typesafe-jev-1.13"))
            latency_ms = int(dec_info.get("latency_ms", 1))

            suff = dec_info.get("evidence_sufficiency", "sufficient")
            suff_conf = float(dec_info.get("sufficiency_confidence", 0.90))
            review_req = bool(dec_info.get("human_review_required", False))
            review_conf = float(dec_info.get("human_review_confidence", 0.90))

            db.add(
                Decision(
                    id=uuid.uuid4(),
                    run_id=run.id,
                    question_key=f"{m_name}:market_decision",
                    decision_value=posture,
                    probabilities_json=posture_probs,
                    confidence=posture_conf,
                    model_name=model_name,
                    schema_version="v1.0.0",
                    latency_ms=latency_ms,
                )
            )
            db.add(
                Decision(
                    id=uuid.uuid4(),
                    run_id=run.id,
                    question_key=f"{m_name}:evidence_sufficiency",
                    decision_value=suff,
                    probabilities_json={
                        suff: suff_conf,
                        "insufficient" if suff == "sufficient" else "sufficient": round(
                            1.0 - suff_conf, 4
                        ),
                    },
                    confidence=suff_conf,
                    model_name=model_name,
                    schema_version="v1.0.0",
                    latency_ms=latency_ms,
                )
            )
            db.add(
                Decision(
                    id=uuid.uuid4(),
                    run_id=run.id,
                    question_key=f"{m_name}:human_review_required",
                    decision_value="yes" if review_req else "no",
                    probabilities_json={
                        "yes": 0.90 if review_req else 0.10,
                        "no": 0.10 if review_req else 0.90,
                    },
                    confidence=review_conf,
                    model_name=model_name,
                    schema_version="v1.0.0",
                    latency_ms=latency_ms,
                )
            )

        # 6. Finalize Run summary
        ranking_data = current_state.get("market_ranking", {})
        final_status = current_state.get("status", "completed")

        run.status = final_status
        run.result_summary_json = {
            "winner_market": ranking_data.get("winner_market"),
            "score_margin": ranking_data.get("score_margin"),
            "market_scores": current_state.get("market_scores", {}),
            "comparative_matrix": ranking_data.get("comparative_matrix", {}),
            "decisions": current_state.get("decisions", {}),
            "recommendations": current_state.get("strategy_recommendations", []),
            "audit_report": current_state.get("audit_report", {}),
        }

        await db.commit()
        await db.refresh(run)
        return run

    @staticmethod
    async def get_run_by_id(
        db: AsyncSession,
        run_id: uuid.UUID,
    ) -> AnalysisRun | None:
        """Fetch analysis run by primary key."""
        stmt = select(AnalysisRun).where(AnalysisRun.id == run_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_run_steps(
        db: AsyncSession,
        run_id: uuid.UUID,
    ) -> list[RunStep]:
        """Fetch all execution steps for a run ordered by sequence."""
        stmt = select(RunStep).where(RunStep.run_id == run_id).order_by(RunStep.sequence.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_run_evidence(
        db: AsyncSession,
        run_id: uuid.UUID,
    ) -> list[Evidence]:
        """Fetch all evidence collected during an analysis run."""
        stmt = select(Evidence).where(Evidence.run_id == run_id).order_by(Evidence.created_at.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_run_decisions(
        db: AsyncSession,
        run_id: uuid.UUID,
    ) -> list[Decision]:
        """Fetch all decisions recorded during an analysis run."""
        stmt = select(Decision).where(Decision.run_id == run_id).order_by(Decision.created_at.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def list_project_runs(
        db: AsyncSession,
        project_id: uuid.UUID,
    ) -> list[AnalysisRun]:
        """Fetch all analysis runs belonging to a project."""
        stmt = (
            select(AnalysisRun)
            .where(AnalysisRun.project_id == project_id)
            .order_by(AnalysisRun.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def list_workspace_runs(
        db: AsyncSession,
        workspace_id: uuid.UUID,
        limit: int = 20,
    ) -> list[AnalysisRun]:
        """Fetch recent analysis runs across an entire workspace."""
        stmt = (
            select(AnalysisRun)
            .where(AnalysisRun.workspace_id == workspace_id)
            .order_by(AnalysisRun.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create_and_execute_simulation(
        db: AsyncSession,
        parent_run_id: uuid.UUID,
        user_id: uuid.UUID,
        changes: dict[str, Any],
    ) -> AnalysisRun:
        """
        Executes a counterfactual simulation run linked to a parent baseline run.
        Computes parameter deltas, executes full agent DAG, and records comparison.
        """
        parent_run = await AnalysisRunService.get_run_by_id(db, parent_run_id)
        if not parent_run:
            raise ValueError(f"Parent analysis run {parent_run_id} not found")

        # Merge changes into baseline input snapshot
        sanitized_changes = PromptInjectionGuard.validate_and_sanitize_dict(changes)
        baseline_input = dict(parent_run.input_snapshot_json or {})
        modified_brand = dict(baseline_input.get("brand_profile", {}))
        modified_audience = dict(baseline_input.get("audience_profile", {}))
        modified_markets = list(baseline_input.get("candidate_markets", []))

        if "price_positioning" in sanitized_changes:
            modified_brand["price_point"] = sanitized_changes["price_positioning"]
        if "category" in sanitized_changes:
            modified_brand["category"] = sanitized_changes["category"]
        if "target_audience" in sanitized_changes:
            modified_audience["target_description"] = sanitized_changes["target_audience"]
        if "override_markets" in sanitized_changes:
            modified_markets = sanitized_changes["override_markets"]
        if "brand_profile" in sanitized_changes:
            modified_brand.update(sanitized_changes["brand_profile"])
        if "audience_profile" in sanitized_changes:
            modified_audience.update(sanitized_changes["audience_profile"])

        sim_snapshot = {
            "brand_name": baseline_input.get("brand_name", "Brand"),
            "objective": baseline_input.get("objective", "Market Entry"),
            "candidate_markets": modified_markets,
            "brand_profile": modified_brand,
            "audience_profile": modified_audience,
            "simulation_changes": sanitized_changes,
            "parent_run_id": str(parent_run_id),
        }

        # Create simulation run record
        sim_run = AnalysisRun(
            project_id=parent_run.project_id,
            workspace_id=parent_run.workspace_id,
            created_by=user_id,
            parent_run_id=parent_run_id,
            type="simulation",
            status="running",
            input_snapshot_json=sim_snapshot,
            workflow_version=parent_run.workflow_version,
            score_version=parent_run.score_version,
            prompt_version=parent_run.prompt_version,
        )
        db.add(sim_run)
        await db.commit()
        await db.refresh(sim_run)

        # Setup initial state for LangGraph
        initial_state: AnalysisState = {
            "run_id": str(sim_run.id),
            "project_id": str(parent_run.project_id),
            "workspace_id": str(parent_run.workspace_id),
            "brand_name": sim_snapshot["brand_name"],
            "objective": sim_snapshot["objective"],
            "candidate_markets": modified_markets,
            "brand_profile": modified_brand,
            "audience_profile": modified_audience,
            "status": "running",
            "step_history": [],
            "research_queries": [],
            "raw_evidence": [],
            "normalized_evidence": [],
            "errors": [],
        }

        graph = create_analysis_graph()
        thread_config = {"configurable": {"thread_id": str(sim_run.id)}}
        current_state = initial_state
        step_sequence = 0
        step_start_perf = time.perf_counter()
        step_start_ts = datetime.now(UTC)

        async for output in graph.astream(initial_state, config=thread_config):
            step_end_perf = time.perf_counter()
            step_end_ts = datetime.now(UTC)
            step_latency_ms = int((step_end_perf - step_start_perf) * 1000)

            for node_name, node_update in output.items():
                step_sequence += 1
                current_state.update(node_update)

                step_record = RunStep(
                    run_id=sim_run.id,
                    step_key=node_name,
                    agent_name=f"{node_name}_agent",
                    status="completed",
                    sequence=step_sequence,
                    started_at=step_start_ts,
                    completed_at=step_end_ts,
                    latency_ms=max(1, step_latency_ms),
                    output_ref=str(node_update.get("current_step", node_name)),
                )
                db.add(step_record)
                await db.commit()

            step_start_perf = time.perf_counter()
            step_start_ts = datetime.now(UTC)

        # Persist normalized evidence
        for ev_data in current_state.get("normalized_evidence", []):
            raw_ev_id = ev_data.get("id")
            ev_id = (
                uuid.UUID(raw_ev_id)
                if (isinstance(raw_ev_id, str) and raw_ev_id != "None")
                else uuid.uuid4()
            )
            ev_record = Evidence(
                id=ev_id,
                run_id=sim_run.id,
                project_id=parent_run.project_id,
                source=ev_data.get("source", "qloo"),
                kind=ev_data["kind"],
                market_name=ev_data.get("market_name"),
                entity_ref=ev_data.get("entity_ref"),
                value_numeric=ev_data.get("value_numeric"),
                value_text=ev_data.get("value_text"),
                explanation=ev_data["explanation"],
                confidence=ev_data.get("confidence", 1.0),
                source_metadata_json=ev_data.get("source_metadata_json", {}),
            )
            db.add(ev_record)

        # Persist decisions
        decisions_state = current_state.get("decisions", {})
        market_decisions = decisions_state.get("market_decisions", {})
        for m_name, dec_info in market_decisions.items():
            posture = dec_info.get("posture", "launch")
            posture_conf = float(dec_info.get("posture_confidence", 0.90))
            posture_probs = dec_info.get("posture_probabilities", {posture: 1.0})
            model_name = str(dec_info.get("model_name", "typesafe-jev-1.13"))
            latency_ms = int(dec_info.get("latency_ms", 1))

            db.add(
                Decision(
                    id=uuid.uuid4(),
                    run_id=sim_run.id,
                    question_key=f"{m_name}:market_decision",
                    decision_value=posture,
                    probabilities_json=posture_probs,
                    confidence=posture_conf,
                    model_name=model_name,
                    schema_version="v1.0.0",
                    latency_ms=latency_ms,
                )
            )

        # Compute delta matrix against parent run
        parent_result = parent_run.result_summary_json or {}
        parent_scores = parent_result.get("market_scores", {})
        sim_scores = current_state.get("market_scores", {})
        score_deltas: dict[str, float] = {}

        for m_name, s_info in sim_scores.items():
            sim_val = float(s_info.get("overall_score", 0.0))
            parent_val = float(parent_scores.get(m_name, {}).get("overall_score", 0.0))
            score_deltas[m_name] = round(sim_val - parent_val, 4)

        ranking_data = current_state.get("market_ranking", {})
        sim_run.status = current_state.get("status", "completed")
        sim_run.result_summary_json = {
            "winner_market": ranking_data.get("winner_market"),
            "score_margin": ranking_data.get("score_margin"),
            "market_scores": sim_scores,
            "comparative_matrix": ranking_data.get("comparative_matrix", {}),
            "decisions": current_state.get("decisions", {}),
            "recommendations": current_state.get("strategy_recommendations", []),
            "audit_report": current_state.get("audit_report", {}),
            "simulation_delta": {
                "parent_run_id": str(parent_run.id),
                "parent_winner": parent_result.get("winner_market"),
                "new_winner": ranking_data.get("winner_market"),
                "winner_changed": (
                    parent_result.get("winner_market") != ranking_data.get("winner_market")
                ),
                "score_deltas": score_deltas,
                "changes_applied": changes,
            },
        }
        await db.commit()
        await db.refresh(sim_run)
        return sim_run
