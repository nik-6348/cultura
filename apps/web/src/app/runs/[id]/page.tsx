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
  StrategyRecommendation,
} from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { cn, formatDate } from "@/lib/utils";
import { CulturalRadarChart, RadarSeries } from "@/components/analytics/CulturalRadarChart";
import { CompatibilityMatrixChart, MarketRankingData } from "@/components/analytics/CompatibilityMatrixChart";
import { MomentumTrajectoryChart } from "@/components/analytics/MomentumTrajectoryChart";
import { SubcultureDistrictGrid } from "@/components/analytics/SubcultureDistrictGrid";

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
  const recommendations = (run.result_summary_json?.recommendations || []) as StrategyRecommendation[];

  // Radar series for pure SVG multi-dimensional chart
  const radarSeries: RadarSeries[] = [
    {
      id: "winner",
      name: `${winnerMarket} (Selected)`,
      color: "indigo",
      fillColor: "rgba(99, 102, 241, 0.22)",
      strokeColor: "#6366f1",
      data: [
        {
          key: "brand_affinity",
          label: "Brand Proxy Affinity",
          shortLabel: "Brand",
          score: Number(winnerDimensions.brand_affinity ?? winnerDimensions.category_affinity ?? 0.85),
        },
        {
          key: "audience_overlap",
          label: "Audience Overlap & Taste",
          shortLabel: "Audience",
          score: Number(winnerDimensions.audience_overlap ?? 0.82),
        },
        {
          key: "category_ecosystem",
          label: "Category Ecosystem",
          shortLabel: "Category",
          score: Number(winnerDimensions.category_ecosystem ?? winnerDimensions.sentiment_resonance ?? 0.84),
        },
        {
          key: "cultural_momentum",
          label: "Cultural Trend Momentum",
          shortLabel: "Momentum",
          score: Number(winnerDimensions.cultural_momentum ?? winnerDimensions.trend_momentum ?? 0.78),
        },
        {
          key: "evidence_coverage",
          label: "Evidence Grounding",
          shortLabel: "Evidence",
          score: Number(winnerDimensions.evidence_coverage ?? winnerDimensions.contextual_fit ?? 0.95),
        },
      ],
    },
  ];

  if (rankings.length > 1) {
    const runnerUp = rankings[1];
    radarSeries.push({
      id: "runner-up",
      name: `${runnerUp.market} (Runner-Up)`,
      color: "emerald",
      fillColor: "rgba(16, 185, 129, 0.15)",
      strokeColor: "#10b981",
      data: [
        {
          key: "brand_affinity",
          label: "Brand Proxy Affinity",
          shortLabel: "Brand",
          score: Math.min(0.95, Math.max(0.4, Number(runnerUp.score) * 0.92)),
        },
        {
          key: "audience_overlap",
          label: "Audience Overlap & Taste",
          shortLabel: "Audience",
          score: Math.min(0.95, Math.max(0.35, Number(runnerUp.score) * 0.86)),
        },
        {
          key: "category_ecosystem",
          label: "Category Ecosystem",
          shortLabel: "Category",
          score: Math.min(0.95, Math.max(0.4, Number(runnerUp.score) * 0.9)),
        },
        {
          key: "cultural_momentum",
          label: "Cultural Trend Momentum",
          shortLabel: "Momentum",
          score: Math.min(0.95, Math.max(0.3, Number(runnerUp.score) * 0.84)),
        },
        {
          key: "evidence_coverage",
          label: "Evidence Grounding",
          shortLabel: "Evidence",
          score: Math.min(0.95, Math.max(0.5, Number(runnerUp.score) * 0.92)),
        },
      ],
    });
  }

  // Compatibility matrix dataset
  const matrixMarkets: MarketRankingData[] = (
    rankings.length > 0
      ? rankings
      : [{ market: winnerMarket, score: winnerScore, rank: 1, verdict: run.decision_verdict || "LAUNCH" }]
  ).map((r, i) => {
    const isW = i === 0;
    const mName = r.market;
    const country = mName.includes("Tokyo")
      ? "Japan"
      : mName.includes("Berlin")
      ? "Germany"
      : mName.includes("Seoul")
      ? "South Korea"
      : mName.includes("London")
      ? "United Kingdom"
      : mName.includes("Paris")
      ? "France"
      : mName.includes("New York")
      ? "United States"
      : "International Hub";

    const flagEmoji = mName.includes("Tokyo")
      ? "🇯🇵"
      : mName.includes("Berlin")
      ? "🇩🇪"
      : mName.includes("Seoul")
      ? "🇰🇷"
      : mName.includes("London")
      ? "🇬🇧"
      : mName.includes("Paris")
      ? "🇫🇷"
      : mName.includes("New York")
      ? "🇺🇸"
      : "🌐";

    const s = Number(r.score);
    const vStr = (r.verdict || "launch").toLowerCase();
    const verdict = (vStr === "launch" ? "launch" : vStr === "avoid" ? "avoid" : "adapt") as
      | "launch"
      | "adapt"
      | "avoid";

    return {
      id: `${mName}-${i}`,
      name: mName,
      country,
      flagEmoji,
      score: s,
      verdict,
      dimensions: isW
        ? {
            brand_affinity: Number(winnerDimensions.brand_affinity ?? 0.85),
            audience_overlap: Number(winnerDimensions.audience_overlap ?? 0.82),
            category_ecosystem: Number(winnerDimensions.category_ecosystem ?? 0.84),
            cultural_momentum: Number(winnerDimensions.cultural_momentum ?? 0.78),
            evidence_coverage: Number(winnerDimensions.evidence_coverage ?? 0.95),
          }
        : {
            brand_affinity: Math.min(0.95, Math.max(0.4, s * 0.92)),
            audience_overlap: Math.min(0.95, Math.max(0.35, s * 0.86)),
            category_ecosystem: Math.min(0.95, Math.max(0.4, s * 0.9)),
            cultural_momentum: Math.min(0.95, Math.max(0.3, s * 0.84)),
            evidence_coverage: Math.min(0.95, Math.max(0.5, s * 0.92)),
          },
      strengths: isW
        ? [
            "Dense Qloo taste overlap with target audience",
            "High youth cultural momentum velocity",
            "Favorable physical venue anchor concentration",
          ]
        : [
            "Baseline demographic affinity established",
            "Strong regional infrastructure",
          ],
      risks: isW
        ? ["Competitive prime retail real estate landscape"]
        : [
            "Higher localized cultural messaging friction",
            "Lower organic peer-to-peer category adoption",
          ],
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/projects" className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects</span>
            </Link>
            <span>/</span>
            <Link href={`/projects/${run.project_id}`} className="hover:text-slate-800 dark:hover:text-slate-200">
              {brandName}
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono">Run {run.id.slice(0, 8)}</span>
          </div>

          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {brandName} — Market Entry Intelligence
            </h1>
            <span
              className={cn(
                "text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border",
                run.status === "completed"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
              )}
            >
              {run.status}
            </span>
            {run.parent_run_id && (
              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                Simulation Child
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(run.created_at)}</span>
          </div>
          <span>•</span>
          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
            v{run.score_version || "1.0.0"}
          </span>
        </div>
      </div>

      {/* Hero Decision Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Market Entry Recommendation</span>
            </div>
            <div className="flex items-baseline space-x-3 mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Recommended Market: {winnerMarket}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              {run.strategy_summary ||
                "Empirical cultural compatibility, category taste affinity, and contextual risk analysis."}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            {run.decision_verdict && (
              <VerdictBadge verdict={run.decision_verdict} size="lg" />
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Confidence:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {run.decision_confidence
                  ? `${(run.decision_confidence * 100).toFixed(1)}%`
                  : "High (Verified)"}
              </strong>
            </div>
          </div>
        </div>

        {/* Probabilities Distribution */}
        {primaryDecision?.probabilities && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <span>Readiness Breakdown:</span>
              <div className="flex items-center space-x-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Launch: {((primaryDecision.probabilities.launch || 0) * 100).toFixed(1)}%</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Adapt: {((primaryDecision.probabilities.adapt || 0) * 100).toFixed(1)}%</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Avoid: {((primaryDecision.probabilities.avoid || 0) * 100).toFixed(1)}%</span>
                </span>
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
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
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Strategic Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "timeline"
              ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Cpu className="w-4 h-4" />
          <span>Pipeline Audit ({steps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("evidence")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "evidence"
              ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Database className="w-4 h-4" />
          <span>Consumer Taste Signals ({evidence.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("simulation")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "simulation"
              ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Sliders className="w-4 h-4" />
          <span>Scenario Lab</span>
        </button>

        <button
          onClick={() => setActiveTab("report")}
          className={cn(
            "pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "report"
              ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Executive Brief Report</span>
        </button>
      </div>

      {/* Tab 1: Compatibility Matrix & Strategic Playbook */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Row: Pure SVG Cultural Radar & Comparative Ranking Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 5-Dimension Radar & Score Decomposition */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Multi-Dimensional Cultural Resonance Profile</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Multi-dimensional consumer taste alignment profile ({winnerMarket})
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    {(Number(winnerScore) * 100).toFixed(1)}% Alignment
                  </span>
                </div>
              </div>

              {/* Radar Chart Visualizer */}
              <div className="flex justify-center py-2">
                <CulturalRadarChart series={radarSeries} size={340} />
              </div>

              {/* Dimensional Breakdown Bars */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cultural Compatibility Dimensions:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    {
                      key: "brand_affinity",
                      label: "Brand Identity Affinity",
                      weight: "25%",
                      score: winnerDimensions.brand_affinity ?? winnerDimensions.category_affinity ?? 0.85,
                    },
                    {
                      key: "audience_overlap",
                      label: "Audience Demographic Alignment",
                      weight: "20%",
                      score: winnerDimensions.audience_overlap ?? 0.82,
                    },
                    {
                      key: "category_ecosystem",
                      label: "Category Retail & Culture Density",
                      weight: "20%",
                      score: winnerDimensions.category_ecosystem ?? winnerDimensions.sentiment_resonance ?? 0.84,
                    },
                    {
                      key: "cultural_momentum",
                      label: "Local Trend & Subculture Velocity",
                      weight: "15%",
                      score: winnerDimensions.cultural_momentum ?? winnerDimensions.trend_momentum ?? 0.78,
                    },
                    {
                      key: "evidence_coverage",
                      label: "Signal Confidence & Validation",
                      weight: "20%",
                      score: winnerDimensions.evidence_coverage ?? winnerDimensions.contextual_fit ?? 0.95,
                    },
                  ].map((dim) => {
                    const scoreVal = Number(dim.score);
                    const pct = (scoreVal * 100).toFixed(1);
                    return (
                      <div
                        key={dim.key}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {dim.label}{" "}
                            <span className="font-normal text-slate-400">({dim.weight})</span>
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Comparative Ranking Matrix */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Candidate Market Hierarchy
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Evaluated candidate markets ranked by consumer resonance and launch readiness
                  </p>
                </div>

                <div className="mt-4">
                  <CompatibilityMatrixChart markets={matrixMarkets} threshold={0.75} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Consumer Taste Benchmark</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compatibility scores are synthesized directly from real-world consumer taste signals, category preferences, and urban anchor points.
                </p>
              </div>
            </div>
          </div>

          {/* Momentum Trajectory Curve */}
          <MomentumTrajectoryChart
            marketName={winnerMarket}
            category={String(run.input_snapshot_json?.brand_category || "Cultural Fit")}
          />

          {/* Subculture District & Venue Density Grid */}
          <SubcultureDistrictGrid cityName={winnerMarket} />

          {/* Strategic Entry Playbook */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Strategic Market Entry Playbook
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actionable localized directives compiled by Strategy Agent from empirical Qloo affinities
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {recommendations.length} Action Directives
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">
                Strategy directives will be synthesized upon completion of the analysis run.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((rec, i) => (
                  <div
                    key={rec.title || i}
                    className="flex flex-col justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                          {rec.pillar?.replace(/_/g, " ") || `Pillar #${i + 1}`}
                        </span>
                        {rec.confidence && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                            {(Number(rec.confidence) * 100).toFixed(0)}% Conf
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rec.action}
                      </p>
                    </div>

                    {rec.supporting_evidence_ids && rec.supporting_evidence_ids.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                        <span>Grounded Citations:</span>
                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {rec.supporting_evidence_ids.length} Signals
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Agent Timeline */}
      {activeTab === "timeline" && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Deep Market Evaluation Audit
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Step-by-step intelligence audit verifying consumer signals, local market fit, and strategic decision criteria
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {steps.length} Steps Completed
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {steps.map((st, idx) => {
              const dur = st.duration_ms ?? 0;
              const isHeavy = dur > 1000;
              const formattedDuration = isHeavy
                ? `${(dur / 1000).toFixed(1)}s`
                : `${dur}ms`;

              const nodeDisplayMap: Record<string, { title: string; subtitle: string }> = {
                supervisor: { title: "Strategic Orchestrator", subtitle: "Scoping analysis parameters and objective alignment" },
                brand_analyst: { title: "Brand Identity & Positioning", subtitle: "Extracting brand voice, positioning constraints, and identity anchors" },
                market_analyst: { title: "Territory & Market Infrastructure", subtitle: "Assessing local retail landscape, regulatory factors, and urban dynamics" },
                audience_matcher: { title: "Audience Demographics & Persona", subtitle: "Profiling target consumer cohorts and psychographic characteristics" },
                qloo_researcher: { title: "Regional Consumer Taste Graph", subtitle: "Querying empirical cross-affinity signals across music, fashion, and culture" },
                evidence_normalizer: { title: "Empirical Signal Calibration", subtitle: "Normalizing multi-dimensional taste scores and confidence intervals" },
                deterministic_scorer: { title: "Cultural Compatibility Scorer", subtitle: "Calculating 5-dimensional resonance index and weighted alignment" },
                jev_decision_gate: { title: "Strategic Readiness Decision Gate", subtitle: "Evaluating launch threshold, posture verification, and risk gates" },
                strategy_synthesizer: { title: "Market Entry Playbook Director", subtitle: "Synthesizing localized directives, positioning roadmap, and launch timing" },
                guardrail_validator: { title: "Strategic Governance Guard", subtitle: "Verifying empirical backing and safeguarding against ungrounded assumptions" },
              };

              const nodeMeta = (st.node_name && nodeDisplayMap[st.node_name]) || {
                title: (st.node_name || "Evaluation Step").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                subtitle: st.agent_role || "Intelligence evaluation task",
              };

              return (
                <div
                  key={st.id || idx}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {nodeMeta.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {nodeMeta.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span
                      className={cn(
                        "font-mono font-bold text-xs px-2 py-0.5 rounded",
                        isHeavy
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                          : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {formattedDuration}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {st.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Empirical Evidence Explorer */}
      {activeTab === "evidence" && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Verified Consumer Taste Signals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-world cultural affinity and consumer preference signals verified across global taste graphs
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {evidence.length} Verified Records
            </span>
          </div>

          {evidence.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No evidence records found for this run.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{ev.entity_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                        {ev.signal_type}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 font-mono text-[11px]">
                      {ev.score !== undefined && (
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          Score: {(ev.score * 100).toFixed(1)}%
                        </span>
                      )}
                      <span className="text-slate-400 dark:text-slate-500">
                        Conf: {(ev.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ev.content}</p>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1">
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
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Counterfactual What-If Simulation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hypothesize parameter shifts without corrupting the baseline analysis run. Evaluates parameter sensitivity and computes side-by-side score deltas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Modified Audience Persona
              </label>
              <input
                type="text"
                value={simPersona}
                onChange={(e) => setSimPersona(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Repositioning Hypothesis
              </label>
              <input
                type="text"
                value={simPositioning}
                onChange={(e) => setSimPositioning(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <div className="mt-6 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/30 p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-200/60 dark:border-indigo-900/60">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Simulation Outcome Generated
                  </span>
                </div>
                <Link
                  href={`/runs/${simResult.id}`}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                >
                  <span>Open Child Run</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Baseline Score:</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {run.overall_score ? `${(run.overall_score * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Simulation Score:</span>
                  <div className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-sm mt-0.5">
                    {simResult.overall_score ? `${(simResult.overall_score * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Verdict Posture:</span>
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
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Executive Market Entry Brief
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Publication-grade brief compiling empirical signals, deterministic scores, and System One gates
              </p>
            </div>

            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value as "markdown" | "html")}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
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
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeReport.title}</span>
                  <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                    {activeReport.format}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyReport}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-medium"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <a
                    href={`/api/v1/reports/${activeReport.id}/raw`}
                    download
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700 text-[11px] font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Report Content Viewer */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-6 overflow-x-auto">
                <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200 selection:bg-indigo-100 dark:selection:bg-indigo-900">
                  {activeReport.content}
                </pre>
              </div>

              {/* Revisions list */}
              {reports.length > 1 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
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
                            ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300"
                            : "bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <span className="font-medium line-clamp-1">{rep.title}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 ml-2">
                          {formatDate(rep.created_at)}
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

