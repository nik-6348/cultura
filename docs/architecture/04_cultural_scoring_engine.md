# Architecture Specification — Deterministic Cultural Scoring Engine

## 1. Grounding Principle
**No LLM is permitted to invent cultural compatibility numbers.** If an AI generates a score like *"Cultural Fit: 87%"* purely from language reasoning, the product loses credibility. In Cultura, all numeric metrics are calculated deterministically from empirical evidence by the **Compatibility Scoring Engine**.

## 2. Scoring Dimensions

The overall Cultural Compatibility Score $S \in [0.00, 1.00]$ is a weighted combination of five distinct dimensions:

$$S = \sum_{i=1}^{5} w_i \cdot D_i$$

Where $\sum w_i = 1.0$.

| Dimension ($D_i$) | Default Weight ($w_i$) | Description | Underlying Signals |
| :--- | :--- | :--- | :--- |
| **$D_1$: Brand Affinity** | 0.25 | Direct consumer affinity between target audience and brand/product proxies. | Qloo cross-domain affinity scores for brand entity / proxy entities. |
| **$D_2$: Category Ecosystem** | 0.20 | Strength of the surrounding category culture in the candidate market. | Volume and density of related lifestyle, fashion, culinary, or entertainment nodes. |
| **$D_3$: Audience Demographic Overlap** | 0.20 | Alignment between the target customer persona and the market's demographic profile. | Age distribution, income brackets, urban concentration index. |
| **$D_4$: Cultural Momentum & Trends** | 0.15 | Direction of cultural taste changes in the target market. | Qloo 30/90/180-day trend velocity indicators. |
| **$D_5$: Evidence Coverage** | 0.20 | Confidence penalty based on data completeness. | Ratio of resolved entities and verified data points against required queries. |

## 3. Mathematical Formula Breakdown

### 3.1 Dimension Normalization
Each raw signal $x$ from Qloo is normalized to $[0, 1]$ using min-max scaling with predefined bounds:

$$x_{\text{norm}} = \frac{x - x_{\min}}{x_{\max} - x_{\min}}$$

### 3.2 Evidence Coverage Penalty
If a candidate market has sparse Qloo data (e.g., niche emerging city), the system applies an evidence completeness factor:

$$C = \frac{N_{\text{resolved\_entities}}}{N_{\text{expected\_entities}}} \times \frac{K_{\text{data\_points}}}{K_{\text{target\_threshold}}}$$

If $C < 0.60$, the final compatibility score is capped and flagged with:
- `confidence`: `low`
- `requires_human_review`: `true`

## 4. Score Versioning
Every calculated score stored in the `analysis_runs` and `evidence` tables is stamped with a `score_version` (e.g., `score_v1.0.0`). This guarantees reproducibility: rerunning historical data against an older score algorithm will always yield identical numbers.
