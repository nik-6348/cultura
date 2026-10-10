"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PlayCircle,
  Globe2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalysisRun, Project } from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
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
      <div className="py-24 text-center text-sm text-slate-400">
        Loading project intelligence overview...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-semibold">Project not found or accessible</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const markets = project.candidate_markets || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link href="/projects" className="hover:text-slate-800 flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{project.name}</span>
          </div>

          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {project.name}
            </h1>
            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {project.status}
            </span>
          </div>
        </div>

        <button
          onClick={handleTriggerRun}
          disabled={runningNew}
          className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors self-start sm:self-auto"
        >
          <PlayCircle className="w-4 h-4" />
          <span>{runningNew ? "Launching Agents..." : "Run Analysis Pipeline"}</span>
        </button>
      </div>

      {/* Project Metadata Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Strategic Objective
            </h2>
            <p className="mt-1 text-sm text-slate-700 leading-relaxed">
              {project.objective || "Comprehensive multi-agent cultural compatibility evaluation."}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Candidate Target Markets ({markets.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {markets.map((m) => (
                <span
                  key={m.id || m.name}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                >
                  <Globe2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  {m.name} ({m.location_code || "GLOBAL"})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Brand & Audience Card */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 text-xs">
          <div>
            <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
              Brand Profile
            </span>
            <div className="mt-1 font-semibold text-slate-800 text-sm">
              {(project.brand_profile_json?.brand_name as string) || project.name}
            </div>
            <p className="text-slate-500 mt-0.5">
              {(project.brand_profile_json?.category as string) || "Specialty Commercial Enterprise"}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
              Target Persona
            </span>
            <p className="mt-1 text-slate-700">
              {(project.audience_profile_json?.persona as string) || "Urban progressive consumer base"}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Runs History */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Analysis Runs History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical LangGraph multi-agent evaluations and Jev System One gates
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {runs.length} {runs.length === 1 ? "run" : "runs"} recorded
          </span>
        </div>

        {runs.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="No analysis runs yet"
              description="Execute your first multi-agent analysis run to evaluate candidate markets using Qloo taste signals."
              actionText="Execute Analysis Run"
              onAction={handleTriggerRun}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {runs.map((r) => {
              const scorePct = r.overall_score
                ? (r.overall_score * 100).toFixed(1)
                : "—";
              const dateStr = new Date(r.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={r.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      {scorePct !== "—" ? `${scorePct}%` : "—"}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900">
                          Run {r.id.slice(0, 8)}
                        </span>
                        {r.parent_run_id && (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Simulation
                          </span>
                        )}
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          {dateStr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {r.strategy_summary || "Empirical compatibility analysis"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    {r.decision_verdict && (
                      <VerdictBadge verdict={r.decision_verdict} size="sm" />
                    )}
                    <Link
                      href={`/runs/${r.id}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <span>Inspect Run</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
