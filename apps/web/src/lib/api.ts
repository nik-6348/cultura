import {
  AnalysisRun,
  ChatResponse,
  DecisionRecord,
  EvidenceRecord,
  MarketLocation,
  MemoryRecord,
  Project,
  RankedMarketItem,
  ReportRecord,
  RunStep,
  Workspace,
} from "./types";

const DEV_AUTH_HEADER = "Bearer dev_token:uid_demo_strategist:strategist@cultura.ai:Demo Strategist";

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", DEV_AUTH_HEADER);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = (await response.json()) as { detail?: string; message?: string };
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // Keep status text
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

function normalizeProject(proj: Project): Project {
  return {
    ...proj,
    status: proj.status || "active",
    candidate_markets: proj.candidate_markets || proj.markets || [],
  };
}

function normalizeRun(run: AnalysisRun): AnalysisRun {
  const summary = run.result_summary_json;
  const decisions = summary?.decisions;
  const winner = summary?.winner_market;
  const marketScores = (summary?.market_scores || {}) as Record<
    string,
    {
      overall_score?: number;
      dimension_scores?: Record<string, { raw_score?: number; weighted_score?: number }>;
    }
  >;
  const winnerScoreObj = winner ? marketScores[winner] : null;

  // Build real ranked markets list from marketScores or comparative_matrix
  const computedRankings: RankedMarketItem[] = [];
  const compMatrix = (summary?.comparative_matrix || {}) as Record<string, { overall?: number }>;
  const allMarkets = Array.from(
    new Set([
      ...Object.keys(marketScores),
      ...Object.keys(compMatrix),
      ...((run.input_snapshot_json?.candidate_markets as Array<{ name: string }>) || []).map((m) => m.name),
    ])
  ).filter(Boolean);

  allMarkets.forEach((mName) => {
    const mScore =
      marketScores[mName]?.overall_score ??
      compMatrix[mName]?.overall ??
      (mName === winner ? run.overall_score : 0.8) ??
      0.8;
    computedRankings.push({
      rank: 1,
      market: mName,
      score: Number(mScore),
      verdict: mScore >= 0.8 ? "LAUNCH" : (mScore >= 0.65 ? "ADAPT" : "AVOID"),
      confidence: mName === winner ? (run.decision_confidence ?? 1.0) : 0.88,
    });
  });

  computedRankings.sort((a, b) => b.score - a.score);
  computedRankings.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Extract dimensions for each market
  const marketScoresObj: Record<string, unknown> = {};
  for (const [mName, mData] of Object.entries(marketScores)) {
    const dims: Record<string, number> = {};
    if (mData.dimension_scores) {
      for (const [dKey, dVal] of Object.entries(mData.dimension_scores)) {
        dims[dKey] = dVal.raw_score ?? dVal.weighted_score ?? 0;
      }
    }
    marketScoresObj[mName] = {
      overall_score: mData.overall_score,
      dimensions: dims,
      dimension_scores: dims,
    };
  }

  return {
    ...run,
    parent_run_id: (run.input_snapshot_json?.parent_run_id as string) || null,
    overall_score:
      run.overall_score ??
      (winnerScoreObj?.overall_score !== undefined
        ? Number(winnerScoreObj.overall_score)
        : (computedRankings[0]?.score ?? null)),
    decision_verdict:
      run.decision_verdict ??
      decisions?.winner_posture ??
      (computedRankings[0]?.verdict ?? "LAUNCH"),
    decision_confidence:
      run.decision_confidence ??
      decisions?.winner_confidence ??
      1.0,
    strategy_summary:
      run.strategy_summary ??
      (summary?.recommendations && summary.recommendations.length > 0
        ? summary.recommendations[0]?.action || summary.recommendations[0]?.title
        : null),
    scores_json: {
      market_scores: marketScoresObj,
      rankings: computedRankings,
    },
  };
}

function normalizeStep(step: RunStep): RunStep {
  return {
    ...step,
    node_name: step.node_name || step.step_key,
    agent_role: step.agent_role || step.agent_name,
    duration_ms: step.duration_ms !== undefined ? step.duration_ms : step.latency_ms,
  };
}

function normalizeEvidence(ev: EvidenceRecord): EvidenceRecord {
  return {
    ...ev,
    signal_type: ev.signal_type || ev.kind,
    entity_name: ev.entity_name || ev.entity_ref || ev.market_name || "Taste Signal",
    score: ev.score !== undefined ? ev.score : ev.value_numeric,
    content: ev.content || ev.explanation,
    provider: ev.provider || ev.source,
    source_type: ev.source_type || ev.source,
  };
}

function normalizeDecision(dec: DecisionRecord): DecisionRecord {
  return {
    ...dec,
    probabilities: dec.probabilities || dec.probabilities_json,
  };
}

function normalizeMemory(mem: MemoryRecord): MemoryRecord {
  return {
    ...mem,
    layer: mem.layer ?? (mem.memory_type === "fact" ? "C" : "D"),
  };
}

export const api = {
  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return fetchJson<Workspace[]>("/api/v1/workspaces");
  },

  async createWorkspace(name: string, domain?: string): Promise<Workspace> {
    return fetchJson<Workspace>("/api/v1/workspaces", {
      method: "POST",
      body: JSON.stringify({ name, domain }),
    });
  },

  // Projects
  async getProjects(workspaceId: string): Promise<Project[]> {
    const list = await fetchJson<Project[]>(`/api/v1/projects?workspace_id=${workspaceId}`);
    return list.map(normalizeProject);
  },

  async getProject(projectId: string): Promise<Project> {
    const proj = await fetchJson<Project>(`/api/v1/projects/${projectId}`);
    return normalizeProject(proj);
  },

  async createProject(payload: {
    workspace_id: string;
    name: string;
    objective?: string;
    brand_profile_json?: Record<string, unknown>;
    audience_profile_json?: Record<string, unknown>;
    candidate_markets?: Array<{ name: string; country_code?: string; location_code?: string }>;
  }): Promise<Project> {
    const proj = await fetchJson<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeProject(proj);
  },

  // Locations
  async searchLocations(query?: string, region?: string): Promise<MarketLocation[]> {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (region && region !== "All markets") params.set("region", region);
    const queryString = params.toString();
    const url = queryString ? `/api/v1/locations?${queryString}` : "/api/v1/locations";
    return fetchJson<MarketLocation[]>(url);
  },

  // Analysis Runs
  async createRun(
    projectId: string,
    overrideMarkets?: Array<{ name: string; code?: string }>
  ): Promise<AnalysisRun> {
    const run = await fetchJson<AnalysisRun>(`/api/v1/projects/${projectId}/runs`, {
      method: "POST",
      body: JSON.stringify({ override_markets: overrideMarkets }),
    });
    return normalizeRun(run);
  },

  async getRun(runId: string): Promise<AnalysisRun> {
    const run = await fetchJson<AnalysisRun>(`/api/v1/runs/${runId}`);
    return normalizeRun(run);
  },

  async getWorkspaceRuns(workspaceId: string, limit: number = 20): Promise<AnalysisRun[]> {
    const runs = await fetchJson<AnalysisRun[]>(`/api/v1/runs?workspace_id=${workspaceId}&limit=${limit}`);
    return runs.map(normalizeRun);
  },

  async getProjectRuns(projectId: string): Promise<AnalysisRun[]> {
    const runs = await fetchJson<AnalysisRun[]>(`/api/v1/projects/${projectId}/runs`);
    return runs.map(normalizeRun);
  },

  async getRunSteps(runId: string): Promise<RunStep[]> {
    const steps = await fetchJson<RunStep[]>(`/api/v1/runs/${runId}/steps`);
    return steps.map(normalizeStep);
  },

  async getRunEvidence(runId: string): Promise<EvidenceRecord[]> {
    const evList = await fetchJson<EvidenceRecord[]>(`/api/v1/runs/${runId}/evidence`);
    return evList.map(normalizeEvidence);
  },

  async getRunDecisions(runId: string): Promise<DecisionRecord[]> {
    const decList = await fetchJson<DecisionRecord[]>(`/api/v1/runs/${runId}/decisions`);
    return decList.map(normalizeDecision);
  },

  // Simulations
  async createSimulation(
    runId: string,
    changes: Record<string, unknown>
  ): Promise<AnalysisRun> {
    const sim = await fetchJson<AnalysisRun>(`/api/v1/runs/${runId}/simulations`, {
      method: "POST",
      body: JSON.stringify({ changes }),
    });
    return normalizeRun(sim);
  },

  // Memories
  async getMemories(workspaceId: string, projectId?: string): Promise<MemoryRecord[]> {
    const url = projectId
      ? `/api/v1/workspaces/${workspaceId}/memories?project_id=${projectId}`
      : `/api/v1/workspaces/${workspaceId}/memories`;
    const memList = await fetchJson<MemoryRecord[]>(url);
    return memList.map(normalizeMemory);
  },

  async createMemory(
    workspaceId: string,
    payload: {
      content: string;
      memory_type?: string;
      project_id?: string;
      structured_json?: Record<string, unknown>;
    }
  ): Promise<MemoryRecord> {
    const mem = await fetchJson<MemoryRecord>(`/api/v1/workspaces/${workspaceId}/memories`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeMemory(mem);
  },

  async searchMemories(
    workspaceId: string,
    query: string,
    limit: number = 3
  ): Promise<Array<{ memory: MemoryRecord; similarity: number }>> {
    const results = await fetchJson<Array<{ memory: MemoryRecord; similarity: number }>>(
      `/api/v1/workspaces/${workspaceId}/memories/search`,
      {
        method: "POST",
        body: JSON.stringify({ query, limit }),
      }
    );
    return results.map((r) => ({
      ...r,
      memory: normalizeMemory(r.memory),
    }));
  },

  async deactivateMemory(memoryId: string): Promise<void> {
    return fetchJson<void>(`/api/v1/memories/${memoryId}`, {
      method: "DELETE",
    });
  },

  // Reports
  async generateReport(
    runId: string,
    format: "markdown" | "html" = "markdown",
    title?: string
  ): Promise<ReportRecord> {
    return fetchJson<ReportRecord>(`/api/v1/runs/${runId}/reports`, {
      method: "POST",
      body: JSON.stringify({ format, title }),
    });
  },

  async getRunReports(runId: string): Promise<ReportRecord[]> {
    return fetchJson<ReportRecord[]>(`/api/v1/runs/${runId}/reports`);
  },

  async getReport(reportId: string): Promise<ReportRecord> {
    return fetchJson<ReportRecord>(`/api/v1/reports/${reportId}`);
  },

  // Analyst Chat
  async chatWithAnalyst(
    projectId: string,
    message: string,
    runId?: string
  ): Promise<ChatResponse> {
    return fetchJson<ChatResponse>(`/api/v1/projects/${projectId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, run_id: runId }),
    });
  },

  async getConversationHistory(projectId: string): Promise<{
    conversation_id: string | null;
    messages: Array<{
      id: string;
      role: "user" | "assistant" | "system";
      content: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>;
  }> {
    return fetchJson(`/api/v1/projects/${projectId}/conversation`);
  },

  chatWithAnalystStream(
    projectId: string,
    message: string,
    runId?: string
  ): AsyncGenerator<Record<string, unknown>> {
    async function* gen() {
      const response = await fetch(`/api/v1/projects/${projectId}/chat/stream`, {
        method: "POST",
        headers: {
          Authorization: DEV_AUTH_HEADER,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, run_id: runId }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const data = trimmed.slice(6);
              if (data && data !== "[DONE]") {
                try {
                  yield JSON.parse(data) as Record<string, unknown>;
                } catch {
                  // skip malformed
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
    return gen();
  },
};
