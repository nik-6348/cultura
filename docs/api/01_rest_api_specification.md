# API Specification — REST API Endpoints

All APIs are prefixed with `/api/v1` and accept/return `application/json`.

## 1. Authentication & Security
- **Header**: `Authorization: Bearer <firebase_id_token>`
- **Verification**: Verified using the Firebase Admin SDK on every request.
- **Context Injection**: Derives `user_id` and active `workspace_id`. Client-supplied user IDs are rejected.

## 2. API Endpoints

### 2.1 Health & Diagnostics
```http
GET /api/v1/health
```
**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development",
  "database": "connected"
}
```

---

### 2.2 Workspaces
```http
POST /api/v1/workspaces
GET  /api/v1/workspaces
GET  /api/v1/workspaces/{workspace_id}
```
**Create Workspace Body:**
```json
{
  "name": "Acme Brand Strategy",
  "domain": "acme.com"
}
```

---

### 2.3 Projects
```http
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/{project_id}
PATCH  /api/v1/projects/{project_id}
DELETE /api/v1/projects/{project_id}
```
**Create Project Body:**
```json
{
  "workspace_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Tokyo Streetwear Entry into London & Berlin",
  "objective": "Evaluate European launch feasibility for minimalist Japanese streetwear",
  "brand_profile": {
    "category": "fashion_streetwear",
    "price_positioning": "premium",
    "origin_country": "JP",
    "core_aesthetic": "minimalist_functional"
  },
  "candidate_markets": [
    {"name": "London", "country": "GB", "location_code": "GB-LND"},
    {"name": "Berlin", "country": "DE", "location_code": "DE-BER"}
  ],
  "target_audience": {
    "age_range": [20, 35],
    "interests": ["contemporary_art", "electronic_music", "coffee_culture"]
  }
}
```

---

### 2.4 Analysis Runs
```http
POST /api/v1/projects/{project_id}/runs
GET  /api/v1/runs/{run_id}
GET  /api/v1/runs/{run_id}/steps
GET  /api/v1/runs/{run_id}/evidence
POST /api/v1/runs/{run_id}/cancel
```
**Trigger Run Request:**
```json
{
  "analysis_type": "market_entry_comparison",
  "strategy_assumptions": {
    "retail_channel": "flagship_plus_online",
    "marketing_focus": "creator_collaborations"
  }
}
```
**Response (202 Accepted):**
```json
{
  "run_id": "8b9e6712-4214-41d3-92f7-ef65421398bb",
  "status": "queued",
  "created_at": "2026-10-10T07:30:00Z"
}
```

---

### 2.5 Counterfactual What-If Simulations
```http
POST /api/v1/runs/{run_id}/simulations
```
**Simulation Body:**
```json
{
  "changes": {
    "price_positioning": "accessible_luxury",
    "marketing_focus": "underground_music_events"
  }
}
```
Creates a linked child run (`parent_run_id = {run_id}`) that shares base evidence while re-evaluating strategic fit.

---

### 2.6 Interactive Project Chat
```http
POST /api/v1/projects/{project_id}/conversations
POST /api/v1/conversations/{conversation_id}/messages
GET  /api/v1/conversations/{conversation_id}/messages
```
Allows follow-up analytical questions grounded in project memory and prior run evidence.

---

## 3. Standard Error Format
All errors return standard RFC 7807 problem details:
```json
{
  "error_code": "RESOURCE_NOT_FOUND",
  "message": "Project with ID 3fa85f64-... does not exist in active workspace",
  "details": null,
  "timestamp": "2026-10-10T07:30:00Z"
}
```
