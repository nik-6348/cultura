"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Database, CheckCircle2, Clock, Sparkles,
  BarChart3, Sliders, Cpu, FileText, Download, Trash2,
  TrendingUp, XCircle, ChevronRight, MapPin, ChevronDown,
  Activity, MessageSquare, Play,
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

interface SimPlanItem {
  key: string;
  label: string;
  value: string;
  original?: string;
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

// Simulation scenario → changes parser
function parseScenarioToChanges(text: string): SimPlanItem[] {
  const plan: SimPlanItem[] = [];

  if (/younger|gen.?z|millen/i.test(text))
    plan.push({ key: "target_audience", label: "Target Audience", value: "Gen-Z digital natives (18–28)", original: "Original audience profile" });
  if (/premium|luxury|high.?end/i.test(text))
    plan.push({ key: "price_positioning", label: "Price Positioning", value: "ultra_premium", original: "mid_range" });
  if (/budget|affordable|mass.?market|value/i.test(text))
    plan.push({ key: "price_positioning", label: "Price Positioning", value: "value", original: "mid_range" });
  if (/eco|sustain|green|conscious/i.test(text))
    plan.push({ key: "brand_profile", label: "Brand Values", value: JSON.stringify({ sustainability_focus: "high", eco_certifications: true }), original: "standard" });
  if (/local|partner|collab|joint/i.test(text))
    plan.push({ key: "brand_profile", label: "Market Approach", value: JSON.stringify({ distribution: "local_partnership", go_to_market: "co-branded" }), original: "direct" });
  if (/digital|online|e.?comm/i.test(text))
    plan.push({ key: "brand_profile", label: "Channel Strategy", value: JSON.stringify({ primary_channel: "digital_first", ecommerce: true }), original: "omnichannel" });
  if (/reposition|pivot|shift/i.test(text))
    plan.push({ key: "brand_profile", label: "Brand Repositioning", value: JSON.stringify({ positioning: "repositioned", tone: "modern" }), original: "current" });

  if (plan.length === 0) {
    // Generic fallback — treat as audience shift
    plan.push({ key: "target_audience", label: "Target Audience", value: text.slice(0, 120), original: "Original audience profile" });
  }
  return plan;
}

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

function DimBar({ dim, score, weight, explanation }: {
  dim: string; score: number; weight: number; explanation?: string;
}) {
  const meta = DIM_LABELS[dim] ?? { uiLabel: dim, color: "#6366F1" };
  const p = Math.round(score * 100);
  return (
    <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1A2338] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200">{meta.uiLabel}</span>
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
    return dims.map((_, i) => { const p = toXY(i, scale); return `${p.x},${p.y}`; }).join(" ");
  }

  function marketPoints(market: string) {
    return dims.map((dim, i) => { const v = matrix[market]?.[dim] ?? 0; const p = toXY(i, v); return `${p.x},${p.y}`; }).join(" ");
  }

  const labelPositions = dims.map((_, i) => {
    const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    return { x: cx + (r + 18) * Math.cos(angle), y: cy + (r + 18) * Math.sin(angle), label: labels[i] };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon key={scale} points={ringPoints(scale)} fill="none" stroke="#1A2338" strokeWidth={scale === 1 ? 1 : 0.5} />
        ))}
        {dims.map((_, i) => { const p = toXY(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#252f45" strokeWidth={0.5} />; })}
        {labelPositions.map(({ x, y, label }) => (
          <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#4B5A72" fontFamily="ui-monospace,monospace">{label}</text>
        ))}
        {markets.slice(0, 3).map((m, mi) => (
          <polygon key={m.market} points={marketPoints(m.market)} fill={`${colors[mi]}22`} stroke={colors[mi]} strokeWidth={mi === 0 ? 1.5 : 1} strokeDasharray={mi === 0 ? undefined : "3,2"} />
        ))}
      </svg>
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

  if (total === 0) return <div className="text-xs text-slate-600 text-center py-4">No evidence for this market</div>;

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
          <circle key={s.key} cx={40} cy={40} r={r} fill="none" stroke={s.color} strokeWidth={10}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset} transform="rotate(-90 40 40)" />
        ))}
        <text x={40} y={40} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight={700} fill="#F1F5F9" fontFamily="ui-monospace,monospace">{total}</text>
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
  const [expanded, setExpanded] = useState<string | null>(null);

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
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-b border-[#1A2338] pb-3">
        <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-indigo-400" /><span>{sorted.length} pipeline steps</span></div>
        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /><span className="font-mono">{(totalMs / 1000).toFixed(1)}s total execution</span></div>
      </div>

      {/* Gantt bars */}
      <div className="space-y-1 mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Pipeline Gantt — proportional duration</div>
        {sorted.map((s, idx) => {
          const ms = s.latency_ms ?? s.duration_ms ?? 0;
          const p = Math.max(4, (ms / maxLatency) * 100);
          const key = s.node_name ?? s.step_key;
          const color = phaseColors[key] ?? "#4B5A72";
          return (
            <div key={s.id ?? idx} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600 font-mono w-28 truncate text-right flex-shrink-0">
                {(AGENT_META[key]?.title ?? key).split(" ").slice(0, 2).join(" ")}
              </span>
              <div className="flex-1 h-5 rounded-sm bg-[#111827] overflow-hidden">
                <div className="h-full rounded-sm flex items-center"
                  style={{ width: `${p}%`, background: `${color}55`, borderRight: `2px solid ${color}` }}>
                  {p > 20 && (
                    <span className="text-[9px] font-mono px-1.5" style={{ color }}>
                      {ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
                    </span>
                  )}
                </div>
              </div>
              {p <= 20 && <span className="text-[9px] font-mono w-8" style={{ color }}>{ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}</span>}
            </div>
          );
        })}
      </div>

      {/* Step detail list */}
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mt-4 mb-2">Trace Steps — click to inspect details</div>
      <div className="space-y-0 divide-y divide-[#1A2338]">
        {sorted.map((s, idx) => {
          const key = s.node_name ?? s.step_key;
          const meta = AGENT_META[key] ?? { title: key.replace(/_/g, " "), role: s.agent_role ?? "" };
          const ms = s.latency_ms ?? s.duration_ms ?? 0;
          const color = phaseColors[key] ?? "#4B5A72";
          const isFailed = s.status === "failed" || s.status === "error";
          const stepMeta = s.metadata_json as Record<string, unknown> | null;
          const isExpanded = expanded === (s.id ?? String(idx));

          return (
            <div key={s.id ?? idx}>
              <button
                onClick={() => setExpanded(isExpanded ? null : (s.id ?? String(idx)))}
                className="w-full py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#0E1424] rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                    style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                    {idx + 1}
                  </div>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.started_at && (
                    <span className="text-[10px] text-slate-600 font-mono hidden md:block">
                      {new Date(s.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  )}
                  <span className={cn(
                    "font-mono text-[11px] font-semibold px-2 py-0.5 rounded",
                    ms > 2000 ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800/40" : "text-slate-500"
                  )}>
                    {ms > 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                    isFailed ? "text-rose-400 bg-rose-950/40" : "text-emerald-400 bg-emerald-950/40"
                  )}>{s.status}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-600 transition-transform", isExpanded && "rotate-180")} />
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mx-2 mb-3 rounded-xl border border-[#252f45] bg-[#070C18] p-4 space-y-3 animate-in fade-in duration-150">
                  {/* Input summary */}
                  {typeof stepMeta?.input_summary === "string" && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Agent Scope & Input</div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{stepMeta.input_summary}</p>
                    </div>
                  )}

                  {/* Output summary */}
                  {typeof stepMeta?.output_summary === "string" && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Deliverable & Result</div>
                      <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                        {stepMeta.output_summary.startsWith("Updated state:")
                          ? "Execution step completed and pipeline state updated"
                          : stepMeta.output_summary}
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {isFailed && s.error_json && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Error</div>
                      <pre className="text-[10px] text-rose-400 font-mono leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(s.error_json, null, 2).slice(0, 400)}
                      </pre>
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

// ─── Score margin chart ───────────────────────────────────────────────────────

function ScoreMarginChart({ rankings }: { rankings: RankedMarketItem[] }) {
  const winner = rankings[0]?.score ?? 0;
  return (
    <div className="space-y-2.5">
      {rankings.map((r, i) => {
        const s = r.score;
        const p = Math.round(s * 100);
        const delta = i === 0 ? null : Math.round((winner - s) * 100);
        const vc = verdictColor(r.verdict);
        return (
          <div key={r.market} className="flex items-center gap-3">
            <div className="w-24 flex-shrink-0 flex items-center gap-1.5">
              <span className="text-[11px] text-slate-300 truncate font-medium">{r.market.split(",")[0]}</span>
            </div>
            <div className="flex-1 h-6 rounded-lg bg-[#111827] overflow-hidden relative">
              <div className="h-full rounded-lg transition-all"
                style={{ width: `${p}%`, background: `${vc}33`, borderRight: `2px solid ${vc}` }} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">{p}</span>
            </div>
            <div className="w-20 flex-shrink-0 flex items-center justify-end gap-1">
              {delta !== null && <span className="text-[10px] font-mono text-slate-600">-{delta}pts</span>}
              <span className="text-[10px] font-bold px-1.5 py-px rounded" style={{ color: vc, background: `${vc}15` }}>{r.verdict}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Taste entities ───────────────────────────────────────────────────────────

function TasteEntities({ evidence, market }: { evidence: EvidenceRecord[]; market: string }) {
  const affinities = useMemo(() => {
    const entities: Array<{ name: string; category: string; score: number }> = [];
    evidence
      .filter(e => e.market_name === market && e.kind === "brand_affinity" && e.source_metadata_json)
      .forEach(e => {
        const meta = e.source_metadata_json as Record<string, unknown>;
        const aff = meta?.affinities as Array<{ name: string; category?: string; affinity_score?: number }> | undefined;
        if (aff) aff.slice(0, 6).forEach(a => entities.push({ name: a.name, category: a.category ?? "culture", score: a.affinity_score ?? 0.8 }));
      });
    if (entities.length === 0) {
      evidence.filter(e => e.market_name === market && (e.entity_name || e.entity_ref)).slice(0, 8)
        .forEach(e => entities.push({ name: e.entity_name ?? e.entity_ref ?? e.kind, category: e.kind, score: e.value_numeric ?? 0.7 }));
    }
    return entities.slice(0, 8);
  }, [evidence, market]);

  if (affinities.length === 0) return <p className="text-xs text-slate-600">No taste entity data for this market.</p>;

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

// ─── Report modal ─────────────────────────────────────────────────────────────

function ReportModal({ report, onClose }: { report: ReportRecord; onClose: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const doc = iframe.contentDocument;
      // Target the inner .page wrapper
      const target = (doc.querySelector(".page") as HTMLElement) ?? doc.body;

      // Capture full rendered page at 2x resolution
      const targetW = target.offsetWidth || target.scrollWidth;
      const targetH = target.scrollHeight || target.offsetHeight;

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
        scrollX: 0,
        scrollY: 0,
        width: targetW,
        height: targetH,
        windowWidth: targetW,
        windowHeight: targetH,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Margins: Header gap (top), Footer gap (bottom), and Side margins
      const marginTop = 42;
      const marginBottom = 42;
      const marginLeft = 32;
      const marginRight = 32;

      const contentW = pageW - marginLeft - marginRight;
      const contentH = pageH - marginTop - marginBottom;

      const targetRect = target.getBoundingClientRect();
      const domToPdf = contentW / targetW;
      const canvasScale = canvas.width / targetW;
      const maxDomPageH = contentH / domToPdf;

      // 1. Collect top-level section boundaries
      const sectionBottoms: number[] = [];
      Array.from(target.children).forEach((child) => {
        const el = child as HTMLElement;
        const r = el.getBoundingClientRect();
        const bottom = Math.round(r.bottom - targetRect.top);
        if (bottom > 0 && bottom <= targetH) {
          sectionBottoms.push(bottom);
        }
      });
      sectionBottoms.sort((a, b) => a - b);

      // 2. Collect sub-element boundaries (table rows, headers, recommendation cards)
      const elementCutsSet = new Set<number>();
      elementCutsSet.add(0);
      elementCutsSet.add(targetH);
      sectionBottoms.forEach((b) => elementCutsSet.add(b));

      target
        .querySelectorAll<HTMLElement>("tr, .section-title, .section > div > div")
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          const top = Math.round(r.top - targetRect.top);
          const bottom = Math.round(r.bottom - targetRect.top);
          if (top > 0 && top <= targetH) elementCutsSet.add(top);
          if (bottom > 0 && bottom <= targetH) elementCutsSet.add(bottom);
        });

      const allElementCuts = Array.from(elementCutsSet).sort((a, b) => a - b);

      // 3. Compute smart page slices avoiding cutting elements in half
      const slices: { startY: number; endY: number }[] = [];
      let currentY = 0;

      while (currentY < targetH - 10) {
        const maxEnd = currentY + maxDomPageH;
        if (maxEnd >= targetH) {
          slices.push({ startY: currentY, endY: targetH });
          break;
        }

        // Priority 1: Check if a major section ends between 60% and 100% of the page
        const minSectionY = currentY + maxDomPageH * 0.60;
        const validSectionCuts = sectionBottoms.filter(
          (b) => b >= minSectionY && b <= maxEnd
        );

        let chosenCut: number | undefined;
        if (validSectionCuts.length > 0) {
          chosenCut = validSectionCuts[validSectionCuts.length - 1];
        } else {
          // Priority 2: Cut cleanly between table rows or recommendation cards
          const validElementCuts = allElementCuts.filter(
            (c) => c >= currentY + 100 && c <= maxEnd
          );
          if (validElementCuts.length > 0) {
            chosenCut = validElementCuts[validElementCuts.length - 1];
          } else {
            chosenCut = maxEnd;
          }
        }

        if (chosenCut <= currentY + 20) {
          chosenCut = maxEnd;
        }

        slices.push({ startY: currentY, endY: chosenCut });
        currentY = chosenCut;
      }

      // 4. Render each slice onto its own PDF page with margins and running header/footer
      for (let i = 0; i < slices.length; i++) {
        if (i > 0) pdf.addPage();

        const slice = slices[i];
        const sliceHDom = slice.endY - slice.startY;
        const sliceYCanvas = Math.round(slice.startY * canvasScale);
        const sliceHCanvas = Math.min(
          Math.max(1, Math.round(sliceHDom * canvasScale)),
          canvas.height - sliceYCanvas
        );
        const sliceHPdf = sliceHDom * domToPdf;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHCanvas;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0, sliceYCanvas, canvas.width, sliceHCanvas,
            0, 0, canvas.width, sliceHCanvas
          );
        }

        const sliceData = sliceCanvas.toDataURL("image/png");
        pdf.addImage(sliceData, "PNG", marginLeft, marginTop, contentW, sliceHPdf);

        // Running Header on pages 2+
        if (i > 0) {
          pdf.setFontSize(8);
          pdf.setTextColor(148, 163, 184); // slate-400
          const headerTitle =
            report.title.length > 55 ? report.title.slice(0, 52) + "…" : report.title;
          pdf.text(headerTitle, marginLeft, marginTop - 14);
          pdf.text("Cultura AI Cultural Intelligence", pageW - marginRight, marginTop - 14, {
            align: "right",
          });
          pdf.setDrawColor(226, 232, 240); // slate-200
          pdf.setLineWidth(0.5);
          pdf.line(marginLeft, marginTop - 8, pageW - marginRight, marginTop - 8);
        }

        // Running Footer with page numbering and divider line
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(marginLeft, pageH - 26, pageW - marginRight, pageH - 26);

        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          "Cultura AI · Executive Intelligence Brief · Confidential",
          marginLeft,
          pageH - 14
        );
        pdf.text(`Page ${i + 1} of ${slices.length}`, pageW - marginRight, pageH - 14, {
          align: "right",
        });
      }

      const slug = report.title.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 40);
      pdf.save(`${slug}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 896,     /* 4xl = 896px */
          height: "90vh",
          borderRadius: 16,
          border: "1px solid #1A2338",
          background: "#0E1424",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "#0E1424",
          borderBottom: "1px solid #1A2338", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <FileText style={{ width: 15, height: 15, color: "#94a3b8", flexShrink: 0 }} />
            <span style={{
              fontSize: 13, fontWeight: 600, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {report.title}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button onClick={downloadPDF} disabled={downloading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, border: "none",
                background: "#4f46e5", color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: downloading ? "not-allowed" : "pointer",
                opacity: downloading ? 0.7 : 1,
              }}>
              {downloading
                ? "Generating…"
                : <><Download style={{ width: 13, height: 13 }} /> Download PDF</>
              }
            </button>
            <button onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8, border: "1px solid #1A2338",
                background: "transparent", color: "#94a3b8", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <XCircle style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        {/* Report iframe — scrollable */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <iframe
            ref={iframeRef}
            srcDoc={report.content ?? ""}
            style={{ width: "100%", height: "100%", border: "none", display: "block", minHeight: 600 }}
            title="Executive Report"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RunIntelligencePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const runId = params?.id as string;

  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [activeReport, setActiveReport] = useState<ReportRecord | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const reportIframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "market" | "timeline" | "evidence" | "simulation" | "report">(
    (searchParams?.get("tab") as "report" | null) === "report" ? "report" : "overview"
  );
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [evidenceFilter, setEvidenceFilter] = useState<string>("all");

  // Simulation state
  const [simScenario, setSimScenario] = useState("");
  const [simPlan, setSimPlan] = useState<SimPlanItem[]>([]);
  const [parsingSim, setParsingSim] = useState(false);
  const [simConfirmed, setSimConfirmed] = useState(false);
  const [runningSim, setRunningSim] = useState(false);
  const [simResult, setSimResult] = useState<AnalysisRun | null>(null);

  const handleGenerateReport = useCallback(async (format: "markdown" | "html" = "html") => {
    if (!run) return;
    try {
      setGeneratingReport(true);
      const rep = await api.generateReport(run.id, format);
      setReports(prev => [rep, ...prev]);
      setActiveReport(rep);
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setGeneratingReport(false);
    }
  }, [run]);

  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      setDeletingReportId(reportId);
      await api.deleteReport(reportId);
      setReports(prev => {
        const next = prev.filter(r => r.id !== reportId);
        if (activeReport?.id === reportId) {
          setActiveReport(next.length > 0 ? next[0] : null);
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert(err instanceof Error ? err.message : "Failed to delete report");
    } finally {
      setDeletingReportId(null);
    }
  };

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
        if (repList.length > 0) {
          setActiveReport(repList[0]);
        }
        const markets = r.scores_json?.rankings ?? [];
        if (markets.length > 0) setSelectedMarket((markets[0] as RankedMarketItem).market);
        const persona = r.input_snapshot_json?.audience_profile?.persona as string;
        if (persona) setSimScenario(`Shift audience to ${persona} with digital-first positioning`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load run");
      } finally {
        setLoading(false);
      }
    })();
  }, [runId]);

  // Auto-generate HTML report for completed runs with no existing report
  useEffect(() => {
    if (run?.status === "completed" && reports.length === 0 && !generatingReport && activeTab === "report") {
      handleGenerateReport("html");
    }
  }, [activeTab, run?.status, reports.length, generatingReport, handleGenerateReport]);

  const handleParseScenario = async () => {
    if (!simScenario.trim()) return;
    setParsingSim(true);
    // Client-side parsing (no API call needed for basic scenarios)
    await new Promise(r => setTimeout(r, 600)); // UX delay
    const plan = parseScenarioToChanges(simScenario);
    setSimPlan(plan);
    setSimConfirmed(false);
    setParsingSim(false);
  };

  const handleExecuteSimulation = async () => {
    if (!run || simPlan.length === 0) return;
    try {
      setRunningSim(true);
      // Convert plan items to changes dict
      const changes: Record<string, unknown> = {};
      for (const item of simPlan) {
        try {
          changes[item.key] = JSON.parse(item.value);
        } catch {
          changes[item.key] = item.value;
        }
      }
      const sim = await api.createSimulation(run.id, changes);
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

  const rawMatrix = useMemo(() => {
    const cm = summary?.comparative_matrix as Record<string, Record<string, number>> | undefined;
    if (cm && typeof cm === "object") {
      const firstKey = Object.keys(cm)[0];
      if (firstKey && typeof cm[firstKey] === "object" && !Array.isArray(cm[firstKey])) {
        return cm;
      }
    }
    const ms = summary?.market_scores as Record<string, Record<string, unknown>> | undefined;
    if (ms) {
      const out: Record<string, Record<string, number>> = {};
      Object.entries(ms).forEach(([market, data]) => {
        const dims = data?.dimension_scores as Record<string, { raw_score?: number }> | undefined;
        if (dims) {
          out[market] = {};
          Object.entries(dims).forEach(([k, v]) => { out[market][k] = v?.raw_score ?? 0; });
        }
        out[market] = { ...out[market], overall: data?.overall_score as number ?? 0 };
      });
      return out;
    }
    return {} as Record<string, Record<string, number>>;
  }, [summary]);

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

  // Evidence filter
  const marketNames = useMemo(() => {
    const names = new Set<string>();
    evidence.forEach(e => { if (e.market_name) names.add(e.market_name); });
    return Array.from(names);
  }, [evidence]);

  const filteredEvidence = useMemo(() => {
    if (evidenceFilter === "all") return evidence;
    return evidence.filter(e => e.market_name === evidenceFilter);
  }, [evidence, evidenceFilter]);

  const TABS = [
    { id: "overview",    label: "Overview",                  icon: BarChart3 },
    { id: "market",      label: "Market Deep Dive",          icon: MapPin },
    { id: "timeline",    label: `Timeline (${steps.length})`, icon: Cpu },
    { id: "evidence",    label: `Evidence (${evidence.length})`, icon: Database },
    { id: "simulation",  label: "Scenario Lab",              icon: Sliders },
    { id: "report",      label: "Report",                    icon: FileText },
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
    <>
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-in fade-in duration-300">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/projects" className="hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Projects
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/projects/${run.project_id}`} className="hover:text-slate-300">{brandName}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-300 font-mono">Run {run.id.slice(0, 8)}</span>
      </div>

      {/* ── Run header ─────────────────────────────────────────────────────── */}
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
                <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3 h-3" /> Verified</span>
              )}
            </div>
          </div>

          {winnerMarket && (
            <div className="flex-shrink-0 rounded-xl border border-indigo-800/60 bg-indigo-950/30 px-4 py-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">Recommended</div>
              <div className="text-lg font-bold text-white">{winnerMarket.split(",")[0]}</div>
              {run.decision_verdict && <VerdictBadge verdict={run.decision_verdict} size="sm" />}
            </div>
          )}
        </div>

        {/* Score chips */}
        <div className="flex flex-wrap gap-3">
          {run.overall_score != null && (
            <div className="flex-1 min-w-[100px] rounded-xl bg-[#111827] border border-[#1A2338] p-3 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cultural Fit</div>
              <div className="text-xl font-bold font-mono text-indigo-400">{pct(run.overall_score)}</div>
            </div>
          )}
          {run.decision_verdict && (
            <div className="flex-1 min-w-[100px] rounded-xl bg-[#111827] border border-[#1A2338] p-3 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Verdict</div>
              <div className="text-sm font-bold font-mono mt-1" style={{ color: verdictColor(run.decision_verdict) }}>
                {run.decision_verdict.toUpperCase()}
              </div>
            </div>
          )}
          {run.strategy_summary && (
            <div className="flex-[3] min-w-[200px] rounded-xl bg-[#111827] border border-[#1A2338] p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Strategy</div>
              <div className="text-xs text-slate-300 leading-relaxed line-clamp-2">{run.strategy_summary}</div>
            </div>
          )}
        </div>

        {primaryDecision?.probabilities && (
          <div className="pt-3 border-t border-[#1A2338]">
            <ProbabilityBar label="Overall Launch Readiness" probs={primaryDecision.probabilities} />
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 border-b border-[#1A2338] overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 pb-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2",
                active ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
              )}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════ TAB 1: OVERVIEW ═══════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-400" /> Dimension × Market Intelligence Matrix</h2>
                <p className="text-xs text-slate-500 mt-0.5">5 cultural dimensions across all candidate markets — direct from Qloo scoring engine</p>
              </div>
              {Object.keys(rawMatrix).length > 0 && rankings.length > 0
                ? <DimensionHeatmap matrix={rawMatrix} rankings={rankings} />
                : <p className="text-xs text-slate-600 py-4">Run not yet scored or no market data available.</p>
              }
            </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Market Ranking — Score Margin</h2>
              {rankings.length > 0 ? <ScoreMarginChart rankings={rankings} /> : <p className="text-xs text-slate-600">No rankings available.</p>}
            </div>
            <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-violet-400" /> Launch Probability — All Markets</h2>
              <div className="space-y-3">
                {rankings.map(r => {
                  const md = marketDecisions[r.market];
                  const probs = md?.posture_probabilities ?? {};
                  return <ProbabilityBar key={r.market} label={r.market.split(",")[0]} probs={probs} />;
                })}
                {rankings.length === 0 && <p className="text-xs text-slate-600">No decision data.</p>}
              </div>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> Strategic Entry Playbook</h2>
                <span className="text-xs text-slate-500">{recommendations.length} directives</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#111827] border border-[#1A2338] space-y-2 hover:border-indigo-800/60 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-900">
                        {rec.pillar?.replace(/_/g, " ") ?? `Pillar ${i + 1}`}
                      </span>
                      {rec.confidence && <span className="text-[10px] font-mono text-slate-500">{Math.round(Number(rec.confidence) * 100)}%</span>}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200">{rec.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{rec.action}</p>
                    {rec.supporting_evidence_ids?.length ? (
                      <div className="text-[10px] text-slate-600 pt-1 border-t border-[#1A2338]">{rec.supporting_evidence_ids.length} evidence signals</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB 2: MARKET DEEP DIVE ═══════════════════════ */}
      {activeTab === "market" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rankings.map(r => {
              const isActive = r.market === selectedMarket;
              return (
                <button key={r.market} onClick={() => setSelectedMarket(r.market)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                    isActive ? "bg-indigo-900/40 border-indigo-700 text-white" : "bg-[#0E1424] border-[#1A2338] text-slate-400 hover:border-[#252f45] hover:text-slate-200"
                  )}>
                  <div className="text-left">
                    <div>{r.market.split(",")[0]}</div>
                    <div className="text-[10px] font-mono" style={{ color: scoreColor(r.score) }}>{Math.round(r.score * 100)}</div>
                  </div>
                  {isActive && <VerdictBadge verdict={r.verdict} size="sm" />}
                </button>
              );
            })}
          </div>

          {selectedMarket && (
            <>
              <div className="flex flex-wrap gap-3">
                <ScoreChip label="Cultural Fit" color="#6366F1" value={pct(selectedRanking?.score)} sub="overall score" />
                <ScoreChip label="Consumer Interest" color="#8B5CF6" value={pct(marketDimScores.audience_overlap?.raw_score)} sub="audience_overlap dim" />
                <ScoreChip label="Market Opportunity" color="#22D3EE" value={pct(marketDimScores.category_ecosystem?.raw_score)} sub="category_ecosystem dim" />
                <ScoreChip label="Data Confidence" color="#10B981" value={pct(marketDimScores.evidence_coverage?.raw_score)} sub={`${(marketDimScores.evidence_coverage?.raw_score ?? 0) >= 0.8 ? "HIGH" : "MEDIUM"} tier`} />
              </div>

              {selectedDecision?.posture_probabilities && (
                <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-4">
                  <ProbabilityBar
                    label={`${selectedMarket.split(",")[0]} — Launch Readiness`}
                    probs={selectedDecision.posture_probabilities} />
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span>Confidence: <strong className="text-slate-300">{pct(selectedDecision.posture_confidence)}</strong></span>
                    {selectedDecision.evidence_sufficiency && (
                      <span>Evidence: <strong className="text-slate-300 capitalize">{selectedDecision.evidence_sufficiency}</strong></span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">5-Dimension Breakdown</h3>
                  {Object.keys(marketDimScores).length > 0 ? (
                    Object.entries(marketDimScores).map(([dim, ds]) => (
                      <DimBar key={dim} dim={dim} score={ds.raw_score} weight={ds.weight} explanation={ds.explanation} />
                    ))
                  ) : <p className="text-xs text-slate-600">No dimension data.</p>}
                </div>

                <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Cultural Taste Signals</h3>
                    <div>
                      <EvidenceDonut evidence={evidence} market={selectedMarket} />
                    </div>
                  </div>
                  <TasteEntities evidence={evidence} market={selectedMarket} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════ TAB 3: AGENT TIMELINE ═════════════════════════ */}
      {activeTab === "timeline" && (
        <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 animate-in fade-in duration-200 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Cpu className="w-4 h-4 text-violet-400" /> Agent Pipeline Trace</h2>
            <p className="text-xs text-slate-500 mt-0.5">Full execution trace — click any step to inspect agent objectives, actions, and deliverables</p>
          </div>
          {steps.length > 0
            ? <AgentTimeline steps={steps} />
            : <div className="py-10 text-center text-sm text-slate-600">No agent steps recorded.</div>
          }
        </div>
      )}

      {/* ════════════════════════ TAB 4: EVIDENCE ═══════════════════════════ */}
      {activeTab === "evidence" && (
        <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2338]">
            <div>
              <h2 className="text-sm font-bold text-white">Qloo Consumer Taste Signals</h2>
              <p className="text-xs text-slate-500 mt-0.5">Raw evidence from Qloo taste graph — feeds the 5-dimension scorer</p>
            </div>
            <span className="text-xs text-slate-500">{filteredEvidence.length} / {evidence.length} records</span>
          </div>

          {/* Market filter chips */}
          {marketNames.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setEvidenceFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                  evidenceFilter === "all" ? "bg-indigo-900/40 border-indigo-700 text-white" : "bg-[#111827] border-[#1A2338] text-slate-500 hover:text-slate-300"
                )}>
                All Markets
              </button>
              {marketNames.map(m => (
                <button key={m} onClick={() => setEvidenceFilter(m)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                    evidenceFilter === m ? "bg-indigo-900/40 border-indigo-700 text-white" : "bg-[#111827] border-[#1A2338] text-slate-500 hover:text-slate-300"
                  )}>
                  {m.split(",")[0]}
                </button>
              ))}
            </div>
          )}

          {filteredEvidence.length === 0
            ? <div className="py-10 text-center text-sm text-slate-600">No evidence records{evidenceFilter !== "all" ? " for this market" : ""}.</div>
            : (
              <div className="divide-y divide-[#1A2338]">
                {filteredEvidence.map(ev => {
                  const dimMeta = DIM_LABELS[ev.kind] ?? { color: "#94A3B8", uiLabel: ev.kind };
                  const entityLabel = ev.entity_name ?? ev.market_name ?? "Signal";
                  // Show entity_ref only if it's not a UUID (i.e. it carries readable info like "qloo:location:JP")
                  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ev.entity_ref ?? "");
                  const showRef = ev.entity_ref && !isUUID && !ev.entity_name;
                  const scoreVal = ev.score ?? ev.value_numeric;
                  return (
                    <div key={ev.id} className="py-3.5 px-2 hover:bg-[#111827] rounded-lg transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${dimMeta.color}20`, color: dimMeta.color, border: `1px solid ${dimMeta.color}30` }}>
                            {dimMeta.uiLabel}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 truncate">{entityLabel}</span>
                          {showRef && (
                            <span className="text-[10px] bg-[#0E1424] border border-[#1A2338] px-1.5 py-0.5 rounded font-mono text-slate-500 flex-shrink-0">
                              {ev.entity_ref}
                            </span>
                          )}
                          {ev.market_name && (
                            <span className="text-[10px] text-slate-500 flex-shrink-0">
                              {ev.market_name.split(",")[0]}
                            </span>
                          )}
                          {ev.source && (
                            <span className="text-[10px] bg-[#0E1424] border border-[#1A2338] px-1.5 py-0.5 rounded font-mono text-slate-600 flex-shrink-0">
                              {ev.source}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 font-mono text-[11px]">
                          {scoreVal !== undefined && scoreVal !== null && (
                            <span className="font-bold" style={{ color: scoreColor(scoreVal) }}>{pct(scoreVal)}</span>
                          )}
                          {ev.confidence !== undefined && (
                            <span className="text-slate-600">conf {pct(ev.confidence, 0)}</span>
                          )}
                        </div>
                      </div>
                      {(ev.content ?? ev.explanation) && (
                        <p className="text-[11px] text-slate-500 leading-relaxed">{ev.content ?? ev.explanation}</p>
                      )}
                      {ev.value_text && ev.value_text !== (ev.content ?? ev.explanation) && (
                        <p className="text-[10px] text-slate-600 font-mono italic">{ev.value_text}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {/* ════════════════════════ TAB 5: SIMULATION ═════════════════════════ */}
      {activeTab === "simulation" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                Counterfactual Scenario Lab
              </h2>
              <p className="text-xs text-slate-500 mt-1">Describe a what-if scenario — the system will parse your intent into a testable parameter plan.</p>
            </div>

            {/* Step 1: Describe */}
            {!simResult && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Describe your scenario
                  </label>
                  <textarea
                    value={simScenario}
                    onChange={e => { setSimScenario(e.target.value); setSimPlan([]); setSimConfirmed(false); }}
                    rows={3}
                    placeholder="e.g. What if we repositioned for younger audiences with eco-conscious messaging and local partnerships?"
                    className="w-full rounded-xl border border-[#1A2338] bg-[#111827] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-600 focus:outline-none resize-none"
                  />
                </div>

                {/* Scenario templates */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Quick scenarios</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Target younger Gen-Z consumers with digital-first approach",
                      "Reposition as ultra-premium luxury brand",
                      "Eco-conscious sustainable brand pivot",
                      "Local partnership and co-branding strategy",
                      "Budget-friendly mass market approach",
                    ].map(t => (
                      <button key={t} onClick={() => { setSimScenario(t); setSimPlan([]); setSimConfirmed(false); }}
                        className="px-2.5 py-1 rounded-lg border border-[#252f45] bg-[#111827] hover:border-indigo-700 hover:bg-indigo-950/20 text-[10px] text-slate-400 hover:text-indigo-300 transition-all text-left">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleParseScenario} disabled={parsingSim || !simScenario.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-xs font-bold text-white transition-colors">
                  {parsingSim
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Parsing…</>
                    : <><MessageSquare className="w-3.5 h-3.5" /> Parse Scenario</>
                  }
                </button>
              </div>
            )}

            {/* Step 2: Plan */}
            {simPlan.length > 0 && !simResult && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-t border-[#1A2338] pt-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Simulation Plan — Parameters to change</div>
                  <div className="space-y-2">
                    {simPlan.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-[#252f45] bg-[#111827]">
                        <div className="w-5 h-5 rounded-full bg-violet-900/60 border border-violet-700 flex items-center justify-center flex-shrink-0 mt-px">
                          <span className="text-[9px] font-bold text-violet-300">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                            <span className="text-[10px] font-mono text-slate-600 bg-[#0E1424] px-1.5 py-0.5 rounded border border-[#1A2338]">{item.key}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            {item.original && <span className="text-slate-600 line-through">{item.original}</span>}
                            <span className="text-violet-300 font-mono">{item.value.length > 60 ? item.value.slice(0, 60) + "…" : item.value}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={simConfirmed} onChange={e => setSimConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1A2338] bg-[#111827] accent-violet-500" />
                    <span className="text-xs text-slate-400">I&apos;ve reviewed the plan and want to proceed</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => { setSimPlan([]); setSimConfirmed(false); }}
                    className="px-4 py-2.5 rounded-xl border border-[#252f45] text-xs text-slate-400 hover:text-slate-200 hover:border-[#3a4a60] transition-colors">
                    Revise
                  </button>
                  <button onClick={handleExecuteSimulation} disabled={!simConfirmed || runningSim}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white transition-colors">
                    {runningSim
                      ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running simulation…</>
                      : <><Play className="w-3.5 h-3.5" /> Run Simulation</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Result */}
            {simResult && (
              <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/20 p-4 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Simulation Complete
                  </span>
                  <Link href={`/runs/${simResult.id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    Open full run <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Baseline Score", val: run.overall_score ? pct(run.overall_score) : "—", color: "#94A3B8" },
                    { label: "Simulated Score", val: simResult.overall_score ? pct(simResult.overall_score) : "—", color: "#A5B4FC" },
                    { label: "New Verdict", val: simResult.decision_verdict ?? "—", color: verdictColor(simResult.decision_verdict ?? "") },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-[#111827] border border-[#1A2338] p-3 text-center">
                      <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
                      <div className="text-base font-bold font-mono" style={{ color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                {simResult.strategy_summary && (
                  <p className="text-xs text-slate-400 italic">"{simResult.strategy_summary}"</p>
                )}
                <button onClick={() => { setSimResult(null); setSimPlan([]); setSimConfirmed(false); setSimScenario(""); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Run another scenario ↩
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════ TAB 6: REPORT ════════════════════════════ */}
      {activeTab === "report" && (
        <div className="rounded-xl border border-[#1A2338] bg-[#0E1424] p-5 animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2338]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Reports
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{reports.length} report{reports.length !== 1 ? "s" : ""} — click View to open</p>
            </div>
            {run.status === "completed" && (
              <button onClick={() => handleGenerateReport("html")} disabled={generatingReport}
                className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40 transition-colors flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {generatingReport ? "Generating…" : "Regenerate"}
              </button>
            )}
          </div>

          {generatingReport && (
            <div className="flex items-center justify-center py-10 gap-3 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Compiling executive brief…
            </div>
          )}

          {reports.length > 0 ? (
            <div className="space-y-2">
              {/* All reports as simple cards */}
              {reports.map(rep => (
                <div key={rep.id}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all",
                    activeReport?.id === rep.id
                      ? "border-indigo-700 bg-indigo-950/30"
                      : "border-[#1A2338] bg-[#111827] hover:border-[#252f45]"
                  )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className={cn("w-4 h-4 flex-shrink-0", activeReport?.id === rep.id ? "text-indigo-400" : "text-slate-500")} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{rep.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{formatDate(rep.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setActiveReport(rep); setReportModalOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors">
                      View
                    </button>
                    <button
                      onClick={(e) => handleDeleteReport(rep.id, e)}
                      disabled={deletingReportId === rep.id}
                      title="Delete report"
                      className="p-1.5 rounded-lg border border-[#1A2338] bg-[#111827] hover:bg-rose-950/40 hover:border-rose-900/60 text-slate-400 hover:text-rose-400 disabled:opacity-40 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* hidden iframe ref for PDF generation */}
              <div className="hidden">
                <iframe ref={reportIframeRef} srcDoc={activeReport?.content ?? ""} sandbox="allow-same-origin" title="pdf-source" />
              </div>


            </div>
          ) : (
            !generatingReport && (
              <div className="py-16 text-center text-xs text-slate-600">
                {run.status === "completed"
                  ? "Auto-generating report…"
                  : "Report will be available once the run completes."}
              </div>
            )
          )}
        </div>
      )}
    </div>

    {/* Report modal */}
    {reportModalOpen && activeReport && (
      <ReportModal report={activeReport} onClose={() => setReportModalOpen(false)} />
    )}
    </>
  );
}
