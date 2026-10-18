"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PlayCircle,
  Globe2,
  Clock,
  MessageSquare,
  FileText,
  Database,
  Layers,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  AnalysisRun,
  Project,
  ReportRecord,
  MemoryRecord,
} from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { formatDate, timeAgo } from "@/lib/utils";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export default function ProjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "runs" | "chat" | "reports" | "memory"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [runningNew, setRunningNew] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function loadProjectDetails() {
      if (!projectId) return;
      try {
        setLoading(true);
        setError(null);
        const [proj, runList] = await Promise.all([
          api.getProject(projectId),
          api.getProjectRuns(projectId),
        ]);
        setProject(proj);
        setRuns(runList);

        if (runList.length > 0) {
          try {
            const reps = await api.getRunReports(runList[0].id);
            setReports(reps);
          } catch {
            // Non-critical
          }
        }

        try {
          const mems = await api.getMemories(proj.workspace_id, projectId);
          setMemories(mems);
        } catch {
          // Non-critical
        }

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load project";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadProjectDetails();
  }, [projectId]);

  const handleTriggerRun = async () => {
    if (!project) return;
    try {
      setRunningNew(true);
      const newRun = await api.createRun(project.id);
      router.push(`/runs/${newRun.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start analysis run";
      alert(msg);
      setRunningNew(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-sm text-slate-400">
        Loading project workspace...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="text-rose-400 font-semibold text-sm">{error || "Project not found"}</div>
        <Link href="/projects" className="text-xs text-indigo-400 font-semibold underline">
          Return to Projects
        </Link>
      </div>
    );
  }

  const latestRun = runs.length > 0 ? runs[0] : null;
  const brand = asRecord(project.brand_profile_json);
  const audience = asRecord(project.audience_profile_json);
  const brandTags = asStringArray(brand.tags);
  const interests = asStringArray(audience.interests);
  const ageRange = Array.isArray(audience.age_range) ? audience.age_range : null;

  // All candidate markets scored in the latest run (not just the winner) —
  // already computed by normalizeRun, just never surfaced in the UI before.
  const latestRankings = latestRun?.scores_json?.rankings || [];

  // Cultural Fit across every run this project has executed, oldest to newest.
  const scoredRunsAsc = [...runs]
    .filter((r) => r.overall_score != null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1A2338]">
        <div className="space-y-1">
          <Link
            href="/projects"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Projects</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/50 text-indigo-300 font-semibold border border-indigo-900">
              {project.candidate_markets?.length || 0} Markets
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            {project.objective || "No objective specified for this project."}
          </p>
        </div>

        <button
          onClick={handleTriggerRun}
          disabled={runningNew}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{runningNew ? "Evaluating Markets..." : "Run Analysis"}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-[#1A2338] overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "runs", label: `Analysis Runs (${runs.length})`, icon: PlayCircle },
          { id: "chat", label: "Analyst Chat", icon: MessageSquare },
          { id: "reports", label: `Reports (${reports.length})`, icon: FileText },
          { id: "memory", label: `Project Memory (${memories.length})`, icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-3.5 text-xs font-semibold flex items-center space-x-2 whitespace-nowrap transition-all relative ${
                isActive
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Project Profile & Markets */}
          <div className="lg:col-span-8 space-y-6">
            {/* Candidate Markets Grid */}
            <div className="p-5 rounded-xl bg-[#0E1424] border border-[#1A2338] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Globe2 className="w-4 h-4 text-indigo-400" />
                  <span>Candidate Evaluation Markets</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {project.candidate_markets?.length || 0} selected
                </span>
              </div>

              {project.candidate_markets && project.candidate_markets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.candidate_markets.map((m) => (
                    <div
                      key={m.id || m.name}
                      className="p-3 rounded-xl border border-[#1A2338] bg-[#101626] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {m.country || "Target Market"}
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No candidate markets configured.</p>
              )}
            </div>

            {/* Brand & Audience Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[#0E1424] border border-[#1A2338] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1A2338]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Brand & Positioning Profile
                  </h3>
                  {asString(brand.positioning) && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 font-semibold border border-indigo-800">
                      {asString(brand.positioning)}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Brand Name: </span>
                    <strong className="text-slate-200">{asString(brand.name) || project.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Industry / Sector: </span>
                    <span className="text-slate-300">
                      {asString(brand.category) || "Not specified"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed pt-1">
                    {asString(brand.description) || project.objective || "No brand description provided."}
                  </p>
                  {brandTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {brandTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#141B2D] text-slate-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0E1424] border border-[#1A2338] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1A2338]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Audience & Cultural Persona
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-semibold border border-emerald-800">
                    Target Cohort
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Target Segment: </span>
                    <strong className="text-slate-200">
                      {asString(audience.name) || asString(audience.persona) || "Not specified"}
                    </strong>
                  </div>
                  <div className="flex items-center space-x-4 text-slate-400">
                    <span>
                      Age:{" "}
                      <strong className="text-slate-300">
                        {ageRange ? `${ageRange[0]} - ${ageRange[1]}` : "Not specified"}
                      </strong>
                    </span>
                    <span>
                      Income:{" "}
                      <strong className="text-slate-300">
                        {asString(audience.income_level) || "Not specified"}
                      </strong>
                    </span>
                  </div>
                  {interests.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] text-slate-500 mb-1">Target Taste Affinities:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((int, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 font-medium border border-indigo-800"
                          >
                            {int}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* All Markets Evaluated (Latest Run) — every candidate market this
                run scored, not just the winner shown in the summary card. */}
            {latestRun && latestRankings.length > 0 && (
              <div className="p-5 rounded-xl bg-[#0E1424] border border-[#1A2338] shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#1A2338]">
                  <div>
                    <h3 className="text-sm font-bold text-white">All Markets Evaluated</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Full ranking from the latest run · {formatDate(latestRun.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/runs/${latestRun.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    View run
                  </Link>
                </div>
                <div className="divide-y divide-[#141B2D]">
                  {latestRankings.map((item) => {
                    const pct = Math.round(item.score * 100);
                    const barColor =
                      pct >= 70 ? "bg-emerald-400" : pct >= 55 ? "bg-amber-400" : "bg-rose-500";
                    return (
                      <div key={item.market} className="flex items-center gap-3 py-2.5 text-xs">
                        <span className="text-slate-500 font-mono w-5">{item.rank}</span>
                        <span className="flex-1 font-medium text-slate-200 truncate">
                          {item.market}
                        </span>
                        <div className="flex items-center gap-2 w-28">
                          <div className="flex-1 h-1.5 rounded-full bg-[#1A2338] overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                          <span className="font-mono font-semibold text-white w-8 text-right">
                            {pct}
                          </span>
                        </div>
                        <VerdictBadge verdict={item.verdict} size="sm" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Latest Analysis Snapshot */}
          <div className="lg:col-span-4 space-y-6">
            {latestRun ? (
              <div className="p-5 rounded-xl bg-[#0E1424] border border-[#1A2338] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Latest Decision Verdict
                  </span>
                  <span className="text-xs text-slate-500">Run #{latestRun.id.slice(0, 6)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {latestRun.decision_verdict ? (
                      <VerdictBadge verdict={latestRun.decision_verdict} />
                    ) : (
                      <StatusBadge status={latestRun.status} />
                    )}
                  </div>
                  <div className="text-3xl font-black text-white">
                    {latestRun.overall_score != null ? (
                      <>
                        {(latestRun.overall_score * 100).toFixed(0)}%
                        <span className="text-xs font-normal text-slate-500 ml-1.5">Compatibility</span>
                      </>
                    ) : (
                      <span className="text-base font-semibold text-slate-400">Not yet scored</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {latestRun.strategy_summary || "No strategic summary available yet for this run."}
                </p>

                <div className="pt-2">
                  <Link
                    href={`/runs/${latestRun.id}`}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <span>Inspect Full Intelligence Trace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-[#0E1424] border border-[#1A2338] space-y-3">
                <Clock className="w-8 h-8 text-indigo-400 mx-auto" />
                <div className="text-sm font-bold text-slate-200">No runs executed yet</div>
                <p className="text-xs text-slate-500">
                  Click &ldquo;Run Analysis&rdquo; to evaluate market compatibility and generate strategic expansion recommendations.
                </p>
              </div>
            )}

            {/* Cultural Fit Trend — across every run this project has executed.
                Only renders once there are 2+ scored runs; no fabricated line for one data point. */}
            {scoredRunsAsc.length >= 2 && (
              <div className="p-5 rounded-xl bg-[#0E1424] border border-[#1A2338] shadow-xs">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Cultural Fit Trend
                  </h3>
                  <span className="text-[11px] text-slate-500">{scoredRunsAsc.length} runs</span>
                </div>
                <CulturalFitTrend runs={scoredRunsAsc} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RUNS LIST */}
      {activeTab === "runs" && (
        <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#1A2338] flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Historical Executions ({runs.length})</h3>
          </div>

          {runs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No analysis runs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1A2338] bg-[#101626] text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Run ID</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Verdict</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created</th>
                    <th className="p-3.5 text-right pr-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141B2D]">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-[#12192B] transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-semibold text-white">
                        {r.id.slice(0, 8)}...
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {r.parent_run_id ? "What-If Simulation" : "Baseline Analysis"}
                      </td>
                      <td className="p-3.5">
                        {r.decision_verdict ? (
                          <VerdictBadge verdict={r.decision_verdict} size="sm" />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {r.overall_score != null ? `${(r.overall_score * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-3.5 text-slate-400">{formatDate(r.created_at)}</td>
                      <td className="p-3.5 text-right pr-5">
                        <Link
                          href={`/runs/${r.id}`}
                          className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANALYST CHAT */}
      {activeTab === "chat" && project && (
        <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] overflow-hidden" style={{ height: "520px" }}>
          <ChatPanel projectId={project.id} scrollAreaClass="flex-1" />
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-[#0E1424] rounded-xl border border-[#1A2338] text-xs text-slate-500">
              No reports compiled yet for this project.
            </div>
          ) : (
            reports.map((rep) => (
              <div key={rep.id} className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white truncate">{rep.title}</h4>
                  <span className="text-[10px] font-bold uppercase bg-[#141B2D] px-1.5 py-0.5 rounded text-slate-400">
                    {rep.format}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">Compiled {formatDate(rep.created_at)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: MEMORY */}
      {activeTab === "memory" && (
        <div className="space-y-3">
          {memories.length === 0 ? (
            <div className="p-8 text-center bg-[#0E1424] rounded-xl border border-[#1A2338] text-xs text-slate-500">
              No persistent project memory records yet.
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-start justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                    {mem.memory_type}
                  </span>
                  <p className="text-xs text-slate-200 mt-1">{mem.content}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{timeAgo(mem.created_at)}</p>
                </div>
                <span className="text-[10px] text-slate-500">
                  {mem.confidence != null ? `Conf: ${Math.round(mem.confidence * 100)}%` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CulturalFitTrend({ runs }: { runs: AnalysisRun[] }) {
  const width = 300;
  const height = 130;
  const padL = 28;
  const padR = 10;
  const padT = 10;
  const padB = 20;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const points = runs.map((r, i) => {
    const score = Math.round((r.overall_score || 0) * 100);
    const x = padL + (runs.length > 1 ? (i / (runs.length - 1)) * chartW : chartW / 2);
    const y = padT + (1 - score / 100) * chartH;
    return { x, y, score, date: r.created_at };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const shortDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const latest = points[points.length - 1];
  const first = points[0];
  const delta = latest.score - first.score;

  return (
    <div>
      <div className="flex items-baseline space-x-2 mb-1">
        <span className="text-2xl font-black text-white">{latest.score}%</span>
        {delta !== 0 && (
          <span className={`text-xs font-semibold ${delta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {delta > 0 ? "↑" : "↓"} {Math.abs(delta)} pts since first run
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 50, 100].map((v) => {
          const y = padT + (1 - v / 100) * chartH;
          return (
            <g key={v}>
              <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize="9">
                {v}
              </text>
              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#161D2E" strokeWidth={1} />
            </g>
          );
        })}
        <path d={pathD} fill="none" stroke="#818CF8" strokeWidth={2} strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#818CF8" stroke="#0B0F19" strokeWidth={1.5} />
        ))}
        <text x={first.x} y={height - 4} textAnchor="start" className="fill-slate-500" fontSize="9">
          {shortDate(first.date)}
        </text>
        <text x={latest.x} y={height - 4} textAnchor="end" className="fill-slate-500" fontSize="9">
          {shortDate(latest.date)}
        </text>
      </svg>
    </div>
  );
}
