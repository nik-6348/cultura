import hashlib
import json
from typing import Any


def _canonical_json_dumps(obj: Any) -> str:
    """Serialize object to canonical, sorted JSON string."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True, default=str)


def compute_request_hash(
    endpoint: str,
    method: str = "GET",
    params: dict[str, Any] | None = None,
    body: dict[str, Any] | None = None,
) -> str:
    """
    Compute a deterministic SHA-256 hash for an external API request.

    Guarantees:
    - Independent of key ordering in dictionaries.
    - Normalized HTTP method and endpoint whitespace/case.
    - None and empty dictionaries produce consistent hashes.
    """
    norm_method = method.strip().upper()
    norm_endpoint = endpoint.strip()

    canonical_params = _canonical_json_dumps(params or {})
    canonical_body = _canonical_json_dumps(body or {})

    hash_payload = f"{norm_method}:{norm_endpoint}:{canonical_params}:{canonical_body}"
    return hashlib.sha256(hash_payload.encode("utf-8")).hexdigest()
