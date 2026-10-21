"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FileText, Download, Search, Calendar,
  Trash2, ChevronDown, XCircle, Filter, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ReportRecord, Project } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";

// ─── Report Modal ─────────────────────────────────────────────────────────────

function ReportModal({ report, onClose }: { report: ReportRecord; onClose: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"), import("jspdf"),
      ]);
      const doc = iframe.contentDocument;
      const target = (doc.querySelector(".page") as HTMLElement) ?? doc.body;
      const canvas = await html2canvas(target, {
        scale: 2, useCORS: true, backgroundColor: "#f8fafc",
        scrollX: 0, scrollY: 0,
        windowWidth: target.scrollWidth, windowHeight: target.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = imgW / (canvas.width / canvas.height);
      // 24pt overlap between pages so text at page breaks isn't cut
      const overlap = 24;
      let y = 0;
      let first = true;
      while (y < imgH) {
        if (!first) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, first ? 0 : overlap - y, imgW, imgH);
        y += first ? pageH : (pageH - overlap);
        first = false;
      }
      const slug = report.title.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 40);
      pdf.save(`${slug}.pdf`);
    } finally { setDownloading(false); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 896, height: "90vh",
        borderRadius: 16, border: "1px solid #1A2338", background: "#0E1424",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #1A2338", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <FileText style={{ width: 15, height: 15, color: "#94a3b8", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {report.title}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button onClick={downloadPDF} disabled={downloading} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, border: "none",
              background: "#4f46e5", color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: downloading ? "not-allowed" : "pointer", opacity: downloading ? 0.7 : 1,
            }}>
              {downloading ? "Generating…" : <><Download style={{ width: 13, height: 13 }} /> Download PDF</>}
            </button>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 8, border: "1px solid #1A2338",
              background: "transparent", color: "#94a3b8", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <XCircle style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <iframe ref={iframeRef} srcDoc={report.content ?? ""}
            style={{ width: "100%", height: "100%", border: "none", display: "block", minHeight: 600 }}
            title="Executive Report" sandbox="allow-same-origin allow-scripts" />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsListPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ReportRecord | null>(null);
  const [runProjectMap, setRunProjectMap] = useState<Record<string, string>>({});

  const handleDelete = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this report?")) return;
    try {
      setDeletingId(reportId);
      await api.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally { setDeletingId(null); }
  };

  const loadData = useCallback(async () => {
    try {
      const wsList = await api.getWorkspaces();
      if (!wsList?.length) return;
      const ws = wsList[0];

      const [runList, projList] = await Promise.all([
        api.getWorkspaceRuns(ws.id, 50),
        api.getProjects(ws.id),
      ]);
      setProjects(projList ?? []);

      const rpMap: Record<string, string> = {};
      (projList ?? []).forEach((p: Project) => {
        runList.forEach(r => { if (r.project_id === p.id) rpMap[r.id] = p.name; });
      });
      setRunProjectMap(rpMap);

      const allReports: ReportRecord[] = [];
      await Promise.all(
        runList.slice(0, 20).map(async r => {
          try {
            const rr = await api.getRunReports(r.id);
            if (rr?.length) allReports.push(...rr);
          } catch { /* ignore */ }
        })
      );
      allReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReports(allReports);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);


  const filteredReports = useMemo(() =>
    reports.filter(rep => {
      const matchSearch = rep.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProject = projectFilter === "all" || rep.project_id === projectFilter;
      return matchSearch && matchProject;
    }),
  [reports, searchQuery, projectFilter]);

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
          <FileText className="w-6 h-6 text-indigo-600" />
          <span>Executive Intelligence Reports</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Publication-grade market entry briefs, comparative matrices, and strategic recommendations.
        </p>
      </div>

      {/* Search + Project filter */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search executive reports..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Project filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 pl-2 pr-6 py-1.5 focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 -ml-5 pointer-events-none" />
        </div>

        <div className="text-xs text-slate-500 ml-auto">
          {filteredReports.length} <span className="hidden sm:inline">reports</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="col-span-full p-12 text-center text-xs text-slate-400">
          Loading compiled reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No reports found</div>
          <p className="text-xs text-slate-500">
            {searchQuery || projectFilter !== "all"
              ? "Try adjusting your search or filter."
              : "Open a completed run and click Regenerate to create a report."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(rep => (
            <div
              key={rep.id}
              onClick={() => setActiveReport(rep)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 hover:border-indigo-400 dark:hover:border-indigo-700 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  {runProjectMap[rep.run_id] && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-medium truncate max-w-[100px]">
                      {runProjectMap[rep.run_id]}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {rep.format}
                  </span>
                </div>
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
                  href={`/runs/${rep.run_id}?tab=report`}
                  onClick={e => e.stopPropagation()}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
                  View Run <ChevronRight className="w-3 h-3" />
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    onClick={e => { e.stopPropagation(); setActiveReport(rep); }}
                    className="font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                    View Report
                  </button>
                  <button
                    onClick={e => handleDelete(rep.id, e)}
                    disabled={deletingId === rep.id}
                    title="Delete"
                    className="text-slate-400 hover:text-rose-500 disabled:opacity-40 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeReport && (
        <ReportModal report={activeReport} onClose={() => setActiveReport(null)} />
      )}
    </div>
  );
}
