import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_workspace_crud_lifecycle(client: AsyncClient) -> None:
    token = "dev_token:uid_ws_owner:owner@cultura.local:Owner"
    user_headers = {"Authorization": f"Bearer {token}"}

    # 1. Create workspace
    create_payload = {
        "name": "Global Retail Lab",
        "domain": "retail.global",
    }
    res_create = await client.post(
        "/api/v1/workspaces",
        json=create_payload,
        headers=user_headers,
    )
    assert res_create.status_code == 201
    ws_data = res_create.json()
    workspace_id = ws_data["id"]
    assert ws_data["name"] == "Global Retail Lab"
    assert ws_data["domain"] == "retail.global"

    # 2. List workspaces
    res_list = await client.get("/api/v1/workspaces", headers=user_headers)
    assert res_list.status_code == 200
    workspaces = res_list.json()
    assert any(w["id"] == workspace_id for w in workspaces)

    # 3. Get workspace by ID
    res_get = await client.get(f"/api/v1/workspaces/{workspace_id}", headers=user_headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == workspace_id

    # 4. Update workspace
    res_update = await client.patch(
        f"/api/v1/workspaces/{workspace_id}",
        json={"name": "Global Retail Lab EMEA"},
        headers=user_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Global Retail Lab EMEA"


@pytest.mark.asyncio
async def test_workspace_access_denied_for_non_member(client: AsyncClient) -> None:
    owner_headers = {"Authorization": "Bearer dev_token:uid_ox:ox@cultura.local:OwnerX"}
    outsider_headers = {"Authorization": "Bearer dev_token:uid_oy:oy@cultura.local:OutY"}

    # Owner creates workspace
    res_create = await client.post(
        "/api/v1/workspaces",
        json={"name": "Secret Strategy Vault"},
        headers=owner_headers,
    )
    assert res_create.status_code == 201
    workspace_id = res_create.json()["id"]

    # Outsider attempts access -> 403 Forbidden
    res_access = await client.get(
        f"/api/v1/workspaces/{workspace_id}",
        headers=outsider_headers,
    )
    assert res_access.status_code == 403
    assert "Access denied" in res_access.json()["detail"]
