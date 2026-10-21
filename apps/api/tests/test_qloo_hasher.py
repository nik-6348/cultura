from src.integrations.qloo.hasher import compute_request_hash


def test_hash_identical_for_differing_key_orders() -> None:
    """TC-2.2: Payloads with different dictionary key order produce identical hashes."""
    endpoint = "/v2/insights/audiences"
    body_a = {
        "entities": ["ent_1", "ent_2"],
        "target_categories": ["fashion", "dining"],
        "location": "London",
    }
    body_b = {
        "location": "London",
        "target_categories": ["fashion", "dining"],
        "entities": ["ent_1", "ent_2"],
    }

    hash_a = compute_request_hash(endpoint, method="POST", body=body_a)
    hash_b = compute_request_hash(endpoint, method="POST", body=body_b)

    assert hash_a == hash_b
    assert len(hash_a) == 64  # SHA-256 hex string


def test_hash_differs_for_different_endpoints_or_methods() -> None:
    """Ensure varying endpoints or methods produce distinct hashes."""
    h1 = compute_request_hash("/v2/insights/entities", method="GET", params={"query": "coffee"})
    h2 = compute_request_hash("/v2/insights/entities", method="POST", params={"query": "coffee"})
    h3 = compute_request_hash("/v2/insights/locations", method="GET", params={"query": "coffee"})

    assert h1 != h2
    assert h1 != h3


def test_hash_normalizes_empty_params_and_whitespace() -> None:
    """Ensure null/empty dictionaries and whitespace are normalized."""
    h_none = compute_request_hash("  /v2/insights/entities  ", method="get")
    h_empty = compute_request_hash("/v2/insights/entities", method="GET", params={}, body={})

    assert h_none == h_empty
