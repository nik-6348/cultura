export interface Workspace {
  id: string;
  name: string;
  domain?: string | null;
  owner_user_id: string;
  created_at: string;
}

export interface CandidateMarket {
  id?: string;
  name: string;
  country?: string;
  code?: string;
  country_code?: string;
  location_code?: string;
  is_primary?: boolean;
}

export interface MarketLocation {
  id: string;
  name: string;
  country: string;
  country_code: string;
  location_code: string;
  region: string;
  potential: string;
  description: string;
  flag: string;
  color: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  objective?: string | null;
  status?: string;
  brand_profile_json?: Record<string, unknown>;
  product_profile_json?: Record<string, unknown>;
  audience_profile_json?: Record<string, unknown>;
  candidate_markets?: CandidateMarket[];
  markets?: CandidateMarket[];
  created_at: string;
  updated_at: string;
}

export interface RunStep {
  id: string;
  run_id: string;
  step_key: string;
  node_name?: string;
  agent_name: string;
  agent_role?: string;
  status: string;
  sequence: number;
  started_at?: string;
  completed_at?: string;
  latency_ms?: number;
  duration_ms?: number;
  output_ref?: string;
  error_json?: Record<string, unknown> | null;
  metadata_json?: Record<string, unknown> | null;
}

export interface DecisionRecord {
  id: string;
  run_id: string;
  question_key: string;
  decision_value: string;
  probabilities?: Record<string, number>;
  probabilities_json: Record<string, number>;
  confidence: number;
  model_name: string;
  schema_version?: string;
  latency_ms: number;
  created_at: string;
}

export interface EvidenceRecord {
  id: string;
  run_id: string;
  project_id: string;
  source: string;
  source_type?: string;
  provider?: string;
  kind: string;
  signal_type?: string;
  market_name?: string;
  entity_ref?: string;
  entity_name?: string;
  value_numeric?: number;
  score?: number;
  value_text?: string;
  explanation?: string;
  content?: string;
  confidence: number;
  source_metadata_json?: Record<string, unknown>;
  created_at: string;
}

export interface MarketScoreDetail {
  market_name: string;
  overall_score: number;
  confidence: "high" | "moderate" | "low" | string;
  evidence_coverage_ratio?: number;
  dimension_scores?: {
    brand_affinity?: number;
    category_density?: number;
    audience_overlap?: number;
    cultural_momentum?: number;
    data_completeness?: number;
    [key: string]: number | undefined;
  };
  dimensions?: Record<string, number>;
  missing_signals?: string[];
  requires_human_review?: boolean;
}

export interface StrategyRecommendation {
  pillar?: string;
  title?: string;
  action?: string;
  supporting_evidence_ids?: string[];
  confidence?: number;
  [key: string]: unknown;
}

export interface SimulationDelta {
  parent_run_id?: string;
  parent_winner?: string;
  new_winner?: string;
  winner_changed?: boolean;
  score_deltas?: Record<string, number>;
  changes_applied?: Record<string, unknown>;
}

export interface RankedMarketItem {
  rank: number;
  market: string;
  score: number;
  verdict: string;
  confidence?: number;
}

export interface AnalysisRun {
  id: string;
  project_id: string;
  workspace_id: string;
  type: string;
  status: string;
  workflow_version: string;
  score_version: string;
  created_at: string;
  updated_at?: string;
  input_snapshot_json: {
    brand_name?: string;
    objective?: string;
    candidate_markets?: CandidateMarket[];
    brand_profile?: Record<string, unknown>;
    audience_profile?: Record<string, unknown>;
    changes?: Record<string, unknown>;
    simulation_changes?: Record<string, unknown>;
    parent_run_id?: string;
    [key: string]: unknown;
  };
  result_summary_json?: {
    winner_market?: string;
    score_margin?: number;
    market_scores?: Record<string, unknown>;
    comparative_matrix?: {
      winner_market?: string;
      ranked_markets?: RankedMarketItem[];
      [key: string]: unknown;
    };
    decisions?: {
      market_decisions?: Record<string, unknown>;
      winner_posture?: string;
      winner_confidence?: number;
      requires_human_review?: boolean;
      [key: string]: unknown;
    };
    recommendations?: StrategyRecommendation[];
    audit_report?: {
      is_verified?: boolean;
      verdict?: string;
      total_recommendations?: number;
      grounded_recommendations?: number;
      [key: string]: unknown;
    };
    simulation_delta?: SimulationDelta;
    [key: string]: unknown;
  } | null;
  scores_json?: {
    market_scores?: Record<string, unknown>;
    rankings?: RankedMarketItem[];
  };
  parent_run_id?: string | null;
  overall_score?: number | null;
  decision_verdict?: string | null;
  decision_confidence?: number | null;
  strategy_summary?: string | null;
}

export interface MemoryRecord {
  id: string;
  workspace_id: string;
  project_id?: string;
  scope?: string;
  layer?: number | string;
  memory_type: string;
  content: string;
  structured_json?: Record<string, unknown>;
  source_type?: string;
  confidence?: number;
  is_active?: boolean;
  created_at: string;
}

export interface ReportRecord {
  id: string;
  project_id: string;
  run_id: string;
  format: "markdown" | "html" | string;
  title: string;
  content?: string | null;
  storage_uri?: string | null;
  created_at: string;
}

export interface CitationItem {
  id: number;
  label: string;
  entity: string;
  kind: string;
  source: string;
}

export interface DimensionChartPoint {
  dimension: string;
  scores: Record<string, number>;
}

export interface EvidenceCard {
  entity: string;
  kind: string;
  description: string;
  score: number;
}

export interface ChatResponse {
  reply: string;
  citations: CitationItem[];
  chart_data?: DimensionChartPoint[] | null;
  suggested_questions: string[];
  related_evidence: EvidenceCard[];
  run_id?: string | null;
  project_id: string;
  context_meta: Record<string, unknown>;
}
