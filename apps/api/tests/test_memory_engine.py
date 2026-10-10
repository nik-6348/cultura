import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.user import User
from src.db.models.workspace import Workspace, WorkspaceMember
from src.services.context_builder import ContextBuilder
from src.services.memory_service import MemoryService


async def create_test_workspace(db: AsyncSession, name: str = "Memory Test WS") -> Workspace:
    """Helper to provision a real User and Workspace for foreign key integrity."""
    user = User(
        firebase_uid=f"uid_{uuid.uuid4().hex[:8]}",
        email=f"user_{uuid.uuid4().hex[:6]}@cultura.local",
        name="Test User",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    ws = Workspace(
        name=name,
        owner_user_id=user.id,
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)

    member = WorkspaceMember(
        workspace_id=ws.id,
        user_id=user.id,
        role="owner",
    )
    db.add(member)
    await db.commit()
    return ws


@pytest.mark.asyncio
async def test_tc_6_1_pgvector_cosine_similarity_retrieval(db_session: AsyncSession) -> None:
    """
    TC-6.1 (Integration): pgvector cosine similarity search retrieves top-3 closest past memories.
    Tests semantic retrieval using pgvector cosine distance on PostgreSQL 16.
    """
    ws = await create_test_workspace(db_session, name="Nordic Design Workspace")
    workspace_id = ws.id

    # Create 3 memories related to Scandinavian fashion & minimalism
    m1 = await MemoryService.create_memory(
        db=db_session,
        workspace_id=workspace_id,
        content=(
            "Nordic minimalism aesthetic emphasizes clean silhouettes, neutral palettes, "
            "and organic materials."
        ),
        memory_type="fact",
        structured_json={"topic": "design_philosophy"},
    )
    await MemoryService.create_memory(
        db=db_session,
        workspace_id=workspace_id,
        content=(
            "Tokyo streetwear and Harajuku subculture prioritize oversized tailoring, "
            "graphic layering, and technical fabrics."
        ),
        memory_type="fact",
        structured_json={"topic": "streetwear_aesthetic"},
    )
    await MemoryService.create_memory(
        db=db_session,
        workspace_id=workspace_id,
        content=(
            "Berlin electronic music venues require dark, industrial, and utilitarian apparel "
            "with functional pockets."
        ),
        memory_type="fact",
        structured_json={"topic": "nightlife_outerwear"},
    )
    # A completely unrelated memory (e.g. Italian cuisine)
    m_unrelated = await MemoryService.create_memory(
        db=db_session,
        workspace_id=workspace_id,
        content=(
            "Traditional Neapolitan wood-fired pizza requires San Marzano tomatoes "
            "and double-zero flour."
        ),
        memory_type="fact",
        structured_json={"topic": "culinary"},
    )

    # Search with a query closely related to Scandinavian minimalism
    query = "Minimalist Nordic clean apparel design"
    results = await MemoryService.search_semantic_memories(
        db=db_session,
        workspace_id=workspace_id,
        query_text=query,
        limit=3,
    )

    assert len(results) == 3
    retrieved_ids = [mem.id for mem, sim in results]

    # m1 should be the top match with highest similarity
    assert m1.id == retrieved_ids[0]
    top_mem, top_sim = results[0]
    assert top_sim > 0.0

    # m_unrelated should not be in the top-1
    assert m_unrelated.id != retrieved_ids[0]


def test_tc_6_2_context_builder_strict_token_budgeting() -> None:
    """
    TC-6.2 (Unit): ContextBuilder strictly stays within token limit (< 8,000 tokens)
    even when huge payloads are supplied.
    """
    max_tokens = 4000

    huge_policy = "Policy directive sentence repeating. " * 500  # ~18,000 chars
    huge_project_profile = {"brand_history": "Long background text. " * 400}
    huge_memories = [
        {"memory_type": "correction", "content": f"Correction number {i}: detail text " * 30}
        for i in range(50)
    ]
    huge_evidence = [
        {
            "id": f"ev_{i}",
            "market_name": "London",
            "kind": "brand_affinity",
            "explanation": f"Statistical correlation signal details for entity {i} " * 20,
        }
        for i in range(100)
    ]
    huge_semantic = [
        {"similarity": 0.92, "content": f"Past successful entry strategy into capital {i} " * 20}
        for i in range(30)
    ]
    huge_task = "Analyze market and produce recommendations. " * 300

    result = ContextBuilder.assemble_context(
        max_tokens=max_tokens,
        system_policy=huge_policy,
        project_profile=huge_project_profile,
        active_memories=huge_memories,
        normalized_evidence=huge_evidence,
        semantic_memories=huge_semantic,
        task_prompt=huge_task,
        output_schema_desc="{ 'analysis': 'string' }",
    )

    # Must strictly not exceed max_tokens + 5% buffer
    assert result.token_count <= int(max_tokens * 1.05)
    assert "[truncated to fit token budget]" in result.compiled_prompt
    assert "## SYSTEM DIRECTIVES" in result.compiled_prompt
    assert "## LAYER C MEMORY" in result.compiled_prompt
    assert "## EMPIRICAL EVIDENCE" in result.compiled_prompt


@pytest.mark.asyncio
async def test_tc_6_3_memory_conflict_resolution_and_audit(db_session: AsyncSession) -> None:
    """
    TC-6.3 (Unit): Updating a memory deactivates the old memory record with audit trail.
    When a user preference or correction overrides an existing topic, the old record
    is set to is_active=False with superseded_by reference.
    """
    ws = await create_test_workspace(db_session, name="Demographics WS")
    workspace_id = ws.id

    # 1. User records initial preference
    initial_mem = await MemoryService.create_memory(
        db=db_session,
        workspace_id=workspace_id,
        project_id=None,
        content="Target audience age is strictly 18-24 Gen Z.",
        memory_type="preference",
        structured_json={"topic": "target_demographics", "age_bracket": "18-24"},
    )
    assert initial_mem.is_active is True

    # 2. User later issues a correction/update for the same topic
    new_mem = await MemoryService.create_memory(
        db=db_session,
        workspace_id=workspace_id,
        project_id=None,
        content="Correction: Target audience is 25-38 affluent millennial creatives.",
        memory_type="correction",
        structured_json={"topic": "target_demographics", "age_bracket": "25-38"},
    )

    # 3. Verify old memory was deactivated with audit trail
    await db_session.refresh(initial_mem)
    assert initial_mem.is_active is False
    assert initial_mem.structured_json["superseded_by"] == str(new_mem.id)
    assert "Superseded by correction update" in initial_mem.structured_json["deactivated_reason"]

    # 4. Verify new memory is active
    assert new_mem.is_active is True

    # 5. Active memories retrieval returns only new_mem
    active_mems = await MemoryService.get_active_memories(
        db=db_session,
        workspace_id=workspace_id,
        project_id=None,
    )
    assert len(active_mems) == 1
    assert active_mems[0].id == new_mem.id


@pytest.mark.asyncio
async def test_tc_6_4_multi_tenant_workspace_isolation_zero_leak(
    db_session: AsyncSession,
) -> None:
    """
    TC-6.4 (Security): Memory retrieval across different workspace_ids returns zero results.
    Guarantees strict tenant isolation for sensitive brand intelligence and episodic memories.
    """
    ws_a = await create_test_workspace(db_session, name="Tenant A Confidential")
    ws_b = await create_test_workspace(db_session, name="Tenant B Isolated")
    workspace_a = ws_a.id
    workspace_b = ws_b.id

    # Workspace A records secret strategy
    await MemoryService.create_memory(
        db=db_session,
        workspace_id=workspace_a,
        content="Confidential London flagship store scheduled on Shoreditch High Street.",
        memory_type="fact",
        structured_json={"topic": "retail_expansion"},
    )

    # Workspace B queries with exact same content keywords
    leak_check = await MemoryService.search_semantic_memories(
        db=db_session,
        workspace_id=workspace_b,  # Different tenant!
        query_text="Confidential London flagship store Shoreditch",
        limit=5,
    )

    # Must return 0 records from Workspace A
    assert len(leak_check) == 0

    # Also list active memories in Workspace B must be empty
    list_b = await MemoryService.get_active_memories(
        db=db_session,
        workspace_id=workspace_b,
    )
    assert len(list_b) == 0


@pytest.mark.asyncio
async def test_memories_rest_api_lifecycle(client: AsyncClient) -> None:
    """
    Contract & E2E API test for memory endpoints:
    POST /workspaces/{id}/memories
    GET  /workspaces/{id}/memories
    POST /workspaces/{id}/memories/search
    DELETE /memories/{id}
    """
    token_owner = f"dev_token:uid_mem_owner_{uuid.uuid4().hex[:6]}:memowner@cultura.local:Owner"
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    # 1. Create Workspace
    res_ws = await client.post(
        "/api/v1/workspaces",
        json={"name": "Memory Test Workspace"},
        headers=headers_owner,
    )
    assert res_ws.status_code == 201
    workspace_id = res_ws.json()["id"]

    # 2. Create Memory
    res_mem = await client.post(
        f"/api/v1/workspaces/{workspace_id}/memories",
        json={
            "content": "Brand emphasizes carbon-neutral manufacturing and organic wool.",
            "memory_type": "fact",
            "scope": "brand",
            "structured_json": {"sustainability_score": 0.95},
        },
        headers=headers_owner,
    )
    assert res_mem.status_code == 201
    mem_data = res_mem.json()
    memory_id = mem_data["id"]
    assert mem_data["content"] == "Brand emphasizes carbon-neutral manufacturing and organic wool."
    assert mem_data["is_active"] is True

    # 3. List Memories
    res_list = await client.get(
        f"/api/v1/workspaces/{workspace_id}/memories",
        headers=headers_owner,
    )
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    # 4. Semantic Search
    res_search = await client.post(
        f"/api/v1/workspaces/{workspace_id}/memories/search",
        json={
            "query": "sustainable carbon-neutral wool fashion",
            "limit": 3,
        },
        headers=headers_owner,
    )
    assert res_search.status_code == 200
    search_results = res_search.json()
    assert len(search_results) == 1
    assert search_results[0]["memory"]["id"] == memory_id
    assert search_results[0]["similarity"] > 0.0

    # 5. Delete (Deactivate) Memory
    res_del = await client.delete(
        f"/api/v1/memories/{memory_id}",
        headers=headers_owner,
    )
    assert res_del.status_code == 204

    # 6. Verify Memory is now inactive
    res_list_after = await client.get(
        f"/api/v1/workspaces/{workspace_id}/memories",
        headers=headers_owner,
    )
    assert res_list_after.status_code == 200
    assert len(res_list_after.json()) == 0
