import httpx
import pytest

from src.integrations.qloo.client import (
    QlooAPIError,
    QlooAuthenticationError,
    QlooClient,
    QlooRateLimitError,
)


@pytest.mark.asyncio
async def test_qloo_response_parser_valid_json() -> None:
    """TC-2.1: Valid JSON response is correctly parsed into typed models."""
    mock_payload = {
        "entities": [
            {
                "id": "ent_palace_london",
                "name": "Palace Skateboards",
                "domain": "fashion",
                "tags": ["streetwear", "skate"],
                "popularity": 0.85,
            }
        ]
    }

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=mock_payload)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        client = QlooClient(api_key="test_key", http_client=http_client)
        entities = await client.resolve_entities("palace", domain="fashion")

        assert len(entities) == 1
        assert entities[0].id == "ent_palace_london"
        assert entities[0].name == "Palace Skateboards"
        assert entities[0].popularity == 0.85


@pytest.mark.asyncio
async def test_qloo_response_parser_empty_entities() -> None:
    """TC-2.1: Empty result set returns empty list without error."""

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"entities": []})

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        client = QlooClient(api_key="test_key", http_client=http_client)
        entities = await client.resolve_entities("nonexistent_brand")

        assert entities == []


@pytest.mark.asyncio
async def test_qloo_response_parser_malformed_json() -> None:
    """TC-2.1: Malformed non-JSON body raises QlooAPIError."""

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="<!DOCTYPE html><html>Gateway Error</html>")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        client = QlooClient(api_key="test_key", http_client=http_client)
        with pytest.raises(QlooAPIError) as exc_info:
            await client.resolve_entities("anything")
        assert "Invalid JSON" in str(exc_info.value)


@pytest.mark.asyncio
async def test_qloo_client_exponential_backoff_on_429() -> None:
    """TC-2.3: Exponential backoff retries 3 times on 429 before raising QlooRateLimitError."""
    attempts = 0

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(429, text="Rate limit exceeded")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        client = QlooClient(
            api_key="test_key",
            http_client=http_client,
            max_retries=3,
            backoff_factor=0.01,  # fast backoff for test speed
        )
        with pytest.raises(QlooRateLimitError):
            await client.resolve_entities("streetwear")

        # Initial call (1) + 3 retries = 4 total attempts
        assert attempts == 4


@pytest.mark.asyncio
async def test_qloo_client_recovers_after_retry() -> None:
    """TC-2.3: If server returns 429 twice and succeeds on third attempt, operation succeeds."""
    attempts = 0

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            return httpx.Response(429, text="Rate limited")
        return httpx.Response(
            200, json={"entities": [{"id": "ent_recovered", "name": "Recovered"}]}
        )

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        client = QlooClient(
            api_key="test_key",
            http_client=http_client,
            max_retries=3,
            backoff_factor=0.01,
        )
        entities = await client.resolve_entities("test")
        assert len(entities) == 1
        assert entities[0].name == "Recovered"
        assert attempts == 3


@pytest.mark.asyncio
async def test_qloo_client_auth_error_no_retry() -> None:
    """Ensure 401/403 fails immediately with QlooAuthenticationError without wasting retries."""
    attempts = 0

    async def mock_handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(401, text="Unauthorized: invalid API key")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as http_client:
        client = QlooClient(api_key="invalid_key", http_client=http_client, max_retries=3)
        with pytest.raises(QlooAuthenticationError):
            await client.resolve_entities("test")
        assert attempts == 1
