"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Database, CheckCircle2, Clock, Sparkles,
  BarChart3, Sliders, Cpu, FileText, Download, Copy, Check,
  TrendingUp, XCircle, ChevronRight, MapPin,
  Activity, Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  AnalysisRun, DecisionRecord, EvidenceRecord,
  RankedMarketItem, ReportRecord, RunStep, StrategyRecommendation,
} from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { cn, formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DimScore {
  raw_score: number;
  weighted_score: number;
  weight: number;
  explanation?: string;
  evidence_ids?: string[];
}

interface MarketDecision {
  posture: string;
  posture_confidence: number;
  posture_probabilities?: { launch?: number; adapt?: number; avoid?: number };
  evidence_sufficiency?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number | undefined, decimals = 0) {
  if (v === undefined || v === null) return "—";
  const n = v > 1 ? v : v * 100;
  return `${n.toFixed(decimals)}%`;
}

function scoreColor(v: number): string {
  if (v >= 0.80) return "#6366F1";
  if (v >= 0.65) return "#F59E0B";
  return "#EF4444";
}

function verdictColor(v: string): string {
  const lv = v?.toLowerCase();
  if (lv === "launch") return "#10B981";
  if (lv === "adapt")  return "#F59E0B";
  return "#EF4444";
}

function getMarketFlag(name: string): string {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("tokyo") || n.includes("japan"))      return "🇯🇵";
  if (n.includes("berlin") || n.includes("germany"))    return "🇩🇪";
  if (n.includes("seoul") || n.includes("korea"))       return "🇰🇷";
  if (n.includes("london") || n.includes("uk"))         return "🇬🇧";
  if (n.includes("paris") || n.includes("france"))      return "🇫🇷";
  if (n.includes("new york") || n.includes("usa"))      return "🇺🇸";
  if (n.includes("singapore"))                          return "🇸🇬";
  if (n.includes("bangkok") || n.includes("thailand"))  return "🇹🇭";
  if (n.includes("jakarta") || n.includes("indonesia")) return "🇮🇩";
  if (n.includes("sydney") || n.includes("australia"))  return "🇦🇺";
  if (n.includes("dubai"))                               return "🇦🇪";
  return "🌐";
}

const DIM_LABELS: Record<string, { label: string; uiLabel: string; color: string }> = {
  brand_affinity:     { label: "Brand Affinity",       uiLabel: "Brand Affinity",     color: "#6366F1" },
  category_ecosystem: { label: "Category Ecosystem",   uiLabel: "Market Opportunity", color: "#22D3EE" },
  audience_overlap:   { label: "Audience Overlap",     uiLabel: "Consumer Interest",  color: "#8B5CF6" },
  cultural_momentum:  { label: "Cultural Momentum",    uiLabel: "Trend Velocity",     color: "#F59E0B" },
  evidence_coverage:  { label: "Evidence Coverage",    uiLabel: "Data Confidence",    color: "#10B981" },
};

const AGENT_META: Record<string, { title: string; role: string }> = {
  supervisor:            { title: "Strategic Orchestrator",       role: "Scopes objectives & directs agent routing" },
  brand_analyst:         { title: "Brand Identity Agent",         role: "Extracts brand voice, positioning & identity anchors" },
  market_analyst:        { title: "Territory Intelligence Agent", role: "Assesses retail landscape, urban dynamics" },
  audience_matcher:      { title: "Audience Persona Agent",       role: "Profiles consumer cohorts & psychographics" },
  qloo_researcher:       { title: "Qloo Taste Graph Agent",       role: "Queries cross-affinity signals — music, fashion, culture" },
  evidence_normalizer:   { title: "Signal Calibration Agent",     role: "Normalises scores & confidence intervals" },
  deterministic_scorer:  { title: "Cultural Compatibility Scorer",role: "Computes 5-dimension resonance index" },
  jev_decision_gate:     { title: "Decision Gate Agent",          role: "Evaluates launch threshold & risk gates" },
  strategy_synthesizer:  { title: "Playbook Director Agent",      role: "Synthesises localised entry directives" },
  guardrail_validator:   { title: "Governance Guard Agent",       role: "Verifies empirical backing & flags assumptions" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreChip({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="flex-1 min-w-[110px] rounded-xl bg-[#111827] border border-[#1A2338] p-3.5 space-y-0.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}

function DimBar({ dim, score, weight, explanation, evidenceCount }: {
  dim: string; score: number; weight: number; explanation?: string; evidenceCount?: number;
}) {
  const meta = DIM_LABELS[dim] ?? { uiLabel: dim, color: "#6366F1" };
  const p = Math.round(score * 100);
  return (
    <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1A2338] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">{meta.uiLabel}</span>
          {evidenceCount !== undefined && (
            <span className="text-[10px] px-1.5 py-px rounded bg-[#0E1424] border border-[#1A2338] text-slate-500 font-mono">
              {evidenceCount} signals
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600">weight {Math.round(weight * 100)}%</span>
          <span className="text-sm font-bold font-mono" style={{ color: meta.color }}>{p}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-[#1A2338] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: meta.color }} />
      </div>
      {explanation && (
        <p className="text-[11px] text-slate-500 leading-relaxed">{explanation}</p>
      )}
    </div>
  );
}

function ProbabilityBar({ label, probs }: { label: string; probs: { launch?: number; adapt?: number; avoid?: number } }) {
  const launch = (probs.launch ?? 0) * 100;
  const adapt  = (probs.adapt  ?? 0) * 100;
  const avoid  = (probs.avoid  ?? 0) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-400 font-medium">{label}</span>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-emerald-400">{launch.toFixed(0)}% Launch</span>
          <span className="text-amber-400">{adapt.toFixed(0)}% Adapt</span>
          <span className="text-rose-400">{avoid.toFixed(0)}% Avoid</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-[#1A2338] overflow-hidden flex">
        <div style={{ width: `${launch}%` }} className="h-full bg-emerald-500" />
        <div style={{ width: `${adapt}%`  }} className="h-full bg-amber-400"  />
        <div style={{ width: `${avoid}%`  }} className="h-full bg-rose-500"   />
      </div>
    </div>
  );
}

// ─── Heatmap component ────────────────────────────────────────────────────────

function DimensionHeatmap({ matrix, rankings }: {
  matrix: Record<string, Record<string, number>>;
  rankings: RankedMarketItem[];
}) {
  const markets = rankings.map(r => r.market);
  const dims = ["brand_affinity","category_ecosystem","audience_overlap","cultural_momentum","evidence_coverage"];

  function cellBg(v: number) {
    const opacity = 0.15 + v * 0.65;
    return v >= 0.75
      ? `rgba(99,102,241,${opacity})`
      : v >= 0.60
      ? `rgba(245,158,11,${opacity})`
      : `rgba(239,68,68,${opacity})`;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "3px" }}>
        <thead>
          <tr>
            <th className="text-left text-[10px] text-slate-600 font-mono pb-1 pr-3 w-36" />
            {markets.map(m => (
              <th key={m} className="text-center text-[10px] text-slate-500 font-medium pb-1 px-1">
                <div>{getMarketFlag(m)}</div>
                <div className="truncate max-w-[60px]">{m.split(",")[0]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dims.map(dim => {
            const meta = DIM_LABELS[dim];
            return (
              <tr key={dim}>
                <td className="text-right text-[10px] text-slate-500 pr-3 py-0.5 font-medium">{meta?.uiLabel ?? dim}</td>
                {markets.map(m => {
                  const v = matrix[m]?.[dim] ?? 0;
                  const p = Math.round(v * 100);
                  return (
                    <td key={m} className="py-0.5">
                      <div
                        className="rounded text-center font-mono font-semibold text-[11px] py-1.5"
                        style={{ background: cellBg(v), color: "rgba(255,255,255,0.85)" }}
                      >
                        {p}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* Overall row */}
          <tr>
            <td className="text-right text-[10px] text-slate-400 pr-3 py-0.5 font-semibold">Overall</td>
            {markets.map((m, i) => {
              const s = rankings[i]?.score ?? 0;
              const p = Math.round(s * 100);
              return (
                <td key={m} className="py-0.5">
                  <div className="rounded text-center font-mono font-bold text-[11px] py-1.5 border"
                    style={{
                      background: `rgba(${s >= 0.75 ? "99,102,241" : s >= 0.60 ? "245,158,11" : "239,68,68"},0.2)`,
                      borderColor: `rgba(${s >= 0.75 ? "99,102,241" : s >= 0.60 ? "245,158,11" : "239,68,68"},0.4)`,
                      color: s >= 0.75 ? "#A5B4FC" : s >= 0.60 ? "#FCD34D" : "#FCA5A5",
                    }}>
                    {p}
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Radar SVG ────────────────────────────────────────────────────────────────

function RadarChart({ markets, matrix }: {
  markets: RankedMarketItem[];
  matrix: Record<string, Record<string, number>>;
}) {
  const dims = ["brand_affinity","category_ecosystem","audience_overlap","cultural_momentum","evidence_coverage"];
  const labels = ["Brand", "Mkt Opp", "Consumer", "Momentum", "Data Conf"];
  const size = 200;
  const cx = size / 2, cy = size / 2, r = 72;
  const colors = ["#6366F1","#10B981","#F59E0B","#EF4444","#22D3EE"];

  function toXY(dimIdx: number, score: number) {
    const angle = (Math.PI * 2 * dimIdx) / dims.length - Math.PI / 2;
    return { x: cx + r * score * Math.cos(angle), y: cy + r * score * Math.sin(angle) };
  }

  function ringPoints(scale: number) {
    return dims.map((_, i) => {
      const p = toXY(i, scale);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  function marketPoints(market: string) {
    return dims.map((dim, i) => {
      const v = matrix[market]?.[dim] ?? 0;
      const p = toXY(i, v);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  const labelPositions = dims.map((_, i) => {
    const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    return {
      x: cx + (r + 18) * Math.cos(angle),
      y: cy + (r + 18) * Math.sin(angle),
      label: labels[i],
    };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Rings */}
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon key={scale} points={ringPoints(scale)}
            fill="none" stroke="#1A2338" strokeWidth={scale === 1 ? 1 : 0.5} />
        ))}
        {/* Axes */}
        {dims.map((_, i) => {
          const p = toXY(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#252f45" strokeWidth={0.5} />;
        })}
        {/* Labels */}
        {labelPositions.map(({ x, y, label }) => (
          <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fill="#4B5A72" fontFamily="ui-monospace,monospace">{label}</text>
        ))}
        {/* Market polygons */}
        {markets.slice(0, 3).map((m, mi) => (
          <polygon key={m.market} points={marketPoints(m.market)}
            fill={`${colors[mi]}22`} stroke={colors[mi]} strokeWidth={mi === 0 ? 1.5 : 1}
            strokeDasharray={mi === 0 ? undefined : "3,2"} />
        ))}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {markets.slice(0, 3).map((m, mi) => (
          <div key={m.market} className="flex items-center gap-1.5">
            <div className="w-3 h-px" style={{ background: colors[mi] }} />
            <span className="text-[10px] text-slate-400">{m.market.split(",")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evidence donut ───────────────────────────────────────────────────────────

function EvidenceDonut({ evidence, market }: { evidence: EvidenceRecord[]; market: string }) {
  const filtered = market ? evidence.filter(e => e.market_name === market) : evidence;
  const counts: Record<string, number> = {};
  filtered.forEach(e => { counts[e.kind] = (counts[e.kind] ?? 0) + 1; });
  const total = filtered.length;

  const kinds = [
    { key: "brand_affinity",    color: "#6366F1", label: "Brand Affinity" },
    { key: "locality_density",  color: "#10B981", label: "Locality Density" },
    { key: "venue_anchor",      color: "#22D3EE", label: "Venue Anchors" },
    { key: "audience_overlap",  color: "#8B5CF6", label: "Audience Overlap" },
    { key: "cultural_momentum", color: "#F59E0B", label: "Cultural Momentum" },
  ].filter(k => (counts[k.key] ?? 0) > 0);

  if (total === 0) return (
    <div className="text-xs text-slate-600 text-center py-4">No evidence for this market</div>
  );

  const r = 28, circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = kinds.map(k => {
    const frac = (counts[k.key] ?? 0) / total;
    const dash = frac * circ;
    const seg = { ...k, dash, gap: circ - dash, offset, count: counts[k.key] ?? 0 };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" width={72} height={72} style={{ flexShrink: 0 }}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="#1A2338" strokeWidth={10} />
        {segments.map(s => (
          <circle key={s.key} cx={40} cy={40} r={r} fill="none"
            stroke={s.color} strokeWidth={10}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 40 40)" />
        ))}
        <text x={40} y={40} textAnchor="middle" dominantBaseline="middle"
          fontSize={13} fontWeight={700} fill="#F1F5F9" fontFamily="ui-monospace,monospace">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[10px] text-slate-400">{s.label}</span>
            <span className="text-[10px] font-mono text-slate-500 ml-auto pl-2">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agent timeline ───────────────────────────────────────────────────────────

function AgentTimeline({ steps }: { steps: RunStep[] }) {
  const sorted = [...steps].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const maxLatency = Math.max(...sorted.map(s => s.latency_ms ?? s.duration_ms ?? 0), 1);
  const totalMs = sorted.reduce((sum, s) => sum + (s.latency_ms ?? s.duration_ms ?? 0), 0);

  const phaseColors: Record<string, string> = {
    qloo_researcher: "#6366F1",
    deterministic_scorer: "#F59E0B",
    strategy_synthesizer: "#8B5CF6",
    jev_decision_gate: "#10B981",
    guardrail_validator: "#EF4444",
    brand_analyst: "#22D3EE",
    market_analyst: "#22D3EE",
    audience_matcher: "#22D3EE",
    evidence_normalizer: "#22D3EE",
    supervisor: "#94A3B8",
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-slate-500 border-b border-[#1A2338] pb-3">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>{sorted.length} steps completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono">{(totalMs / 1000).toFixed(1)}s total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Longest: {sorted.reduce((a, b) =>
            (a.latency_ms ?? 0) > (b.latency_ms ?? 0) ? a : b
          ).node_name?.replace(/_/g, " ") ?? "—"}</span>
        </div>
      </div>

      {/* Gantt bars */}
      <div className="space-y-1 mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
          Pipeline Gantt — proportional duration
        </div>
        {sorted.map((s, idx) => {
          const ms = s.latency_ms ?? s.duration_ms ?? 0;
          const pct = Math.max(4, (ms / maxLatency) * 100);
          const key = s.node_name ?? s.step_key;
          const color = phaseColors[key] ?? "#4B5A72";
          return (
            <div key={s.id ?? idx} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600 font-mono w-28 truncate text-right flex-shrink-0">
                {(AGENT_META[key]?.title ?? key).split(" ").slice(0, 2).join(" ")}
              </span>
              <div className="flex-1 h-5 rounded-sm bg-[#111827] overflow-hidden">
                <div className="h-full rounded-sm flex items-center"
                  style={{ width: `${pct}%`, background: `${color}55`, borderRight: `2px solid ${color}` }}>
                  {pct > 20 && (
                    <span className="text-[9px] font-mono px-1.5" style={{ color }}>
                      {ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
                    </span>
                  )}
                </div>
              </div>
              {pct <= 20 && (
                <span className="text-[9px] font-mono w-8" style={{ color }}>
                  {ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Step list */}
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mt-4 mb-2">
        Trace Steps
      </div>
      <div className="space-y-0 divide-y divide-[#1A2338]">
        {sorted.map((s, idx) => {
          const key = s.node_name ?? s.step_key;
          const meta = AGENT_META[key] ?? { title: key.replace(/_/g, " "), role: s.agent_role ?? "" };
          const ms = s.latency_ms ?? s.duration_ms ?? 0;
          const color = phaseColors[key] ?? "#4B5A72";
          const isHeavy = ms > 2000;
          const isFailed = s.status === "failed" || s.status === "error";

          return (
            <div key={s.id ?? idx}
              className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#0E1424] rounded-lg transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                {/* Sequence dot */}
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                  {idx + 1}
                </div>
                {/* Status icon */}
                {isFailed
                  ? <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                }
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200 truncate">{meta.title}</span>
                    <span className="text-[10px] text-slate-600 truncate hidden sm:block">{meta.role}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">{key}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {s.started_at && (
                  <span className="text-[10px] text-slate-600 font-mono hidden md:block">
                    {new Date(s.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
                <span className={cn(
                  "font-mono text-[11px] font-semibold px-2 py-0.5 rounded",
                  isHeavy ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800/40" : "text-slate-500"
                )}>
                  {ms > 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                  isFailed ? "text-rose-400 bg-rose-950/40" : "text-emerald-400 bg-emerald-950/40"
                )}>
                  {s.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Score margin chart ───────────────────────────────────────────────────────

function ScoreMarginChart({ rankings }: { rankings: RankedMarketItem[] }) {
  const winner = rankings[0]?.score ?? 0;
  return (
    <div className="space-y-2.5">
      {rankings.map((r, i) => {
        const s = r.score;
        const pct = Math.round(s * 100);
        const delta = i === 0 ? null : Math.round((winner - s) * 100);
        const vc = verdictColor(r.verdict);
        return (
          <div key={r.market} className="flex items-center gap-3">
            <div className="w-24 flex-shrink-0 flex items-center gap-1.5">
              <span className="text-sm">{getMarketFlag(r.market)}</span>
              <span className="text-[11px] text-slate-300 truncate font-medium">{r.market.split(",")[0]}</span>
            </div>
            <div className="flex-1 h-6 rounded-lg bg-[#111827] overflow-hidden relative">
              <div className="h-full rounded-lg transition-all"
                style={{ width: `${pct}%`, background: `${vc}33`, borderRight: `2px solid ${vc}` }} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">
                {pct}
              </span>
            </div>
            <div className="w-20 flex-shrink-0 flex items-center justify-end gap-1">
              {delta !== null && (
                <span className="text-[10px] font-mono text-slate-600">-{delta}pts</span>
              )}
              <span className="text-[10px] font-bold px-1.5 py-px rounded"
                style={{ color: vc, background: `${vc}15` }}>
                {r.verdict}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Taste entities from source_metadata_json ─────────────────────────────────

function TasteEntities({ evidence, market }: { evidence: EvidenceRecord[]; market: string }) {
  const affinities = useMemo(() => {
    const entities: Array<{ name: string; category: string; score: number }> = [];
    evidence
      .filter(e => e.market_name === market && e.kind === "brand_affinity" && e.source_metadata_json)
      .forEach(e => {
        const meta = e.source_metadata_json as Record<string, unknown>;
        const aff = meta?.affinities as Array<{ name: string; category?: string; affinity_score?: number }> | undefined;
        if (aff) {
          aff.slice(0, 6).forEach(a => {
            entities.push({ name: a.name, category: a.category ?? "culture", score: a.affinity_score ?? 0.8 });
          });
        }
      });
    // Fallback: use entity_ref from evidence records
    if (entities.length === 0) {
      evidence
        .filter(e => e.market_name === market && e.entity_ref)
        .slice(0, 8)
        .forEach(e => entities.push({ name: e.entity_ref!, category: e.kind, score: e.value_numeric ?? 0.7 }));
    }
    return entities.slice(0, 8);
  }, [evidence, market]);

  if (affinities.length === 0) return (
    <p className="text-xs text-slate-600">No taste entity data for this market.</p>
  );

  const catColor = (cat: string) => {
    const c = cat?.toLowerCase();
    if (c?.includes("fashion") || c?.includes("brand_affinity")) return { bg: "rgba(99,102,241,0.12)", color: "#A5B4FC", border: "rgba(99,102,241,0.2)" };
    if (c?.includes("music") || c?.includes("momentum"))          return { bg: "rgba(16,185,129,0.1)",  color: "#6EE7B7", border: "rgba(16,185,129,0.2)" };
    if (c?.includes("venue") || c?.includes("locality"))          return { bg: "rgba(34,211,238,0.1)",  color: "#67E8F9", border: "rgba(34,211,238,0.2)" };
    return { bg: "rgba(245,158,11,0.1)", color: "#FCD34D", border: "rgba(245,158,11,0.2)" };
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {affinities.map((a, i) => {
        const { bg, color, border } = catColor(a.category);
        return (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium"
            style={{ background: bg, color, border: `1px solid ${border}` }}>
            {a.name}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RunIntelligencePage() {
  const params = useParams();
  const runId = params?.id as string;

  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [activeReport, setActiveReport] = useState<ReportRecord | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportFormat, setReportFormat] = useState<"markdown" | "html">("markdown");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "market" | "timeline" | "evidence" | "simulation" | "report">("overview");
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [simPersona, setSimPersona] = useState("Digital-first Gen Z conscious consumers");
  const [simPositioning, setSimPositioning] = useState("Hyper-local sustainable functional packaging");
  const [runningSim, setRunningSim] = useState(false);
  const [simResult, setSimResult] = useState<AnalysisRun | null>(null);

  useEffect(() => {
    if (!runId) return;
    (async () => {
      try {
        setLoading(true);
        const [r, sList, eList, dList, repList] = await Promise.all([
          api.getRun(runId), api.getRunSteps(runId),
          api.getRunEvidence(runId), api.getRunDecisions(runId),
          api.getRunReports(runId),
        ]);
        setRun(r); setSteps(sList); setEvidence(eList);
        setDecisions(dList); setReports(repList);
        if (repList.length > 0) setActiveReport(repList[0]);
        const markets = r.scores_json?.rankings ?? [];
        if (markets.length > 0) setSelectedMarket((markets[0] as RankedMarketItem).market);
        const persona = r.input_snapshot_json?.audience_profile?.persona as string;
        if (persona) setSimPersona(persona + " (Gen Z & Digital Natives)");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load run");
      } finally {
        setLoading(false);
      }
    })();
  }, [runId]);

  const handleGenerateReport = async () => {
    if (!run) return;
    try {
      setGeneratingReport(true);
      const rep = await api.generateReport(run.id, reportFormat);
      setReports(prev => [rep, ...prev]);
      setActiveReport(rep);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (!activeReport?.content) return;
    navigator.clipboard.writeText(activeReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteSimulation = async () => {
    if (!run) return;
    try {
      setRunningSim(true);
      const sim = await api.createSimulation(run.id, { audience_persona: simPersona, brand_positioning: simPositioning });
      setSimResult(sim);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setRunningSim(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const rankings: RankedMarketItem[] = useMemo(() => run?.scores_json?.rankings ?? [], [run]);
  const brandName = run?.input_snapshot_json?.brand_name ?? "Brand";
  const summary = run?.result_summary_json;
  const winnerMarket = rankings[0]?.market ?? summary?.winner_market ?? "";
  const primaryDecision = decisions[0];

  // comparative_matrix — flat dict { market: { dim: score } }
  const rawMatrix = useMemo(() => {
    const cm = summary?.comparative_matrix as Record<string, Record<string, number>> | undefined;
    if (cm && typeof cm === "object") {
      // Check if it's { market: { dim: val } } or nested differently
      const firstKey = Object.keys(cm)[0];
      if (firstKey && typeof cm[firstKey] === "object" && !Array.isArray(cm[firstKey])) {
        return cm;
      }
    }
    // Build from market_scores if comparative_matrix not usable
    const ms = summary?.market_scores as Record<string, Record<string, unknown>> | undefined;
    if (ms) {
      const out: Record<string, Record<string, number>> = {};
      Object.entries(ms).forEach(([market, data]) => {
        const dims = data?.dimension_scores as Record<string, { raw_score?: number }> | undefined;
        if (dims) {
          out[market] = {};
          Object.entries(dims).forEach(([k, v]) => {
            out[market][k] = v?.raw_score ?? 0;
          });
        }
        out[market] = { ...out[market], overall: data?.overall_score as number ?? 0 };
      });
      return out;
    }
    return {} as Record<string, Record<string, number>>;
  }, [summary]);

  // Per-market dimension scores
  const marketDimScores = useMemo((): Record<string, DimScore> => {
    if (!selectedMarket) return {};
    const ms = summary?.market_scores as Record<string, Record<string, unknown>> | undefined;
    const mData = ms?.[selectedMarket];
    const dims = mData?.dimension_scores as Record<string, DimScore> | undefined;
    return dims ?? {};
  }, [summary, selectedMarket]);

  const marketDecisions = useMemo(() => {
    const d = summary?.decisions as { market_decisions?: Record<string, MarketDecision> } | undefined;
    return d?.market_decisions ?? {};
  }, [summary]);

  const selectedDecision = marketDecisions[selectedMarket];
  const selectedRanking = rankings.find(r => r.market === selectedMarket) ?? rankings[0];
  const recommendations = (summary?.recommendations ?? []) as StrategyRecommendation[];
  const auditReport = summary?.audit_report as Record<string, unknown> | undefined;

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "market",   label: "Market Deep Dive", icon: MapPin },
    { id: "timeline", label: `Agent Timeline (${steps.length})`, icon: Cpu },
    { id: "evidence", label: `Evidence (${evidence.length})`, icon: Database },
    { id: "simulation", label: "Scenario Lab", icon: Sliders },
    { id: "report",   label: "Report", icon: FileText },
  ] as const;

  if (loading) return (
    <div className="flex items-center justify-center py-32 gap-3 text-sm text-slate-500">
      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      Loading intelligence data…
    </div>
  );

  if (error || !run) return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-4">
      <div className="p-5 rounded-xl border border-rose-900/60 bg-rose-950/30 text-sm text-rose-400">{error}</div>
      <Link href="/projects" className="text-xs text-indigo-400 hover:text-indigo-300">← Back to Projects</Link>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/projects" className="hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Projects
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/projects/${run.project_id}`} className="hover:text-slate-300">{brandName}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-300 font-mono">Run {run.id.slice(0, 8)}</span>
      </div>

      {/* ── Run header ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#1A2338] bg-[#0E1424] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{brandName} — Market Intelligence</h1>
              <span className={cn(
                "text-xs font-bold uppercase px-2 py-0.5 rounded-full border",
                run.status === "completed"
                  ? "text-emerald-300 bg-emerald-950/60 border-emerald-800"
                  : "text-amber-300 bg-amber-950/60 border-amber-800"
              )}>{run.status}</span>
              {run.parent_run_id && (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800">
                  Simulation
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(run.created_at)}</span>
              <span className="flex items-center gap-1"><Database className="w-3 h-3" />{rankings.length} markets</span>
              <span className="font-mono bg-[#111827] px-2 py-0.5 rounded border border-[#1A2338] text-slate-400">v{run.score_version || "1.0.0"}</span>
              {!!auditReport?.is_verified && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>

          {/* Winner chip */}
          {winnerMarket && (
            <div className="flex-shrink-0 rounded-xl border border-indigo-800/60 bg-indigo-950/30 px-4 py-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">Recommended</div>
              <div className="text-lg font-bold text-white">{getMarketFlag(winnerMarket)} {winnerMarket.split(",")[0]}</div>
              {run.decision_verdict && <VerdictBadge verdict={run.decision_verdict} size="sm" />}
            </div>
          )}
        </div>

        {/* Probability bar */}
        {primaryDecision?.probabilities && (
          <div className="pt-3 border-t border-[#1A2338]">
            <ProbabilityBar label="Overall Launch Readiness" probs={primaryDecision.probabilities} />
          </div>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 border-b border-[#1A2338] overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 pb-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2",
                active
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Heatmap + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Heatmap */}
            <div className="lg:col-span-8 rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Dimension × Market Intelligence Matrix
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">5 cultural dimensions across all candidate markets — direct from Qloo scoring engine</p>
              </div>
              {Object.keys(rawMatrix).length > 0 && rankings.length > 0
                ? <DimensionHeatmap matrix={rawMatrix} rankings={rankings} />
                : <p className="text-xs text-slate-600 py-4">Run not yet scored or no market data available.</p>
              }
            </div>

            {/* Radar */}
            <div className="lg:col-span-4 rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white">Cultural Profile Overlay</h2>
                <p className="text-xs text-slate-500 mt-0.5">Shape comparison across markets</p>
              </div>
              {rankings.length > 0 && Object.keys(rawMatrix).length > 0
                ? <RadarChart markets={rankings} matrix={rawMatrix} />
                : <p className="text-xs text-slate-600 py-4">No scoring data.</p>
              }
            </div>
          </div>

          {/* Score Margin + Probability breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Score ranking */}
            <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Market Ranking — Score Margin
              </h2>
              {rankings.length > 0
                ? <ScoreMarginChart rankings={rankings} />
                : <p className="text-xs text-slate-600">No rankings available.</p>
              }
            </div>

            {/* Per-market probabilities */}
            <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                Launch Probability — All Markets
              </h2>
              <div className="space-y-3">
                {rankings.map(r => {
                  const md = marketDecisions[r.market];
                  const probs = md?.posture_probabilities ?? {};
                  return (
                    <ProbabilityBar key={r.market}
                      label={`${getMarketFlag(r.market)} ${r.market.split(",")[0]}`}
                      probs={probs} />
                  );
                })}
                {rankings.length === 0 && <p className="text-xs text-slate-600">No decision data.</p>}
              </div>
            </div>
          </div>

          {/* Strategy Playbook */}
          {recommendations.length > 0 && (
            <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Strategic Entry Playbook
                </h2>
                <span className="text-xs text-slate-500">{recommendations.length} directives</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#111827] border border-[#1A2338] space-y-2 hover:border-indigo-800/60 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-900">
                        {rec.pillar?.replace(/_/g, " ") ?? `Pillar ${i + 1}`}
                      </span>
                      {rec.confidence && (
                        <span className="text-[10px] font-mono text-slate-500">{Math.round(Number(rec.confidence) * 100)}%</span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200">{rec.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{rec.action}</p>
                    {rec.supporting_evidence_ids?.length ? (
                      <div className="text-[10px] text-slate-600 pt-1 border-t border-[#1A2338]">
                        {rec.supporting_evidence_ids.length} evidence signals
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: MARKET DEEP DIVE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "market" && (
        <div className="space-y-5 animate-in fade-in duration-200">

          {/* Market switcher */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rankings.map(r => {
              const isActive = r.market === selectedMarket;
              return (
                <button key={r.market} onClick={() => setSelectedMarket(r.market)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                    isActive
                      ? "bg-indigo-900/40 border-indigo-700 text-white"
                      : "bg-[#0E1424] border-[#1A2338] text-slate-400 hover:border-[#252f45] hover:text-slate-200"
                  )}>
                  <span className="text-base">{getMarketFlag(r.market)}</span>
                  <div className="text-left">
                    <div>{r.market.split(",")[0]}</div>
                    <div className="text-[10px] font-mono" style={{ color: scoreColor(r.score) }}>
                      {Math.round(r.score * 100)}
                    </div>
                  </div>
                  {isActive && <VerdictBadge verdict={r.verdict} size="sm" />}
                </button>
              );
            })}
          </div>

          {selectedMarket && (
            <>
              {/* 4 score chips */}
              <div className="flex flex-wrap gap-3">
                <ScoreChip label="Cultural Fit" color="#6366F1"
                  value={pct(selectedRanking?.score)}
                  sub="overall score" />
                <ScoreChip label="Consumer Interest" color="#8B5CF6"
                  value={pct(marketDimScores.audience_overlap?.raw_score)}
                  sub="audience_overlap dim" />
                <ScoreChip label="Market Opportunity" color="#22D3EE"
                  value={pct(marketDimScores.category_ecosystem?.raw_score)}
                  sub="category_ecosystem dim" />
                <ScoreChip label="Data Confidence" color="#10B981"
                  value={pct(marketDimScores.evidence_coverage?.raw_score)}
                  sub={`${marketDimScores.evidence_coverage?.raw_score ? marketDimScores.evidence_coverage.raw_score >= 0.8 ? "HIGH" : "MEDIUM" : "—"} tier`} />
              </div>

              {/* Decision confidence */}
              {selectedDecision?.posture_probabilities && (
                <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-4">
                  <ProbabilityBar
                    label={`${getMarketFlag(selectedMarket)} ${selectedMarket.split(",")[0]} — Launch Readiness`}
                    probs={selectedDecision.posture_probabilities} />
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span>Confidence: <strong className="text-slate-300">{pct(selectedDecision.posture_confidence)}</strong></span>
                    {selectedDecision.evidence_sufficiency && (
                      <span>Evidence: <strong className="text-slate-300 capitalize">{selectedDecision.evidence_sufficiency}</strong></span>
                    )}
                  </div>
                </div>
              )}

              {/* Dimension breakdown + Evidence donut */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">5-Dimension Breakdown</h3>
                  {Object.entries(marketDimScores).length > 0
                    ? Object.entries(marketDimScores).map(([dim, ds]) => (
                        <DimBar key={dim} dim={dim}
                          score={ds.raw_score} weight={ds.weight}
                          explanation={ds.explanation}
                          evidenceCount={ds.evidence_ids?.length} />
                      ))
                    : <p className="text-xs text-slate-600 py-4">No dimension data for this market.</p>
                  }
                </div>

                <div className="lg:col-span-5 space-y-4">
                  {/* Evidence donut */}
                  <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence Signal Mix</h3>
                    <EvidenceDonut evidence={evidence} market={selectedMarket} />
                  </div>

                  {/* Taste entities */}
                  <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-4 space-y-3">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Audience Taste DNA</h3>
                      <p className="text-[10px] text-slate-600 mt-0.5">Real Qloo affinity entities for this market</p>
                    </div>
                    <TasteEntities evidence={evidence} market={selectedMarket} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: AGENT TIMELINE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "timeline" && (
        <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-[#1A2338] mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Agent Pipeline Audit
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Execution trace — each node, latency, and status</p>
            </div>
            {steps.length === 0 && (
              <span className="text-xs text-slate-600">No step data recorded for this run</span>
            )}
          </div>
          {steps.length > 0
            ? <AgentTimeline steps={steps} />
            : <div className="py-10 text-center text-sm text-slate-600">No agent steps recorded.</div>
          }
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: EVIDENCE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "evidence" && (
        <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2338]">
            <div>
              <h2 className="text-sm font-bold text-white">Qloo Consumer Taste Signals</h2>
              <p className="text-xs text-slate-500 mt-0.5">Raw evidence from Qloo taste graph — feeds the 5-dimension scorer</p>
            </div>
            <span className="text-xs text-slate-500">{evidence.length} records</span>
          </div>
          {evidence.length === 0
            ? <div className="py-10 text-center text-sm text-slate-600">No evidence records.</div>
            : (
              <div className="divide-y divide-[#1A2338]">
                {evidence.map(ev => {
                  const dimMeta = DIM_LABELS[ev.kind] ?? { color: "#94A3B8", uiLabel: ev.kind };
                  return (
                    <div key={ev.id} className="py-3.5 px-2 hover:bg-[#111827] rounded-lg transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${dimMeta.color}20`, color: dimMeta.color, border: `1px solid ${dimMeta.color}30` }}>
                            {dimMeta.uiLabel}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 truncate">{ev.entity_name ?? ev.entity_ref}</span>
                          {ev.market_name && (
                            <span className="text-[10px] text-slate-600 flex-shrink-0">{getMarketFlag(ev.market_name)} {ev.market_name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 font-mono text-[11px]">
                          {ev.score !== undefined && (
                            <span className="font-bold text-slate-300">{pct(ev.score)}</span>
                          )}
                          <span className="text-slate-600">conf {pct(ev.confidence, 0)}</span>
                        </div>
                      </div>
                      {(ev.content ?? ev.explanation) && (
                        <p className="text-[11px] text-slate-500 leading-relaxed">{ev.content ?? ev.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: SIMULATION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "simulation" && (
        <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 animate-in fade-in duration-200 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              Counterfactual Scenario Lab
            </h2>
            <p className="text-xs text-slate-500 mt-1">Hypothesise parameter shifts without corrupting the baseline run.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Modified Audience Persona
              </label>
              <input type="text" value={simPersona} onChange={e => setSimPersona(e.target.value)}
                className="w-full rounded-xl border border-[#1A2338] bg-[#111827] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Repositioning Hypothesis
              </label>
              <input type="text" value={simPositioning} onChange={e => setSimPositioning(e.target.value)}
                className="w-full rounded-xl border border-[#1A2338] bg-[#111827] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-600 focus:outline-none" />
            </div>
          </div>
          <button onClick={handleExecuteSimulation} disabled={runningSim}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            {runningSim ? "Computing…" : "Run Simulation"}
          </button>
          {simResult && (
            <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/20 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Simulation Result</span>
                <Link href={`/runs/${simResult.id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  Open child run <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Baseline", val: run.overall_score ? pct(run.overall_score) : "—", color: "#94A3B8" },
                  { label: "Simulated", val: simResult.overall_score ? pct(simResult.overall_score) : "—", color: "#A5B4FC" },
                  { label: "Verdict", val: simResult.decision_verdict ?? "—", color: verdictColor(simResult.decision_verdict ?? "") },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-[#111827] border border-[#1A2338] p-3 text-center">
                    <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
                    <div className="text-base font-bold font-mono" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: REPORT
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "report" && (
        <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 animate-in fade-in duration-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1A2338]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Executive Market Entry Brief
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Compiled from empirical signals and deterministic scores</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={reportFormat} onChange={e => setReportFormat(e.target.value as "markdown" | "html")}
                className="rounded-lg border border-[#1A2338] bg-[#111827] px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-600 focus:outline-none">
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
              <button onClick={handleGenerateReport} disabled={generatingReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white transition-colors">
                <FileText className="w-3 h-3" />
                {generatingReport ? "Compiling…" : "Generate"}
              </button>
            </div>
          </div>
          {activeReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#111827] rounded-lg border border-[#1A2338] px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{activeReport.title}</span>
                  <span className="font-mono uppercase text-[10px] bg-[#1A2338] px-1.5 py-0.5 rounded text-slate-400">
                    {activeReport.format}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopyReport}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-[#252f45] hover:bg-[#1A2338] text-slate-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span className="text-[10px]">{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <a href={`/api/v1/reports/${activeReport.id}/raw`} download
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A2338] hover:bg-[#252f45] text-slate-300 text-[10px] transition-colors">
                    <Download className="w-3 h-3" /> Download
                  </a>
                </div>
              </div>
              <div className="rounded-xl border border-[#1A2338] bg-[#070C18] p-5 overflow-x-auto">
                <pre className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap text-slate-300">
                  {activeReport.content}
                </pre>
              </div>
              {reports.length > 1 && (
                <div className="space-y-1.5 pt-2 border-t border-[#1A2338]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Revisions</span>
                  {reports.map(rep => (
                    <button key={rep.id} onClick={() => setActiveReport(rep)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs flex justify-between items-center transition-colors border",
                        activeReport.id === rep.id
                          ? "bg-indigo-950/40 border-indigo-800/60 text-indigo-300"
                          : "bg-[#111827] border-[#1A2338] text-slate-400 hover:text-slate-200"
                      )}>
                      <span className="truncate">{rep.title}</span>
                      <span className="text-[10px] font-mono text-slate-600 ml-2 flex-shrink-0">{formatDate(rep.created_at)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-600">
              No brief generated yet. Click Generate above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
