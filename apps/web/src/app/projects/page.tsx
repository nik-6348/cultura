"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Folder,
  Play,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  MoreVertical,
  LayoutList,
  LayoutGrid,
  Inbox,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalysisRun, Project } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { StatusKey, STATUS_STYLES, statusKeyFor, statusLabelFor } from "@/lib/status";

interface EnrichedProject {
  project: Project;
  category: string | null;
  latestRun: AnalysisRun | null;
  culturalFit: number | null; // 0-100
  statusLabel: string;
  statusKey: StatusKey;
  lastAnalysisMarket: string | null;
  lastAnalysisTime: string | null;
}

const DAY_MS = 86400000;

function periodDelta(currentCount: number, previousCount: number): { pct: number; isPositive: boolean } | null {
  if (previousCount <= 0) return null;
  const pct = ((currentCount - previousCount) / previousCount) * 100;
  return { pct: Math.round(Math.abs(pct)), isPositive: pct >= 0 };
}

function weeklyBuckets(
  dates: Date[],
  weeks: number
): number[] {
  const now = Date.now();
  const buckets = new Array(weeks).fill(0);
  for (const d of dates) {
    const ageMs = now - d.getTime();
    const bucketFromEnd = Math.floor(ageMs / (7 * DAY_MS));
    const idx = weeks - 1 - bucketFromEnd;
    if (idx >= 0 && idx < weeks) buckets[idx] += 1;
  }
  return buckets;
}

function sparklineHeights(counts: number[]): number[] {
  const max = Math.max(...counts, 1);
  return counts.map((c) => Math.max(8, Math.round((c / max) * 100)));
}

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [marketFilter, setMarketFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"last_updated" | "name" | "cultural_fit">("last_updated");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const wsList = await api.getWorkspaces();
        if (wsList && wsList.length > 0) {
          const ws = wsList[0];
          const [pList, rList] = await Promise.all([
            api.getProjects(ws.id),
            api.getWorkspaceRuns(ws.id, 100),
          ]);
          setProjects(pList);
          setRuns(rList);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load projects";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- Enrich each project with its latest run (real data, no fabricated fields) ---
  const enriched: EnrichedProject[] = useMemo(() => {
    const runsByProject = new Map<string, AnalysisRun[]>();
    for (const r of runs) {
      const list = runsByProject.get(r.project_id) || [];
      list.push(r);
      runsByProject.set(r.project_id, list);
    }
    for (const list of runsByProject.values()) {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return projects.map((project) => {
      const projectRuns = runsByProject.get(project.id) || [];
      const latestRun = projectRuns[0] || null;
      const category = (project.brand_profile_json?.category as string) || null;
      const culturalFit =
        latestRun?.overall_score != null ? Math.round(latestRun.overall_score * 100) : null;
      const statusKey: EnrichedProject["statusKey"] = latestRun
        ? statusKeyFor(latestRun.status)
        : "draft";

      const winnerMarket =
        (latestRun?.result_summary_json?.winner_market as string) ||
        latestRun?.input_snapshot_json?.candidate_markets?.[0]?.name ||
        null;

      return {
        project,
        category,
        latestRun,
        culturalFit,
        statusLabel: statusLabelFor(statusKey),
        statusKey,
        lastAnalysisMarket: winnerMarket,
        lastAnalysisTime: latestRun ? timeAgo(latestRun.created_at) : null,
      };
    });
  }, [projects, runs]);

  // --- Filter option lists, derived from what's actually present ---
  const categories = useMemo(
    () => Array.from(new Set(enriched.map((e) => e.category).filter(Boolean))) as string[],
    [enriched]
  );
  const markets = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      for (const m of p.candidate_markets || []) set.add(m.name);
    }
    return Array.from(set).sort();
  }, [projects]);
  const statusOptions = useMemo(
    () => Array.from(new Set(enriched.map((e) => e.statusLabel))),
    [enriched]
  );

  // --- Filtering ---
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return enriched.filter((e) => {
      if (q) {
        const haystack = [
          e.project.name,
          e.project.objective || "",
          e.category || "",
          ...(e.project.candidate_markets || []).map((m) => m.name),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter !== "All" && e.statusLabel !== statusFilter) return false;
      if (categoryFilter !== "All" && e.category !== categoryFilter) return false;
      if (
        marketFilter !== "All" &&
        !(e.project.candidate_markets || []).some((m) => m.name === marketFilter)
      )
        return false;
      return true;
    });
  }, [enriched, searchQuery, statusFilter, categoryFilter, marketFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "name") {
      list.sort((a, b) => a.project.name.localeCompare(b.project.name));
    } else if (sortBy === "cultural_fit") {
      list.sort((a, b) => (b.culturalFit ?? -1) - (a.culturalFit ?? -1));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.project.updated_at || b.project.created_at).getTime() -
          new Date(a.project.updated_at || a.project.created_at).getTime()
      );
    }
    return list;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  async function handleDelete(projectId: string) {
    setDeletingId(projectId);
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
      setOpenMenuId(null);
    }
  }

  // Reset to page 1 whenever filters change the result set
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, categoryFilter, marketFilter, rowsPerPage]);

  // --- Stat tiles: real counts + real month-over-month deltas (hidden if no prior-period data) ---
  const stats = useMemo(() => {
    const now = Date.now();
    const in30 = (d: string) => now - new Date(d).getTime() <= 30 * DAY_MS;
    const in30to60 = (d: string) => {
      const age = now - new Date(d).getTime();
      return age > 30 * DAY_MS && age <= 60 * DAY_MS;
    };

    const projectsRecent = projects.filter((p) => in30(p.created_at)).length;
    const projectsPrev = projects.filter((p) => in30to60(p.created_at)).length;

    const runsRecent = runs.filter((r) => in30(r.created_at)).length;
    const runsPrev = runs.filter((r) => in30to60(r.created_at)).length;

    const scoredRuns = runs.filter((r) => r.overall_score != null);
    const scoredRecent = scoredRuns.filter((r) => in30(r.created_at));
    const scoredPrev = scoredRuns.filter((r) => in30to60(r.created_at));
    const avgFit =
      scoredRuns.length > 0
        ? (scoredRuns.reduce((s, r) => s + (r.overall_score || 0), 0) / scoredRuns.length) * 100
        : null;
    const avgFitRecent =
      scoredRecent.length > 0
        ? (scoredRecent.reduce((s, r) => s + (r.overall_score || 0), 0) / scoredRecent.length) * 100
        : null;
    const avgFitPrev =
      scoredPrev.length > 0
        ? (scoredPrev.reduce((s, r) => s + (r.overall_score || 0), 0) / scoredPrev.length) * 100
        : null;

    const verdictRuns = runs.filter((r) => r.decision_verdict);
    const launchRate = (list: AnalysisRun[]) =>
      list.length > 0
        ? (list.filter((r) => r.decision_verdict?.toUpperCase() === "LAUNCH").length / list.length) * 100
        : null;
    const readiness = launchRate(verdictRuns);
    const readinessRecent = launchRate(verdictRuns.filter((r) => in30(r.created_at)));
    const readinessPrev = launchRate(verdictRuns.filter((r) => in30to60(r.created_at)));

    const projectDates = projects.map((p) => new Date(p.created_at));
    const runDates = runs.map((r) => new Date(r.created_at));

    return {
      totalProjects: projects.length,
      totalRuns: runs.length,
      avgFit,
      readiness,
      projectsDelta: periodDelta(projectsRecent, projectsPrev),
      runsDelta: periodDelta(runsRecent, runsPrev),
      fitDelta:
        avgFitRecent != null && avgFitPrev != null ? periodDelta(avgFitRecent, avgFitPrev) : null,
      readinessDelta:
        readinessRecent != null && readinessPrev != null
          ? periodDelta(readinessRecent, readinessPrev)
          : null,
      projectsSpark: sparklineHeights(weeklyBuckets(projectDates, 8)),
      runsSpark: sparklineHeights(weeklyBuckets(runDates, 8)),
    };
  }, [projects, runs]);

  const renderSparklineBars = (colorClass: string, heights: number[]) => (
    <div className="flex items-end space-x-0.75 h-7">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%` }}
          className={`w-1 rounded-xs ${colorClass}`}
        />
      ))}
    </div>
  );

  const renderDelta = (delta: { pct: number; isPositive: boolean } | null) =>
    delta ? (
      <span
        className={`text-[11px] font-semibold flex items-center ${delta.isPositive ? "text-emerald-400" : "text-rose-400"
          }`}
      >
        {delta.isPositive ? "↑" : "↓"} {delta.pct}%
      </span>
    ) : null;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Projects</h1>
          <p className="mt-1 text-sm text-slate-400 max-w-xl">
            Manage your brands, markets and analysis runs. Turn cultural intelligence into confident decisions.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-300">
          <p className="font-semibold">Error loading projects</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      )}

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#141C38] border border-indigo-500/20 text-[#6366F1] flex items-center justify-center flex-shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Total Projects</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">{stats.totalProjects}</span>
                {renderDelta(stats.projectsDelta)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">vs last 30 days</p>
            </div>
          </div>
          {renderSparklineBars("bg-indigo-500/80", stats.projectsSpark)}
        </div>

        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1D173C] border border-purple-500/20 text-[#8B5CF6] flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Total Analysis Runs</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">{stats.totalRuns}</span>
                {renderDelta(stats.runsDelta)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">vs last 30 days</p>
            </div>
          </div>
          {renderSparklineBars("bg-purple-500/80", stats.runsSpark)}
        </div>

        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0E2336] border border-cyan-500/20 text-[#06B6D4] flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Avg. Cultural Fit</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {stats.avgFit != null ? `${stats.avgFit.toFixed(1)}%` : "—"}
                </span>
                {renderDelta(stats.fitDelta)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">across scored runs</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B251E] border border-emerald-500/20 text-[#10B981] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Launch Readiness Rate</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {stats.readiness != null ? `${Math.round(stats.readiness)}%` : "—"}
                </span>
                {renderDelta(stats.readinessDelta)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">share of runs verdict LAUNCH</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name, brand, objective, or market..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1E293B] bg-[#101626] py-2.5 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <FilterSelect label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categories} />
        <FilterSelect label="Target Market" value={marketFilter} onChange={setMarketFilter} options={markets} />

        <div className="relative">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-3 pr-7 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="last_updated">Last updated</option>
            <option value="name">Name (A-Z)</option>
            <option value="cultural_fit">Cultural fit</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 bottom-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center bg-[#141B2D] border border-slate-700/60 rounded-lg p-0.5 self-end lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            title="List view"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showing {paginated.length} of {sorted.length} projects
      </p>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">Loading projects...</div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#232F49] bg-[#0E1424]/60 p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#141C38] text-slate-400">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            {projects.length === 0 ? "No projects configured yet" : "No matching projects"}
          </h3>
          <p className="mt-1.5 text-sm text-slate-400 max-w-sm">
            {projects.length === 0
              ? "Create your first project to evaluate candidate markets using Qloo taste signals."
              : "Try a different search term or clear your filters."}
          </p>
          {projects.length === 0 && (
            <Link
              href="/projects/new"
              className="mt-5 inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Project</span>
            </Link>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] overflow-visible shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-[#161D2E]">
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-2 font-medium">Project / Brand</th>
                  <th className="py-3 px-2 font-medium">Objective</th>
                  <th className="py-3 px-2 font-medium">Target Markets</th>
                  <th className="py-3 px-2 font-medium">Cultural Fit</th>
                  <th className="py-3 px-2 font-medium">Latest Analysis</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium">Last Updated</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141B2D]">
                {paginated.map((e, idx) => {
                  const style = STATUS_STYLES[e.statusKey];
                  const barColor =
                    e.culturalFit == null
                      ? "bg-slate-700"
                      : e.culturalFit >= 70
                        ? "bg-emerald-400"
                        : e.culturalFit >= 55
                          ? "bg-amber-400"
                          : "bg-rose-500";
                  const marketList = e.project.candidate_markets || [];

                  return (
                    <tr key={e.project.id} className="hover:bg-[#12192B] transition-colors group">
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs align-top">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-2 align-top">
                        <Link href={`/projects/${e.project.id}`} className="block">
                          <div className="font-semibold text-white hover:text-indigo-300 transition-colors">
                            {e.project.name}
                          </div>
                          {e.category && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{e.category}</div>
                          )}
                        </Link>
                      </td>
                      <td className="py-3.5 px-2 align-top text-slate-300 text-xs max-w-[220px]">
                        <span className="line-clamp-2">{e.project.objective || "—"}</span>
                      </td>
                      <td className="py-3.5 px-2 align-top">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {marketList.slice(0, 3).map((m) => (
                            <span
                              key={m.id || m.name}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#141B2D] text-slate-300 border border-slate-700/60"
                            >
                              {m.name}
                            </span>
                          ))}
                          {marketList.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#141B2D] text-slate-400 border border-slate-700/60">
                              +{marketList.length - 3}
                            </span>
                          )}
                          {marketList.length === 0 && <span className="text-xs text-slate-500">—</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 align-top">
                        {e.culturalFit != null ? (
                          <div className="flex items-center space-x-2 w-28">
                            <div className="flex-1 h-1.5 rounded-full bg-[#1A2338] overflow-hidden">
                              <div
                                style={{ width: `${e.culturalFit}%` }}
                                className={`h-full rounded-full ${barColor}`}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-semibold text-white">
                              {e.culturalFit}/100
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Not analyzed</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 align-top text-xs">
                        {e.latestRun ? (
                          <Link
                            href={`/runs/${e.latestRun.id}`}
                            className="block hover:text-indigo-300 transition-colors"
                          >
                            <div className="text-slate-200">{e.lastAnalysisMarket || "—"}</div>
                            <div className="text-slate-500 text-[11px]">{e.lastAnalysisTime}</div>
                          </Link>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.bg} ${style.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {e.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 align-top text-slate-400 text-[11px]">
                        {timeAgo(e.project.updated_at || e.project.created_at)}
                      </td>
                      <td className="py-3.5 px-4 align-top text-right relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(openMenuId === e.project.id ? null : e.project.id)
                          }
                          className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800/60"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === e.project.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-4 top-9 z-50 w-44 rounded-lg bg-[#121829] border border-[#232F49] shadow-2xl py-1 text-left">
                              <Link
                                href={`/projects/${e.project.id}`}
                                className="block px-3 py-2 text-xs text-slate-200 hover:bg-[#1A2338]"
                              >
                                View Project
                              </Link>
                              {e.latestRun && (
                                <Link
                                  href={`/runs/${e.latestRun.id}`}
                                  className="block px-3 py-2 text-xs text-slate-200 hover:bg-[#1A2338]"
                                >
                                  View Latest Run
                                </Link>
                              )}
                              <Link
                                href={`/projects/${e.project.id}?action=new-run`}
                                className="block px-3 py-2 text-xs text-slate-200 hover:bg-[#1A2338]"
                              >
                                Run New Analysis
                              </Link>
                              <div className="my-1 border-t border-[#232F49]" />
                              <button
                                onClick={() => { setConfirmDeleteId(e.project.id); setOpenMenuId(null); }}
                                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" /> Delete Project
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#161D2E]">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>Rows per page</span>
              <div className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-2.5 pr-6 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {[6, 12, 24, 48].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1.5 pointer-events-none" />
              </div>
              <span>
                {sorted.length === 0
                  ? "0 of 0"
                  : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(
                    currentPage * rowsPerPage,
                    sorted.length
                  )} of ${sorted.length} projects`}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1A2338] disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
                )
                .map((n, i, arr) => (
                  <React.Fragment key={n}>
                    {i > 0 && arr[i - 1] !== n - 1 && (
                      <span className="text-slate-600 px-1">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(n)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${n === currentPage
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-[#1A2338]"
                        }`}
                    >
                      {n}
                    </button>
                  </React.Fragment>
                ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1A2338] disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((e) => {
            const style = STATUS_STYLES[e.statusKey];
            const marketList = e.project.candidate_markets || [];
            return (
              <Link
                key={e.project.id}
                href={`/projects/${e.project.id}`}
                className="flex flex-col justify-between rounded-xl bg-[#0E1424] border border-[#1A2338] hover:border-slate-700/80 p-5 shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white leading-snug line-clamp-1">
                      {e.project.name}
                    </h3>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.bg} ${style.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {e.statusLabel}
                    </span>
                  </div>
                  {e.category && <p className="text-[11px] text-slate-400 mt-0.5">{e.category}</p>}
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {e.project.objective || "—"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {marketList.slice(0, 4).map((m) => (
                      <span
                        key={m.id || m.name}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#141B2D] text-slate-300 border border-slate-700/60"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-[#161D2E] flex items-center justify-between text-xs">
                  <span className="text-slate-500">{timeAgo(e.project.updated_at || e.project.created_at)}</span>
                  {e.culturalFit != null ? (
                    <span className="font-mono font-semibold text-white">{e.culturalFit}/100</span>
                  ) : (
                    <span className="text-slate-500">Not analyzed</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121829] border border-[#232F49] rounded-2xl p-6 w-80 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Delete project?</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All runs and data will be permanently deleted.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-lg border border-[#232F49] text-xs text-slate-300 hover:bg-[#1A2338] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { void handleDelete(confirmDeleteId); }}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs text-white font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {deletingId === confirmDeleteId ? (
                  <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-3 pr-7 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]"
      >
        <option value="All">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 bottom-2.5 pointer-events-none" />
    </div>
  );
}
