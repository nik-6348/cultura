import logging
from typing import Any

import httpx

from src.core.config import get_settings
from src.integrations.jev.models import (
    JevQuestionDefinition,
    JevSystemOneRequest,
    JevSystemOneResponse,
)

logger = logging.getLogger(__name__)


class JevError(Exception):
    """Base exception for TypeSafe Jev client errors."""


class JevAuthError(JevError):
    """Authentication or authorization failure with Jev API."""


class JevTimeoutError(JevError):
    """Timeout during Jev API call."""


class JevServiceUnavailable(JevError):
    """Jev API is unreachable, overloaded, or returned 5xx."""


class JevAPIError(JevError):
    """Jev API returned an error response."""

    def __init__(self, message: str, status_code: int = 500, response_code: int = -1):
        super().__init__(message)
        self.status_code = status_code
        self.response_code = response_code


class TypeSafeJevClient:
    """
    Asynchronous client for the TypeSafe Jev System One reasoning engine.
    Sends structured state snapshots and typed question schemas to /api/v1/systemone.
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout_seconds: int | None = None,
    ):
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.jev_api_key
        raw_base_url = base_url if base_url is not None else settings.jev_base_url
        self.timeout_seconds = (
            timeout_seconds if timeout_seconds is not None else settings.jev_timeout_seconds
        )

        # Normalize base URL
        # Handle cases where base_url might already contain /api/v1/systemone
        cleaned_url = raw_base_url.rstrip("/")
        if cleaned_url.endswith("/api/v1/systemone"):
            self.endpoint_url = cleaned_url
        else:
            self.endpoint_url = f"{cleaned_url}/api/v1/systemone"

        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Cultura-API/1.0",
            }
            self._client = httpx.AsyncClient(
                headers=headers,
                timeout=httpx.Timeout(self.timeout_seconds, connect=5.0),
            )
        return self._client

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self) -> "TypeSafeJevClient":
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.close()

    async def predict(
        self,
        state: str | dict[str, Any],
        questions: dict[str, JevQuestionDefinition],
        model: str = "typesafe/jev-1.13",
    ) -> JevSystemOneResponse:
        """
        Submits state and questions to Jev System One API.

        Raises:
            JevAuthError: On 401 or 403 HTTP status.
            JevTimeoutError: On request timeout.
            JevServiceUnavailable: On 502/503/504 HTTP status or connection failure.
            JevAPIError: On other non-200 responses or non-zero Jev error codes.
        """
        if not self.api_key:
            raise JevAuthError("Missing Jev API key. Configure JEV_API_KEY in environment.")

        request_body = JevSystemOneRequest(
            model=model,
            state=state,
            questions=questions,
        )

        client = await self._get_client()
        try:
            response = await client.post(
                self.endpoint_url,
                json=request_body.model_dump(),
            )
        except (httpx.TimeoutException, TimeoutError) as exc:
            logger.warning(f"Jev API timeout after {self.timeout_seconds}s: {exc}")
            raise JevTimeoutError(
                f"Jev API request timed out after {self.timeout_seconds}s"
            ) from exc
        except (httpx.ConnectError, httpx.NetworkError) as exc:
            logger.warning(f"Jev API network connection failure: {exc}")
            raise JevServiceUnavailable(f"Jev API unreachable at {self.endpoint_url}") from exc

        if response.status_code in (401, 403):
            raise JevAuthError(
                f"Jev API authentication failed ({response.status_code}): {response.text}"
            )
        if response.status_code in (502, 503, 504):
            raise JevServiceUnavailable(
                f"Jev API gateway/server error ({response.status_code}): {response.text}"
            )
        if not response.is_success:
            raise JevAPIError(
                f"Jev API request failed with HTTP {response.status_code}: {response.text}",
                status_code=response.status_code,
            )

        try:
            payload = response.json()
        except Exception as exc:
            raise JevAPIError(f"Failed to parse Jev response as JSON: {response.text}") from exc

        if payload.get("code", 0) != 0:
            error_msg = payload.get("message", "Unknown error from Jev")
            raise JevAPIError(
                f"Jev API returned error code {payload.get('code')}: {error_msg}",
                response_code=payload.get("code", -1),
            )

        try:
            return JevSystemOneResponse.model_validate(payload)
        except Exception as exc:
            logger.error(f"Failed to validate Jev response schema: {exc}, payload={payload}")
            raise JevAPIError(f"Invalid Jev response schema: {exc}") from exc
