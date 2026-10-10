"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Sliders,
  ExternalLink,
  Cpu,
  FileText,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  AnalysisRun,
  DecisionRecord,
  EvidenceRecord,
  RankedMarketItem,
  ReportRecord,
  RunStep,
} from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { cn } from "@/lib/utils";

export default function RunIntelligencePage() {
  const params = useParams();
  const runId = params?.id as string;

  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [activeReport, setActiveReport] = useState<ReportRecord | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportFormat, setReportFormat] = useState<"markdown" | "html">("markdown");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "evidence" | "simulation" | "report"
  >("overview");

  // Simulation Form State
  const [simPersona, setSimPersona] = useState("");
  const [simPositioning, setSimPositioning] = useState("");
  const [runningSim, setRunningSim] = useState(false);
  const [simResult, setSimResult] = useState<AnalysisRun | null>(null);

  useEffect(() => {
    async function loadRunData() {
      if (!runId) return;
      try {
        setLoading(true);
        setError(null);
        const [r, sList, eList, dList, repList] = await Promise.all([
          api.getRun(runId),
          api.getRunSteps(runId),
          api.getRunEvidence(runId),
          api.getRunDecisions(runId),
          api.getRunReports(runId),
        ]);
        setRun(r);
        setSteps(sList);
        setEvidence(eList);
        setDecisions(dList);
        setReports(repList);
        if (repList.length > 0) {
          setActiveReport(repList[0]);
        }

        const currentPersona = r.input_snapshot_json?.audience_profile?.persona as string;
        if (currentPersona) {
          setSimPersona(currentPersona + " (Gen Z & Digital Natives)");
        } else {
          setSimPersona("Digital-first Gen Z conscious consumers");
        }
        setSimPositioning("Hyper-local sustainable functional packaging");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load analysis run data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadRunData();
  }, [runId]);

  const handleExecuteSimulation = async () => {
    if (!run) return;
    try {
      setRunningSim(true);
      const sim = await api.createSimulation(run.id, {
        audience_persona: simPersona,
        brand_positioning: simPositioning,
      });
      setSimResult(sim);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Simulation failed";
      alert(msg);
    } finally {
      setRunningSim(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!run) return;
    try {
      setGeneratingReport(true);
      const rep = await api.generateReport(run.id, reportFormat);
      setReports([rep, ...reports]);
      setActiveReport(rep);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compile report";
      alert(msg);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (!activeReport?.content) return;
    navigator.clipboard.writeText(activeReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-slate-400 animate-pulse">
        Fetching multi-agent intelligence data...
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-semibold">Analysis Run Error</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const primaryDecision = decisions[0];
  const candidateMarkets = run.input_snapshot_json?.candidate_markets || [];
  const brandName = run.input_snapshot_json?.brand_name || "Enterprise Brand";
  const scoresData = run.scores_json || {};
  const rankings: RankedMarketItem[] = scoresData.rankings || [];
  const dimensions = (scoresData.market_scores || {}) as Record<
    string,
    { dimensions?: Record<string, number> }
  >;

  // Winner market details
  const winnerMarket = rankings[0]?.market || candidateMarkets[0]?.name || "Primary Market";
  const winnerScore = rankings[0]?.score || run.overall_score || 0;
  const winnerDimensions = dimensions[winnerMarket]?.dimensions || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link href="/projects" className="hover:text-slate-800 flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects</span>
            </Link>
            <span>/</span>
            <Link href={`/projects/${run.project_id}`} className="hover:text-slate-800">
              {brandName}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-mono">Run {run.id.slice(0, 8)}</span>
          </div>

          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {brandName} — Market Entry Intelligence
            </h1>
            <span
              className={cn(
                "text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border",
                run.status === "completed"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              )}
            >
              {run.status}
            </span>
            {run.parent_run_id && (
              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Simulation Child
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(run.created_at).toLocaleDateString()}</span>
          </div>
          <span>•</span>
          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
            v{run.score_version || "1.0.0"}
          </span>
        </div>
      </div>

      {/* Hero Decision Card (TypeSafe Jev System One Posture) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>TypeSafe Jev System One Posture Gate</span>
            </div>
            <div className="flex items-baseline space-x-3 mt-2">
              <span className="text-3xl font-extrabold text-slate-900">
                Recommended Market: {winnerMarket}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 max-w-xl">
              {run.strategy_summary ||
                "Empirical cultural compatibility, category taste affinity, and contextual risk analysis."}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            {run.decision_verdict && (
              <VerdictBadge verdict={run.decision_verdict} size="lg" />
            )}
            <div className="text-xs text-slate-500">
              Confidence:{" "}
              <strong className="text-slate-800">
                {run.decision_confidence
                  ? `${(run.decision_confidence * 100).toFixed(1)}%`
                  : "High (Deterministic)"}
              </strong>
            </div>
          </div>
        </div>

        {/* Probabilities Distribution & Deterministic Score */}
        {primaryDecision?.probabilities && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 font-semibold">
              <span>Decision Probability Distribution:</span>
              <span className="font-mono text-[11px] text-slate-400">
                P(Launch)={((primaryDecision.probabilities.launch || 0) * 100).toFixed(1)}% • P(Adapt)={((primaryDecision.probabilities.adapt || 0) * 100).toFixed(1)}% • P(Avoid)={((primaryDecision.probabilities.avoid || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div
                style={{ width: `${(primaryDecision.probabilities.launch || 0) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`Launch: ${((primaryDecision.probabilities.launch || 0) * 100).toFixed(1)}%`}
              />
              <div
                style={{ width: `${(primaryDecision.probabilities.adapt || 0) * 100}%` }}
                className="bg-amber-400 h-full"
                title={`Adapt: ${((primaryDecision.probabilities.adapt || 0) * 100).toFixed(1)}%`}
              />
              <div
                style={{ width: `${(primaryDecision.probabilities.avoid || 0) * 100}%` }}
                className="bg-rose-500 h-full"
                title={`Avoid: ${((primaryDecision.probabilities.avoid || 0) * 100).toFixed(1)}%`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Compatibility Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "timeline"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Cpu className="w-4 h-4" />
          <span>Agent Timeline ({steps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("evidence")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "evidence"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Database className="w-4 h-4" />
          <span>Qloo Evidence ({evidence.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("simulation")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "simulation"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Sliders className="w-4 h-4" />
          <span>What-If Simulation</span>
        </button>

        <button
          onClick={() => setActiveTab("report")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "report"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Executive Brief Report</span>
        </button>
      </div>

      {/* Tab 1: Compatibility Matrix & Strategic Playbook */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* 5-Dimension Radar/Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dimensions Bar Card */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    5-Dimensional Compatibility Profile — {winnerMarket}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deterministic score calculation based on normalized Qloo taste graphs
                  </p>
                </div>
                <span className="text-sm font-bold text-indigo-700 font-mono">
                  {(Number(winnerScore) * 100).toFixed(1)}% Score
                </span>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "category_affinity",
                    label: "Category Taste Affinity",
                    weight: "25%",
                    score: winnerDimensions.category_affinity ?? 0.85,
                  },
                  {
                    key: "audience_overlap",
                    label: "Audience Overlap & Preferences",
                    weight: "25%",
                    score: winnerDimensions.audience_overlap ?? 0.82,
                  },
                  {
                    key: "sentiment_resonance",
                    label: "Sentiment & Tone Resonance",
                    weight: "20%",
                    score: winnerDimensions.sentiment_resonance ?? 0.79,
                  },
                  {
                    key: "trend_momentum",
                    label: "Cultural Trend Momentum",
                    weight: "15%",
                    score: winnerDimensions.trend_momentum ?? 0.76,
                  },
                  {
                    key: "contextual_fit",
                    label: "Contextual & Regulatory Fit",
                    weight: "15%",
                    score: winnerDimensions.contextual_fit ?? 0.78,
                  },
                ].map((dim) => {
                  const scoreVal = Number(dim.score);
                  const pct = (scoreVal * 100).toFixed(1);
                  return (
                    <div key={dim.key} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {dim.label}{" "}
                          <span className="font-normal text-slate-400">({dim.weight})</span>
                        </span>
                        <span className="font-mono font-bold text-slate-700">{pct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Market Comparative Ranking Matrix */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
                Comparative Ranking Matrix
              </h3>

              {rankings.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  Single market evaluated
                </div>
              ) : (
                <div className="space-y-3">
                  {rankings.map((r, idx) => {
                    const isWinner = idx === 0;
                    return (
                      <div
                        key={r.market}
                        className={cn(
                          "p-3 rounded-lg border flex items-center justify-between text-xs transition-colors",
                          isWinner
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-slate-200 bg-slate-50"
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]",
                              isWinner
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            )}
                          >
                            #{r.rank}
                          </span>
                          <span className="font-semibold text-slate-900">{r.market}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-800">
                            {(Number(r.score) * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-800">
                            {r.verdict}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Strategic Entry Playbook */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100">
              Strategic Market Entry Playbook
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-700">
              <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                  Target Distribution & Channel Posture
                </span>
                <p>
                  Deploy primarily through third-wave specialty cafes and boutique organic grocers. High category affinity indicates strong barista and consumer willingness to trial clean-label oat formulations.
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                  Cultural Nuance & Localization Shield
                </span>
                <p>
                  Avoid generic industrial claims. Local consumer sentiment emphasizes transparency in agricultural provenance and minimal additive processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Agent Timeline */}
      {activeTab === "timeline" && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                LangGraph 10-Node Agent Execution Trace
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Step-by-step audit log of specialized agent nodes and execution latency
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {steps.length} Steps Completed
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {steps.map((st, idx) => (
              <div
                key={st.id || idx}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 font-mono">
                        {st.node_name}
                      </span>
                      {st.agent_role && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {st.agent_role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-slate-500 font-mono text-[11px]">
                  <span>{st.duration_ms ? `${st.duration_ms}ms` : "—"}</span>
                  <span className="text-emerald-700 font-bold uppercase text-[10px]">
                    {st.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Empirical Evidence Explorer */}
      {activeTab === "evidence" && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Normalized Qloo Empirical Evidence
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Citable signals gathered from Qloo Taste Graph API (hackathon.api.qloo.com)
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {evidence.length} Verified Records
            </span>
          </div>

          {evidence.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No evidence records found for this run.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="py-4 hover:bg-slate-50 px-2 rounded-lg transition-colors space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900">{ev.entity_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {ev.signal_type}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 font-mono text-[11px]">
                      {ev.score !== undefined && (
                        <span className="text-slate-800 font-bold">
                          Score: {(ev.score * 100).toFixed(1)}%
                        </span>
                      )}
                      <span className="text-slate-400">
                        Conf: {(ev.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed">{ev.content}</p>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono pt-1">
                    <span>Source: {ev.source_type}</span>
                    <span>•</span>
                    <span>Provider: {ev.provider}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Counterfactual What-If Simulation Panel */}
      {activeTab === "simulation" && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Counterfactual What-If Simulation
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Hypothesize parameter shifts without corrupting the baseline analysis run. Evaluates parameter sensitivity and computes side-by-side score deltas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Modified Audience Persona
              </label>
              <input
                type="text"
                value={simPersona}
                onChange={(e) => setSimPersona(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Repositioning Hypothesis
              </label>
              <input
                type="text"
                value={simPositioning}
                onChange={(e) => setSimPositioning(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleExecuteSimulation}
              disabled={runningSim}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{runningSim ? "Computing Simulation..." : "Execute Simulation Run"}</span>
            </button>
          </div>

          {/* Simulation Output Delta Comparison */}
          {simResult && (
            <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-200/60">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-sm text-slate-900">
                    Simulation Outcome Generated
                  </span>
                </div>
                <Link
                  href={`/runs/${simResult.id}`}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  <span>Open Child Run</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-slate-500 text-[11px]">Baseline Score:</span>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {run.overall_score ? `${(run.overall_score * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-slate-500 text-[11px]">Simulation Score:</span>
                  <div className="font-mono font-bold text-indigo-700 text-sm mt-0.5">
                    {simResult.overall_score ? `${(simResult.overall_score * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-slate-500 text-[11px]">Verdict Posture:</span>
                  <div className="mt-1">
                    <VerdictBadge verdict={simResult.decision_verdict || "ADAPT"} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Executive Brief Report */}
      {activeTab === "report" && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Executive Market Entry Brief
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Publication-grade brief compiling empirical signals, deterministic scores, and System One gates
              </p>
            </div>

            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value as "markdown" | "html")}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="html">HTML (.html)</option>
              </select>

              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{generatingReport ? "Compiling..." : "Generate Brief"}</span>
              </button>
            </div>
          </div>

          {activeReport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800">{activeReport.title}</span>
                  <span className="text-[10px] font-mono uppercase bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                    {activeReport.format}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyReport}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-medium"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <a
                    href={`/api/v1/reports/${activeReport.id}/raw`}
                    download
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-medium"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Report Content Viewer */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 overflow-x-auto">
                <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-slate-800 selection:bg-indigo-100">
                  {activeReport.content}
                </pre>
              </div>

              {/* Revisions list */}
              {reports.length > 1 && (
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Saved Revisions ({reports.length})
                  </span>
                  <div className="space-y-1.5">
                    {reports.map((rep) => (
                      <button
                        key={rep.id}
                        onClick={() => setActiveReport(rep)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-lg text-xs flex justify-between items-center transition-colors",
                          activeReport.id === rep.id
                            ? "bg-indigo-50 border border-indigo-200 text-indigo-900"
                            : "bg-slate-50 border border-slate-200/60 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span className="font-medium line-clamp-1">{rep.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {new Date(rep.created_at).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No executive brief generated yet. Click &quot;Generate Brief&quot; above to compile the full report.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
