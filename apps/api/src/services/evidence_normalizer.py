import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.evidence import Evidence
from src.integrations.qloo.models import (
    QlooAudienceInsights,
    QlooLocationInsights,
    QlooTrendInsights,
)


class EvidenceNormalizer:
    """
    Transforms raw and structured Qloo responses into canonical, citable
    Evidence ORM records with mathematical value scaling and human-readable explanations.
    """

    @staticmethod
    def normalize_audience_insights(
        insights: QlooAudienceInsights,
        run_id: uuid.UUID,
        project_id: uuid.UUID,
        market_name: str,
        request_hash: str = "",
        latency_ms: int = 0,
    ) -> list[Evidence]:
        """Convert audience affinity items into canonical Evidence records."""
        evidence_items: list[Evidence] = []

        for item in insights.affinities:
            pct = round(item.affinity_score * 100, 1)
            explanation = (
                f"Observed {pct}% consumer affinity with '{item.name}' "
                f"({item.category}) for target audience in {market_name}."
            )
            entity_ref = f"qloo:{item.category}:{item.entity_id}"
            confidence = round(min(1.0, max(0.5, item.relevance)), 2)

            evidence = Evidence(
                run_id=run_id,
                project_id=project_id,
                source="qloo",
                kind="brand_affinity",
                market_name=market_name,
                entity_ref=entity_ref,
                value_numeric=item.affinity_score,
                value_text=None,
                explanation=explanation,
                confidence=confidence,
                source_metadata_json={
                    "qloo_endpoint": "/v2/insights/audiences",
                    "request_hash": request_hash,
                    "latency_ms": latency_ms,
                    "item_name": item.name,
                    "category": item.category,
                },
            )
            evidence_items.append(evidence)

        return evidence_items

    @staticmethod
    def normalize_location_insights(
        insights: QlooLocationInsights,
        run_id: uuid.UUID,
        project_id: uuid.UUID,
        market_name: str,
        request_hash: str = "",
        latency_ms: int = 0,
    ) -> list[Evidence]:
        """Convert location demographics and cluster data into canonical Evidence records."""
        evidence_items: list[Evidence] = []
        clusters_str = (
            ", ".join(insights.cultural_clusters) if insights.cultural_clusters else "Central Core"
        )
        density_pct = round(insights.density_score * 100, 1)

        explanation = (
            f"Category ecosystem density score of {density_pct}% in {market_name} "
            f"({insights.location_code}). Key subculture hubs identified: {clusters_str}."
        )

        density_evidence = Evidence(
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="locality_density",
            market_name=market_name,
            entity_ref=f"qloo:location:{insights.location_code}",
            value_numeric=insights.density_score,
            value_text=None,
            explanation=explanation,
            confidence=0.90,
            source_metadata_json={
                "qloo_endpoint": "/v2/insights/locations",
                "request_hash": request_hash,
                "latency_ms": latency_ms,
                "location_code": insights.location_code,
                "clusters": insights.cultural_clusters,
            },
        )
        evidence_items.append(density_evidence)

        # Include venue anchor evidence if available
        for venue in insights.top_venues:
            v_name = venue.get("name", "Anchor Venue")
            v_cat = venue.get("category", "lifestyle")
            v_aff = float(venue.get("affinity", 0.8))
            v_pct = round(v_aff * 100, 1)
            v_expl = (
                f"Cultural anchor venue '{v_name}' ({v_cat}) demonstrates "
                f"{v_pct}% fit in {market_name}."
            )

            evidence_items.append(
                Evidence(
                    run_id=run_id,
                    project_id=project_id,
                    source="qloo",
                    kind="venue_anchor",
                    market_name=market_name,
                    entity_ref=f"qloo:venue:{v_name.lower().replace(' ', '_')}",
                    value_numeric=v_aff,
                    value_text=None,
                    explanation=v_expl,
                    confidence=0.88,
                    source_metadata_json={
                        "qloo_endpoint": "/v2/insights/locations",
                        "request_hash": request_hash,
                        "latency_ms": latency_ms,
                        "venue_name": v_name,
                        "venue_category": v_cat,
                    },
                )
            )

        return evidence_items

    @staticmethod
    def normalize_trend_insights(
        insights: QlooTrendInsights,
        run_id: uuid.UUID,
        project_id: uuid.UUID,
        market_name: str | None = None,
        request_hash: str = "",
        latency_ms: int = 0,
    ) -> list[Evidence]:
        """Convert velocity momentum signals into canonical Evidence records."""
        # Scale momentum velocity (-1.0 to 1.0) into normalized numeric [0.0, 1.0]
        normalized_velocity = round((insights.momentum_velocity + 1.0) / 2.0, 4)
        explanation = (
            f"Cultural momentum for '{insights.entity_or_category}' is {insights.trajectory} "
            f"(velocity: {insights.momentum_velocity:+.2f}) over {insights.interval_days} days."
        )

        trend_evidence = Evidence(
            run_id=run_id,
            project_id=project_id,
            source="qloo",
            kind="cultural_momentum",
            market_name=market_name,
            entity_ref=f"qloo:trend:{insights.entity_or_category.lower().replace(' ', '_')}",
            value_numeric=normalized_velocity,
            value_text=insights.trajectory,
            explanation=explanation,
            confidence=0.85,
            source_metadata_json={
                "qloo_endpoint": "/v2/insights/trends",
                "request_hash": request_hash,
                "latency_ms": latency_ms,
                "raw_velocity": insights.momentum_velocity,
                "interval_days": insights.interval_days,
            },
        )
        return [trend_evidence]

    @staticmethod
    async def persist_evidence_batch(
        db: AsyncSession,
        evidence_items: list[Evidence],
    ) -> list[Evidence]:
        """
        Deduplicate and persist a batch of Evidence records in a single database transaction.
        """
        if not evidence_items:
            return []

        # Find existing evidence for this run to avoid duplicates
        run_id = evidence_items[0].run_id
        stmt = select(Evidence.kind, Evidence.market_name, Evidence.entity_ref).where(
            Evidence.run_id == run_id
        )
        existing_res = await db.execute(stmt)
        existing_keys = {(r[0], r[1], r[2]) for r in existing_res.fetchall()}

        persisted: list[Evidence] = []
        for ev in evidence_items:
            key = (ev.kind, ev.market_name, ev.entity_ref)
            if key not in existing_keys:
                db.add(ev)
                persisted.append(ev)
                existing_keys.add(key)

        if persisted:
            await db.commit()
            for p in persisted:
                await db.refresh(p)

        return persisted
