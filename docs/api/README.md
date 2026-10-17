# Cultura REST API Reference Manual

> **Base URL**: `http://localhost:8000/api/v1` (Production: `https://api.cultura.ai/api/v1`)  
> **Protocol**: HTTPS / REST  
> **Format**: JSON (`Content-Type: application/json`, `Accept: application/json`)

---

## 1. Authentication

Cultura supports two authentication modes:
1. **Production (Firebase JWT)**:
   ```http
   Authorization: Bearer <FIREBASE_ID_TOKEN>
   ```
2. **Development / Local Testing**:
   ```http
   Authorization: Bearer dev_token:<USER_ID>:<EMAIL>:<DISPLAY_NAME>
   ```
   *Example*: `Authorization: Bearer dev_token:uid_demo_strategist:strategist@cultura.ai:Demo Strategist`

---

## 2. API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status, database latency, and Qloo connectivity |
| `GET` | `/workspaces` | List all workspaces accessible by the authenticated user |
| `POST` | `/workspaces` | Provision a new multi-tenant workspace |
| `GET` | `/projects` | List projects (optionally filtered by `workspace_id`) |
| `POST` | `/projects` | Create a new market analysis project with brand & audience profiles |
| `POST` | `/projects/{id}/runs` | Launch a 10-node multi-agent analysis run against live Qloo Gateway |
| `GET` | `/runs/{id}` | Retrieve run status, deterministic scores, winner market, and postures |
| `GET` | `/runs/{id}/steps` | Retrieve the chronological 10-step agent execution audit timeline |
| `GET` | `/runs/{id}/evidence` | Retrieve normalized empirical Qloo evidence records |
| `GET` | `/runs/{id}/decisions` | Retrieve TypeSafe JEV System One gate decisions and probabilities |
| `POST` | `/runs/{id}/simulations` | Execute counterfactual "What-If" simulation on market parameters |
| `POST` | `/projects/{id}/chat` | Grounded Cultural Analyst Chat with footnote citations and chart data |
| `POST` | `/workspaces/{id}/memories` | Record an institutional constraint/precedent into pgvector memory |
| `GET` | `/workspaces/{id}/memories` | Semantic search and filter across institutional memory facts |
| `POST` | `/runs/{id}/reports` | Generate a publication-grade Markdown or HTML executive brief |
| `GET` | `/locations/search` | Search supported metropolitan expansion markets |
| `GET` | `/qloo/entities/search` | Direct live entity resolution search against Qloo Taste Graph |

---

## 3. Detailed Endpoint Specifications

### 3.1 System Health
```http
GET /api/v1/health
```
**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development",
  "database": {
    "status": "connected",
    "latency_ms": 18.57
  },
  "qloo_gateway": {
    "configured": true,
    "base_url": "https://hackathon.api.qloo.com"
  }
}
```

---

### 3.2 Create Project
```http
POST /api/v1/projects
```
**Request Body:**
```json
{
  "workspace_id": "a34386b5-0ff7-4a13-b453-fc91146f1430",
  "name": "Tokyo & Paris Avant-Garde Streetwear Expansion",
  "objective": "Determine optimal flagship entry order between Tokyo and Paris",
  "brand_profile_json": {
    "brand_name": "Aetheria Subcultural Atelier",
    "category": "Fashion & Apparel",
    "positioning": "Premium / Luxury Avant-Garde",
    "tags": ["Techwear", "Avant-Garde", "Luxury Streetwear"]
  },
  "audience_profile_json": {
    "persona": "Subcultural Fashion Early Adopters",
    "age_range": [20, 38],
    "income_level": "High",
    "interests": ["Streetwear", "Art & Design", "Electronic Music"]
  },
  "candidate_markets": [
    {"name": "Tokyo", "location_code": "JP-TYO", "country_code": "JP"},
    {"name": "Paris", "location_code": "FR-PAR", "country_code": "FR"}
  ]
}
```

---

### 3.3 Execute Analysis Run (10-Node LangGraph DAG)
```http
POST /api/v1/projects/{project_id}/runs
```
**Request Body:**
```json
{
  "candidate_markets": [
    {"name": "Tokyo", "code": "JP-TYO"},
    {"name": "Paris", "code": "FR-PAR"}
  ]
}
```
**Response (201 Created):**
```json
{
  "id": "ee8d6c58-f440-4e60-b1b1-f909e5bfc649",
  "project_id": "5f379e2f-fdd4-452e-8889-668642768f68",
  "status": "completed",
  "result_summary_json": {
    "winner_market": "Paris",
    "score_margin": 0.0004,
    "decisions": {
      "winner_posture": "launch",
      "winner_confidence": 1.0,
      "requires_human_review": false
    },
    "market_scores": {
      "Paris": {
        "overall_score": 0.8352,
        "dimension_scores": {
          "brand_affinity": {"raw_score": 0.7989, "weight": 0.25},
          "audience_overlap": {"raw_score": 0.79, "weight": 0.20},
          "category_ecosystem": {"raw_score": 0.84, "weight": 0.20},
          "cultural_momentum": {"raw_score": 0.73, "weight": 0.15},
          "evidence_coverage": {"raw_score": 1.0, "weight": 0.20}
        }
      }
    }
  }
}
```

---

### 3.4 Grounded Cultural Analyst Chat
```http
POST /api/v1/projects/{project_id}/chat
```
**Request Body:**
```json
{
  "message": "Why was the winner market chosen for Aetheria Subcultural Atelier?"
}
```
**Response (200 OK):**
```json
{
  "reply": "**Paris** is recommended for **LAUNCH** (Overall Compatibility: 85/100) because it exhibits strong empirical resonance across multiple Qloo taste vectors: 1. **Strong Category Relevance [1]**...",
  "citations": [
    {
      "id": 1,
      "label": "qloo:fashion:395E0A85-4655-4894-9D30-BC94946FB25E",
      "entity": "qloo:fashion:395E0A85-4655-4894-9D30-BC94946FB25E",
      "kind": "brand_affinity",
      "source": "Qloo Taste Graph"
    }
  ],
  "chart_data": [
    {"dimension": "Category Affinity", "scores": {"Paris": 0.77, "Tokyo": 0.84}}
  ]
}
```
