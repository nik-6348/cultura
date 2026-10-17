"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, Globe2 } from "lucide-react";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { cn } from "@/lib/utils";

export interface MarketRankingData {
  id: string;
  name: string;
  country: string;
  countryCode?: string;
  flagEmoji?: string;
  score: number; // 0 to 1
  verdict: "launch" | "adapt" | "avoid";
  dimensions: {
    brand_affinity: number;
    audience_overlap: number;
    category_ecosystem: number;
    cultural_momentum: number;
    evidence_coverage: number;
  };
  strengths?: string[];
  risks?: string[];
}

interface CompatibilityMatrixChartProps {
  markets: MarketRankingData[];
  threshold?: number; // default 0.75
  className?: string;
  onSelectMarket?: (market: MarketRankingData) => void;
}

export function CompatibilityMatrixChart({
  markets,
  threshold = 0.75,
  className,
  onSelectMarket,
}: CompatibilityMatrixChartProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    markets[0]?.id || null
  );

  if (!markets || markets.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No market comparisons available
      </div>
    );
  }

  // Sort descending by score
  const sorted = [...markets].sort((a, b) => b.score - a.score);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Threshold Guide */}
      <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
        <span>Market Entry Comparative Matrix</span>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Readiness Threshold: &gt; {Math.round(threshold * 100)}%</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {sorted.map((m, idx) => {
          const isExpanded = expandedId === m.id;
          const scorePct = (m.score * 100).toFixed(1);
          const isWinner = idx === 0;

          return (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border transition-all duration-200 overflow-hidden",
                isWinner
                  ? "border-indigo-200/90 dark:border-indigo-800/80 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs"
                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
              )}
            >
              {/* Header Row */}
              <div
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                onClick={() => {
                  setExpandedId(isExpanded ? null : m.id);
                  if (onSelectMarket) onSelectMarket(m);
                }}
              >
                {/* Left: Rank & Flag & Name */}
                <div className="flex items-center space-x-3 min-w-0">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0",
                      isWinner
                        ? "bg-indigo-600 text-white"
                        : idx === 1
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}
                  >
                    #{idx + 1}
                  </span>

                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="text-base" role="img" aria-label={m.country}>
                        {m.flagEmoji || "🌐"}
                      </span>
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {m.name}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        {m.country}
                      </span>
                      {isWinner && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          Recommended
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Score Bar & Verdict Badge & Toggle */}
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="w-24 sm:w-36 hidden sm:block">
                    <div className="flex justify-between text-[11px] font-mono font-semibold mb-1">
                      <span className="text-slate-400">Score</span>
                      <span className="text-slate-800 dark:text-slate-200">{scorePct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      {/* Threshold marker line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                        style={{ left: `${threshold * 100}%` }}
                      />
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          m.score >= threshold
                            ? "bg-gradient-to-r from-emerald-500 to-indigo-600"
                            : m.score >= 0.6
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        )}
                        style={{ width: `${scorePct}%` }}
                      />
                    </div>
                  </div>

                  <span className="sm:hidden font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {scorePct}%
                  </span>

                  <VerdictBadge verdict={m.verdict} size="sm" />

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expandable Dimension Breakdown */}
              {isExpanded && (
                <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    5-Dimension Score Decomposition:
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] text-slate-400 truncate">Brand Affinity</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {(m.dimensions.brand_affinity * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] text-slate-400 truncate">Audience Overlap</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {(m.dimensions.audience_overlap * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] text-slate-400 truncate">Ecosystem Density</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {(m.dimensions.category_ecosystem * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] text-slate-400 truncate">Trend Momentum</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {(m.dimensions.cultural_momentum * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 truncate">Evidence Coverage</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {(m.dimensions.evidence_coverage * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {(m.strengths || m.risks) && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {m.strengths && m.strengths.length > 0 && (
                        <div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                            Key Catalysts:
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                            {m.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {m.risks && m.risks.length > 0 && (
                        <div>
                          <div className="font-semibold text-rose-600 dark:text-rose-400 mb-1">
                            Contextual Friction:
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                            {m.risks.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
