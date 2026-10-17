# Cultura: Complete Project Blueprint, Features Inventory & UI Architecture Specification

> **Document Purpose**: This comprehensive specification outlines the entire Cultura platform, every built-in feature, backend capability, data contract, and exact page-by-page UI requirements. Use this document as your complete reference to build, customize, and refine the user interface.

---

## 1. Executive Project Overview & Problem Solved

### The Real-World Problem
Every year, multi-billion-dollar enterprise brands fail when entering new international markets (e.g., Target in Canada, Best Buy in China, Walmart in Germany, luxury brands misstepping cultural nuances in East Asia). 

Traditional market research suffers from three critical flaws:
1. **Blind Demographic Extrapolation**: Assuming that a 25-year-old in Tokyo has the same behavioral preferences as a 25-year-old in Berlin simply because they share income and age brackets.
2. **LLM Hallucinations in Strategy**: Generic generative AI tools (ChatGPT/Claude) hallucinate optimistic expansion advice without empirical taste data, citation grounding, or statistical validation.
3. **No Institutional Memory**: When strategy teams or agencies rotate, past failures, verified audience preferences, and localized lessons are lost, causing companies to repeat expensive cultural mistakes.

### The Cultura Solution
**Cultura** is an enterprise AI-native Cross-Cultural Market Intelligence Platform that combines:
- **Qloo Cultural Taste Graph**: Millions of real-world taste entities, cross-category affinities (fashion, music, dining, media, nightlife), and physical venue density data.
- **TypeSafe Jev System One Posture Gating**: Strict statistical decision boundaries that classify market entry postures into deterministic gates: **`LAUNCH`**, **`ADAPT`**, or **`AVOID`**.
- **10-Node Multi-Agent DAG Pipeline**: Autonomous specialized agents that orchestrate data collection, demographic alignment, trend momentum, risk screening, and executive synthesis.
- **Deterministic 5-Dimension Scoring Engine**: Mathematically grounded fixed-point arithmetic ($10^{-4}$ precision) with explicit penalties for missing data.
- **4-Layer Institutional Memory (pgvector)**: Persistent vector memory that preserves brand corrections, audience assumptions, and previous decisions.
- **What-If Scenario Simulation Engine**: Rapid branch testing allowing strategists to simulate modified personas, price tiers, or formats (pop-up vs. flagship) in seconds.

---

## 2. Core Technical Architecture (The 5 Pillars)

```
                           ┌─────────────────────────────────────────┐
                           │      Cultura Frontend (Next.js 16)      │
                           │     Pure SVG Charts & Chat Assistant    │
                           └────────────────────┬────────────────────┘
                                                │ REST API / JSON
                                                ▼
                           ┌─────────────────────────────────────────┐
                           │      FastAPI Backend Engine (v0.1.0)    │
                           └───────┬─────────────────────────┬───────┘
                                   │                         │
         ┌─────────────────────────┴─────────┐     ┌─────────┴───────────────────────┐
         ▼                                   ▼     ▼                                 ▼
┌──────────────────┐               ┌───────────────────┐               ┌───────────────────────┐
│ 10-Node Agent DAG│               │ Qloo Taste API    │               │ TypeSafe Jev System 1 │
│ Orchestration    │               │ Cultural Graph    │               │ Posture Gating        │
└────────┬─────────┘               └───────────────────┘               └───────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ PostgreSQL 16 + pgvector (4-Layer Memory: Transient, Session, Project, Institutional)         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Pillar 1: Deterministic 5-Dimension Compatibility Scoring
Instead of asking an LLM "give this a score from 1 to 10", Cultura uses fixed-point deterministic calculation across 5 weighted dimensions:
1. **Brand Proxy Affinity (25%)**: Empirical taste overlap between brand category and regional consumer proxies.
2. **Audience Overlap & Preferences (20%)**: Target cohort alignment across music, fashion, dining, and media.
3. **Category Ecosystem Density (20%)**: Physical venue density (boutiques, cafes, galleries, lifestyle anchors).
4. **Cultural Trend Momentum (15%)**: 6-month velocity and predictive trajectory of the local subculture.
5. **Evidence Grounding Completeness (20%)**: Penalizes lack of coverage so uncertain decisions cannot masquerade as high scores.

### Pillar 2: TypeSafe Jev System One Posture Gate
Evaluates deterministic decision vectors with probability distributions:
- **`LAUNCH`**: Score $\ge 0.75$, confidence $\ge 0.70$, zero critical cultural risk flags.
- **`ADAPT`**: Score between $0.55$ and $0.74$, or high affinity with localized messaging friction.
- **`AVOID`**: Score $< 0.55$, severe cultural misalignment, or missing critical category signals.

### Pillar 3: 10-Node Multi-Agent DAG Pipeline
Runs sequentially with strict state hand-offs:
1. `OrchestratorAgent`: Validates inputs, creates audit checkpoints, and initializes workspace context.
2. `QlooTasteExtractionAgent`: Fetches live entity affinities, category overlap, and subculture anchors.
3. `DemographicAlignmentAgent`: Evaluates cohort match across age, income, and lifestyle habits.
4. `TrendMomentumAgent`: Calculates 6-month historical curve and forward velocity.
5. `RiskSensitivityAgent`: Screens for regulatory, cultural faux pas, and localization taboos.
6. `JevSystemOneGateAgent`: Enforces type-safe decision contract and posture probabilities.
7. `StrategySynthesisAgent`: Formulates 3 actionable localized strategic directives.
8. `ExecutiveBriefingAgent`: Generates structured markdown and HTML intelligence reports.
9. `AuditLedgerAgent`: Computes SHA-256 cryptographic proof of all Qloo evidence records.
10. `MemoryIngestionAgent`: Embeds verified findings into pgvector Layer C/D storage.

### Pillar 4: 4-Layer Institutional Memory (pgvector)
- **Layer A (Transient Cache)**: Short-lived in-memory cache for API rate limit optimization.
- **Layer B (Session State)**: Conversational context during live analyst chat.
- **Layer C (Project Memory)**: Project-specific brand guidelines, corrections, and approved assumptions.
- **Layer D (Cross-Workspace Corporate Memory)**: Organization-wide learned rules, previous market successes, and institutional lessons with cosine similarity retrieval.

### Pillar 5: Dynamic Global Location Resolver
- Pre-seeded with **120+ tier-1 global cultural epicenters** across Asia, Europe, North America, Latin America, Middle East, and Oceania.
- Dynamic fallback: Accepts **any world city or country** in real time, automatically resolving national flags, ISO country codes, and region clusters.

---

## 3. Exhaustive Feature Inventory

### Module A: Executive Dashboard (`/dashboard`)
- **Metric Cards (KPIs)**:
  - Active Projects count.
  - Market Analyses executed.
  - Average Cultural Fit score (% compatibility).
  - Launch Readiness rate (% of evaluations with `LAUNCH` verdict).
- **Interactive Pure SVG Visualizations**:
  - **Regional Cultural Resonance Radar (Spider Chart)**: 5-axis visualization comparing key hubs (Tokyo vs. Berlin).
  - **Global Cultural Momentum Curve**: 6-month historical trajectory + 2-month predictive growth curve with velocity badge.
- **Recent Decision Intelligence Feed**: List of evaluated runs with overall score pills, candidate market counts, verdict badges, and 1-click inspection.
- **Configured Projects Table**: Quick access to active brand initiatives with market badges.
- **Decision Stack Health Monitor**: Real-time status for Qloo Taste API, TypeSafe Jev System One, Deterministic Scorer v1.0, and pgvector HNSW memory.

---

### Module B: Project Creation Hub (`/projects/new`)
Supports **Dual Creation Modes**:

#### Mode 1: Interactive Conversational AI Copilot (Plan-First)
- **Plan-First Architecture**: Strategist types brand/concept or clicks a 1-tap starter. AI instantly generates the entire baseline Strategic Execution Plan.
- **Natural Language (NLP) Prompt-Based Editing**:
  - Edit markets: e.g., *"Change Berlin to Paris"*, *"Add Seoul and London"*, *"Only test Tokyo"*.
  - Edit audience: e.g., *"Target luxury connoisseurs instead"*, *"Target Gen Z gamers"*.
  - Edit format: e.g., *"Make it an underground pop-up"*, *"Switch to D2C expansion"*.
  - Edit timeline/positioning: e.g., *"Set timeline to Q4 2026 and positioning to Ultra-Luxury"*.
- **What-If Simulation Queries**:
  - Strategist asks *"What if we do a pop-up?"* or *"What if we only test Tokyo?"*.
  - AI calculates capital risk reduction, velocity shifts, and Qloo category trade-offs right in the chat.
- **Live In-Chat Strategy Blueprint Card**: Displays brand, persona, candidate market flags, and timeline with a prominent **`🚀 Launch Multi-Agent Analysis Now`** button.
- **1-Click Suggestion Chips**: Quick action chips for instant fill without typing.

#### Mode 2: 5-Step Guided Manual Wizard
- **Step 1: Brand & Product Profile**: Brand Name, Category, Positioning (Premium / Mid-market / Budget-friendly), Description, Tags.
- **Step 2: Target Audience & Persona**: Cohort Name, Age Slider [min, max], Gender, Income Level, Interest Tags.
- **Step 3: Candidate Markets**: Dynamic search resolver across 120+ global cities or custom world cities with regional filters.
- **Step 4: Strategic Goals & Context**: Primary Objective, Launch Timeline, Additional Organizational Directives.
- **Step 5: Review & Launch**: Summary breakdown with 1-click execution.

---

### Module C: Project Hub Overview (`/projects/[id]`)
- **Header**: Breadcrumbs, Project Name, Market Count pill, Objective, and **"Run Analysis"** button.
- **Tabs**:
  1. **Overview**:
     - Candidate Markets Grid with ISO codes and status indicators.
     - Brand & Positioning Card (Positioning tag, Industry, Description, Tags).
     - Audience & Persona Card (Target segment, Age range, Income level, Taste affinities).
     - Latest Decision Verdict Card (Verdict badge, Compatibility %, Summary, Inspect link).
  2. **Analysis Runs**: Historical list of all executions for this project with status, scores, and parent-child simulation indicators.
  3. **Analyst Chat**: Interactive assistant grounded in this project's Qloo data and memory.
  4. **Reports**: Generated executive briefs with markdown and HTML downloads.
  5. **Project Memory**: Active pgvector memory facts scoped to this project.

---

### Module D: Run Intelligence Details (`/runs/[id]`)
The centerpiece of Cultura's decision intelligence:
- **Hero Decision Card**:
  - TypeSafe Jev System One Posture Gate (Verdict badge: `LAUNCH`, `ADAPT`, `AVOID`).
  - Recommended Market Winner and confidence score.
  - Decision Probability Distribution bar: `P(Launch)%`, `P(Adapt)%`, `P(Avoid)%`.
- **Navigation Tabs**:
  1. **Overview & Compatibility Matrix**:
     - **5-Axis Cultural Radar Chart**: SVG spider chart mapping Winner Market vs. Runner-Up Benchmark.
     - **Fixed-Point Dimension Breakdown Bars**: Brand Affinity, Audience Overlap, Category Density, Trend Momentum, Evidence Coverage.
     - **Candidate Market Hierarchy Matrix**: Expandable comparative matrix with rank pills, score bars, and catalyst/friction breakdowns.
     - **Cultural Momentum Trajectory Curve**: 6-month historical curve + predictive acceleration path.
     - **Subculture District & Venue Density Grid**: Grounded urban neighborhoods (e.g., Harajuku, Shibuya, Daikanyama for Tokyo; Kreuzberg, Mitte for Berlin) with retail, cafe, gallery, and nightlife counts.
     - **Strategic Market Entry Playbook**: 3 localized action directive cards synthesized by the Strategy Agent with confidence scores and grounded citations.
  2. **Agent Timeline**: Step-by-step audit of all 10 agents with sequence numbers, latency in milliseconds, execution status, and agent roles.
  3. **Qloo Evidence Explorer**: Filterable cards showing exact entities, kind (`PLACE`, `ARTIST`, `BRAND`, `INTEREST`), confidence, and numeric value.
  4. **What-If Simulation Lab**:
     - Form to override audience persona, brand positioning, or candidate markets.
     - Generates a linked child run and renders a side-by-side delta comparison (`winner_changed`, score differences).
  5. **Executive Brief Report**: Full executive markdown/HTML briefing with 1-click clipboard copy and file export.

---

### Module E: Cross-Project Analyst Chat (`/chat`)
- Chat interface connected to all workspace projects.
- Grounded citations linking directly to verified Qloo taste entities.
- Dynamic dimension chart cards comparing market affinities.
- Related evidence cards on the right sidebar.

---

### Module F: Institutional Memory Hub (`/memory`)
- Management interface for pgvector 4-layer memory.
- Scope selector: Project-level vs. Workspace-level corporate memory.
- Ability to search memories semantically or manually inject verified brand constraints (e.g. *"Brand never uses discount promotions in Asia"*).

---

### Module G: Observability & Tracing (`/observability`)
- Pipeline performance overview: Average agent latency, Qloo API round-trip times, LLM response latency.
- Status breakdown of completed vs. running runs.
- LangSmith tracing integration status.

---

## 4. UI Page-by-Page Specifications & Data Contracts

| Route | Page Name | Primary Components | Key Data Models / APIs |
| :--- | :--- | :--- | :--- |
| **`/dashboard`** | Executive Decision Intelligence | 4 KPI StatCards, CulturalRadarChart, MomentumTrajectoryChart, Recent Runs Feed, Projects Table, Health Cards | `api.getWorkspaces()`, `api.getProjects()`, `api.getWorkspaceRuns()` |
| **`/projects`** | Projects Directory | Search bar, status filters, project cards with candidate market badges, "New Project" action | `api.getProjects(workspaceId)` |
| **`/projects/new`** | Create New Analysis | Mode switcher (AI Chat vs. 5-Step Wizard), Conversational Chatbot with NLP prompt editing, Blueprint Card | `api.createProject()`, `api.createRun()`, `api.searchLocations()` |
| **`/projects/[id]`** | Project Strategy Hub | Breadcrumbs, Market grid, Brand Profile card, Audience card, Runs list, Project Analyst chat, Memory list | `api.getProject(id)`, `api.getProjectRuns(id)`, `api.getMemories(wsId, id)` |
| **`/runs`** | Intelligence Runs Directory | Workspace-wide execution log, filter by status, filter by verdict (`LAUNCH`, `ADAPT`, `AVOID`), score pills | `api.getWorkspaceRuns(workspaceId)` |
| **`/runs/[id]`** | Run Intelligence Details | Jev Posture Hero, 5-Axis Radar Chart, Compatibility Matrix, Momentum Curve, District Density Grid, 10-Agent Timeline, Evidence Cards, What-If Simulation, Report Exporter | `api.getRun(id)`, `api.getRunSteps(id)`, `api.getRunEvidence(id)`, `api.getRunDecisions(id)`, `api.getRunReports(id)`, `api.createSimulation(id)` |
| **`/chat`** | Strategic Analyst Assistant | Project selector, conversational chat stream, citation cards, multi-market comparison chart, evidence sidebar | `api.getProjects()`, `api.chatWithAnalyst(projectId, message)` |
| **`/memory`** | Institutional Memory Hub | Layer selector (C vs D), semantic memory search, memory cards with layer badges, manual memory injector | `api.getMemories()`, `api.createMemory()` |
| **`/reports`** | Executive Briefs Archive | List of generated strategic briefs across projects, markdown/HTML download links | `api.getRunReports()` |
| **`/observability`** | Agent Pipeline Observability | Agent latency waterfall, LangSmith status indicator, database connection status, Qloo gateway metrics | System health endpoints |

---

## 5. API Reference & Data Payloads

### 1. Projects API
- `GET /api/v1/projects?workspace_id={id}` -> List of projects.
- `POST /api/v1/projects`
  ```json
  {
    "workspace_id": "uuid",
    "name": "Acme Tokyo Streetwear",
    "objective": "Flagship retail expansion in Shibuya",
    "brand_profile": {
      "name": "Acme Streetwear Lab",
      "category": "Fashion & Apparel",
      "positioning": "Premium",
      "description": "Technical outerwear and drop-culture streetwear",
      "tags": ["Streetwear", "Sneakers", "Drop Culture"]
    },
    "audience_profile": {
      "persona": "Gen Z Streetwear & Digital Natives",
      "age_range": [18, 28],
      "income_level": "Medium",
      "interests": ["Streetwear", "Sneakers", "Electronic Music"]
    },
    "candidate_markets": [
      { "name": "Tokyo", "location_code": "JP-TYO", "country_code": "JP" },
      { "name": "Berlin", "location_code": "DE-BER", "country_code": "DE" }
    ]
  }
  ```

### 2. Analysis Runs API
- `POST /api/v1/projects/{project_id}/runs` -> Triggers the 10-node agent DAG.
- `GET /api/v1/runs/{run_id}` -> Returns run record with `overall_score`, `decision_verdict`, `scores_json`, `result_summary_json`.
- `GET /api/v1/runs/{run_id}/steps` -> List of 10 agent step records with latencies.
- `GET /api/v1/runs/{run_id}/evidence` -> Array of grounded Qloo evidence records.
- `GET /api/v1/runs/{run_id}/decisions` -> TypeSafe Jev System One posture records with probabilities:
  ```json
  {
    "question_key": "market_entry_verdict",
    "decision_value": "LAUNCH",
    "confidence": 0.88,
    "probabilities": { "launch": 0.82, "adapt": 0.14, "avoid": 0.04 }
  }
  ```

### 3. What-If Simulation API
- `POST /api/v1/runs/{run_id}/simulate`
  ```json
  {
    "audience_persona": "High-Net-Worth Luxury Connoisseurs",
    "brand_positioning": "Premium",
    "override_markets": [{ "name": "Tokyo" }, { "name": "Paris" }]
  }
  ```

### 4. Locations Search API
- `GET /api/v1/locations?query={city}&region={region}` -> Returns matching cultural hubs or dynamically generates a valid `MarketLocation` object.

### 5. Analyst Chat API
- `POST /api/v1/projects/{project_id}/chat`
  ```json
  {
    "message": "Why is Tokyo ranked higher than Berlin for this brand?",
    "include_evidence": true
  }
  ```

---

## 6. Visual Guidelines & UI Design Rules

1. **Strictly Enforce Zero Images / Zero External Avatars**:
   - Never use `<img>` tags pointing to external CDNs or unverified image assets.
   - Use Lucide SVG vector icons (`Sparkles`, `Bot`, `Globe2`, `TrendingUp`, `ShieldCheck`).
   - Use native Unicode emojis for national flags (`🇯🇵`, `🇩🇪`, `🇰🇷`, `🇬🇧`, `🇫🇷`, `🇺🇸`).
2. **Pure SVG Charting**:
   - Avoid bulky third-party chart libraries that break Turbopack SSR or cause React 19 hydration mismatches.
   - Custom SVG components (`<svg>`, `<polygon>`, `<path>`, `<circle>`) are 100% hydration-safe and theme-responsive.
3. **Color Tokens & Dark Luxury Aesthetic**:
   - Background: Slate 950 (`#0c0e14`) / Dark Slate 900 (`#0f172a`).
   - Cards & Containers: Border stroke `slate-800`, subtle gradient overlays.
   - Accents: Indigo 600 (`#6366f1`), Emerald 500 (`#10b981`), Amber 500 (`#f59e0b`), Rose 500 (`#f43f5e`).
   - Verdict Colors:
     - `LAUNCH`: Emerald (`#10b981`)
     - `ADAPT`: Amber (`#f59e0b`)
     - `AVOID`: Rose (`#f43f5e`)
4. **Interactive Responsiveness**:
   - Every metric, chart point, and ranking item should have subtle hover states and clear tooltips.
   - All forms must support both mouse-driven 1-click selection and keyboard-driven typing (Enter to submit).
