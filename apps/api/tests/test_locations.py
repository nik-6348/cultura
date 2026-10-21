import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_locations_search_all(client: AsyncClient) -> None:
    response = await client.get("/api/v1/locations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Tokyo should be in default locations
    tokyo = next((loc for loc in data if loc["id"] == "jp-tyo"), None)
    assert tokyo is not None
    assert tokyo["name"] == "Tokyo"
    assert tokyo["country"] == "Japan"
    assert tokyo["location_code"] == "JP-TYO"
    assert tokyo["flag"] == "🇯🇵"


@pytest.mark.asyncio
async def test_locations_search_query(client: AsyncClient) -> None:
    response = await client.get("/api/v1/locations?query=france")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(loc["country"] == "France" for loc in data)
    assert any(loc["name"] == "Paris" for loc in data)


@pytest.mark.asyncio
async def test_locations_search_region(client: AsyncClient) -> None:
    response = await client.get("/api/v1/locations?region=Asia")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for loc in data:
        assert loc["region"] == "Asia"
