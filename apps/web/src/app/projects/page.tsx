"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Globe2,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const wsList = await api.getWorkspaces();
        if (wsList && wsList.length > 0) {
          const ws = wsList[0];
          const pList = await api.getProjects(ws.id);
          setProjects(pList);
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

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.objective && p.objective.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Strategic market entry portfolios and cultural affinity configurations.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name or objective..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">Error loading projects</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      )}

      {/* Projects Grid / List */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching projects" : "No projects configured yet"}
          description={
            searchQuery
              ? `No projects found matching "${searchQuery}". Try a different search term.`
              : "Create your first project to evaluate candidate markets using Qloo taste signals."
          }
          actionText={searchQuery ? undefined : "Create First Project"}
          actionHref={searchQuery ? undefined : "/projects/new"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const markets = project.candidate_markets || [];
            const dateStr = new Date(project.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-base text-slate-900 leading-snug line-clamp-1">
                      {project.name}
                    </h2>
                    <span className="shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {project.status}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {project.objective || "Comprehensive multi-agent cultural compatibility and market launch analysis."}
                  </p>

                  {/* Candidate Markets List */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Candidate Markets ({markets.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {markets.map((m) => (
                        <span
                          key={m.id || m.name}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                        >
                          <Globe2 className="w-3 h-3 mr-1 text-slate-400" />
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer with actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateStr}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center space-x-1 font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Overview</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
