"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { CityMarket } from "@/components/dashboard/WorldMapCanvas";
import { api } from "@/lib/api";
import type { Project, AnalysisRun } from "@/lib/types";
import {
  Folder,
  Play,
  BarChart2,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  ChevronDown,
} from "lucide-react";

const WorldMapCanvas = dynamic(
  () => import("@/components/dashboard/WorldMapCanvas"),
  { ssr: false }
);

const GLOBAL_MARKETS: CityMarket[] = [
  { id: "tokyo", name: "Tokyo", country: "Japan", flag: "🇯🇵", lng: 139.6503, lat: 35.6762, score: 82, opportunities: 6, recentRuns: 4, status: "high", momentum: "+14.2%", isPositive: true },
  { id: "seoul", name: "Seoul", country: "South Korea", flag: "🇰🇷", lng: 126.978, lat: 37.5665, score: 78, opportunities: 5, recentRuns: 3, status: "high", momentum: "+12.6%", isPositive: true },
  { id: "new-york", name: "New York", country: "USA", flag: "🇺🇸", lng: -74.006, lat: 40.7128, score: 74, opportunities: 7, recentRuns: 5, status: "high", momentum: "+11.8%", isPositive: true },
  { id: "berlin", name: "Berlin", country: "Germany", flag: "🇩🇪", lng: 13.405, lat: 52.52, score: 68, opportunities: 4, recentRuns: 2, status: "medium", momentum: "+8.4%", isPositive: true },
  { id: "singapore", name: "Singapore", country: "Singapore", flag: "🇸🇬", lng: 103.8198, lat: 1.3521, score: 65, opportunities: 4, recentRuns: 2, status: "medium", momentum: "+7.9%", isPositive: true },
  { id: "paris", name: "Paris", country: "France", flag: "🇫🇷", lng: 2.3522, lat: 48.8566, score: 62, opportunities: 3, recentRuns: 2, status: "medium", momentum: "+6.1%", isPositive: true },
  { id: "dubai", name: "Dubai", country: "UAE", flag: "🇦🇪", lng: 55.2708, lat: 25.2048, score: 58, opportunities: 3, recentRuns: 1, status: "low", momentum: "+5.3%", isPositive: true },
  { id: "sao-paulo", name: "São Paulo", country: "Brazil", flag: "🇧🇷", lng: -46.6333, lat: -23.5505, score: 51, opportunities: 2, recentRuns: 1, status: "low", momentum: "-2.8%", isPositive: false },
];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function verdictColor(verdict: string | null | undefined): string {
  const v = (verdict ?? "").toLowerCase();
  if (v === "launch" || v === "proceed") return "text-emerald-400";
  if (v === "adapt" || v === "caution") return "text-amber-400";
  if (v === "avoid" || v === "decline") return "text-rose-500";
  return "text-slate-400";
}

function statusBadge(status: string) {
  if (status === "completed")
    return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">Completed</span>;
  if (status === "running" || status === "in_progress")
    return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/40 text-blue-400 border border-blue-500/30">In Progress</span>;
  if (status === "failed")
    return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/40 text-rose-400 border border-rose-500/30">Failed</span>;
  return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
}

function projectStatusBadge(status: string | undefined) {
  if (!status || status === "draft")
    return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">Draft</span>;
  if (status === "completed" || status === "active")
    return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">Analysis Complete</span>;
  if (status === "running")
    return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-950/40 text-blue-400 border border-blue-500/30">In Progress</span>;
  return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
}

function projectInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState<CityMarket | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedMarketFilter, setSelectedMarketFilter] = useState("All Markets");
  const [selectedTrendCity, setSelectedTrendCity] = useState("Tokyo, Japan");
  const [selectedCategory, setSelectedCategory] = useState("Fashion");

  const [projects, setProjects] = useState<Project[]>([]);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const workspaces = await api.getWorkspaces();
        if (!workspaces.length) return;
        const wsId = workspaces[0].id;
        const [projs, wsRuns] = await Promise.all([
          api.getProjects(wsId),
          api.getWorkspaceRuns(wsId, 20),
        ]);
        setProjects(projs);
        setRuns(wsRuns);
      } catch {
        // fail silently — UI degrades gracefully
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derived stats
  const totalRuns = runs.length;
  const completedRuns = runs.filter(r => r.status === "completed").length;
  const inProgressRuns = runs.filter(r => r.status === "running" || r.status === "in_progress").length;
  const failedRuns = runs.filter(r => r.status === "failed").length;
  const queuedRuns = runs.filter(r => r.status === "queued" || r.status === "pending").length;

  const scores = runs
    .filter(r => r.status === "completed" && typeof r.overall_score === "number")
    .map(r => r.overall_score as number);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const launchRuns = runs.filter(r => {
    const v = (r.decision_verdict ?? "").toLowerCase();
    return v === "launch" || v === "proceed";
  }).length;
  const launchRate = completedRuns ? Math.round((launchRuns / completedRuns) * 100) : null;

  const recentProjects = [...projects].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ).slice(0, 4);

  const recentRuns = [...runs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  const renderSparklineBars = (colorClass: string, heights: number[]) => (
    <div className="flex items-end space-x-0.75 h-7">
      {heights.map((h, i) => (
        <span key={i} style={{ height: `${h}%` }} className={`w-1 rounded-xs transition-all duration-300 ${colorClass}`} />
      ))}
    </div>
  );

  // Donut chart math
  const circumference = 2 * Math.PI * 38; // 238.76
  const completedArc = totalRuns ? (completedRuns / totalRuns) * circumference : 0;
  const inProgressArc = totalRuns ? (inProgressRuns / totalRuns) * circumference : 0;
  const failedArc = totalRuns ? (failedRuns / totalRuns) * circumference : 0;

  const today = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-7 space-y-1.5">
          <p className="text-xs font-medium text-slate-400 tracking-wide">{today}</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Cultural intelligence for global opportunities.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-2xl">
            Analyse markets, understand cultural signals, and make confident expansion decisions with real-world taste data.
          </p>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Link href="/projects/new"
            className="group p-3.5 rounded-xl bg-[#0E1424] hover:bg-[#12192C] border border-[#1A2338] hover:border-slate-700/80 transition-all flex items-start justify-between cursor-pointer shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors">Start a new analysis</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                  Create a new project to evaluate a brand in any market using Qloo&apos;s cultural intelligence.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1 ml-2" />
          </Link>

          <Link href="/chat"
            className="group p-3.5 rounded-xl bg-[#0E1424] hover:bg-[#12192C] border border-[#1A2338] hover:border-slate-700/80 transition-all flex items-start justify-between cursor-pointer shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors">Ask AI Assistant</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                  Get insights, compare markets, or explore cultural trends.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1 ml-2" />
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs hover:border-slate-700/60 transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#141C38] border border-indigo-500/20 text-[#6366F1] flex items-center justify-center flex-shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Active Projects</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {loading ? "—" : projects.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">total in workspace</p>
            </div>
          </div>
          {renderSparklineBars("bg-indigo-500/80", [30, 45, 38, 60, 48, 75, 90, 85, 100])}
        </div>

        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs hover:border-slate-700/60 transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1D173C] border border-purple-500/20 text-[#8B5CF6] flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Analysis Runs</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {loading ? "—" : totalRuns}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{completedRuns} completed</p>
            </div>
          </div>
          {renderSparklineBars("bg-purple-500/80", [25, 40, 55, 45, 65, 80, 88, 95, 100])}
        </div>

        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs hover:border-slate-700/60 transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0E2336] border border-cyan-500/20 text-[#06B6D4] flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Average Cultural Fit</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {loading ? "—" : avgScore !== null ? `${avgScore}/100` : "—"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">across completed runs</p>
            </div>
          </div>
          {renderSparklineBars("bg-cyan-500/80", [45, 52, 60, 68, 62, 74, 82, 88, 92])}
        </div>

        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs hover:border-slate-700/60 transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B251E] border border-emerald-500/20 text-[#10B981] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Launch Readiness Rate</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {loading ? "—" : launchRate !== null ? `${launchRate}%` : "—"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">of completed analyses</p>
            </div>
          </div>
          {renderSparklineBars("bg-emerald-500/80", [20, 35, 45, 50, 62, 70, 78, 85, 94])}
        </div>
      </div>

      {/* 3. Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[6fr_3.5fr_2.5fr] gap-4">
        {/* 3A. World Map */}
        <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] p-5 flex flex-col justify-between shadow-xs relative overflow-hidden min-h-[460px]">
          <div className="flex items-start justify-between z-10">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Global Market Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Markets evaluated across all projects</p>
            </div>
            <div className="relative">
              <select value={selectedMarketFilter} onChange={e => setSelectedMarketFilter(e.target.value)}
                className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer">
                <option>All Markets</option>
                <option>Asia Pacific</option>
                <option>Europe</option>
                <option>North America</option>
                <option>Latin America</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          <WorldMapCanvas cities={GLOBAL_MARKETS} zoomLevel={zoomLevel} selectedCityId={selectedCity?.id ?? null} onSelectCity={setSelectedCity} />

          <div className="flex items-center justify-between pt-3 border-t border-[#161D2E] z-10">
            <div className="flex items-center space-x-1 bg-[#121828] border border-slate-800 rounded-lg p-0.5">
              <button type="button" onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors" title="Zoom In">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3 bg-slate-700/60" />
              <button type="button" onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors" title="Zoom Out">
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" /><span>High</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" /><span>Medium</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" /><span>Low</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full border border-blue-400 bg-blue-500/20" /><span>Under Analysis</span></span>
            </div>
          </div>
        </div>

        {/* 3B. Top Markets */}
        <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-[#161D2E]">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Top Markets by Opportunity</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Based on cultural fit, momentum and market signals.</p>
              </div>
              <Link href="/projects" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5">
                <span>View all</span><ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-12 text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 border-b border-[#161D2E]">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Market</span>
              <span className="col-span-4">Cultural Fit</span>
              <span className="col-span-3 text-right">Momentum</span>
            </div>

            <div className="divide-y divide-[#141B2D]">
              {GLOBAL_MARKETS.map((m, idx) => {
                const barColor = m.score >= 70 ? "bg-emerald-400" : m.score >= 60 ? "bg-amber-400" : "bg-rose-500";
                return (
                  <div key={m.id} onClick={() => setSelectedCity(m)}
                    className="grid grid-cols-12 items-center py-2 text-xs hover:bg-[#12192B] rounded px-1 cursor-pointer transition-colors">
                    <span className="col-span-1 text-slate-500 font-mono text-[11px]">{idx + 1}</span>
                    <span className="col-span-4 font-medium text-slate-200 truncate pr-1">{m.name}, {m.country}</span>
                    <div className="col-span-4 flex items-center space-x-2 pr-1">
                      <div className="flex-1 h-1.5 rounded-full bg-[#1A2338] overflow-hidden">
                        <div style={{ width: `${m.score}%` }} className={`h-full rounded-full ${barColor}`} />
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-white w-5 text-right">{m.score}</span>
                    </div>
                    <div className="col-span-3 flex items-center justify-end space-x-1 text-right">
                      {m.isPositive ? <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <TrendingDown className="w-3 h-3 text-rose-500 flex-shrink-0" />}
                      <span className={`text-[11px] font-semibold font-mono ${m.isPositive ? "text-emerald-400" : "text-rose-500"}`}>{m.momentum}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3C. Right stack */}
        <div className="flex flex-col space-y-4">
          {/* Donut chart */}
          <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] p-4.5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#161D2E]">
              <h2 className="text-xs font-bold text-white tracking-tight">Analysis Run Status</h2>
              <Link href="/observability" className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5">
                <span>View all</span><ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#161F33" strokeWidth="10" />
                  {totalRuns > 0 && <>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="10"
                      strokeDasharray={`${completedArc} ${circumference}`} strokeDashoffset="0" className="transition-all duration-500" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="10"
                      strokeDasharray={`${inProgressArc} ${circumference}`} strokeDashoffset={`-${completedArc}`} />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="10"
                      strokeDasharray={`${failedArc} ${circumference}`} strokeDashoffset={`-${completedArc + inProgressArc}`} />
                  </>}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-extrabold text-white leading-tight">{loading ? "—" : totalRuns}</span>
                  <span className="text-[9px] text-slate-400 font-medium">Total Runs</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-slate-400">Completed</span>
                  <span className="text-[11px] font-bold text-white ml-auto">{loading ? "—" : completedRuns}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[11px] text-slate-400">In Progress</span>
                  <span className="text-[11px] font-bold text-white ml-auto">{loading ? "—" : inProgressRuns}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[11px] text-slate-400">Failed</span>
                  <span className="text-[11px] font-bold text-white ml-auto">{loading ? "—" : failedRuns}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-[11px] text-slate-400">Queued</span>
                  <span className="text-[11px] font-bold text-white ml-auto">{loading ? "—" : queuedRuns}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] p-4.5 shadow-xs flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#161D2E]">
              <h2 className="text-xs font-bold text-white tracking-tight">Recent Projects</h2>
              <Link href="/projects" className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5">
                <span>View all</span><ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 pt-3">
              {loading ? (
                <div className="py-4 text-center text-[11px] text-slate-600">Loading…</div>
              ) : recentProjects.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-slate-600">No projects yet</div>
              ) : recentProjects.map(proj => {
                const markets = (proj.candidate_markets ?? proj.markets ?? []).map(m => m.name).slice(0, 3).join(", ");
                const initials = projectInitials(proj.name);
                return (
                  <Link key={proj.id} href={`/projects/${proj.id}`} className="flex items-center justify-between hover:opacity-80 transition-opacity">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-[10px] flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-white truncate max-w-[120px]">{proj.name}</h3>
                        <p className="text-[10px] text-slate-400">{markets || "No markets"}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      {projectStatusBadge(proj.status)}
                      <p className="text-[9px] text-slate-500 mt-0.5">{formatRelativeTime(proj.updated_at)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 4A. Recent Analysis Runs */}
        <div className="lg:col-span-7 rounded-xl bg-[#0E1424] border border-[#1A2338] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#161D2E]">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Recent Analysis Runs</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest analysis results across all projects.</p>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5">
              <span>View all</span><ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs mt-2">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-[#161D2E]">
                  <th className="py-2.5 font-medium">Project</th>
                  <th className="py-2.5 font-medium">Winner</th>
                  <th className="py-2.5 font-medium">Score</th>
                  <th className="py-2.5 font-medium">Verdict</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141B2D]">
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-[11px] text-slate-600">Loading…</td></tr>
                ) : recentRuns.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-[11px] text-slate-600">No runs yet</td></tr>
                ) : recentRuns.map(run => {
                  const winner = run.result_summary_json?.winner_market
                    ?? run.result_summary_json?.comparative_matrix?.winner_market
                    ?? "—";
                  const score = typeof run.overall_score === "number" ? `${run.overall_score}/100` : "—";
                  const verdict = run.decision_verdict ?? run.result_summary_json?.decisions?.winner_posture ?? "—";
                  return (
                    <tr key={run.id} className="hover:bg-[#12192B] transition-colors">
                      <td className="py-3 font-semibold text-white max-w-[140px] truncate">
                        <Link href={`/runs/${run.id}`} className="hover:text-indigo-300 transition-colors">
                          {run.input_snapshot_json?.brand_name ?? `Run ${run.id.slice(0, 6)}`}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-300">{winner}</td>
                      <td className="py-3 font-mono font-semibold text-white">{score}</td>
                      <td className="py-3">
                        <span className={`font-semibold text-xs ${verdictColor(verdict)}`}>
                          {verdict !== "—" ? `◆ ${verdict}` : "—"}
                        </span>
                      </td>
                      <td className="py-3">{statusBadge(run.status)}</td>
                      <td className="py-3 text-slate-400 text-[11px]">{formatRelativeTime(run.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4B. Cultural Trend Momentum */}
        <div className="lg:col-span-5 rounded-xl bg-[#0E1424] border border-[#1A2338] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#161D2E]">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Cultural Trend Momentum</h2>
                <p className="text-xs text-slate-400 mt-0.5">Historical trend and 6-month predictive growth curve.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <select value={selectedTrendCity} onChange={e => setSelectedTrendCity(e.target.value)}
                    className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-2.5 pr-6 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer">
                    <option>Tokyo, Japan</option>
                    <option>Seoul, South Korea</option>
                    <option>New York, USA</option>
                    <option>Berlin, Germany</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                    className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-2.5 pr-6 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer">
                    <option>Fashion</option>
                    <option>Beauty</option>
                    <option>Food &amp; Bev</option>
                    <option>Consumer Tech</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-3 pb-1 text-xs">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-3 h-0.5 bg-[#818CF8]" /><span className="text-[11px]">Historical</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-3 h-0.5 border-b border-dashed border-[#818CF8]" /><span className="text-[11px]">Predicted</span>
              </span>
            </div>

            <div className="relative w-full h-56 pt-2 select-none">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 620 200">
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <text x="-100" y="12" transform="rotate(-90)" className="fill-slate-500 text-[10px] font-sans font-medium">Cultural Momentum Index</text>
                {[{ val: 100, y: 20 }, { val: 80, y: 55 }, { val: 60, y: 90 }, { val: 40, y: 125 }, { val: 20, y: 160 }, { val: 0, y: 195 }].map(tick => (
                  <g key={tick.val}>
                    <text x="32" y={tick.y + 4} className="fill-slate-500 text-[10px] font-mono text-right">{tick.val}</text>
                    <line x1="45" y1={tick.y} x2="610" y2={tick.y} stroke="#161D2E" strokeWidth="1" />
                  </g>
                ))}
                <polygon points="45,195 45,178 95,160 145,150 195,152 245,151 295,138 345,110 395,95 445,88 495,78 545,68 595,50 595,195" fill="url(#purpleGradient)" />
                <path d="M 45,178 C 70,169 80,165 95,160 C 120,152 130,152 145,150 C 170,147 180,154 195,152 C 220,149 230,153 245,151 C 270,148 280,142 295,138 C 320,132 330,118 345,110 C 370,98 380,98 395,95" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 395,95 C 420,92 430,90 445,88 C 470,85 480,82 495,78 C 520,72 530,72 545,68 C 570,62 580,56 595,50" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeDasharray="5,4" strokeLinecap="round" />
                {[{ x: 45, y: 178 }, { x: 95, y: 160 }, { x: 145, y: 150 }, { x: 195, y: 152 }, { x: 245, y: 151 }, { x: 295, y: 138 }, { x: 345, y: 110 }, { x: 395, y: 95 }, { x: 445, y: 88 }, { x: 495, y: 78 }, { x: 545, y: 68 }, { x: 595, y: 50 }].map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r={i === 7 ? "4.5" : "3"} fill={i >= 7 ? "#A5B4FC" : "#818CF8"} stroke="#0B0F19" strokeWidth="2" className="cursor-pointer" />
                ))}
                <g transform="translate(480, 24)">
                  <rect x="0" y="0" width="112" height="24" rx="6" fill="#121829" stroke="#2A3859" strokeWidth="1" />
                  <text x="56" y="16" textAnchor="middle" className="fill-white text-[10px] font-bold font-mono">+14.2% predicted</text>
                </g>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                  <text key={m} x={45 + i * 50} y="212" textAnchor="middle" className="fill-slate-500 text-[10px] font-medium">{m}</text>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
