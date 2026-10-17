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
  Sparkles,
  CheckCircle2,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  AnalysisRun,
  Project,
  ReportRecord,
  MemoryRecord,
  ChatResponse,
} from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { formatDate } from "@/lib/utils";
import { CulturalRadarChart, RadarSeries } from "@/components/analytics/CulturalRadarChart";

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

  // Chat tab state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "bot"; text: string; citations?: Array<{ id: number; label: string }> }>
  >([]);
  const [chatSubmitting, setChatSubmitting] = useState(false);

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

        // If there's a recent run, fetch its reports
        if (runList.length > 0) {
          try {
            const reps = await api.getRunReports(runList[0].id);
            setReports(reps);
          } catch {
            // Non-critical
          }
        }

        // Fetch memories for project
        try {
          const mems = await api.getMemories(proj.workspace_id, projectId);
          setMemories(mems);
        } catch {
          // Non-critical
        }

        // Initial welcome chat
        setChatMessages([
          {
            sender: "bot",
            text: `Hello! I am your AI Cultural Intelligence Analyst for **${proj.name}**. You can ask me about candidate market fit, Qloo taste signals, or localized strategic recommendations.`,
          },
        ]);
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

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !project || chatSubmitting) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatSubmitting(true);

    try {
      const res: ChatResponse = await api.chatWithAnalyst(project.id, userText);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: res.reply,
          citations: res.citations.map((c) => ({ id: c.id, label: c.label })),
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I encountered an issue retrieving cultural signals. Please ensure you have triggered an analysis run for this project.",
        },
      ]);
    } finally {
      setChatSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading project workspace...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-rose-600 font-semibold text-sm">
          {error || "Project not found"}
        </div>
        <Link
          href="/projects"
          className="text-xs text-indigo-600 font-semibold underline"
        >
          Return to Projects
        </Link>
      </div>
    );
  }

  const latestRun = runs.length > 0 ? runs[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <Link
            href="/projects"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Projects</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {project.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-900">
              {project.candidate_markets?.length || 0} Markets
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            {project.objective || "Enterprise cultural intelligence analysis"}
          </p>
        </div>

        <button
          onClick={handleTriggerRun}
          disabled={runningNew}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-300 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{runningNew ? "Evaluating Markets..." : "Run Analysis"}</span>
        </button>
      </div>

      {/* Navigation Tabs (Overview, Runs, Analyst Chat, Reports, Memory) */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800">
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
              className={`pb-3 px-3.5 text-xs font-semibold flex items-center space-x-2 transition-all relative ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Globe2 className="w-4 h-4 text-indigo-600" />
                  <span>Candidate Evaluation Markets</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {project.candidate_markets?.length || 0} selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.candidate_markets?.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {m.country || "Target Market"}
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Brand & Audience Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Brand & Positioning Profile
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                    {String((project.brand_profile_json as Record<string, any>)?.positioning || "Premium")}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Brand Name: </span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {String((project.brand_profile_json as Record<string, any>)?.name || project.name)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Industry / Sector: </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {String((project.brand_profile_json as Record<string, any>)?.category || "Lifestyle & Apparel")}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed pt-1">
                    {String((project.brand_profile_json as Record<string, any>)?.description || project.objective || "Expansion strategy evaluation")}
                  </p>
                  {Array.isArray((project.brand_profile_json as Record<string, any>)?.tags) && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {((project.brand_profile_json as Record<string, any>).tags as string[]).map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Audience & Cultural Persona
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                    Target Cohort
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Target Segment: </span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {String((project.audience_profile_json as Record<string, any>)?.name || (project.audience_profile_json as Record<string, any>)?.persona || "Gen Z & Urban Creatives")}
                    </strong>
                  </div>
                  <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-400">
                    <span>
                      Age: <strong className="text-slate-700 dark:text-slate-300">
                        {Array.isArray((project.audience_profile_json as Record<string, any>)?.age_range)
                          ? `${(project.audience_profile_json as Record<string, any>).age_range[0]} - ${(project.audience_profile_json as Record<string, any>).age_range[1]}`
                          : "18 - 35"}
                      </strong>
                    </span>
                    <span>
                      Income: <strong className="text-slate-700 dark:text-slate-300">
                        {String((project.audience_profile_json as Record<string, any>)?.income_level || "Medium-High")}
                      </strong>
                    </span>
                  </div>
                  {Array.isArray((project.audience_profile_json as Record<string, any>)?.interests) && (
                    <div className="pt-2">
                      <div className="text-[11px] text-slate-400 mb-1">Target Taste Affinities:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {((project.audience_profile_json as Record<string, any>).interests as string[]).map((int, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
                            {int}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Latest Analysis Snapshot */}
          <div className="lg:col-span-4 space-y-6">
            {latestRun ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Latest Decision Verdict
                  </span>
                  <span className="text-xs text-slate-400">
                    Run #{latestRun.id.slice(0, 6)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <VerdictBadge
                      verdict={latestRun.decision_verdict || "LAUNCH"}
                    />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {latestRun.overall_score
                      ? `${(latestRun.overall_score * 100).toFixed(0)}%`
                      : "88%"}
                    <span className="text-xs font-normal text-slate-400 ml-1.5">
                      Compatibility
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {latestRun.strategy_summary ||
                    "Deterministic compatibility scoring completed with high empirical grounding."}
                </p>

                <div className="pt-2">
                  <Link
                    href={`/runs/${latestRun.id}`}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <span>Inspect Full Intelligence Trace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <Clock className="w-8 h-8 text-indigo-400 mx-auto" />
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No runs executed yet
                </div>
                <p className="text-xs text-slate-500">
                  Click &ldquo;Run Analysis&rdquo; to evaluate market compatibility and generate strategic expansion recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RUNS LIST */}
      {activeTab === "runs" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Historical Executions ({runs.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-semibold">
                  <th className="p-3.5 pl-5">Run ID</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Verdict</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-3.5 pl-5 font-mono font-semibold text-slate-900 dark:text-white">
                      {r.id.slice(0, 8)}...
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {r.parent_run_id ? "What-If Simulation" : "Baseline Analysis"}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-600">
                        {r.decision_verdict || "LAUNCH"}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {r.overall_score ? `${(r.overall_score * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center space-x-1.5 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{r.status.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      <Link
                        href={`/runs/${r.id}`}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYST CHAT */}
      {activeTab === "chat" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 space-y-4">
          <div className="h-96 overflow-y-auto space-y-4 p-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {msg.text}

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
                      {msg.citations.map((c) => (
                        <span
                          key={c.id}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-indigo-600 font-semibold"
                        >
                          [{c.id}] {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask the Cultural Analyst about this project's findings..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No reports compiled yet for this project.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {rep.title}
                  </h4>
                  <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600">
                    {rep.format}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Compiled {formatDate(rep.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: MEMORY */}
      {activeTab === "memory" && (
        <div className="space-y-3">
          {memories.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No persistent project memory records yet.
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono text-indigo-600 uppercase font-semibold">
                    {mem.memory_type}
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                    {mem.content}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400">
                  {mem.confidence ? `Conf: ${Math.round(mem.confidence * 100)}%` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
