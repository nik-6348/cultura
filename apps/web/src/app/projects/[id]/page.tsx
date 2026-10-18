"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, PlayCircle, Globe2, Clock, MessageSquare,
  FileText, Database, Layers, ChevronRight,
  TrendingUp, Sparkles, Activity, Target,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalysisRun, Project, ReportRecord, MemoryRecord } from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { formatDate, timeAgo, cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function marketInitials(name: string): string {
  const city = (name ?? "").split(",")[0].trim();
  return city.slice(0, 2).toUpperCase();
}
function scoreColor(v: number) {
  if (v >= 0.80) return { fg: "#A5B4FC", bg: "rgba(99,102,241,0.15)", bar: "#6366F1" };
  if (v >= 0.60) return { fg: "#FCD34D", bg: "rgba(245,158,11,0.12)", bar: "#F59E0B" };
  return { fg: "#FCA5A5", bg: "rgba(239,68,68,0.12)", bar: "#EF4444" };
}
function verdictColor(v: string) {
  const lv = v?.toLowerCase();
  if (lv === "launch") return "#10B981";
  if (lv === "adapt")  return "#F59E0B";
  return "#EF4444";
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ProjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "runs" | "chat" | "reports" | "memory">("overview");
  const [loading, setLoading] = useState(true);
  const [runningNew, setRunningNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatStartFresh, setChatStartFresh] = useState(false);
  const [chatPanelKey, setChatPanelKey] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        setLoading(true);
        const [proj, runList] = await Promise.all([api.getProject(projectId), api.getProjectRuns(projectId)]);
        setProject(proj);
        setRuns(runList);
        if (runList.length > 0) {
          try { setReports(await api.getRunReports(runList[0].id)); } catch { /* non-critical */ }
        }
        try { setMemories(await api.getMemories(proj.workspace_id, projectId)); } catch { /* non-critical */ }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const handleTriggerRun = async () => {
    if (!project) return;
    try {
      setRunningNew(true);
      const newRun = await api.createRun(project.id);
      router.push(`/runs/${newRun.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start run");
      setRunningNew(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32 gap-3 text-sm text-slate-500">
      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      Loading project workspace…
    </div>
  );

  if (error || !project) return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-3">
      <div className="text-rose-400 text-sm">{error || "Project not found"}</div>
      <Link href="/projects" className="text-xs text-indigo-400">← All Projects</Link>
    </div>
  );

  const latestRun = runs[0] ?? null;
  const brand = asRecord(project.brand_profile_json);
  const audience = asRecord(project.audience_profile_json);
  const brandTags = asStringArray(brand.tags);
  const interests = asStringArray(audience.interests);
  const ageRange = Array.isArray(audience.age_range) ? audience.age_range : null;
  const latestRankings = latestRun?.scores_json?.rankings ?? [];
  const scoredRunsAsc = [...runs]
    .filter(r => r.overall_score != null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const winnerMarket = latestRun?.result_summary_json?.winner_market as string | undefined;

  const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "runs",     label: `Runs (${runs.length})`, icon: PlayCircle },
    { id: "chat",     label: "Analyst Chat", icon: MessageSquare },
    { id: "reports",  label: `Reports (${reports.length})`, icon: FileText },
    { id: "memory",   label: `Memory (${memories.length})`, icon: Database },
  ] as const;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All Projects
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/50 text-indigo-300 font-semibold border border-indigo-900">
              {project.candidate_markets?.length ?? 0} Markets
            </span>
            {latestRun?.status && <StatusBadge status={latestRun.status} />}
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {project.objective ?? "No objective specified."}
          </p>
        </div>
        <button onClick={handleTriggerRun} disabled={runningNew}
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition-all active:scale-[0.98] disabled:opacity-50">
          <PlayCircle className="w-4 h-4" />
          {runningNew ? "Evaluating Markets…" : "Run Analysis"}
        </button>
      </div>

      {/* ── Quick stats bar ───────────────────────────────────────────── */}
      {latestRun && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: Target,
              label: "Cultural Fit Score",
              value: latestRun.overall_score != null ? `${Math.round(latestRun.overall_score * 100)}%` : "—",
              color: latestRun.overall_score != null ? scoreColor(latestRun.overall_score).fg : "#94A3B8",
            },
            {
              icon: Globe2,
              label: "Top Market",
              value: winnerMarket ? winnerMarket.split(",")[0] : "—",
              color: "#A5B4FC",
            },
            {
              icon: Activity,
              label: "Markets Evaluated",
              value: String(latestRankings.length || project.candidate_markets?.length || 0),
              color: "#67E8F9",
            },
            {
              icon: TrendingUp,
              label: "Total Runs",
              value: String(runs.length),
              color: "#6EE7B7",
            },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-[#1A2338] bg-[#0E1424] px-4 py-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <Icon className="w-3 h-3" />{s.label}
                </div>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 border-b border-[#1A2338] overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 pb-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2",
                active ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
              )}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">

          {/* Left: markets + brand profile */}
          <div className="lg:col-span-8 space-y-5">

            {/* Market results from latest run */}
            {latestRankings.length > 0 ? (
              <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2338]">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-indigo-400" /> Market Intelligence Results
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Latest run · {formatDate(latestRun!.created_at)}
                    </p>
                  </div>
                  <Link href={`/runs/${latestRun!.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    Full report <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-[#111827]">
                  {latestRankings.map((item, idx) => {
                    const pct = Math.round(item.score * 100);
                    const { fg, bar } = scoreColor(item.score);
                    const isWinner = item.market === winnerMarket;
                    return (
                      <div key={item.market}
                        className={cn("flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#111827]", isWinner && "bg-indigo-950/20")}>
                        {/* Rank */}
                        <span className="text-[11px] font-mono text-slate-600 w-4 flex-shrink-0">{idx + 1}</span>
                        {/* Market name */}
                        <div className="flex items-center gap-2 w-36 flex-shrink-0">
                          <div>
                            <div className={cn("text-xs font-semibold truncate", isWinner ? "text-white" : "text-slate-200")}>
                              {item.market.split(",")[0]}
                            </div>
                            {isWinner && (
                              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                                ✦ Top Pick
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Bar */}
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <div className="flex-1 h-2 rounded-full bg-[#1A2338] overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: bar }} />
                          </div>
                          <span className="font-mono text-xs font-bold w-8 text-right flex-shrink-0" style={{ color: fg }}>
                            {pct}
                          </span>
                        </div>
                        {/* Verdict */}
                        <VerdictBadge verdict={item.verdict} size="sm" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Candidate markets (no run yet) */
              <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-indigo-400" /> Candidate Markets
                </h3>
                {project.candidate_markets && project.candidate_markets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {project.candidate_markets.map(m => (
                      <div key={m.id ?? m.name}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-[#1A2338] bg-[#111827]">
                        <div className="w-7 h-7 rounded-lg bg-[#1A2338] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-slate-400">{marketInitials(m.name)}</span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{m.name}</div>
                          <div className="text-[10px] text-slate-500">{m.country ?? "Target Market"}</div>
                        </div>
                        <div className="ml-auto w-2 h-2 rounded-full bg-slate-700" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No candidate markets configured.</p>
                )}
                <p className="text-[11px] text-slate-600">Run Analysis to score these markets.</p>
              </div>
            )}

            {/* Recent Runs — full width in left column */}
            {runs.length > 0 && (
              <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1A2338]">
                  <h3 className="text-xs font-bold text-white">Recent Runs</h3>
                  <button onClick={() => setActiveTab("runs")}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300">View all →</button>
                </div>
                <div className="divide-y divide-[#111827]">
                  {runs.slice(0, 5).map(r => {
                    const winner = r.result_summary_json?.winner_market as string | undefined;
                    return (
                      <Link key={r.id} href={`/runs/${r.id}`}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-[#111827] transition-colors">
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#1A2338] flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-slate-500 font-mono">{r.id.slice(0, 4)}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-200 truncate block">
                              {winner ?? (r.parent_run_id ? "Simulation" : "Baseline Analysis")}
                            </span>
                            <span className="text-[10px] text-slate-600">{timeAgo(r.created_at)}</span>
                          </div>
                        </div>
                        {r.overall_score != null && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-20 h-1.5 rounded-full bg-[#1A2338] overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${Math.round(r.overall_score * 100)}%`, background: scoreColor(r.overall_score).bar }} />
                            </div>
                            <span className="font-mono text-xs font-bold w-8 text-right" style={{ color: scoreColor(r.overall_score).fg }}>
                              {Math.round(r.overall_score * 100)}%
                            </span>
                          </div>
                        )}
                        {r.decision_verdict && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ color: verdictColor(r.decision_verdict), background: `${verdictColor(r.decision_verdict)}15` }}>
                            {r.decision_verdict}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Brand + Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Brand */}
              <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1A2338] pb-2.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Brand Profile</h3>
                  {asString(brand.positioning) && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-900">
                      {asString(brand.positioning)}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div><span className="text-slate-500">Name: </span><strong className="text-slate-200">{asString(brand.name) ?? project.name}</strong></div>
                  <div><span className="text-slate-500">Category: </span><span className="text-slate-300">{asString(brand.category) ?? "Not specified"}</span></div>
                  {asString(brand.description) && (
                    <p className="text-slate-400 leading-relaxed text-[11px] pt-1">{asString(brand.description)}</p>
                  )}
                  {brandTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {brandTags.map((tag, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#141B2D] text-slate-300">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Audience */}
              <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1A2338] pb-2.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Audience Persona</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900">Target Cohort</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div><span className="text-slate-500">Segment: </span><strong className="text-slate-200">{asString(audience.name) ?? asString(audience.persona) ?? "Not specified"}</strong></div>
                  <div className="flex gap-4 text-slate-400">
                    <span>Age: <strong className="text-slate-300">{ageRange ? `${ageRange[0]}–${ageRange[1]}` : "—"}</strong></span>
                    <span>Income: <strong className="text-slate-300">{asString(audience.income_level) ?? "—"}</strong></span>
                  </div>
                  {interests.length > 0 && (
                    <div className="pt-2 space-y-1">
                      <div className="text-[10px] text-slate-500">Taste Affinities:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((int, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-900">{int}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: snapshot + trend */}
          <div className="lg:col-span-4 space-y-4">

            {/* Latest run snapshot */}
            {latestRun ? (
              <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Latest Decision
                  </span>
                  <span className="text-[10px] font-mono text-slate-600">#{latestRun.id.slice(0, 6)}</span>
                </div>

                {latestRun.decision_verdict ? (
                  <VerdictBadge verdict={latestRun.decision_verdict} />
                ) : (
                  <StatusBadge status={latestRun.status} />
                )}

                <div className="text-3xl font-black text-white">
                  {latestRun.overall_score != null ? (
                    <>
                      {Math.round(latestRun.overall_score * 100)}%
                      <span className="text-xs font-normal text-slate-500 ml-1.5">fit score</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-slate-500">Not yet scored</span>
                  )}
                </div>

                {winnerMarket && (
                  <div className="flex items-center gap-2 rounded-lg bg-indigo-950/40 border border-indigo-900/40 px-3 py-2">
                    <div>
                      <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Recommended Entry</div>
                      <div className="text-xs font-bold text-white">{winnerMarket}</div>
                    </div>
                  </div>
                )}

                {latestRun.strategy_summary && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">{latestRun.strategy_summary}</p>
                )}

                <Link href={`/runs/${latestRun.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
                  Inspect Intelligence Trace <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-6 text-center space-y-3">
                <Clock className="w-8 h-8 text-indigo-400 mx-auto" />
                <div className="text-sm font-bold text-slate-200">No runs yet</div>
                <p className="text-xs text-slate-500">Run Analysis to evaluate market compatibility.</p>
              </div>
            )}

            {/* Cultural Fit Trend */}
            {scoredRunsAsc.length >= 2 && (
              <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-4 space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cultural Fit Trend</h3>
                <CulturalFitTrend runs={scoredRunsAsc} />
              </div>
            )}

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: RUNS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "runs" && (
        <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] overflow-hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2338]">
            <h3 className="text-sm font-bold text-white">Historical Runs ({runs.length})</h3>
          </div>
          {runs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-600">No runs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1A2338] bg-[#111827]">
                    {["Run ID", "Type", "Winner Market", "Score", "Verdict", "Status", "Created", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111827]">
                  {runs.map(r => {
                    const winner = r.result_summary_json?.winner_market as string | undefined;
                    return (
                      <tr key={r.id} className="hover:bg-[#111827] transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400">{r.id.slice(0, 8)}…</td>
                        <td className="px-4 py-3 text-slate-300">{r.parent_run_id ? "Simulation" : "Baseline"}</td>
                        <td className="px-4 py-3">
                          {winner ? (
                            <span className="font-medium text-slate-200">{winner.split(",")[0]}</span>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.overall_score != null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-[#1A2338] overflow-hidden">
                                <div className="h-full rounded-full"
                                  style={{ width: `${Math.round(r.overall_score * 100)}%`, background: scoreColor(r.overall_score).bar }} />
                              </div>
                              <span className="font-mono font-bold" style={{ color: scoreColor(r.overall_score).fg }}>
                                {Math.round(r.overall_score * 100)}%
                              </span>
                            </div>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.decision_verdict ? <VerdictBadge verdict={r.decision_verdict} size="sm" /> : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-slate-500">{timeAgo(r.created_at)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/runs/${r.id}`} className="text-indigo-400 hover:text-indigo-300 font-semibold">
                            Inspect →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: CHAT
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "chat" && (
        <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] overflow-hidden flex flex-col animate-in fade-in duration-200"
          style={{ height: "560px" }}>
          <ChatPanel
            key={chatPanelKey}
            projectId={project.id}
            startFresh={chatStartFresh}
            scrollAreaClass="flex-1 min-h-0"
            showHeader
            headerLabel={project.name}
            onReset={() => { setChatStartFresh(true); setChatPanelKey(k => k + 1); }}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: REPORTS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="animate-in fade-in duration-200">
          {reports.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-[#1A2338] bg-[#0E1424] text-xs text-slate-600">
              No reports compiled yet. Open a run and click Generate Report.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map(rep => (
                <Link key={rep.id} href={`/runs/${rep.run_id}?tab=report`}
                  className="block p-4 rounded-xl border border-[#1A2338] bg-[#0E1424] space-y-3 hover:border-indigo-700 transition-all group">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-white leading-tight">{rep.title}</h4>
                    <span className="text-[10px] font-bold uppercase bg-[#1A2338] px-1.5 py-0.5 rounded text-slate-400 flex-shrink-0">{rep.format}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{formatDate(rep.created_at)}</div>
                  <div className="flex items-center gap-1 text-[11px] text-indigo-400 group-hover:text-indigo-300 font-semibold">
                    <FileText className="w-3 h-3" /> Open Report →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 5: MEMORY
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "memory" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {memories.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-[#1A2338] bg-[#0E1424] text-xs text-slate-600">
              No project memory records yet.
            </div>
          ) : (
            memories.map(mem => (
              <div key={mem.id} className="p-4 rounded-xl border border-[#1A2338] bg-[#0E1424] flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">{mem.memory_type}</span>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">{mem.content}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{timeAgo(mem.created_at)}</p>
                </div>
                {mem.confidence != null && (
                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {Math.round(mem.confidence * 100)}% conf
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cultural fit trend SVG ───────────────────────────────────────────────────

function CulturalFitTrend({ runs }: { runs: AnalysisRun[] }) {
  const W = 300, H = 110, pL = 28, pR = 10, pT = 10, pB = 20;
  const cW = W - pL - pR, cH = H - pT - pB;

  const pts = runs.map((r, i) => {
    const score = Math.round((r.overall_score ?? 0) * 100);
    const x = pL + (runs.length > 1 ? (i / (runs.length - 1)) * cW : cW / 2);
    const y = pT + (1 - score / 100) * cH;
    return { x, y, score, date: r.created_at };
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const first = pts[0], last = pts[pts.length - 1];
  const delta = last.score - first.score;
  const shortDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-black text-white">{last.score}%</span>
        {delta !== 0 && (
          <span className={cn("text-xs font-semibold", delta > 0 ? "text-emerald-400" : "text-rose-400")}>
            {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}pts
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {[0, 50, 100].map(v => {
          const y = pT + (1 - v / 100) * cH;
          return (
            <g key={v}>
              <text x={pL - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#4B5A72">{v}</text>
              <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#161D2E" strokeWidth={0.5} />
            </g>
          );
        })}
        <path d={d} fill="none" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#6366F1" stroke="#0B0F19" strokeWidth={1.5} />)}
        <text x={first.x} y={H - 3} textAnchor="start" fontSize={8} fill="#4B5A72">{shortDate(first.date)}</text>
        <text x={last.x} y={H - 3} textAnchor="end" fontSize={8} fill="#4B5A72">{shortDate(last.date)}</text>
      </svg>
    </div>
  );
}
