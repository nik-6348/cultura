import json
import math
from typing import Any

from pydantic import BaseModel, Field


class ContextBudgetBreakdown(BaseModel):
    """Breakdown of token utilization across all context sections."""

    system_tokens: int = 0
    project_tokens: int = 0
    layer_c_memory_tokens: int = 0
    evidence_tokens: int = 0
    layer_d_semantic_tokens: int = 0
    task_schema_tokens: int = 0
    total_tokens: int = 0
    max_tokens: int = 8000


class ContextBuilderResult(BaseModel):
    """Result of context assembly with token accounting."""

    compiled_prompt: str
    token_count: int = Field(ge=0)
    budget_breakdown: ContextBudgetBreakdown


class ContextBuilder:
    """
    Strict Token Budgeting & Multi-Layer Context Assembler for Cultura.
    Enforces strict token limits to prevent context dilution, latency spikes,
    and hallucinations:

    - System & Behavioral Rules: 10%
    - Project Constants & Brand Profile: 15%
    - Active Project Facts (Layer C): 10%
    - Qloo Empirical Evidence Signals: 35%
    - Semantic Episodic Recall (Layer D): 10%
    - Task Prompt & JSON Output Schema: 15%
    - Safety & Parsing Headroom Buffer: 5%
    """

    CHARS_PER_TOKEN = 4.0

    @classmethod
    def estimate_tokens(cls, text: str) -> int:
        """Estimates token count from text using standard 4-char rule."""
        if not text:
            return 0
        return math.ceil(len(text) / cls.CHARS_PER_TOKEN)

    @classmethod
    def _truncate_to_budget(cls, text: str, max_tokens: int) -> tuple[str, int]:
        """Truncates string to fit within max_tokens budget with clean boundary."""
        estimated = cls.estimate_tokens(text)
        if estimated <= max_tokens:
            return text, estimated

        max_chars = int(max_tokens * cls.CHARS_PER_TOKEN)
        suffix = "\n... [truncated to fit token budget]"
        allowed_chars = max(0, max_chars - len(suffix))
        truncated = text[:allowed_chars] + suffix
        return truncated, cls.estimate_tokens(truncated)

    @classmethod
    def assemble_context(
        cls,
        max_tokens: int = 8000,
        system_policy: str = "",
        project_profile: dict[str, Any] | None = None,
        active_memories: list[dict[str, Any]] | None = None,
        normalized_evidence: list[dict[str, Any]] | None = None,
        semantic_memories: list[dict[str, Any]] | None = None,
        task_prompt: str = "",
        output_schema_desc: str = "",
    ) -> ContextBuilderResult:
        """
        TC-6.2: Assembles multi-layer context string guaranteed to stay strictly
        within max_tokens limit.
        """
        # 1. Calculate section token budgets
        b_system = int(max_tokens * 0.10)
        b_project = int(max_tokens * 0.15)
        b_layer_c = int(max_tokens * 0.10)
        b_evidence = int(max_tokens * 0.35)
        b_layer_d = int(max_tokens * 0.10)
        b_task = int(max_tokens * 0.15)

        # 2. Format System Policy
        sys_text = system_policy.strip() or (
            "You are Cultura, an AI Cultural Intelligence Engine. "
            "Base all recommendations strictly on verified empirical evidence. "
            "Never invent citations or assume unverified subcultural affinity."
        )
        sys_content, t_sys = cls._truncate_to_budget(sys_text, b_system)

        # 3. Format Project Constants
        proj_str = json.dumps(project_profile or {}, indent=2)
        proj_text = f"### Active Brand & Project Profile\n```json\n{proj_str}\n```"
        proj_content, t_proj = cls._truncate_to_budget(proj_text, b_project)

        # 4. Format Layer C Active Project Memories
        mem_lines = []
        for m in active_memories or []:
            m_type = m.get("memory_type", "fact").upper()
            m_content = m.get("content", "")
            mem_lines.append(f"- [{m_type}] {m_content}")
        mem_text = "### Verified Project Facts & User Corrections (Layer C)\n" + (
            "\n".join(mem_lines) if mem_lines else "None recorded."
        )
        mem_content, t_mem = cls._truncate_to_budget(mem_text, b_layer_c)

        # 5. Format Empirical Cultural Evidence (Qloo)
        ev_lines = []
        for ev in normalized_evidence or []:
            ev_id = ev.get("id", "N/A")
            kind = ev.get("kind", "signal")
            m_name = ev.get("market_name", "Global")
            expl = ev.get("explanation", "")
            ev_lines.append(f"- [{ev_id}] ({m_name} | {kind}): {expl}")
        ev_text = "### Empirical Qloo Cultural Signals & Grounded Evidence\n" + (
            "\n".join(ev_lines) if ev_lines else "No normalized evidence provided."
        )
        ev_content, t_ev = cls._truncate_to_budget(ev_text, b_evidence)

        # 6. Format Layer D Semantic Episodic Recall
        sem_lines = []
        for s in semantic_memories or []:
            sim = s.get("similarity", 1.0)
            c = s.get("content", "")
            sem_lines.append(f"- (Similarity: {sim:.2f}) {c}")
        sem_text = "### Historical Episodic Recall (Layer D pgvector)\n" + (
            "\n".join(sem_lines) if sem_lines else "No prior similar historical cases found."
        )
        sem_content, t_sem = cls._truncate_to_budget(sem_text, b_layer_d)

        # 7. Format Task & Output Schema
        task_full = (
            f"### Immediate Analysis Objective\n{task_prompt}\n\n"
            f"### Target JSON Output Schema\n{output_schema_desc}"
        )
        task_content, t_task = cls._truncate_to_budget(task_full, b_task)

        # 8. Compile Full Prompt
        compiled = (
            f"## SYSTEM DIRECTIVES\n{sys_content}\n\n"
            f"## PROJECT CONSTANTS\n{proj_content}\n\n"
            f"## LAYER C MEMORY\n{mem_content}\n\n"
            f"## EMPIRICAL EVIDENCE\n{ev_content}\n\n"
            f"## LAYER D EPISODIC RECALL\n{sem_content}\n\n"
            f"## TASK OBJECTIVE\n{task_content}"
        )

        total_tokens = cls.estimate_tokens(compiled)

        breakdown = ContextBudgetBreakdown(
            system_tokens=t_sys,
            project_tokens=t_proj,
            layer_c_memory_tokens=t_mem,
            evidence_tokens=t_ev,
            layer_d_semantic_tokens=t_sem,
            task_schema_tokens=t_task,
            total_tokens=total_tokens,
            max_tokens=max_tokens,
        )

        return ContextBuilderResult(
            compiled_prompt=compiled,
            token_count=total_tokens,
            budget_breakdown=breakdown,
        )
