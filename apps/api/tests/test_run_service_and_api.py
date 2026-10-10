import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analysis_run_lifecycle_and_api(client: AsyncClient) -> None:
    """
    TC-4.2, TC-4.3, TC-4.5:
    End-to-end integration test creating a project, executing an analysis run,
    inspecting run_steps audit trail, and verifying evidence endpoints.
    """
    token_owner = f"dev_token:uid_run_owner_{uuid.uuid4().hex[:6]}:owner@cultura.local:Owner"
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    # 1. Create workspace
    res_ws = await client.post(
        "/api/v1/workspaces",
        json={"name": "European Strategy Hub"},
        headers=headers_owner,
    )
    assert res_ws.status_code == 201
    workspace_id = res_ws.json()["id"]

    # 2. Create project
    res_proj = await client.post(
        "/api/v1/projects",
        json={
            "workspace_id": workspace_id,
            "name": "Kyoto Craft Denim Launch",
            "objective": "Determine London vs Berlin launch priority",
            "brand_profile_json": {"category": "apparel_streetwear"},
            "candidate_markets": [
                {"name": "London", "country_code": "GB", "location_code": "GB-LND"},
                {"name": "Berlin", "country_code": "DE", "location_code": "DE-BER"},
            ],
        },
        headers=headers_owner,
    )
    assert res_proj.status_code == 201
    project_id = res_proj.json()["id"]

    # 3. Trigger Analysis Run -> POST /api/v1/projects/{project_id}/runs
    res_run = await client.post(
        f"/api/v1/projects/{project_id}/runs",
        json={},
        headers=headers_owner,
    )
    assert res_run.status_code == 201
    run_data = res_run.json()
    run_id = run_data["id"]
    assert run_data["status"] == "completed"
    assert run_data["result_summary_json"] is not None
    assert "winner_market" in run_data["result_summary_json"]

    # 4. Fetch Run Details -> GET /api/v1/runs/{run_id}
    res_get_run = await client.get(
        f"/api/v1/runs/{run_id}",
        headers=headers_owner,
    )
    assert res_get_run.status_code == 200
    assert res_get_run.json()["id"] == run_id

    # 5. Fetch Run Steps Timeline -> GET /api/v1/runs/{run_id}/steps (TC-4.2, TC-4.3)
    res_steps = await client.get(
        f"/api/v1/runs/{run_id}/steps",
        headers=headers_owner,
    )
    assert res_steps.status_code == 200
    steps = res_steps.json()
    assert len(steps) == 10  # All 10 agent nodes recorded in DB
    step_keys = [s["step_key"] for s in steps]
    assert step_keys == [
        "supervisor",
        "brand_analyst",
        "market_analyst",
        "audience_analyst",
        "qloo_researcher",
        "evidence_normalizer",
        "scorer",
        "jev_decision_gate",
        "strategy",
        "final_review_guard",
    ]
    # Check sequences are strictly 1..10
    assert [s["sequence"] for s in steps] == list(range(1, 11))

    # 6. Fetch Evidence -> GET /api/v1/runs/{run_id}/evidence
    res_ev = await client.get(
        f"/api/v1/runs/{run_id}/evidence",
        headers=headers_owner,
    )
    assert res_ev.status_code == 200
    evidence_list = res_ev.json()
    assert len(evidence_list) > 0
    assert all("kind" in e and "explanation" in e for e in evidence_list)

    # 6b. Fetch Decisions -> GET /api/v1/runs/{run_id}/decisions (Phase 5)
    res_dec = await client.get(
        f"/api/v1/runs/{run_id}/decisions",
        headers=headers_owner,
    )
    assert res_dec.status_code == 200
    decisions_list = res_dec.json()
    assert len(decisions_list) > 0
    assert all("question_key" in d and "decision_value" in d for d in decisions_list)

    # 7. Multi-tenant security guard: outsider forbidden from accessing run
    token_outsider = f"dev_token:uid_outsider_{uuid.uuid4().hex[:6]}:out@cultura.local:Outsider"
    headers_outsider = {"Authorization": f"Bearer {token_outsider}"}

    res_forbidden = await client.get(
        f"/api/v1/runs/{run_id}",
        headers=headers_outsider,
    )
    assert res_forbidden.status_code == 403
    assert "Access denied" in res_forbidden.json()["detail"]
