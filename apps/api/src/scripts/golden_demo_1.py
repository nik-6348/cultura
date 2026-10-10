import asyncio
import json
import logging
import uuid
from typing import Any

from src.integrations.qloo.client import QlooClient
from src.scorer.engine import CompatibilityScorer
from src.services.evidence_normalizer import EvidenceNormalizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("cultura.demo1")


async def run_golden_demo() -> dict[str, Any]:
    """
    Executes Golden Demo 1:
    Brand: Tokyo Minimalist Streetwear (Undercover / WTAPS proxy)
    Markets: London (GB-LND) vs Berlin (DE-BER)
    Flow:
    1. Resolve brand proxies via Qloo Client.
    2. Retrieve cross-domain taste affinities for candidate markets.
    3. Retrieve location venue and density profiles.
    4. Retrieve trend velocity.
    5. Normalize raw signals into canonical Evidence records.
    6. Compute 5-dimension deterministic compatibility scores.
    7. Generate comparative ranking matrix.
    """
    logger.info("==================================================================")
    logger.info("   CULTURA — GOLDEN DEMO 1: DETERMINISTIC CULTURAL SCORING        ")
    logger.info("==================================================================")

    run_id = uuid.uuid4()
    project_id = uuid.uuid4()
    candidate_markets = [
        {"name": "London", "code": "GB-LND"},
        {"name": "Berlin", "code": "DE-BER"},
    ]

    brand_name = "Tokyo Streetwear Collective"
    seed_proxies = ["ent_st_wtaps", "ent_st_supreme", "ent_st_palace"]
    logger.info("Evaluating brand expansion: %s", brand_name)

    qloo = QlooClient(force_synthetic=True)
    evidence_by_market: dict[str, list[Any]] = {}

    for market in candidate_markets:
        m_name = market["name"]
        m_code = market["code"]
        logger.info("Gathering cultural intelligence for market: %s (%s)...", m_name, m_code)

        # 1. Audience Affinities
        aud_insights = await qloo.get_audience_affinities(
            seed_entities=seed_proxies,
            target_categories=["fashion", "music", "dining"],
            location=m_name,
        )
        aud_ev = EvidenceNormalizer.normalize_audience_insights(
            insights=aud_insights,
            run_id=run_id,
            project_id=project_id,
            market_name=m_name,
            request_hash=f"hash_aud_{m_name.lower()}",
            latency_ms=120,
        )

        # 2. Location Demographics
        loc_insights = await qloo.get_location_demographics(location_code=m_code)
        loc_ev = EvidenceNormalizer.normalize_location_insights(
            insights=loc_insights,
            run_id=run_id,
            project_id=project_id,
            market_name=m_name,
            request_hash=f"hash_loc_{m_name.lower()}",
            latency_ms=110,
        )

        # 3. Cultural Momentum
        trend_insights = await qloo.get_taste_trends(
            entity_or_category="streetwear", interval_days=90
        )
        trend_ev = EvidenceNormalizer.normalize_trend_insights(
            insights=trend_insights,
            run_id=run_id,
            project_id=project_id,
            market_name=m_name,
            request_hash=f"hash_trend_{m_name.lower()}",
            latency_ms=95,
        )

        all_market_evidence = aud_ev + loc_ev + trend_ev
        evidence_by_market[m_name] = all_market_evidence
        logger.info("Normalized %d evidence points for %s.", len(all_market_evidence), m_name)

    # 4. Deterministic Scoring
    logger.info("Computing deterministic 5-dimension compatibility scores...")
    scorer = CompatibilityScorer()
    ranking_result = scorer.rank_markets(
        market_evidence_map=evidence_by_market,
        project_id=project_id,
        run_id=run_id,
        market_location_map={m["name"]: m["code"] for m in candidate_markets},
    )

    logger.info("------------------------------------------------------------------")
    logger.info(
        "WINNER: %s (Score: %.1f%%)",
        ranking_result.winner_market,
        ranking_result.ranked_markets[0].overall_score * 100,
    )
    logger.info("MARGIN: +%.1f%% over second market", ranking_result.score_margin * 100)
    logger.info("RECOMMENDATION: %s", ranking_result.recommendation_summary)
    logger.info("------------------------------------------------------------------")
    logger.info("COMPARATIVE MATRIX:")
    logger.info(json.dumps(ranking_result.comparative_matrix, indent=2))
    logger.info("==================================================================")

    return ranking_result.model_dump()


if __name__ == "__main__":
    asyncio.run(run_golden_demo())
