# API Specification — Streaming Protocol & Event Bus

## 1. Real-Time Analysis Streaming (SSE)
To provide an interactive, premium user experience while long-running agent workflows execute (typically 30–75 seconds), Cultura streams live step transitions to the Next.js frontend over **Server-Sent Events (SSE)**.

### Endpoint
```http
GET /api/v1/runs/{run_id}/events
Accept: text/event-stream
```

### Event Payload Schema
```json
{
  "run_id": "8b9e6712-4214-41d3-92f7-ef65421398bb",
  "step_key": "qloo_research_london",
  "agent_name": "QlooResearcher",
  "status": "in_progress",
  "sequence": 4,
  "message": "Resolving consumer taste graph for London demographic clusters",
  "payload": {
    "entities_queried": 6,
    "current_affinity_sample": 0.84
  },
  "timestamp": "2026-10-10T07:31:12.450Z"
}
```

### Supported Event Types
1. `run.started` — Graph execution initialized.
2. `step.started` — Specific agent node entered.
3. `step.progress` — Partial data received (e.g. entity resolved).
4. `step.completed` — Node finished successfully.
5. `step.failed` — Node failed (includes retry status).
6. `run.completed` — Full analysis complete with final recommendations.
7. `run.interrupted` — Suspended awaiting human review input.

---

## 2. Asynchronous Task Queue Payload
In production on Google Cloud Run, long-running agent runs are offloaded via **Cloud Tasks** to an internal worker endpoint.

### Internal Worker Route
```http
POST /internal/tasks/run-analysis
Content-Type: application/json
X-CloudTasks-QueueName: cultura-analysis-queue
```

### Task Payload
```json
{
  "run_id": "8b9e6712-4214-41d3-92f7-ef65421398bb",
  "project_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workflow_version": "2026-10-10",
  "attempt": 1,
  "idempotency_key": "user_req_987452"
}
```
*Note: Sensitive secrets, prompts, and tokens are NEVER placed in the task payload; the worker securely loads state and secrets via database and Secret Manager.*
