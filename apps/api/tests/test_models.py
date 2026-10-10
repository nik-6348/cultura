import uuid

from src.db.models import (
    AnalysisRun,
    Decision,
    Evidence,
    Memory,
    Project,
    ProjectMarket,
    RunStep,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceRole,
)


def test_user_model_instantiation() -> None:
    user = User(
        firebase_uid="firebase_abc123",
        email="test@cultura.ai",
        name="Test User",
    )
    assert user.firebase_uid == "firebase_abc123"
    assert user.email == "test@cultura.ai"
    assert user.name == "Test User"
    assert user.__tablename__ == "users"


def test_workspace_and_member_model() -> None:
    user_id = uuid.uuid4()
    workspace_id = uuid.uuid4()

    workspace = Workspace(
        id=workspace_id,
        name="Global Ventures",
        owner_user_id=user_id,
    )
    assert workspace.name == "Global Ventures"
    assert workspace.owner_user_id == user_id
    assert workspace.__tablename__ == "workspaces"

    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user_id,
        role=WorkspaceRole.OWNER,
    )
    assert member.role == WorkspaceRole.OWNER
    assert member.__tablename__ == "workspace_members"


def test_project_and_market_model() -> None:
    project_id = uuid.uuid4()
    workspace_id = uuid.uuid4()
    user_id = uuid.uuid4()

    project = Project(
        id=project_id,
        workspace_id=workspace_id,
        name="Tokyo Streetwear Launch",
        objective="Assess London market",
        created_by=user_id,
        brand_profile_json={"category": "streetwear"},
    )
    assert project.name == "Tokyo Streetwear Launch"
    assert project.brand_profile_json["category"] == "streetwear"
    assert project.__tablename__ == "projects"

    market = ProjectMarket(
        project_id=project_id,
        name="London",
        country_code="GB",
        location_code="GB-LND",
    )
    assert market.name == "London"
    assert market.country_code == "GB"
    assert market.__tablename__ == "project_markets"


def test_analysis_run_and_step_model() -> None:
    run_id = uuid.uuid4()
    project_id = uuid.uuid4()
    workspace_id = uuid.uuid4()
    user_id = uuid.uuid4()

    run = AnalysisRun(
        id=run_id,
        project_id=project_id,
        workspace_id=workspace_id,
        type="market_entry",
        status="queued",
        workflow_version="v1.0.0",
        score_version="v1.0.0",
        prompt_version="v1.0.0",
        input_snapshot_json={"markets": ["London"]},
        created_by=user_id,
    )
    assert run.status == "queued"
    assert run.workflow_version == "v1.0.0"
    assert run.__tablename__ == "analysis_runs"

    step = RunStep(
        run_id=run_id,
        step_key="qloo_research",
        agent_name="QlooResearcher",
        status="in_progress",
        sequence=1,
    )
    assert step.step_key == "qloo_research"
    assert step.sequence == 1
    assert step.__tablename__ == "run_steps"


def test_evidence_and_decision_model() -> None:
    run_id = uuid.uuid4()
    project_id = uuid.uuid4()

    evidence = Evidence(
        run_id=run_id,
        project_id=project_id,
        source="qloo",
        kind="brand_affinity",
        market_name="London",
        value_numeric=0.88,
        explanation="High affinity among demographic",
        source_metadata_json={"endpoint": "/v2/insights/audiences"},
    )
    assert evidence.value_numeric == 0.88
    assert evidence.source == "qloo"
    assert evidence.__tablename__ == "evidence"

    decision = Decision(
        run_id=run_id,
        question_key="market_decision",
        decision_value="launch",
        probabilities_json={"launch": 0.85, "adapt": 0.12, "avoid": 0.03},
        confidence=0.85,
        latency_ms=120,
    )
    assert decision.decision_value == "launch"
    assert decision.confidence == 0.85
    assert decision.__tablename__ == "decisions"


def test_memory_model() -> None:
    workspace_id = uuid.uuid4()
    project_id = uuid.uuid4()

    memory = Memory(
        workspace_id=workspace_id,
        project_id=project_id,
        memory_type="preference",
        content="Target market priority is London",
        is_active=True,
    )
    assert memory.memory_type == "preference"
    assert memory.is_active is True
    assert memory.__tablename__ == "memories"
