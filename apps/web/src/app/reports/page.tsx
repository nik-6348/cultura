"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Search,
  Calendar,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { ReportRecord, AnalysisRun } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ReportsListPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const wsList = await api.getWorkspaces();
        if (wsList && wsList.length > 0) {
          const runList = await api.getWorkspaceRuns(wsList[0].id, 20);
          setRuns(runList);

          // Fetch reports for recent runs
          const allReports: ReportRecord[] = [];
          for (const r of runList.slice(0, 5)) {
            try {
              const rReports = await api.getRunReports(r.id);
              if (rReports && rReports.length > 0) {
                allReports.push(...rReports);
              }
            } catch {
              // Ignore single run report fetch errors
            }
          }
          setReports(allReports);
        }
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter((rep) =>
    rep.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Executive Intelligence Reports</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publication-grade market entry briefs, comparative matrices, and strategic recommendations.
          </p>
        </div>

        <Link
          href="/runs"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Generate from Run</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search executive reports..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="text-xs text-slate-500">
          <span>{reports.length}</span> reports compiled
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400">
            Loading compiled reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="col-span-full p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No reports generated yet
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Open any completed analysis run in your project and click &ldquo;Generate Executive Brief&rdquo;.
            </p>
            {runs.length > 0 && (
              <div className="pt-2">
                <Link
                  href={`/runs/${runs[0].id}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800"
                >
                  <span>Open Latest Run ({runs[0].id.slice(0, 8)})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 hover:border-indigo-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {rep.format}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                  {rep.title}
                </h3>
                <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(rep.created_at)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <Link
                  href={`/runs/${rep.run_id}`}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center space-x-1"
                >
                  <span>View Run</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>

                {rep.content && (
                  <button
                    onClick={() =>
                      downloadFile(
                        `${rep.title.replace(/\s+/g, "_")}.${rep.format === "html" ? "html" : "md"}`,
                        rep.content || "",
                        rep.format === "html" ? "text/html" : "text/markdown"
                      )
                    }
                    className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
