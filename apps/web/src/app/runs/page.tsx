"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Filter,
  Search,
  Layers,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalysisRun } from "@/lib/types";

export default function RunsListPage() {
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadRuns() {
      try {
        const wsList = await api.getWorkspaces();
        if (wsList && wsList.length > 0) {
          const runList = await api.getWorkspaceRuns(wsList[0].id, 50);
          setRuns(runList);
        }
      } catch (err) {
        console.error("Failed to load runs", err);
      } finally {
        setLoading(false);
      }
    }
    loadRuns();
  }, []);

  const filteredRuns = runs.filter((r) => {
    const brand = r.input_snapshot_json?.brand_name?.toLowerCase() || "";
    const matchesSearch =
      brand.includes(searchQuery.toLowerCase()) || r.id.includes(searchQuery);
    const matchesStatus =
      statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <PlayCircle className="w-6 h-6 text-indigo-600" />
            <span>Analysis Runs & History</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete audit trail of all multi-agent executions and what-if counterfactual simulations.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Start New Run</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by brand name or run ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Runs Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading analysis runs from database...
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No analysis runs found
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a new market entry project and trigger an analysis to populate runs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-semibold">
                  <th className="p-3.5 pl-5">Brand / Project</th>
                  <th className="p-3.5">Workflow</th>
                  <th className="p-3.5">Markets</th>
                  <th className="p-3.5">Verdict Posture</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5">Execution Status</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRuns.map((r) => {
                  const brand = r.input_snapshot_json?.brand_name || "Enterprise Brand";
                  const markets = r.input_snapshot_json?.candidate_markets || [];
                  const score = r.overall_score
                    ? `${(r.overall_score * 100).toFixed(0)}%`
                    : "—";
                  const verdict = r.decision_verdict || "LAUNCH";
                  const isSimulation = !!r.parent_run_id;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-3.5 pl-5">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{brand}</span>
                          {isSimulation && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
                              What-If
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {r.id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-500">
                        {r.workflow_version}
                      </td>

                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{markets.length}</span>{" "}
                        <span className="text-slate-400">territories</span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            verdict === "LAUNCH"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : verdict === "ADAPT"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          }`}
                        >
                          {verdict}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {score}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{r.status.toUpperCase()}</span>
                        </span>
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <Link
                          href={`/runs/${r.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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
    </div>
  );
}
