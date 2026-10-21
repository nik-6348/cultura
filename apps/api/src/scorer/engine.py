import uuid
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal

from src.db.models.evidence import Evidence
from src.scorer.models import (
    DimensionScore,
    MarketCompatibilityScore,
    MarketRankingResult,
    ScoringConfiguration,
)

SCORE_PRECISION = Decimal("0.0001")
SCORE_VERSION = "v1.0.0"


def _to_decimal(val: float | int | str | None, default: str = "0.0") -> Decimal:
    if val is None:
        return Decimal(default)
    return Decimal(str(val))


def _quantize(val: Decimal) -> float:
    return float(val.quantize(SCORE_PRECISION, rounding=ROUND_HALF_UP))


class CompatibilityScorer:
    """
    Deterministic Cultural Compatibility Engine.

    Guarantees:
    - 100% deterministic calculation using Decimal fixed-point arithmetic.
    - Zero floating point drift across architectures.
    - Explicit missing data penalty when evidence coverage ratio < 0.60.
    - Zero division safety on empty or null inputs.
    """

    def __init__(self, config: ScoringConfiguration | None = None) -> None:
        self.config = config or ScoringConfiguration()

    def calculate_market_score(
        self,
        market_name: str,
        evidence_items: list[Evidence],
        location_code: str | None = None,
    ) -> MarketCompatibilityScore:
        """Calculate the 5-dimension deterministic compatibility score for a market."""
        # 1. Scope evidence to this market (or cross-market global signals)
        market_ev = [
            e
            for e in evidence_items
            if e.market_name is None or e.market_name.lower() == market_name.lower()
        ]

        # ---------------------------------------------------------------------
        # D1: Brand Affinity (w = 0.25)
        # ---------------------------------------------------------------------
        affinity_ev = [e for e in market_ev if e.kind == "brand_affinity"]
        if affinity_ev:
            total_weighted_val = Decimal("0.0")
            total_weight = Decimal("0.0")
            for ev in affinity_ev:
                val = _to_decimal(ev.value_numeric, "0.5")
                conf = _to_decimal(ev.confidence, "1.0")
                total_weighted_val += val * conf
                total_weight += conf

            d1_raw = (
                (total_weighted_val / total_weight)
                if total_weight > Decimal("0.0")
                else Decimal("0.0")
            )
        else:
            d1_raw = Decimal("0.0")

        d1_raw = max(Decimal("0.0"), min(Decimal("1.0"), d1_raw))
        d1_weighted = d1_raw * self.config.w_brand_affinity
        d1_score = DimensionScore(
            dimension_key="brand_affinity",
            name="Brand Proxy Affinity",
            weight=float(self.config.w_brand_affinity),
            raw_score=_quantize(d1_raw),
            weighted_score=_quantize(d1_weighted),
            evidence_ids=[str(e.id) for e in affinity_ev],
            explanation=(
                f"Aggregated {len(affinity_ev)} brand/proxy affinity signals with "
                f"mean score {_quantize(d1_raw) * 100:.1f}%."
            ),
        )

        # ---------------------------------------------------------------------
        # D2: Category Ecosystem Density (w = 0.20)
        # ---------------------------------------------------------------------
        density_ev = [e for e in market_ev if e.kind in ("locality_density", "venue_anchor")]
        if density_ev:
            density_vals = [_to_decimal(e.value_numeric, "0.5") for e in density_ev]
            d2_raw = sum(density_vals) / Decimal(str(len(density_vals)))
        else:
            d2_raw = Decimal("0.0")

        d2_raw = max(Decimal("0.0"), min(Decimal("1.0"), d2_raw))
        d2_weighted = d2_raw * self.config.w_category_ecosystem
        d2_score = DimensionScore(
            dimension_key="category_ecosystem",
            name="Category Ecosystem Density",
            weight=float(self.config.w_category_ecosystem),
            raw_score=_quantize(d2_raw),
            weighted_score=_quantize(d2_weighted),
            evidence_ids=[str(e.id) for e in density_ev],
            explanation=(
                f"Local venue and category ecosystem density scored at "
                f"{_quantize(d2_raw) * 100:.1f}% across {len(density_ev)} evidence anchors."
            ),
        )

        # ---------------------------------------------------------------------
        # D3: Audience Demographic Overlap (w = 0.20)
        # ---------------------------------------------------------------------
        overlap_ev = [e for e in market_ev if e.kind in ("audience_overlap", "brand_affinity")]
        if overlap_ev:
            overlap_vals = [_to_decimal(e.value_numeric, "0.5") for e in overlap_ev]
            d3_raw = sum(overlap_vals) / Decimal(str(len(overlap_vals)))
        else:
            d3_raw = Decimal("0.0")

        d3_raw = max(Decimal("0.0"), min(Decimal("1.0"), d3_raw))
        d3_weighted = d3_raw * self.config.w_audience_overlap
        d3_score = DimensionScore(
            dimension_key="audience_overlap",
            name="Audience Demographic Overlap",
            weight=float(self.config.w_audience_overlap),
            raw_score=_quantize(d3_raw),
            weighted_score=_quantize(d3_weighted),
            evidence_ids=[str(e.id) for e in overlap_ev],
            explanation=(
                f"Target persona demographic alignment index of {_quantize(d3_raw) * 100:.1f}%."
            ),
        )

        # ---------------------------------------------------------------------
        # D4: Cultural Momentum Velocity (w = 0.15)
        # ---------------------------------------------------------------------
        momentum_ev = [e for e in market_ev if e.kind == "cultural_momentum"]
        if momentum_ev:
            momentum_vals = [_to_decimal(e.value_numeric, "0.5") for e in momentum_ev]
            d4_raw = sum(momentum_vals) / Decimal(str(len(momentum_vals)))
        else:
            # Default to neutral momentum (0.50) if no trend data
            d4_raw = Decimal("0.50") if market_ev else Decimal("0.0")

        d4_raw = max(Decimal("0.0"), min(Decimal("1.0"), d4_raw))
        d4_weighted = d4_raw * self.config.w_cultural_momentum
        d4_score = DimensionScore(
            dimension_key="cultural_momentum",
            name="Cultural Momentum Velocity",
            weight=float(self.config.w_cultural_momentum),
            raw_score=_quantize(d4_raw),
            weighted_score=_quantize(d4_weighted),
            evidence_ids=[str(e.id) for e in momentum_ev],
            explanation=(
                f"Cultural trend trajectory and momentum indicator: {_quantize(d4_raw) * 100:.1f}%."
            ),
        )

        # ---------------------------------------------------------------------
        # D5: Evidence Coverage Penalty (w = 0.20)
        # ---------------------------------------------------------------------
        observed_count = len(market_ev)
        expected_count = self.config.expected_evidence_count
        coverage_ratio_dec = min(
            Decimal("1.0"),
            Decimal(str(observed_count)) / Decimal(str(expected_count)),
        )
        d5_raw = coverage_ratio_dec
        d5_weighted = d5_raw * self.config.w_evidence_coverage
        d5_score = DimensionScore(
            dimension_key="evidence_coverage",
            name="Evidence Coverage & Completeness",
            weight=float(self.config.w_evidence_coverage),
            raw_score=_quantize(d5_raw),
            weighted_score=_quantize(d5_weighted),
            evidence_ids=[str(e.id) for e in market_ev],
            explanation=(
                f"Evidence completeness ratio: {_quantize(d5_raw) * 100:.1f}% "
                f"({observed_count}/{expected_count} required empirical data points)."
            ),
        )

        # ---------------------------------------------------------------------
        # Total Weighted Combination & Low-Data Penalty
        # ---------------------------------------------------------------------
        raw_total = d1_weighted + d2_weighted + d3_weighted + d4_weighted + d5_weighted

        # Coverage Threshold Gate:
        # If coverage ratio < 0.60, cap score at coverage ratio and flag for human review
        confidence_tier: Literal["high", "medium", "low"]
        if coverage_ratio_dec < Decimal("0.60"):
            overall_score_dec = min(raw_total, coverage_ratio_dec)
            confidence_tier = "low"
            requires_human_review = True
        elif coverage_ratio_dec < Decimal("0.85"):
            overall_score_dec = raw_total
            confidence_tier = "medium"
            requires_human_review = False
        else:
            overall_score_dec = raw_total
            confidence_tier = "high"
            requires_human_review = False

        overall_score_dec = max(Decimal("0.0"), min(Decimal("1.0"), overall_score_dec))

        return MarketCompatibilityScore(
            market_name=market_name,
            location_code=location_code,
            overall_score=_quantize(overall_score_dec),
            confidence_score=_quantize(coverage_ratio_dec),
            confidence_tier=confidence_tier,
            requires_human_review=requires_human_review,
            coverage_ratio=_quantize(coverage_ratio_dec),
            dimension_scores={
                "brand_affinity": d1_score,
                "category_ecosystem": d2_score,
                "audience_overlap": d3_score,
                "cultural_momentum": d4_score,
                "evidence_coverage": d5_score,
            },
            score_version=SCORE_VERSION,
        )

    def rank_markets(
        self,
        market_evidence_map: dict[str, list[Evidence]],
        project_id: uuid.UUID | None = None,
        run_id: uuid.UUID | None = None,
        market_location_map: dict[str, str] | None = None,
    ) -> MarketRankingResult:
        """
        Rank candidate markets deterministically and construct comparative matrix.
        """
        if not market_evidence_map:
            raise ValueError("Cannot rank empty market evidence map")

        scores: list[MarketCompatibilityScore] = []
        loc_map = market_location_map or {}

        for m_name, ev_list in market_evidence_map.items():
            loc_code = loc_map.get(m_name)
            score = self.calculate_market_score(
                market_name=m_name,
                evidence_items=ev_list,
                location_code=loc_code,
            )
            scores.append(score)

        # Sort descending by overall_score
        scores.sort(key=lambda s: s.overall_score, reverse=True)

        winner = scores[0].market_name
        runner_up = scores[1].market_name if len(scores) > 1 else winner
        margin = round(
            scores[0].overall_score - (scores[1].overall_score if len(scores) > 1 else 0.0), 4
        )

        # Build comparative matrix: {market: {dimension: raw_score}}
        matrix: dict[str, dict[str, float]] = {}
        for s in scores:
            matrix[s.market_name] = {
                "overall": s.overall_score,
                "brand_affinity": s.dimension_scores["brand_affinity"].raw_score,
                "category_ecosystem": s.dimension_scores["category_ecosystem"].raw_score,
                "audience_overlap": s.dimension_scores["audience_overlap"].raw_score,
                "cultural_momentum": s.dimension_scores["cultural_momentum"].raw_score,
                "evidence_coverage": s.dimension_scores["evidence_coverage"].raw_score,
            }

        rec = (
            f"Deterministic evaluation ranks {winner} as primary entry market "
            f"({scores[0].overall_score * 100:.1f}%), leading {runner_up} by a "
            f"{margin * 100:.1f}% margin. Confidence is rated {scores[0].confidence_tier}."
        )

        return MarketRankingResult(
            project_id=project_id,
            run_id=run_id,
            score_version=SCORE_VERSION,
            ranked_markets=scores,
            winner_market=winner,
            score_margin=margin,
            comparative_matrix=matrix,
            recommendation_summary=rec,
        )
