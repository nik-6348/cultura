"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { CityMarket } from "@/components/dashboard/WorldMapCanvas";
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
  MoreVertical,
  ChevronDown,
} from "lucide-react";

// The map's projection math (d3-geo trig) can round a few ULPs differently
// between Node (SSR) and the browser, which React flags as a hydration
// mismatch. It's a client-only visualization anyway, so skip SSR for it.
const WorldMapCanvas = dynamic(
  () => import("@/components/dashboard/WorldMapCanvas"),
  { ssr: false }
);

const GLOBAL_MARKETS: CityMarket[] = [
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    lng: 139.6503,
    lat: 35.6762,
    score: 82,
    opportunities: 6,
    recentRuns: 4,
    status: "high",
    momentum: "+14.2%",
    isPositive: true,
  },
  {
    id: "seoul",
    name: "Seoul",
    country: "South Korea",
    flag: "🇰🇷",
    lng: 126.978,
    lat: 37.5665,
    score: 78,
    opportunities: 5,
    recentRuns: 3,
    status: "high",
    momentum: "+12.6%",
    isPositive: true,
  },
  {
    id: "new-york",
    name: "New York",
    country: "USA",
    flag: "🇺🇸",
    lng: -74.006,
    lat: 40.7128,
    score: 74,
    opportunities: 7,
    recentRuns: 5,
    status: "high",
    momentum: "+11.8%",
    isPositive: true,
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    flag: "🇩🇪",
    lng: 13.405,
    lat: 52.52,
    score: 68,
    opportunities: 4,
    recentRuns: 2,
    status: "medium",
    momentum: "+8.4%",
    isPositive: true,
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    flag: "🇸🇬",
    lng: 103.8198,
    lat: 1.3521,
    score: 65,
    opportunities: 4,
    recentRuns: 2,
    status: "medium",
    momentum: "+7.9%",
    isPositive: true,
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    flag: "🇫🇷",
    lng: 2.3522,
    lat: 48.8566,
    score: 62,
    opportunities: 3,
    recentRuns: 2,
    status: "medium",
    momentum: "+6.1%",
    isPositive: true,
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    lng: 55.2708,
    lat: 25.2048,
    score: 58,
    opportunities: 3,
    recentRuns: 1,
    status: "low",
    momentum: "+5.3%",
    isPositive: true,
  },
  {
    id: "sao-paulo",
    name: "São Paulo",
    country: "Brazil",
    flag: "🇧🇷",
    lng: -46.6333,
    lat: -23.5505,
    score: 51,
    opportunities: 2,
    recentRuns: 1,
    status: "low",
    momentum: "-2.8%",
    isPositive: false,
  },
];

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState<CityMarket | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedMarketFilter, setSelectedMarketFilter] = useState("All Markets");
  const [selectedTrendCity, setSelectedTrendCity] = useState("Tokyo, Japan");
  const [selectedCategory, setSelectedCategory] = useState("Fashion");

  // Mini Sparkline Bar Chart Generator
  const renderSparklineBars = (colorClass: string, heights: number[]) => (
    <div className="flex items-end space-x-0.75 h-7">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%` }}
          className={`w-1 rounded-xs transition-all duration-300 ${colorClass}`}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Section: Date, Title, Subtitle + 2 Quick Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left Headline */}
        <div className="lg:col-span-7 space-y-1.5">
          <p className="text-xs font-medium text-slate-400 tracking-wide">
            Tuesday, 22 April 2025
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Cultural intelligence for global opportunities.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-2xl">
            Analyse markets, understand cultural signals, and make confident expansion decisions with real-world taste data.
          </p>
        </div>

        {/* Right 2 Quick Action Cards */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Start a new analysis */}
          <Link
            href="/projects/new"
            className="group p-3.5 rounded-xl bg-[#0E1424] hover:bg-[#12192C] border border-[#1A2338] hover:border-slate-700/80 transition-all flex items-start justify-between cursor-pointer shadow-xs"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors">
                  Start a new analysis
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                  Create a new project to evaluate a brand in any market using Qloo&apos;s cultural intelligence.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1 ml-2" />
          </Link>

          {/* Card 2: Ask AI Assistant */}
          <Link
            href="/chat"
            className="group p-3.5 rounded-xl bg-[#0E1424] hover:bg-[#12192C] border border-[#1A2338] hover:border-slate-700/80 transition-all flex items-start justify-between cursor-pointer shadow-xs"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors">
                  Ask AI Assistant
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                  Get insights, compare markets, or explore cultural trends.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1 ml-2" />
          </Link>
        </div>
      </div>

      {/* 2. KPI Metric Cards Row (4 Cards across) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Active Projects */}
        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs hover:border-slate-700/60 transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#141C38] border border-indigo-500/20 text-[#6366F1] flex items-center justify-center flex-shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Active Projects</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">24</span>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                  ↑ 33%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">vs last month</p>
            </div>
          </div>
          {renderSparklineBars("bg-indigo-500/80", [30, 45, 38, 60, 48, 75, 90, 85, 100])}
        </div>

        {/* Stat 2: Analysis Runs */}
        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs hover:border-slate-700/60 transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1D173C] border border-purple-500/20 text-[#8B5CF6] flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Analysis Runs</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">142</span>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                  ↑ 75%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">vs last month</p>
            </div>
          </div>
          {renderSparklineBars("bg-purple-500/80", [25, 40, 55, 45, 65, 80, 88, 95, 100])}
        </div>

        {/* Stat 3: Average Cultural Fit */}
        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs hover:border-slate-700/60 transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0E2336] border border-cyan-500/20 text-[#06B6D4] flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Average Cultural Fit</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">78.4%</span>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                  ↑ 12%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">vs last month</p>
            </div>
          </div>
          {renderSparklineBars("bg-cyan-500/80", [45, 52, 60, 68, 62, 74, 82, 88, 92])}
        </div>

        {/* Stat 4: Launch Readiness Rate */}
        <div className="p-4 rounded-xl bg-[#0E1424] border border-[#1A2338] flex items-center justify-between shadow-xs hover:border-slate-700/60 transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B251E] border border-emerald-500/20 text-[#10B981] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Launch Readiness Rate</p>
              <div className="flex items-baseline space-x-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">64%</span>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                  ↑ 18%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">vs last month</p>
            </div>
          </div>
          {renderSparklineBars("bg-emerald-500/80", [20, 35, 45, 50, 62, 70, 78, 85, 94])}
        </div>
      </div>

      {/* 3. Middle Grid:
          - Left: Global Market Overview (Interactive Vector World Map)
          - Middle: Top Markets by Opportunity
          - Right: Analysis Run Status & Recent Projects
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[6fr_3.5fr_2.5fr] gap-4">
        {/* 3A. Global Market Overview (Col span 6) */}
        <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] p-5 flex flex-col justify-between shadow-xs relative overflow-hidden min-h-[460px]">
          {/* Header & Filter */}
          <div className="flex items-start justify-between z-10">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Global Market Overview
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Markets evaluated across all projects
              </p>
            </div>

            <div className="relative">
              <select
                value={selectedMarketFilter}
                onChange={(e) => setSelectedMarketFilter(e.target.value)}
                className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option>All Markets</option>
                <option>Asia Pacific</option>
                <option>Europe</option>
                <option>North America</option>
                <option>Latin America</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Interactive World Map Canvas (real country geometry, equal-earth projection) */}
          <WorldMapCanvas
            cities={GLOBAL_MARKETS}
            zoomLevel={zoomLevel}
            selectedCityId={selectedCity?.id ?? null}
            onSelectCity={setSelectedCity}
          />

          {/* Bottom Toolbar: Zoom Controls & Legend */}
          <div className="flex items-center justify-between pt-3 border-t border-[#161D2E] z-10">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-[#121828] border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6))}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3 bg-slate-700/60" />
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(prev - 0.15, 0.85))}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Map Legend */}
            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                <span>High</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                <span>Medium</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <span>Low</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-blue-400 bg-blue-500/20" />
                <span>Under Analysis</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3B. Top Markets by Opportunity (Col span 3.5) */}
        <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#161D2E]">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Top Markets by Opportunity
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Based on cultural fit, momentum and market signals.
                </p>
              </div>
              <Link
                href="/projects"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 border-b border-[#161D2E]">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Market</span>
              <span className="col-span-4">Cultural Fit</span>
              <span className="col-span-3 text-right">Momentum</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#141B2D]">
              {GLOBAL_MARKETS.map((m, idx) => {
                const barColor =
                  m.score >= 70
                    ? "bg-emerald-400"
                    : m.score >= 60
                    ? "bg-amber-400"
                    : "bg-rose-500";

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedCity(m)}
                    className="grid grid-cols-12 items-center py-2 text-xs hover:bg-[#12192B] rounded px-1 cursor-pointer transition-colors"
                  >
                    {/* Rank */}
                    <span className="col-span-1 text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </span>

                    {/* Market Name */}
                    <span className="col-span-4 font-medium text-slate-200 truncate pr-1">
                      {m.name}, {m.country}
                    </span>

                    {/* Progress Bar & Score */}
                    <div className="col-span-4 flex items-center space-x-2 pr-1">
                      <div className="flex-1 h-1.5 rounded-full bg-[#1A2338] overflow-hidden">
                        <div
                          style={{ width: `${m.score}%` }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-white w-5 text-right">
                        {m.score}
                      </span>
                    </div>

                    {/* Momentum */}
                    <div className="col-span-3 flex items-center justify-end space-x-1 text-right">
                      {m.isPositive ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-rose-500 flex-shrink-0" />
                      )}
                      <span
                        className={`text-[11px] font-semibold font-mono ${
                          m.isPositive ? "text-emerald-400" : "text-rose-500"
                        }`}
                      >
                        {m.momentum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3C. Right Stack: Analysis Run Status & Recent Projects (Col span 2.5) */}
        <div className="flex flex-col space-y-4">
          {/* Card 1: Analysis Run Status (Donut Chart) */}
          <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] p-4.5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#161D2E]">
              <h2 className="text-xs font-bold text-white tracking-tight">
                Analysis Run Status
              </h2>
              <Link
                href="/observability"
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center justify-between pt-3">
              {/* SVG Donut Chart */}
              <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#161F33"
                    strokeWidth="10"
                  />
                  {/* Segment: Completed (98/142 = 69%) -> strokeDasharray="164.8 238.7" */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="10"
                    strokeDasharray="164.7 238.7"
                    strokeDashoffset="0"
                    className="transition-all duration-500"
                  />
                  {/* Segment: In Progress (24/142 = 17%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="10"
                    strokeDasharray="40.3 238.7"
                    strokeDashoffset="-164.7"
                  />
                  {/* Segment: Queued (12/142 = 8.5%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="10"
                    strokeDasharray="20.2 238.7"
                    strokeDashoffset="-205"
                  />
                  {/* Segment: Failed (8/142 = 5.6%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="10"
                    strokeDasharray="13.5 238.7"
                    strokeDashoffset="-225.2"
                  />
                </svg>

                {/* Donut Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-extrabold text-white leading-tight">
                    142
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    Total Runs
                  </span>
                </div>
              </div>

              {/* Legend with counts */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-slate-400">Completed</span>
                  <span className="text-[11px] font-bold text-white ml-auto">98</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[11px] text-slate-400">In Progress</span>
                  <span className="text-[11px] font-bold text-white ml-auto">24</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[11px] text-slate-400">Failed</span>
                  <span className="text-[11px] font-bold text-white ml-auto">8</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-[11px] text-slate-400">Queued</span>
                  <span className="text-[11px] font-bold text-white ml-auto">12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Recent Projects */}
          <div className="rounded-xl bg-[#0E1424] border border-[#1A2338] p-4.5 shadow-xs flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#161D2E]">
              <h2 className="text-xs font-bold text-white tracking-tight">
                Recent Projects
              </h2>
              <Link
                href="/projects"
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 pt-3">
              {/* Project 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-600/30 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                    👕
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Acme Streetwear Expansion
                    </h3>
                    <p className="text-[10px] text-slate-400">Tokyo, Seoul, Singapore</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                    Analysis Complete
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">2 hours ago</p>
                </div>
              </div>

              {/* Project 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-950/40 border border-pink-600/30 flex items-center justify-center text-pink-400 font-bold text-xs flex-shrink-0">
                    💄
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Lume Beauty Global Launch
                    </h3>
                    <p className="text-[10px] text-slate-400">Paris, Berlin, London</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-950/40 text-blue-400 border border-blue-500/30">
                    In Progress
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">1 day ago</p>
                </div>
              </div>

              {/* Project 3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-600/30 flex items-center justify-center text-emerald-400 font-bold text-xs flex-shrink-0">
                    🥤
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Nexa Food & Beverage
                    </h3>
                    <p className="text-[10px] text-slate-400">Bangkok, Jakarta, Manila</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                    Analysis Complete
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">3 days ago</p>
                </div>
              </div>

              {/* Project 4 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                    🎧
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Vertex Tech Market Entry
                    </h3>
                    <p className="text-[10px] text-slate-400">San Francisco, New York</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    Draft
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">4 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row:
          - Left: Recent Analysis Runs (Detailed Table)
          - Right: Cultural Trend Momentum (Interactive Line Graph)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 4A. Recent Analysis Runs (Col span 7) */}
        <div className="lg:col-span-7 rounded-xl bg-[#0E1424] border border-[#1A2338] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#161D2E]">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Recent Analysis Runs
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest analysis results across all projects.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs mt-2">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-[#161D2E]">
                  <th className="py-2.5 font-medium">Project</th>
                  <th className="py-2.5 font-medium">Market</th>
                  <th className="py-2.5 font-medium">Cultural Fit</th>
                  <th className="py-2.5 font-medium">Verdict</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium">Completed</th>
                  <th className="py-2.5 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141B2D]">
                {/* Row 1 */}
                <tr className="hover:bg-[#12192B] transition-colors">
                  <td className="py-3 font-semibold text-white">
                    Acme Streetwear Expansion
                  </td>
                  <td className="py-3 text-slate-300">Tokyo</td>
                  <td className="py-3 font-mono font-semibold text-white">82/100</td>
                  <td className="py-3">
                    <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold text-xs">
                      <span>◆</span>
                      <span>Launch</span>
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                      Completed
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">2 hours ago</td>
                  <td className="py-3 text-right">
                    <button className="text-slate-500 hover:text-slate-300 p-1">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-[#12192B] transition-colors">
                  <td className="py-3 font-semibold text-white">
                    Lume Beauty Global Launch
                  </td>
                  <td className="py-3 text-slate-300">Paris</td>
                  <td className="py-3 font-mono font-semibold text-white">68/100</td>
                  <td className="py-3">
                    <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold text-xs">
                      <span>◆</span>
                      <span>Adapt</span>
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                      Completed
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">1 day ago</td>
                  <td className="py-3 text-right">
                    <button className="text-slate-500 hover:text-slate-300 p-1">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-[#12192B] transition-colors">
                  <td className="py-3 font-semibold text-white">
                    Nexa Food & Beverage
                  </td>
                  <td className="py-3 text-slate-300">Bangkok</td>
                  <td className="py-3 font-mono font-semibold text-white">42/100</td>
                  <td className="py-3">
                    <span className="inline-flex items-center space-x-1 text-rose-500 font-semibold text-xs">
                      <span>◆</span>
                      <span>Avoid</span>
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                      Completed
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">3 days ago</td>
                  <td className="py-3 text-right">
                    <button className="text-slate-500 hover:text-slate-300 p-1">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-[#12192B] transition-colors">
                  <td className="py-3 font-semibold text-white">
                    Vertex Tech Market Entry
                  </td>
                  <td className="py-3 text-slate-300">San Francisco</td>
                  <td className="py-3 font-mono font-semibold text-white">76/100</td>
                  <td className="py-3">
                    <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold text-xs">
                      <span>◆</span>
                      <span>Launch</span>
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                      Completed
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">4 days ago</td>
                  <td className="py-3 text-right">
                    <button className="text-slate-500 hover:text-slate-300 p-1">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-[#12192B] transition-colors">
                  <td className="py-3 font-semibold text-white">
                    Orbit Lifestyle
                  </td>
                  <td className="py-3 text-slate-300">Dubai</td>
                  <td className="py-3 font-mono font-semibold text-white">61/100</td>
                  <td className="py-3">
                    <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold text-xs">
                      <span>◆</span>
                      <span>Adapt</span>
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                      Completed
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">5 days ago</td>
                  <td className="py-3 text-right">
                    <button className="text-slate-500 hover:text-slate-300 p-1">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4B. Cultural Trend Momentum (Col span 5) */}
        <div className="lg:col-span-5 rounded-xl bg-[#0E1424] border border-[#1A2338] p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#161D2E]">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Cultural Trend Momentum
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical trend and 6-month predictive growth curve.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <select
                    value={selectedTrendCity}
                    onChange={(e) => setSelectedTrendCity(e.target.value)}
                    className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-2.5 pr-6 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option>Tokyo, Japan</option>
                    <option>Seoul, South Korea</option>
                    <option>New York, USA</option>
                    <option>Berlin, Germany</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none bg-[#141B2D] border border-slate-700/60 rounded-lg text-xs text-slate-300 pl-2.5 pr-6 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option>Fashion</option>
                    <option>Beauty</option>
                    <option>Food & Bev</option>
                    <option>Consumer Tech</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end space-x-4 pt-3 pb-1 text-xs">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-3 h-0.5 bg-[#818CF8]" />
                <span className="text-[11px]">Historical</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-3 h-0.5 border-b border-dashed border-[#818CF8]" />
                <span className="text-[11px]">Predicted</span>
              </span>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full h-56 pt-2 select-none">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 620 200">
                <defs>
                  {/* Purple/Indigo gradient area fill */}
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Label Rotated */}
                <text
                  x="-100"
                  y="12"
                  transform="rotate(-90)"
                  className="fill-slate-500 text-[10px] font-sans font-medium"
                >
                  Cultural Momentum Index
                </text>

                {/* Y-Axis Grid Lines & Values */}
                {[
                  { val: 100, y: 20 },
                  { val: 80, y: 55 },
                  { val: 60, y: 90 },
                  { val: 40, y: 125 },
                  { val: 20, y: 160 },
                  { val: 0, y: 195 },
                ].map((tick) => (
                  <g key={tick.val}>
                    <text
                      x="32"
                      y={tick.y + 4}
                      className="fill-slate-500 text-[10px] font-mono text-right"
                    >
                      {tick.val}
                    </text>
                    <line
                      x1="45"
                      y1={tick.y}
                      x2="610"
                      y2={tick.y}
                      stroke="#161D2E"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* Gradient Area Fill */}
                <polygon
                  points="45,195 45,178 95,160 145,150 195,152 245,151 295,138 345,110 395,95 445,88 495,78 545,68 595,50 595,195"
                  fill="url(#purpleGradient)"
                />

                {/* Historical Curve (Jan - Jul) Solid Line */}
                <path
                  d="M 45,178 C 70,169 80,165 95,160 C 120,152 130,152 145,150 C 170,147 180,154 195,152 C 220,149 230,153 245,151 C 270,148 280,142 295,138 C 320,132 330,118 345,110 C 370,98 380,98 395,95"
                  fill="none"
                  stroke="#818CF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Predicted Curve (Jul - Dec) Dashed Line */}
                <path
                  d="M 395,95 C 420,92 430,90 445,88 C 470,85 480,82 495,78 C 520,72 530,72 545,68 C 570,62 580,56 595,50"
                  fill="none"
                  stroke="#818CF8"
                  strokeWidth="2.5"
                  strokeDasharray="5,4"
                  strokeLinecap="round"
                />

                {/* Data Points on Nodes */}
                {[
                  { x: 45, y: 178 },
                  { x: 95, y: 160 },
                  { x: 145, y: 150 },
                  { x: 195, y: 152 },
                  { x: 245, y: 151 },
                  { x: 295, y: 138 },
                  { x: 345, y: 110 },
                  { x: 395, y: 95 },
                  { x: 445, y: 88 },
                  { x: 495, y: 78 },
                  { x: 545, y: 68 },
                  { x: 595, y: 50 },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={i === 7 ? "4.5" : "3"}
                    fill={i >= 7 ? "#A5B4FC" : "#818CF8"}
                    stroke="#0B0F19"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-5 transition-all"
                  />
                ))}

                {/* Floating Prediction Callout Badge above Oct/Nov */}
                <g transform="translate(480, 24)">
                  <rect
                    x="0"
                    y="0"
                    width="112"
                    height="24"
                    rx="6"
                    fill="#121829"
                    stroke="#2A3859"
                    strokeWidth="1"
                  />
                  <text
                    x="56"
                    y="16"
                    textAnchor="middle"
                    className="fill-white text-[10px] font-bold font-mono"
                  >
                    +14.2% predicted
                  </text>
                </g>

                {/* X-Axis Month Labels */}
                {[
                  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ].map((m, i) => {
                  const x = 45 + i * 50;
                  return (
                    <text
                      key={m}
                      x={x}
                      y="212"
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px] font-medium"
                    >
                      {m}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
