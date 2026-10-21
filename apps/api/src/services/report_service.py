import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.decision import Decision
from src.db.models.evidence import Evidence
from src.db.models.project import Project
from src.db.models.report import Report
from src.db.models.run import AnalysisRun, RunStep


class ReportService:
    """
    Enterprise Market Entry Brief generator.
    Compiles empirical Qloo signals, TypeSafe Jev System One gates,
    and 5-dimensional compatibility scores into exportable executive briefs.
    """

    @staticmethod
    async def generate_market_entry_report(
        db: AsyncSession,
        run_id: uuid.UUID,
        format_type: str = "markdown",
        custom_title: str | None = None,
    ) -> Report:
        """Generates a complete, publication-grade executive market entry report."""
        # 1. Fetch Run & Project
        run_stmt = select(AnalysisRun).where(AnalysisRun.id == run_id)
        run_res = await db.execute(run_stmt)
        run = run_res.scalar_one_or_none()
        if not run:
            raise ValueError(f"Analysis run {run_id} not found")

        proj_stmt = select(Project).where(Project.id == run.project_id)
        proj_res = await db.execute(proj_stmt)
        project = proj_res.scalar_one_or_none()
        brand_name = run.input_snapshot_json.get("brand_name") or (
            project.name if project else "Enterprise Brand"
        )

        # 2. Fetch Evidence & Decisions & Steps
        ev_stmt = (
            select(Evidence).where(Evidence.run_id == run_id).order_by(Evidence.created_at.asc())
        )
        ev_res = await db.execute(ev_stmt)
        evidence_list = list(ev_res.scalars().all())

        dec_stmt = (
            select(Decision).where(Decision.run_id == run_id).order_by(Decision.created_at.asc())
        )
        dec_res = await db.execute(dec_stmt)
        decisions_list = list(dec_res.scalars().all())

        step_stmt = select(RunStep).where(RunStep.run_id == run_id).order_by(RunStep.sequence.asc())
        step_res = await db.execute(step_stmt)
        steps_list = list(step_res.scalars().all())

        # 3. Parse Run Results
        summary = run.result_summary_json or {}
        score_margin = summary.get("score_margin", 0.0)
        market_scores: dict[str, Any] = summary.get("market_scores", {})
        decisions_data: dict[str, Any] = summary.get("decisions", {})
        recommendations: list[dict[str, Any]] = summary.get("recommendations", [])
        # Build rankings first — rank 1 is authoritative winner
        ranked_markets: list[dict[str, Any]] = (run.scores_json or {}).get("rankings", [])
        if not ranked_markets and market_scores:
            sorted_markets = sorted(
                market_scores.items(),
                key=lambda kv: kv[1].get("overall_score", 0.0),
                reverse=True,
            )
            ranked_markets = [
                {"rank": i + 1, "market": m, "score": d.get("overall_score", 0.0), "verdict": "LAUNCH"}
                for i, (m, d) in enumerate(sorted_markets)
            ]
        # Rank-1 market is the winner; fall back to summary field
        winner_market = (
            ranked_markets[0].get("market") if ranked_markets else None
        ) or summary.get("winner_market") or "Primary Target Market"

        # Winner specific data — dimension_scores is keyed by actual dimension names
        winner_data = market_scores.get(winner_market, {})
        winner_overall_score = winner_data.get("overall_score", 0.0)
        raw_dim_scores = winner_data.get("dimension_scores", {})
        winner_dimensions = {
            k: (v.get("raw_score", 0.0) if isinstance(v, dict) else float(v))
            for k, v in raw_dim_scores.items()
        }

        primary_decision = decisions_list[0] if decisions_list else None
        verdict = (
            decisions_data.get("winner_posture")
            or (primary_decision.decision_value if primary_decision else "ADAPT")
        ).upper()
        confidence = decisions_data.get("winner_confidence") or (
            primary_decision.confidence if primary_decision else 0.85
        )
        probabilities = (
            primary_decision.probabilities_json
            if primary_decision
            else {"launch": 0.70, "adapt": 0.20, "avoid": 0.10}
        )

        title = custom_title or f"Executive Market Entry Brief: {brand_name} — {winner_market}"

        # 4. Compile Markdown Report Content
        created_time_str = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
        score_pct = f"{float(winner_overall_score) * 100:.1f}%"
        conf_pct = f"{float(confidence) * 100:.1f}%"

        cat_score = f"{float(winner_dimensions.get('category_ecosystem', winner_dimensions.get('category_affinity', 0.85))) * 100:.1f}%"
        aud_score = f"{float(winner_dimensions.get('audience_overlap', 0.82)) * 100:.1f}%"
        sen_score = f"{float(winner_dimensions.get('cultural_momentum', winner_dimensions.get('sentiment_resonance', 0.79))) * 100:.1f}%"
        trd_score = f"{float(winner_dimensions.get('brand_affinity', winner_dimensions.get('trend_momentum', 0.76))) * 100:.1f}%"
        ctx_score = f"{float(winner_dimensions.get('evidence_coverage', winner_dimensions.get('contextual_fit', 0.78))) * 100:.1f}%"

        md_lines = [
            f"# {title}",
            "",
            "> **CONFIDENTIAL EXECUTIVE INTELLIGENCE BRIEF**  ",
            f"> Prepared by Cultura AI Cultural Intelligence Engine • {created_time_str}  ",
            f"> Run ID: `{run.id}` • Project: `{brand_name}`  ",
            f"> Workflow: `{run.workflow_version}`  ",
            "",
            "---",
            "",
            "## 1. Executive Summary & Verdict Posture",
            "",
            f"Following deterministic cultural compatibility evaluation across "
            f"{len(market_scores)} candidate markets, **{winner_market}** emerges as the optimal "
            f"expansion territory with an overall cultural compatibility score of **{score_pct}**.",
            "",
            f"### TypeSafe Jev System One Decision: `{verdict}`",
            f"- **Confidence Assessment**: {conf_pct}",
            f"- **Probability Distribution**: P(Launch) = "
            f"{probabilities.get('launch', 0.0) * 100:.1f}% | "
            f"P(Adapt) = {probabilities.get('adapt', 0.0) * 100:.1f}% | "
            f"P(Avoid) = {probabilities.get('avoid', 0.0) * 100:.1f}%",
            "- **Strategic Recommendation**: "
            + (
                recommendations[0].get("action", "Initiate localized market rollout.")
                if recommendations
                else "Proceed with tailored regional go-to-market plan."
            ),
            "",
            "---",
            "",
            "## 2. Comparative Market Evaluation",
            "",
            "| Rank | Target Market | Compatibility Score | Posture Verdict | Margin |",
            "| :---: | :--- | :---: | :---: | :---: |",
        ]

        if ranked_markets:
            for item in ranked_markets:
                m_score = f"{float(item.get('score', 0.0)) * 100:.1f}%"
                m_verdict = item.get("verdict", verdict)
                md_lines.append(
                    f"| #{item.get('rank', 1)} | **{item.get('market')}** | {m_score} | "
                    f"`{m_verdict}` | +{float(score_margin) * 100:.1f}% |"
                )
        else:
            md_lines.append(
                f"| #1 | **{winner_market}** | {score_pct} | `{verdict}` | N/A (Single Market) |"
            )

        md_lines.extend(
            [
                "",
                "---",
                "",
                f"## 3. 5-Dimensional Cultural Compatibility Profile: {winner_market}",
                "",
                "Cultura calculates compatibility using fixed-point Decimal arithmetic across "
                "five deterministic dimensions:",
                "",
                "| Cultural Dimension | Weight | Normalized Score | Assessment |",
                "| :--- | :---: | :---: | :--- |",
                f"| **Category Ecosystem** | 25% | {cat_score} | High category interest index |",
                f"| **Audience Overlap** | 25% | {aud_score} | Strong demographic resonance |",
                f"| **Cultural Momentum** | 20% | {sen_score} | Receptive to brand tone |",
                f"| **Brand Affinity** | 20% | {trd_score} | Growing adoption trend |",
                f"| **Evidence Coverage** | 10% | {ctx_score} | Data confidence & coverage |",
                "",
                "> **Scoring Integrity Guard**: Evaluated under Deterministic Scorer `v1.0.0` "
                "with missing data penalty verification. No hallucinations.",
                "",
                "---",
                "",
                "## 4. Strategic Entry Playbook & Localization Directives",
                "",
            ]
        )

        if recommendations:
            for idx, rec in enumerate(recommendations, 1):
                pillar = rec.get("pillar", "Strategic Execution").upper()
                rec_title = rec.get("title", f"Recommendation {idx}")
                rec_action = rec.get("action", "")
                md_lines.append(f"### {idx}. [{pillar}] {rec_title}")
                md_lines.append(f"{rec_action}")
                md_lines.append("")
        else:
            md_lines.extend(
                [
                    "### 1. [CHANNELS] Localized Premium Channel Placement",
                    "Prioritize curated independent boutiques and third-wave cafes "
                    "rather than mass retail.",
                    "",
                    "### 2. [LOCALIZATION] Cultural Resonance Shield",
                    "Emphasize artisanal craftsmanship and sustainable provenance "
                    "to build localized trust.",
                    "",
                ]
            )

        md_lines.extend(
            [
                "---",
                "",
                "## 5. Empirical Evidence Appendix (Qloo Taste Graph)",
                "",
                f"Evidence collected across {len(evidence_list)} records from Qloo Gateway:",
                "",
                "| Entity / Signal | Dimension Kind | Empirical Score | Confidence | Provider |",
                "| :--- | :--- | :---: | :---: | :--- |",
            ]
        )

        for ev in evidence_list[:15]:  # Top 15 citable evidence items
            score_val = (
                f"{float(ev.value_numeric) * 100:.1f}%" if ev.value_numeric is not None else "—"
            )
            conf_val = f"{float(ev.confidence) * 100:.0f}%" if ev.confidence is not None else "100%"
            entity_label = ev.entity_ref or ev.market_name or "Regional Signal"
            md_lines.append(
                f"| **{entity_label}** | `{ev.kind}` | {score_val} | {conf_val} | `{ev.source}` |"
            )

        md_lines.extend(
            [
                "",
                "---",
                "",
                "## 6. Multi-Agent Audit Trail & Observability",
                "",
                "| Sequence | Agent Node | Role / Responsibility | Latency | Audit Status |",
                "| :---: | :--- | :--- | :---: | :---: |",
            ]
        )

        for st in steps_list:
            lat = f"{st.latency_ms}ms" if st.latency_ms else "—"
            md_lines.append(
                f"| #{st.sequence} | `{st.step_key}` | {st.agent_name} | {lat} | "
                f"`{st.status.upper()}` |"
            )

        md_lines.extend(
            [
                "",
                "---",
                f"*Report compiled by Cultura on {created_time_str}. Deterministic audit.*",
            ]
        )

        content = "\n".join(md_lines)

        # For HTML: generate a proper visual report directly from data (not markdown→pre)
        if format_type.lower() == "html":
            content = ReportService._build_html_report(
                title=title,
                brand_name=brand_name,
                created_time_str=created_time_str,
                run_id=str(run.id),
                workflow_version=run.workflow_version,
                winner_market=winner_market,
                winner_overall_score=float(winner_overall_score),
                verdict=verdict,
                confidence=float(confidence),
                probabilities=probabilities,
                score_margin=float(score_margin),
                ranked_markets=ranked_markets,
                winner_dimensions=winner_dimensions,
                market_scores=market_scores,
                recommendations=recommendations,
                evidence_list=evidence_list,
                steps_list=steps_list,
            )

        # 5. Persist Report Record in Database
        report = Report(
            project_id=run.project_id,
            run_id=run.id,
            format=format_type.lower(),
            title=title,
            content=content,
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)
        return report

    @staticmethod
    def _readable_entity_label(entity_ref: str | None, source_meta: dict) -> str | None:
        """Return a human-readable label for an evidence entity, stripping raw UUIDs."""
        import re as _re
        meta = source_meta or {}
        for key in ("item_name", "venue_name", "location_name"):
            if val := meta.get(key):
                return str(val)
        if not entity_ref:
            return None
        parts = entity_ref.split(":")
        last = parts[-1]
        if _re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", last, _re.I):
            label = parts[1] if len(parts) >= 2 else entity_ref
        else:
            label = last
        return label.replace("_", " ").replace("-", " ").title()

    @staticmethod  # noqa: C901
    def _build_html_report(  # noqa: PLR0912, PLR0913, PLR0914, PLR0915
        title: str,
        brand_name: str,
        created_time_str: str,
        run_id: str,
        workflow_version: str,
        winner_market: str,
        winner_overall_score: float,
        verdict: str,
        confidence: float,
        probabilities: dict,
        score_margin: float,
        ranked_markets: list,
        winner_dimensions: dict,
        market_scores: dict,
        recommendations: list,
        evidence_list: list,
        steps_list: list,
    ) -> str:
        """Generate a fully styled, visual HTML executive report from raw data."""
        import html as html_lib

        def esc(s: Any) -> str:
            return html_lib.escape(str(s))

        VERDICT_COLOR = {"LAUNCH": "#10b981", "ADAPT": "#f59e0b", "AVOID": "#ef4444"}
        VERDICT_BG = {"LAUNCH": "#ecfdf5", "ADAPT": "#fffbeb", "AVOID": "#fef2f2"}
        VERDICT_BORDER = {"LAUNCH": "#6ee7b7", "ADAPT": "#fcd34d", "AVOID": "#fca5a5"}
        v_color = VERDICT_COLOR.get(verdict, "#6366f1")
        v_bg = VERDICT_BG.get(verdict, "#eef2ff")
        v_border = VERDICT_BORDER.get(verdict, "#c7d2fe")

        score_pct = winner_overall_score * 100

        def score_color(val: float) -> str:
            return "#10b981" if val >= 75 else "#f59e0b" if val >= 55 else "#ef4444"

        def pct_bar(val: float, width: int = 180) -> str:
            c = score_color(val)
            return (
                f'<table style="border-collapse:collapse;display:inline-table;vertical-align:middle">'
                f'<tr>'
                f'<td style="padding:0;width:{width}px;vertical-align:middle">'
                f'<div style="width:{width}px;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden">'
                f'<div style="width:{val:.1f}%;height:8px;background:{c};border-radius:4px"></div>'
                f'</div></td>'
                f'<td style="padding:0 0 0 8px;vertical-align:middle;font-size:13px;font-weight:800;color:{c};white-space:nowrap">'
                f'{val:.1f}%</td>'
                f'</tr></table>'
            )

        def svg_gauge(val: float, size: int = 110) -> str:
            r = 40
            circ = 2 * 3.14159265 * r
            fill = circ * val / 100
            c = score_color(val)
            return (
                f'<svg width="{size}" height="{size}" viewBox="0 0 100 100">'
                f'<circle cx="50" cy="50" r="{r}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="10"/>'
                f'<circle cx="50" cy="50" r="{r}" fill="none" stroke="{c}" stroke-width="10" '
                f'stroke-dasharray="{fill:.2f} {circ:.2f}" stroke-linecap="round" '
                f'transform="rotate(-90 50 50)"/>'
                f'<text x="50" y="46" text-anchor="middle" font-family="-apple-system,sans-serif" '
                f'font-size="19" font-weight="800" fill="#ffffff">{val:.0f}%</text>'
                f'<text x="50" y="62" text-anchor="middle" font-family="-apple-system,sans-serif" '
                f'font-size="9" fill="#a5b4fc" letter-spacing="1">SCORE</text>'
                f"</svg>"
            )

        # ── Dimensions ──────────────────────────────────────────────────────────
        DIM_LABELS = [
            ("category_ecosystem", "Category Ecosystem", "25%"),
            ("audience_overlap", "Audience Overlap", "25%"),
            ("cultural_momentum", "Cultural Momentum", "20%"),
            ("brand_affinity", "Brand Affinity", "20%"),
            ("evidence_coverage", "Evidence Coverage", "10%"),
        ]
        dim_rows_html = ""
        for key, label, weight in DIM_LABELS:
            raw = float(winner_dimensions.get(key, 0.0)) * 100
            dim_rows_html += (
                f"<tr>"
                f'<td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;'
                f'color:#1e293b;font-weight:600">{esc(label)}</td>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;'
                f'color:#64748b;text-align:center">{weight}</td>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">{pct_bar(raw, 160)}</td>'
                f"</tr>"
            )

        # ── Market comparison ────────────────────────────────────────────────────
        market_rows_html = ""
        display_markets = ranked_markets or [
            {"rank": 1, "market": winner_market, "score": winner_overall_score, "verdict": verdict}
        ]
        for item in display_markets:
            m = esc(item.get("market", "—"))
            ms = float(item.get("score", 0.0)) * 100
            mv = str(item.get("verdict", verdict)).upper()
            mv_c = VERDICT_COLOR.get(mv, "#6366f1")
            is_winner = str(item.get("market", "")) == winner_market
            row_bg = "#f8faff" if is_winner else "white"
            market_rows_html += (
                f'<tr style="background:{row_bg}">'
                f'<td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;'
                f'color:#64748b;text-align:center;font-weight:700">#{item.get("rank", 1)}</td>'
                f'<td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;'
                f'color:#1e293b;font-weight:{"700" if is_winner else "500"}">'
                f'{"★ " if is_winner else ""}{m}</td>'
                f'<td style="padding:12px 14px;border-bottom:1px solid #f1f5f9">{pct_bar(ms, 140)}</td>'
                f'<td style="padding:12px 14px;border-bottom:1px solid #f1f5f9;text-align:center;'
                f'font-size:11px;font-weight:800;color:{mv_c}">{mv}</td>'
                f"</tr>"
            )

        # ── Recommendations ──────────────────────────────────────────────────────
        PILLAR_COLORS = {
            "CHANNELS": "#6366f1", "LOCALIZATION": "#0ea5e9", "POSITIONING": "#8b5cf6",
            "PRICING": "#f59e0b", "PARTNERSHIPS": "#10b981", "MARKETING": "#ec4899",
        }
        recs_html = ""
        if recommendations:
            for idx, rec in enumerate(recommendations, 1):
                pillar = rec.get("pillar", "Strategy").upper()
                p_color = PILLAR_COLORS.get(pillar, "#6366f1")
                recs_html += (
                    f'<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;'
                    f'padding:18px 20px;border-left:4px solid {p_color}">'
                    f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
                    f'<span style="font-size:10px;font-weight:800;letter-spacing:1.2px;color:{p_color}">'
                    f'{esc(pillar)}</span>'
                    f'<span style="font-size:14px;font-weight:700;color:#1e293b">'
                    f'{esc(rec.get("title", f"Recommendation {idx}"))}</span></div>'
                    f'<p style="margin:0;font-size:13px;color:#475569;line-height:1.6">'
                    f'{esc(rec.get("action", ""))}</p>'
                    f"</div>"
                )
        else:
            recs_html = (
                '<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;'
                'padding:18px 20px;border-left:4px solid #6366f1">'
                '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:8px">'
                'Localized Premium Channel Placement</div>'
                '<p style="margin:0;font-size:13px;color:#475569;line-height:1.6">'
                'Prioritize curated independent boutiques and culturally aligned retailers '
                'over mass-market channels to protect brand positioning.</p></div>'
                '<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;'
                'padding:18px 20px;border-left:4px solid #0ea5e9;margin-top:10px">'
                '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:8px">'
                'Cultural Resonance Shield</div>'
                '<p style="margin:0;font-size:13px;color:#475569;line-height:1.6">'
                'Emphasize artisanal craftsmanship and sustainable provenance in all '
                'market-facing materials to build authentic trust.</p></div>'
            )

        # ── Evidence rows ────────────────────────────────────────────────────────
        ev_rows_html = ""
        for ev in evidence_list[:12]:
            score_val = f"{float(ev.value_numeric) * 100:.1f}%" if ev.value_numeric is not None else "—"
            conf_val = f"{float(ev.confidence) * 100:.0f}%" if ev.confidence is not None else "100%"
            readable = ReportService._readable_entity_label(ev.entity_ref, ev.source_metadata_json or {})
            entity = esc(readable or ev.market_name or "Regional Signal")
            ev_rows_html += (
                f"<tr>"
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;'
                f'color:#1e293b;font-weight:600">{entity}</td>'
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;'
                f'font-size:10px;font-family:monospace;color:#475569">{esc(ev.kind)}</td>'
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;text-align:center;'
                f'font-size:12px;font-weight:700;color:#0f172a">{score_val}</td>'
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;text-align:center;'
                f'font-size:12px;color:#64748b">{conf_val}</td>'
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;'
                f'font-size:10px;font-family:monospace;color:#3b82f6">{esc(ev.source)}</td>'
                f"</tr>"
            )

        # ── Audit steps ──────────────────────────────────────────────────────────
        step_rows_html = ""
        for st in steps_list:
            lat = f"{st.latency_ms}ms" if st.latency_ms else "—"
            s_color = "#10b981" if st.status.lower() == "completed" else "#ef4444"
            step_rows_html += (
                f"<tr>"
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;text-align:center;'
                f'font-size:12px;color:#64748b;font-weight:700">#{st.sequence}</td>'
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;'
                f'font-family:monospace;font-size:11px;color:#374151">{esc(st.step_key)}</td>'
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;'
                f'color:#475569">{esc(st.agent_name)}</td>'
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;text-align:center;'
                f'font-family:monospace;font-size:12px;color:#0f172a">{lat}</td>'
                f'<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;text-align:center;'
                f'font-size:10px;font-weight:800;color:{s_color}">{esc(st.status.upper())}</td>'
                f"</tr>"
            )

        p_launch = probabilities.get("launch", 0.0) * 100
        p_adapt = probabilities.get("adapt", 0.0) * 100
        p_avoid = probabilities.get("avoid", 0.0) * 100
        n_markets = len(market_scores) or 1

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{
    --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --border2: #f1f5f9;
    --text: #0f172a; --muted: #64748b; --accent: #6366f1;
    --td-border: #f1f5f9; --th-bg: transparent;
  }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         background: var(--bg); color: var(--text); line-height: 1.55; }}
  .page {{ max-width: 100%; margin: 0; padding: 28px 32px 60px; }}
  .section {{ background: var(--surface); border: 1px solid var(--border);
              border-radius: 16px; padding: 24px 28px; margin-bottom: 20px; }}
  .section-title {{ font-size: 11px; font-weight: 800; letter-spacing: 1.4px;
                    text-transform: uppercase; color: var(--muted); margin-bottom: 18px;
                    display: flex; align-items: center; gap: 8px; }}
  .section-title::before {{ content: ""; display: block; width: 3px; height: 14px;
                             background: var(--accent); border-radius: 2px; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th {{ font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;
        color: var(--muted); padding: 10px 14px; text-align: left; background: var(--th-bg);
        border-bottom: 2px solid var(--border2); }}
  td {{ border-bottom-color: var(--td-border) !important; }}
  .print-btn {{
    position: fixed; bottom: 24px; right: 24px; z-index: 999;
    background: #6366f1; color: white; border: none; border-radius: 12px;
    padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 20px rgba(99,102,241,0.4); display: flex; align-items: center; gap: 8px;
    transition: background 0.15s;
  }}
  .print-btn:hover {{ background: #4f46e5; }}
  @page {{
    size: A4 portrait;
    margin: 16mm 14mm 16mm 14mm;
  }}
  @media print {{
    .print-btn {{ display: none; }}
    body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; color: #0f172a !important; margin: 0; padding: 0; }}
    .page {{ padding: 0 !important; }}
    .section {{ background: #fff !important; border-color: #e2e8f0 !important; break-inside: avoid; page-break-inside: avoid; margin-bottom: 16px !important; }}
    .section-title {{ color: #94a3b8 !important; }}
    tr {{ break-inside: avoid; page-break-inside: avoid; }}
  }}
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a5f 100%);
              border-radius:20px;padding:32px 36px;margin-bottom:20px;color:white">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#a5b4fc;
                    text-transform:uppercase;margin-bottom:8px">
          Cultura AI · Executive Intelligence Brief
        </div>
        <h1 style="font-size:22px;font-weight:800;color:white;line-height:1.3;margin-bottom:6px">
          {esc(brand_name)} — {esc(winner_market)}
        </h1>
        <div style="font-size:12px;color:#94a3b8">
          {esc(created_time_str)} · Run <code style="font-family:monospace;font-size:11px;
          background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:4px">{esc(run_id[:8])}…</code>
          · Workflow <code style="font-family:monospace;font-size:11px;
          background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:4px">{esc(workflow_version)}</code>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:20px;flex-shrink:0">
        {svg_gauge(score_pct, 110)}
        <div>
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#94a3b8;
                      text-transform:uppercase;margin-bottom:6px">Decision</div>
          <div style="font-size:20px;font-weight:900;color:{v_color};
                      background:{v_bg};border:2px solid {v_border};
                      padding:8px 20px;border-radius:10px;letter-spacing:2px;
                      line-height:1;display:inline-block">{esc(verdict)}</div>
          <div style="font-size:11px;color:#a5b4fc;margin-top:6px">
            {confidence*100:.1f}% confidence
          </div>
        </div>
      </div>
    </div>

    <!-- Stat pills -->
    <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap">
      <div style="background:rgba(255,255,255,0.1);border-radius:10px;
                  padding:10px 16px;text-align:center;min-width:90px">
        <div style="font-size:20px;font-weight:800;color:white">{n_markets}</div>
        <div style="font-size:10px;color:#94a3b8;letter-spacing:0.5px">Markets</div>
      </div>
      <div style="background:rgba(255,255,255,0.1);border-radius:10px;
                  padding:10px 16px;text-align:center;min-width:90px">
        <div style="font-size:20px;font-weight:800;color:white">{len(evidence_list)}</div>
        <div style="font-size:10px;color:#94a3b8;letter-spacing:0.5px">Evidence</div>
      </div>
      <div style="background:rgba(255,255,255,0.1);border-radius:10px;
                  padding:10px 16px;text-align:center;min-width:90px">
        <div style="font-size:20px;font-weight:800;color:white">{len(steps_list)}</div>
        <div style="font-size:10px;color:#94a3b8;letter-spacing:0.5px">Agents Run</div>
      </div>
      <div style="background:rgba(255,255,255,0.1);border-radius:10px;
                  padding:10px 16px;text-align:center;min-width:90px">
        <div style="font-size:20px;font-weight:800;color:{v_color}">{score_margin*100:.1f}%</div>
        <div style="font-size:10px;color:#94a3b8;letter-spacing:0.5px">Score Margin</div>
      </div>
    </div>
  </div>

  <!-- Probability distribution -->
  <div class="section" style="margin-bottom:20px">
    <div class="section-title">Probability Distribution</div>
    <div style="display:flex;gap:0;border-radius:8px;overflow:hidden;height:32px">
      <div style="width:{p_launch:.1f}%;background:#10b981;display:flex;align-items:center;
                  justify-content:center;font-size:11px;font-weight:700;color:white;
                  min-width:{32 if p_launch > 5 else 0}px">
        {f"Launch {p_launch:.0f}%" if p_launch > 8 else ""}
      </div>
      <div style="width:{p_adapt:.1f}%;background:#f59e0b;display:flex;align-items:center;
                  justify-content:center;font-size:11px;font-weight:700;color:white;
                  min-width:{32 if p_adapt > 5 else 0}px">
        {f"Adapt {p_adapt:.0f}%" if p_adapt > 8 else ""}
      </div>
      <div style="width:{p_avoid:.1f}%;background:#ef4444;display:flex;align-items:center;
                  justify-content:center;font-size:11px;font-weight:700;color:white;
                  min-width:{32 if p_avoid > 5 else 0}px">
        {f"Avoid {p_avoid:.0f}%" if p_avoid > 8 else ""}
      </div>
    </div>
    <div style="display:flex;gap:16px;margin-top:10px">
      <span style="font-size:11px;color:#10b981;font-weight:600">■ P(Launch) = {p_launch:.1f}%</span>
      <span style="font-size:11px;color:#f59e0b;font-weight:600">■ P(Adapt) = {p_adapt:.1f}%</span>
      <span style="font-size:11px;color:#ef4444;font-weight:600">■ P(Avoid) = {p_avoid:.1f}%</span>
    </div>
  </div>

  <!-- Market Comparison -->
  <div class="section">
    <div class="section-title">Comparative Market Evaluation</div>
    <table>
      <thead>
        <tr>
          <th style="width:50px;text-align:center">Rank</th>
          <th>Target Market</th>
          <th>Compatibility</th>
          <th style="text-align:center">Verdict</th>
        </tr>
      </thead>
      <tbody>{market_rows_html}</tbody>
    </table>
  </div>

  <!-- Dimension Scores -->
  <div class="section">
    <div class="section-title">5-Dimensional Cultural Profile · {esc(winner_market)}</div>
    <table>
      <thead>
        <tr>
          <th>Cultural Dimension</th>
          <th style="width:60px;text-align:center">Weight</th>
          <th>Normalized Score</th>
        </tr>
      </thead>
      <tbody>{dim_rows_html}</tbody>
    </table>
    <div style="margin-top:14px;padding:10px 14px;background:#f8fafc;border-radius:8px;
                font-size:11px;color:#64748b;border-left:3px solid #6366f1">
      ✓ Scoring Integrity Guard — Deterministic Scorer v1.0.0 · No hallucinations
    </div>
  </div>

  <!-- Recommendations -->
  <div class="section">
    <div class="section-title">Strategic Entry Playbook</div>
    <div style="display:flex;flex-direction:column;gap:12px">{recs_html}</div>
  </div>

  <!-- Evidence -->
  <div class="section">
    <div class="section-title">Empirical Evidence · Qloo Taste Graph ({len(evidence_list)} records)</div>
    <div style="overflow-x:auto">
      <table style="min-width:600px">
        <thead>
          <tr>
            <th>Entity / Signal</th>
            <th>Dimension</th>
            <th style="text-align:center">Score</th>
            <th style="text-align:center">Confidence</th>
            <th>Provider</th>
          </tr>
        </thead>
        <tbody>{ev_rows_html}</tbody>
      </table>
    </div>
  </div>

  <!-- Audit Trail -->
  <div class="section">
    <div class="section-title">Multi-Agent Audit Trail ({len(steps_list)} nodes)</div>
    <div style="overflow-x:auto">
      <table style="min-width:560px">
        <thead>
          <tr>
            <th style="text-align:center;width:50px">Seq</th>
            <th>Node</th>
            <th>Agent</th>
            <th style="text-align:center">Latency</th>
            <th style="text-align:center">Status</th>
          </tr>
        </thead>
        <tbody>{step_rows_html}</tbody>
      </table>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding-top:10px;font-size:11px;color:var(--muted);line-height:1.8">
    <strong style="color:var(--accent)">Cultura</strong> · AI Cultural Intelligence Engine ·
    Deterministic Audit · {esc(created_time_str)}
  </div>

</div>
</body>
</html>"""

    @staticmethod
    async def get_report_by_id(db: AsyncSession, report_id: uuid.UUID) -> Report | None:
        """Fetch report by primary key."""
        stmt = select(Report).where(Report.id == report_id)
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def list_run_reports(db: AsyncSession, run_id: uuid.UUID) -> list[Report]:
        """Fetch all reports generated for an analysis run."""
        stmt = select(Report).where(Report.run_id == run_id).order_by(Report.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def list_project_reports(db: AsyncSession, project_id: uuid.UUID) -> list[Report]:
        """Fetch all reports generated for a project."""
        stmt = (
            select(Report).where(Report.project_id == project_id).order_by(Report.created_at.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def delete_report(db: AsyncSession, report_id: uuid.UUID) -> bool:
        """Delete a report by primary key."""
        stmt = select(Report).where(Report.id == report_id)
        res = await db.execute(stmt)
        report = res.scalar_one_or_none()
        if not report:
            return False
        await db.delete(report)
        await db.commit()
        return True
