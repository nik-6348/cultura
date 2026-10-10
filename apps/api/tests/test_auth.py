import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_required_for_protected_routes(client: AsyncClient) -> None:
    response = await client.get("/api/v1/workspaces")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]


@pytest.mark.asyncio
async def test_dev_token_auto_provisions_user(client: AsyncClient) -> None:
    headers = {"Authorization": "Bearer dev_token:uid_test_101:testuser@cultura.local:Test User"}
    response = await client.get("/api/v1/workspaces", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
