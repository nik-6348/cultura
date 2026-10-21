import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_project_crud_and_markets_lifecycle(client: AsyncClient) -> None:
    token = "dev_token:uid_proj_creator:creator@cultura.local:Creator"
    user_headers = {"Authorization": f"Bearer {token}"}

    # 1. Create workspace first
    res_ws = await client.post(
        "/api/v1/workspaces",
        json={"name": "Tokyo Fashion Group"},
        headers=user_headers,
    )
    assert res_ws.status_code == 201
    workspace_id = res_ws.json()["id"]

    # 2. Create project with candidate markets
    project_payload = {
        "workspace_id": workspace_id,
        "name": "Minimalist Streetwear EU Launch",
        "objective": "Determine London vs Berlin launch priority",
        "brand_profile_json": {
            "category": "apparel_streetwear",
            "price_point": "premium",
        },
        "candidate_markets": [
            {
                "name": "London",
                "country_code": "GB",
                "location_code": "GB-LND",
            },
            {
                "name": "Berlin",
                "country_code": "DE",
                "location_code": "DE-BER",
            },
        ],
    }
    res_create = await client.post(
        "/api/v1/projects",
        json=project_payload,
        headers=user_headers,
    )
    assert res_create.status_code == 201
    proj_data = res_create.json()
    project_id = proj_data["id"]
    assert proj_data["name"] == "Minimalist Streetwear EU Launch"
    assert len(proj_data["markets"]) == 2
    assert {m["name"] for m in proj_data["markets"]} == {"London", "Berlin"}

    # 3. List projects in workspace
    res_list = await client.get(
        f"/api/v1/projects?workspace_id={workspace_id}",
        headers=user_headers,
    )
    assert res_list.status_code == 200
    projects = res_list.json()
    assert any(p["id"] == project_id for p in projects)

    # 4. Get single project
    res_get = await client.get(f"/api/v1/projects/{project_id}", headers=user_headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == project_id

    # 5. Update project
    res_update = await client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Minimalist Streetwear EU Launch - Q4"},
        headers=user_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Minimalist Streetwear EU Launch - Q4"

    # 6. Delete project
    res_delete = await client.delete(f"/api/v1/projects/{project_id}", headers=user_headers)
    assert res_delete.status_code == 204

    # Verify deletion
    res_get_del = await client.get(f"/api/v1/projects/{project_id}", headers=user_headers)
    assert res_get_del.status_code == 404


@pytest.mark.asyncio
async def test_project_workspace_isolation(client: AsyncClient) -> None:
    user_a = {"Authorization": "Bearer dev_token:uid_user_alpha:alpha@cultura.local:User Alpha"}
    user_b = {"Authorization": "Bearer dev_token:uid_user_beta:beta@cultura.local:User Beta"}

    # User A creates workspace and project
    res_ws = await client.post(
        "/api/v1/workspaces",
        json={"name": "Alpha Corporation"},
        headers=user_a,
    )
    assert res_ws.status_code == 201
    workspace_id = res_ws.json()["id"]

    res_proj = await client.post(
        "/api/v1/projects",
        json={
            "workspace_id": workspace_id,
            "name": "Alpha Confidential Project",
        },
        headers=user_a,
    )
    assert res_proj.status_code == 201
    project_id = res_proj.json()["id"]

    # User B attempts to access User A's project -> 403 Forbidden!
    res_b_get = await client.get(
        f"/api/v1/projects/{project_id}",
        headers=user_b,
    )
    assert res_b_get.status_code == 403
    assert "Access denied" in res_b_get.json()["detail"]

    # User B attempts to list User A's workspace projects -> 403 Forbidden!
    res_b_list = await client.get(
        f"/api/v1/projects?workspace_id={workspace_id}",
        headers=user_b,
    )
    assert res_b_list.status_code == 403
