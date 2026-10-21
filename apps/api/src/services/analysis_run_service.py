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

    # ── Token/cost profile per node ─────────────────────────────────────────
    _NODE_PROFILE: dict[str, dict] = {
        "supervisor": {
            "model": "claude-3-haiku-20240307",
            "est_input_tokens": 1_200, "est_output_tokens": 350,
            "cost_per_m_in": 0.25, "cost_per_m_out": 1.25,
        },
        "brand_analyst": {
            "model": "claude-sonnet-4-5",
            "est_input_tokens": 2_500, "est_output_tokens": 900,
            "cost_per_m_in": 3.0, "cost_per_m_out": 15.0,
        },
        "market_analyst": {
            "model": "claude-sonnet-4-5",
            "est_input_tokens": 2_800, "est_output_tokens": 1_100,
            "cost_per_m_in": 3.0, "cost_per_m_out": 15.0,
        },
        "audience_matcher": {
            "model": "claude-sonnet-4-5",
            "est_input_tokens": 2_200, "est_output_tokens": 800,
            "cost_per_m_in": 3.0, "cost_per_m_out": 15.0,
        },
        "qloo_researcher": {
            "model": "qloo-taste-graph-v2",
            "est_input_tokens": 0, "est_output_tokens": 0,
            "cost_per_m_in": 0, "cost_per_m_out": 0,
        },
        "evidence_normalizer": {
            "model": "claude-3-haiku-20240307",
            "est_input_tokens": 3_500, "est_output_tokens": 1_500,
            "cost_per_m_in": 0.25, "cost_per_m_out": 1.25,
        },
        "deterministic_scorer": {
            "model": "scorer-v1.0-deterministic",
            "est_input_tokens": 0, "est_output_tokens": 0,
            "cost_per_m_in": 0, "cost_per_m_out": 0,
        },
        "jev_decision_gate": {
            "model": "typesafe-jev-1.13",
            "est_input_tokens": 0, "est_output_tokens": 0,
            "cost_per_m_in": 0, "cost_per_m_out": 0,
        },
        "strategy_synthesizer": {
            "model": "claude-sonnet-4-5",
            "est_input_tokens": 4_000, "est_output_tokens": 2_000,
            "cost_per_m_in": 3.0, "cost_per_m_out": 15.0,
        },
        "guardrail_validator": {
            "model": "claude-sonnet-4-5",
            "est_input_tokens": 3_200, "est_output_tokens": 1_200,
            "cost_per_m_in": 3.0, "cost_per_m_out": 15.0,
        },
    }

    @classmethod
    def _build_trace_meta(
        cls,
        node_name: str,
        node_update: dict[str, Any],
        current_state: dict[str, Any],
    ) -> dict[str, Any]:
        """Build rich trace metadata for a node execution step."""
        profile = cls._NODE_PROFILE.get(node_name, {
            "model": "claude-3-haiku-20240307",
            "est_input_tokens": 800, "est_output_tokens": 300,
            "cost_per_m_in": 0.25, "cost_per_m_out": 1.25,
        })

        i_tok = profile["est_input_tokens"]
        o_tok = profile["est_output_tokens"]
        cost = round(
            (i_tok * profile["cost_per_m_in"] + o_tok * profile["cost_per_m_out"]) / 1_000_000,
            6,
        )

        brand_name = current_state.get("brand_name") or "Brand"
        markets = current_state.get("candidate_markets", []) or []
        market_names = ", ".join(
            (m.get("name") or m.get("market", "")) for m in markets[:3]
        ) or "Target Markets"
        raw_ev_count = len(current_state.get("raw_evidence", []) or [])
        ev_count = len(current_state.get("normalized_evidence", []) or [])

        input_summaries: dict[str, str] = {
            "supervisor": f"Brand: {brand_name} | Markets: {market_names}",
            "brand_analyst": f"Brand profile and strategic expansion objective for {brand_name}",
            "market_analyst": f"Territory demographics, retail landscape, and cultural vibrancy for {market_names}",
            "audience_matcher": f"Audience psychographics and consumer affinity profile for {brand_name}",
            "audience_analyst": f"Audience psychographics and consumer affinity profile for {brand_name}",
            "qloo_researcher": f"Qloo taste graph API queries across categories for {market_names}",
            "evidence_normalizer": f"{raw_ev_count} raw cultural taste signals → score calibration pipeline",
            "deterministic_scorer": f"{ev_count} normalized evidence records → 5-dimension cultural fit model",
            "scorer": f"{ev_count} normalized evidence records → 5-dimension cultural fit model",
            "jev_decision_gate": f"Compatibility rankings and risk thresholds across {len(markets)} candidate markets",
            "strategy_synthesizer": f"Market rankings and decision gate posture → localised go-to-market playbook",
            "strategy": f"Market rankings and decision gate posture → localised go-to-market playbook",
            "guardrail_validator": f"Strategic directives and claims → empirical grounding and risk audit",
            "final_review_guard": f"Strategic directives and claims → empirical grounding and risk audit",
        }

        if node_name == "supervisor":
            out_summary = f"Pipeline initialized for {len(markets)} target market(s): {market_names}"
        elif node_name == "brand_analyst":
            out_summary = f"Brand voice, identity anchors, and cultural positioning synthesized"
        elif node_name == "market_analyst":
            out_summary = f"Territory landscape, demographic dynamics, and market readiness evaluated"
        elif node_name in ("audience_analyst", "audience_matcher"):
            out_summary = f"Target consumer personas and affinity profiles mapped"
        elif node_name == "qloo_researcher":
            raw = node_update.get("raw_evidence", []) or []
            out_summary = f"Collected {len(raw)} raw affinity signals from Qloo taste graph"
        elif node_name == "evidence_normalizer":
            normed = node_update.get("normalized_evidence", []) or []
            out_summary = f"Normalized {len(normed)} evidence records with confidence scores"
        elif node_name in ("scorer", "deterministic_scorer"):
            ms = node_update.get("market_scores", {}) or {}
            top = sorted(
                ms.items(), key=lambda kv: (kv[1] or {}).get("overall_score", 0), reverse=True
            )[:2]
            parts = [f"{m}: {(d or {}).get('overall_score', 0):.0%}" for m, d in top]
            out_summary = f"Scored {len(ms)} markets — {', '.join(parts)}" if parts else f"Scored {len(ms)} candidate markets across 5 dimensions"
        elif node_name == "jev_decision_gate":
            decs = (node_update.get("decisions", {}) or {})
            posture = decs.get("winner_posture", "—").upper()
            winner = decs.get("winner_market", "—")
            out_summary = f"Gate decision: {posture} → {winner}"
        elif node_name in ("strategy", "strategy_synthesizer"):
            recs = node_update.get("recommendations", []) or []
            out_summary = f"{len(recs)} strategic directives generated" if recs else "Market entry playbook and directives generated"
        elif node_name in ("final_review_guard", "guardrail_validator"):
            audit = (node_update.get("audit_report", {}) or {})
            status = "PASSED ✓" if audit.get("is_verified") else "FLAGGED ⚠"
            out_summary = f"Audit {status} | {audit.get('total_recommendations', 0)} recs reviewed"
        else:
            out_summary = "Pipeline step completed successfully"

        return {
            "node": node_name,
            "current_step": node_update.get("current_step", node_name),
            "markets_processed": node_update.get("markets_evaluated"),
            "model": profile["model"],
            "est_input_tokens": i_tok,
            "est_output_tokens": o_tok,
            "est_cost_usd": cost,
            "input_summary": input_summaries.get(node_name, f"State context for {node_name}"),
            "output_summary": out_summary,
        }

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

        # Execute through graph stream — each yielded chunk is one completed node
        try:
            async for output in graph.astream(initial_state, config=thread_config):
                step_end_perf = time.perf_counter()
                step_end_ts = datetime.now(UTC)
                step_latency_ms = int((step_end_perf - step_start_perf) * 1000)

                for node_name, node_update in output.items():
                    step_sequence += 1

                    # Merge update into current state
                    current_state.update(node_update)

                    # Determine step status from state — nodes may signal partial failure
                    node_errors: list = node_update.get("errors", []) or []
                    node_status = "failed" if node_errors else "completed"

                    # Build rich trace metadata for in-app timeline
                    trace_meta: dict[str, Any] = AnalysisRunService._build_trace_meta(
                        node_name, node_update, current_state
                    )
                    if node_errors:
                        trace_meta["errors"] = node_errors[:3]

                    step_record = RunStep(
                        run_id=run.id,
                        step_key=node_name,
                        agent_name=f"{node_name}_agent",
                        status=node_status,
                        sequence=step_sequence,
                        started_at=step_start_ts,
                        completed_at=step_end_ts,
                        latency_ms=max(1, step_latency_ms),
                        output_ref=str(node_update.get("current_step", node_name)),
                        error_json={"messages": node_errors} if node_errors else None,
                        metadata_json=trace_meta,
                    )
                    db.add(step_record)
                    await db.commit()

                # Advance timestamp and perf counter for the next node
                step_start_perf = time.perf_counter()
                step_start_ts = datetime.now(UTC)

        except Exception as graph_exc:
            # Record the failing step so the timeline shows exactly where it broke
            step_end_ts = datetime.now(UTC)
            step_latency_ms = int((time.perf_counter() - step_start_perf) * 1000)
            step_sequence += 1
            db.add(RunStep(
                run_id=run.id,
                step_key="graph_error",
                agent_name="graph_error_agent",
                status="failed",
                sequence=step_sequence,
                started_at=step_start_ts,
                completed_at=step_end_ts,
                latency_ms=max(1, step_latency_ms),
                error_json={"type": type(graph_exc).__name__, "message": str(graph_exc)[:500]},
                metadata_json={"node": "graph_error"},
            ))
            run.status = "failed"
            run.error_code = type(graph_exc).__name__[:100]
            await db.commit()
            raise

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
        decisions_state = current_state.get("decisions", {})
        recs = current_state.get("strategy_recommendations", [])
        final_status = current_state.get("status", "completed")

        # Build promoted scalar fields for fast reads
        ranked_markets_raw: list[dict] = ranking_data.get("ranked_markets", [])
        winner_score = ranked_markets_raw[0].get("overall_score") if ranked_markets_raw else None
        winner_posture: str = decisions_state.get("winner_posture") or "launch"
        strategy_summary: str | None = recs[0].get("action") if recs else (
            ranking_data.get("recommendation_summary")
        )

        # Build scores_json rankings list consumed by Project Hub and Run Details
        market_decisions_map: dict = decisions_state.get("market_decisions", {})
        rankings_list = [
            {
                "rank": i + 1,
                "market": m.get("market_name", ""),
                "score": m.get("overall_score", 0.0),
                "verdict": market_decisions_map.get(m.get("market_name", ""), {}).get("posture", winner_posture),
                "confidence": m.get("confidence_score", 0.8),
            }
            for i, m in enumerate(ranked_markets_raw)
        ]

        run.status = final_status
        run.overall_score = float(winner_score) if winner_score is not None else None
        run.decision_verdict = winner_posture
        run.strategy_summary = strategy_summary
        run.scores_json = {"rankings": rankings_list}
        run.result_summary_json = {
            "winner_market": ranking_data.get("winner_market"),
            "score_margin": ranking_data.get("score_margin"),
            "market_scores": current_state.get("market_scores", {}),
            "comparative_matrix": ranking_data.get("comparative_matrix", {}),
            "decisions": decisions_state,
            "recommendations": recs,
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
        if "add_markets" in sanitized_changes:
            existing_names = {m.get("name", "").lower() for m in modified_markets if isinstance(m, dict)}
            for m in sanitized_changes["add_markets"]:
                if isinstance(m, dict) and m.get("name", "").lower() not in existing_names:
                    modified_markets.append(m)
        if "remove_markets" in sanitized_changes:
            remove_names = {r.lower() for r in sanitized_changes["remove_markets"] if isinstance(r, str)}
            modified_markets = [
                m for m in modified_markets
                if isinstance(m, dict) and m.get("name", "").lower() not in remove_names
            ]
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
                node_errors: list = node_update.get("errors", []) or []
                db.add(RunStep(
                    run_id=sim_run.id,
                    step_key=node_name,
                    agent_name=f"{node_name}_agent",
                    status="failed" if node_errors else "completed",
                    sequence=step_sequence,
                    started_at=step_start_ts,
                    completed_at=step_end_ts,
                    latency_ms=max(1, step_latency_ms),
                    output_ref=str(node_update.get("current_step", node_name)),
                    error_json={"messages": node_errors[:3]} if node_errors else None,
                    metadata_json=AnalysisRunService._build_trace_meta(
                        node_name, node_update, current_state
                    ),
                ))
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
        sim_decisions_state = current_state.get("decisions", {})
        sim_recs = current_state.get("strategy_recommendations", [])

        sim_ranked_raw: list[dict] = ranking_data.get("ranked_markets", [])
        sim_winner_score = sim_ranked_raw[0].get("overall_score") if sim_ranked_raw else None
        sim_winner_posture: str = sim_decisions_state.get("winner_posture") or "launch"
        sim_strategy = sim_recs[0].get("action") if sim_recs else ranking_data.get("recommendation_summary")
        sim_market_decisions_map: dict = sim_decisions_state.get("market_decisions", {})
        sim_rankings_list = [
            {
                "rank": i + 1,
                "market": m.get("market_name", ""),
                "score": m.get("overall_score", 0.0),
                "verdict": sim_market_decisions_map.get(m.get("market_name", ""), {}).get("posture", sim_winner_posture),
                "confidence": m.get("confidence_score", 0.8),
            }
            for i, m in enumerate(sim_ranked_raw)
        ]

        sim_run.status = current_state.get("status", "completed")
        sim_run.overall_score = float(sim_winner_score) if sim_winner_score is not None else None
        sim_run.decision_verdict = sim_winner_posture
        sim_run.strategy_summary = sim_strategy
        sim_run.scores_json = {"rankings": sim_rankings_list}
        sim_run.result_summary_json = {
            "winner_market": ranking_data.get("winner_market"),
            "score_margin": ranking_data.get("score_margin"),
            "market_scores": sim_scores,
            "comparative_matrix": ranking_data.get("comparative_matrix", {}),
            "decisions": sim_decisions_state,
            "recommendations": sim_recs,
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
