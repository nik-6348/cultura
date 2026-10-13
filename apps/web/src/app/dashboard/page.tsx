"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  PlayCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Database,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalysisRun, Project } from "@/lib/types";
import { StatCard } from "@/components/ui/StatCard";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentRuns, setRecentRuns] = useState<AnalysisRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        setError(null);
        // 1. Fetch workspaces
        const wsList = await api.getWorkspaces();
        let activeWs = wsList[0];
        if (!activeWs) {
          activeWs = await api.createWorkspace(
            "European Strategy Lab",
            "strategy.cultura.ai"
          );
        }

        // 2. Fetch projects
        const projList = await api.getProjects(activeWs.id);
        setProjects(projList);

        // 3. Fetch recent runs across workspace
        const runsList = await api.getWorkspaceRuns(activeWs.id, 10);
        setRecentRuns(runsList);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, []);

  const totalRuns = recentRuns.length;
  const launchVerdicts = recentRuns.filter(
    (r) => r.decision_verdict?.toLowerCase() === "launch"
  ).length;
  const avgScore =
    recentRuns.length > 0
      ? (
          recentRuns.reduce((acc, r) => acc + (r.overall_score || 0), 0) /
          recentRuns.length
        ).toFixed(3)
      : "—";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Decision Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Deterministic cultural compatibility scoring, Qloo taste graph evidence, and TypeSafe Jev System One gates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/projects/new"
            className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Analysis</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-300">
          <p className="font-semibold">Failed to connect to backend</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      )}

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={loading ? "..." : projects.length}
          subtext="Configured market entry portfolios"
          icon={FolderKanban}
        />
        <StatCard
          label="Market Analyses"
          value={loading ? "..." : totalRuns}
          subtext="Executed agentic evaluation runs"
          icon={PlayCircle}
        />
        <StatCard
          label="Average Cultural Fit"
          value={loading ? "..." : avgScore === "—" ? "N/A" : `${(Number(avgScore) * 100).toFixed(1)}%`}
          subtext="Weighted 5-dimension compatibility"
          icon={TrendingUp}
        />
        <StatCard
          label="Launch Readiness"
          value={
            loading
              ? "..."
              : totalRuns > 0
              ? `${Math.round((launchVerdicts / totalRuns) * 100)}%`
              : "0%"
          }
          subtext={`${launchVerdicts} verified launch approvals`}
          icon={ShieldCheck}
        />
      </div>

      {/* Main Grid: Projects & Decision Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Projects & Active Decisions (2 cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Decision Runs */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recent Decision Intelligence
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Latest evaluated market entries with TypeSafe Jev System One gates
                </p>
              </div>
              <Link
                href="/projects"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading intelligence runs...</div>
            ) : recentRuns.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No analysis runs executed yet"
                  description="Run your first multi-agent market compatibility analysis to generate Qloo evidence and Jev decision postures."
                  actionText="Launch New Analysis"
                  actionHref="/projects/new"
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentRuns.map((run) => {
                  const scorePct = run.overall_score
                    ? (run.overall_score * 100).toFixed(1)
                    : "—";
                  const candidateCount =
                    run.input_snapshot_json?.candidate_markets?.length || 2;
                  const brandName =
                    run.input_snapshot_json?.brand_name || "Enterprise Brand";

                  return (
                    <div
                      key={run.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                          {scorePct !== "—" ? `${scorePct}%` : "—"}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {brandName}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {candidateCount} candidate markets
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {run.strategy_summary || "Empirical taste affinity & audience compatibility evaluation"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        {run.decision_verdict && (
                          <VerdictBadge verdict={run.decision_verdict} size="sm" />
                        )}
                        <Link
                          href={`/runs/${run.id}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Projects Table */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Configured Projects</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Strategic market entry initiatives in this workspace
                </p>
              </div>
              <Link
                href="/projects/new"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No projects configured"
                  description="Create a project to configure candidate markets, target personas, and cultural affinity profiles."
                  actionText="Create Project"
                  actionHref="/projects/new"
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {projects.map((proj) => {
                  const markets = proj.candidate_markets || [];
                  return (
                    <div
                      key={proj.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/projects/${proj.id}`}
                            className="font-semibold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {proj.name}
                          </Link>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase font-medium">
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {proj.objective || "Expansion strategy evaluation"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {markets.map((m) => (
                            <span
                              key={m.id || m.name}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <Globe2 className="w-2.5 h-2.5 mr-1 text-slate-400" />
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <Link
                          href={`/projects/${proj.id}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span>Overview</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Platform Architecture & Integrations Status */}
        <div className="space-y-6">
          {/* Intelligence Architecture Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Decision Stack Health
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Qloo Cultural Taste API</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">hackathon.api.qloo.com</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded uppercase">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">TypeSafe Jev System One</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">jevstation.com/systemone</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded uppercase">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Deterministic Scorer v1.0</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">5 Dimensions • Missing penalty</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded uppercase">
                  Audited
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">4-Layer Memory (pgvector)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">HNSW Index • 1536d Cosine</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded uppercase">
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Quick Memory Search preview */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Institutional Memory
              </h3>
              <Link href="/memory" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                Open Hub &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Cultura preserves verified brand corrections, audience assumptions, and previous market decisions in pgvector memory to guarantee strategic continuity across runs.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center">
                <Database className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Persistent Layer C/D
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Strict Isolation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
