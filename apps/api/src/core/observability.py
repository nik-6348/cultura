import logging
import re
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any

# Regex patterns matching sensitive credentials, tokens, and keys
SECRET_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # Bearer tokens: "Bearer abc.xyz-123"
    (re.compile(r"(Bearer\s+)[A-Za-z0-9_.\-:=]{8,}", re.IGNORECASE), r"\1[REDACTED_TOKEN]"),
    # Standard sk_ API keys
    (re.compile(r"sk_[A-Za-z0-9_\-]{16,}", re.IGNORECASE), "[REDACTED_API_KEY]"),
    # API key query params or headers
    (
        re.compile(
            r"(api[_-]?key|password|jwt_secret|private_key)([\"']?\s*[:=]\s*[\"']?)[^\s\"',&]+",
            re.IGNORECASE,
        ),
        r"\1\2[REDACTED]",
    ),
    # LangSmith keys (lsv2_pt_...)
    (re.compile(r"lsv2_pt_[A-Za-z0-9_]{16,}", re.IGNORECASE), "[REDACTED_LANGSMITH_KEY]"),
    # Firebase keys (AIzaSy...)
    (re.compile(r"AIzaSy[A-Za-z0-9_\-]{20,}", re.IGNORECASE), "[REDACTED_FIREBASE_KEY]"),
]


class SensitiveDataMasker:
    """Utility class to sanitize strings and structured payloads of sensitive tokens."""

    @classmethod
    def mask_string(cls, text: str) -> str:
        """Sanitizes sensitive tokens in a raw string."""
        if not text:
            return text
        sanitized = text
        for pattern, replacement in SECRET_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)
        return sanitized

    @classmethod
    def mask_dict(cls, data: dict[str, Any]) -> dict[str, Any]:
        """Recursively sanitizes dictionary keys and values."""
        masked: dict[str, Any] = {}
        for k, v in data.items():
            k_lower = k.lower()
            if any(term in k_lower for term in ["key", "secret", "password", "token", "auth"]):
                masked[k] = "[REDACTED]"
            elif isinstance(v, str):
                masked[k] = cls.mask_string(v)
            elif isinstance(v, dict):
                masked[k] = cls.mask_dict(v)
            elif isinstance(v, list):
                masked[k] = [
                    cls.mask_dict(item) if isinstance(item, dict) else cls.mask_string(str(item))
                    for item in v
                ]
            else:
                masked[k] = v
        return masked


class SanitizingLogFilter(logging.Filter):
    """Logging filter that scrubs sensitive keys and tokens from all log messages."""

    def filter(self, record: logging.LogRecord) -> bool:
        if record.msg and isinstance(record.msg, str):
            record.msg = SensitiveDataMasker.mask_string(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = SensitiveDataMasker.mask_dict(record.args)
            elif isinstance(record.args, tuple):
                record.args = tuple(
                    SensitiveDataMasker.mask_string(str(arg)) if isinstance(arg, str) else arg
                    for arg in record.args
                )
        return True


@contextmanager
def trace_span(
    name: str,
    run_id: str | None = None,
    workspace_id: str | None = None,
    **extra_attributes: Any,
) -> Generator[dict[str, Any], None, None]:
    """
    Lightweight contextual trace span recording execution metadata.
    Enriches audit traces for LangSmith and OpenTelemetry.
    """
    span_context: dict[str, Any] = {
        "span_name": name,
        "run_id": run_id,
        "workspace_id": workspace_id,
        **extra_attributes,
    }
    logger = logging.getLogger("cultura.observability")
    logger.debug(
        "Beginning span %s (run_id=%s, workspace_id=%s)",
        name,
        run_id or "none",
        workspace_id or "none",
    )
    try:
        yield span_context
    finally:
        logger.debug("Completed span %s", name)
