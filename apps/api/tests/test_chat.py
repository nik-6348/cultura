import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analyst_chat_lifecycle_and_evidence_grounding(client: AsyncClient) -> None:
    """
    Verify that the Cultural Analyst Chat endpoint responds with grounded
    citations, dimension scores, and suggested questions.
    """
    token_owner = f"dev_token:uid_chat_{uuid.uuid4().hex[:6]}:chat@cultura.local:Strategist"
    headers = {"Authorization": f"Bearer {token_owner}"}

    # 1. Create Workspace
    ws_res = await client.post(
        "/api/v1/workspaces",
        json={"name": "Chat Enterprise Test Lab", "domain": "chat.cultura.ai"},
        headers=headers,
    )
    assert ws_res.status_code == 201
    workspace_id = ws_res.json()["id"]

    # 2. Create Project
    proj_res = await client.post(
        "/api/v1/projects",
        json={
            "workspace_id": workspace_id,
            "name": "Tokyo Streetwear Expansion",
            "objective": "Evaluate streetwear entry into Tokyo and Seoul",
            "candidate_markets": [
                {"name": "Tokyo", "country_code": "JP", "location_code": "JP-TYO"},
                {"name": "Seoul", "country_code": "KR", "location_code": "KR-SEL"},
            ],
        },
        headers=headers,
    )
    assert proj_res.status_code == 201
    project_id = proj_res.json()["id"]

    # 3. Chat with Analyst
    chat_res = await client.post(
        f"/api/v1/projects/{project_id}/chat",
        json={"message": "Why is Tokyo recommended for launch and what are the key reasons?"},
        headers=headers,
    )
    assert chat_res.status_code == 200
    data = chat_res.json()

    assert "reply" in data
    assert len(data["reply"]) > 50
    assert len(data["citations"]) >= 1
    assert data["citations"][0]["source"] == "Qloo Taste Graph"
    assert len(data["suggested_questions"]) >= 3
    assert len(data["related_evidence"]) >= 1
    assert data["chart_data"] is not None
