"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Send, Sparkles, Plus, Minus, ArrowRight, CheckCircle2,
  RotateCcw, ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalysisRun } from "@/lib/types";
import { MarkdownText } from "@/components/ui/ChatPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimChange {
  type: "add_market" | "remove_market" | "replace_markets" | "positioning" | "audience" | "category" | "generic";
  label: string;
  value: string;
  apiKey: string;
  apiValue: unknown;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  changes?: SimChange[];
  confirmed?: boolean;
}

interface SimulationChatPanelProps {
  run: AnalysisRun;
  onSimulationComplete?: (simRun: AnalysisRun) => void;
}

// ─── Change parser ────────────────────────────────────────────────────────────

function parseIntent(text: string, currentMarkets: string[]): SimChange[] {
  const changes: SimChange[] = [];
  const lower = text.toLowerCase();

  // Detect remove-then-add (replace intent): "replace X with Y", "instead of X try Y", "swap X for Y"
  const replaceMatch = text.match(/(?:replace|swap|instead of)\s+([A-Za-z\s,]+?)\s+(?:with|for|try)\s+([A-Za-z\s,]+)/i);
  if (replaceMatch) {
    const toRemove = replaceMatch[1].trim().split(/\s*,\s*/);
    const toAdd = replaceMatch[2].trim().split(/\s*,\s*/);
    const newMarkets = currentMarkets
      .filter((m) => !toRemove.some((r) => m.toLowerCase().includes(r.toLowerCase())))
      .concat(toAdd.map((a) => a.trim()));
    changes.push({
      type: "replace_markets",
      label: `Markets: ${toRemove.join(", ")} → ${toAdd.join(", ")}`,
      value: newMarkets.join(", "),
      apiKey: "override_markets",
      apiValue: newMarkets.map((n) => ({ name: n })),
    });
    return changes;
  }

  // "add [city]", "include [city]", "also try [city]", "test [city] too"
  const addPatterns = [
    /(?:add|include|also try|test|try adding)\s+([A-Za-z\s,]+?)(?:\s+(?:to|as well|too|also|and|market|markets))?(?=[,.]|$)/gi,
    /(?:what about|how about)\s+([A-Za-z\s,]+?)(?:\s+(?:too|as well|instead|also))?(?=[,.]|$)/gi,
  ];
  const addedCities = new Set<string>();
  for (const pat of addPatterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const cities = m[1].split(/\s*(?:and|,)\s*/).map((s) => s.trim()).filter((s) => s.length > 2 && s.length < 40);
      cities.forEach((c) => addedCities.add(c));
    }
  }
  if (addedCities.size > 0) {
    const list = Array.from(addedCities);
    changes.push({
      type: "add_market",
      label: `Add: ${list.join(", ")}`,
      value: list.join(", "),
      apiKey: "add_markets",
      apiValue: list.map((n) => ({ name: n })),
    });
  }

  // "remove [city]", "drop [city]", "without [city]", "exclude [city]"
  const removePatterns = [
    /(?:remove|drop|without|exclude|skip|cut)\s+([A-Za-z\s,]+?)(?:\s+(?:from|market|markets|out))?(?=[,.]|$)/gi,
  ];
  const removedCities = new Set<string>();
  for (const pat of removePatterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const cities = m[1].split(/\s*(?:and|,)\s*/).map((s) => s.trim()).filter((s) => s.length > 2 && s.length < 40);
      cities.forEach((c) => {
        // Only remove if it looks like a known market or the user named it explicitly
        if (currentMarkets.some((cm) => cm.toLowerCase().includes(c.toLowerCase())) || true) {
          removedCities.add(c);
        }
      });
    }
  }
  if (removedCities.size > 0) {
    const list = Array.from(removedCities);
    changes.push({
      type: "remove_market",
      label: `Remove: ${list.join(", ")}`,
      value: list.join(", "),
      apiKey: "remove_markets",
      apiValue: list,
    });
  }

  // Positioning
  if (/\bultra.?premium\b|\bultra.?luxury\b/i.test(lower))
    changes.push({ type: "positioning", label: "Positioning → ultra-premium", value: "ultra_premium", apiKey: "price_positioning", apiValue: "ultra_premium" });
  else if (/\bluxury\b|\bpremium\b|\bhigh.?end\b/i.test(lower))
    changes.push({ type: "positioning", label: "Positioning → premium", value: "premium", apiKey: "price_positioning", apiValue: "premium" });
  else if (/\bbudget\b|\baffordable\b|\bmass.?market\b|\bvalue\b/i.test(lower))
    changes.push({ type: "positioning", label: "Positioning → value", value: "value", apiKey: "price_positioning", apiValue: "value" });
  else if (/\bmid.?range\b|\bmiddle\b|\bmid.?tier\b/i.test(lower))
    changes.push({ type: "positioning", label: "Positioning → mid-range", value: "mid_range", apiKey: "price_positioning", apiValue: "mid_range" });

  // Audience — age
  const ageMatch = text.match(/(\d{2})\s*[-–to]+\s*(\d{2})/);
  if (ageMatch) {
    const label = `Audience age → ${ageMatch[1]}–${ageMatch[2]}`;
    changes.push({ type: "audience", label, value: `${ageMatch[1]}-${ageMatch[2]}`, apiKey: "audience_profile", apiValue: { age_range: [parseInt(ageMatch[1]), parseInt(ageMatch[2])] } });
  } else if (/\bgen.?z\b|\bgen z\b/i.test(lower))
    changes.push({ type: "audience", label: "Audience → Gen-Z (16–26)", value: "Gen-Z", apiKey: "target_audience", apiValue: "Gen-Z digital natives (16–26)" });
  else if (/\bmillen/i.test(lower))
    changes.push({ type: "audience", label: "Audience → Millennials (27–42)", value: "Millennials", apiKey: "target_audience", apiValue: "Millennials (27–42)" });
  else if (/\byoung/i.test(lower) && !ageMatch)
    changes.push({ type: "audience", label: "Audience → younger (18–30)", value: "18-30", apiKey: "audience_profile", apiValue: { age_range: [18, 30] } });
  else if (/\bold|\bsenior|\bmature/i.test(lower) && !ageMatch)
    changes.push({ type: "audience", label: "Audience → mature (35–55)", value: "35-55", apiKey: "audience_profile", apiValue: { age_range: [35, 55] } });

  // Category / sector
  const catMatch = lower.match(/\b(streetwear|fashion|beauty|food|beverage|tech|fitness|sports|gaming|music|travel|luxury goods)\b/);
  if (catMatch)
    changes.push({ type: "category", label: `Category → ${catMatch[1]}`, value: catMatch[1], apiKey: "category", apiValue: catMatch[1] });

  // Eco / sustainability
  if (/\beco\b|\bsustain|\bgreen\b|\bconscious/i.test(lower))
    changes.push({ type: "generic", label: "Brand values → eco-conscious", value: "sustainability_focus", apiKey: "brand_profile", apiValue: { sustainability_focus: "high", eco_certifications: true } });

  // Fallback
  if (changes.length === 0)
    changes.push({ type: "generic", label: `Scenario: ${text.slice(0, 80)}`, value: text.slice(0, 120), apiKey: "target_audience", apiValue: text.slice(0, 120) });

  return changes;
}

function changesToApiPayload(changes: SimChange[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const addMarkets: Array<{ name: string }> = [];
  const removeMarkets: string[] = [];

  for (const c of changes) {
    if (c.apiKey === "add_markets") {
      addMarkets.push(...(c.apiValue as Array<{ name: string }>));
    } else if (c.apiKey === "remove_markets") {
      removeMarkets.push(...(c.apiValue as string[]));
    } else if (c.apiKey === "audience_profile" && payload.audience_profile) {
      payload.audience_profile = { ...(payload.audience_profile as object), ...(c.apiValue as object) };
    } else if (c.apiKey === "brand_profile" && payload.brand_profile) {
      payload.brand_profile = { ...(payload.brand_profile as object), ...(c.apiValue as object) };
    } else {
      payload[c.apiKey] = c.apiValue;
    }
  }
  if (addMarkets.length > 0) payload.add_markets = addMarkets;
  if (removeMarkets.length > 0) payload.remove_markets = removeMarkets;
  return payload;
}

// ─── Diff card ────────────────────────────────────────────────────────────────

function DiffCard({
  changes,
  onConfirm,
  onCancel,
  running,
}: {
  changes: SimChange[];
  onConfirm: () => void;
  onCancel: () => void;
  running: boolean;
}) {
  return (
    <div className="mt-2 rounded-xl border border-violet-500/30 bg-[#0D1525] overflow-hidden shadow-lg shadow-violet-900/20">
      <div className="px-3 py-2 bg-violet-500/10 border-b border-violet-500/20">
        <p className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">
          Simulation Plan
        </p>
      </div>
      <div className="px-3 py-2.5 space-y-1.5">
        {changes.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            {c.type === "add_market" ? (
              <Plus className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            ) : c.type === "remove_market" ? (
              <Minus className="w-3 h-3 text-rose-400 flex-shrink-0" />
            ) : (
              <ArrowRight className="w-3 h-3 text-violet-400 flex-shrink-0" />
            )}
            <span className="text-[11px] text-slate-200">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={onCancel}
          disabled={running}
          className="flex-1 py-1.5 rounded-lg border border-[#1A2338] text-[11px] text-slate-400 hover:text-slate-200 hover:border-[#2A3A50] transition-colors"
        >
          Revise
        </button>
        <button
          onClick={onConfirm}
          disabled={running}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-[11px] font-semibold text-white transition-colors"
        >
          {running ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running…
            </>
          ) : (
            "Run Simulation →"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ baseline, simRun }: { baseline: AnalysisRun; simRun: AnalysisRun }) {
  const baseScore = baseline.overall_score;
  const simScore = simRun.overall_score;
  const delta = baseScore != null && simScore != null ? simScore - baseScore : null;

  return (
    <div className="mt-2 rounded-xl border border-emerald-500/30 bg-[#0D1525] overflow-hidden shadow-lg">
      <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
            Simulation Complete
          </p>
        </div>
        <Link href={`/runs/${simRun.id}`} className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300">
          Full results <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>
      <div className="px-3 py-2.5 grid grid-cols-3 gap-2">
        {[
          { label: "Baseline", value: baseScore != null ? `${Math.round(baseScore * 100)}%` : "—", color: "text-slate-400" },
          { label: "Simulated", value: simScore != null ? `${Math.round(simScore * 100)}%` : "—", color: "text-indigo-300" },
          {
            label: "Delta",
            value: delta != null ? `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}%` : "—",
            color: delta == null ? "text-slate-400" : delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-400",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-[#111827] border border-[#1A2338] p-2.5 text-center">
            <div className="text-[9px] text-slate-500 mb-1 uppercase tracking-wider">{s.label}</div>
            <div className={`text-base font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 text-center">
        <p className="text-[11px] text-slate-400">
          Verdict: <span className="font-semibold text-indigo-300">{simRun.decision_verdict ?? "—"}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SimulationChatPanel({ run, onSimulationComplete }: SimulationChatPanelProps) {
  const currentMarkets: string[] = (
    (run.input_snapshot_json?.candidate_markets as Array<{ name: string }>) ?? []
  ).map((m) => m.name);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [pendingChanges, setPendingChanges] = useState<SimChange[] | null>(null);
  const [running, setRunning] = useState(false);
  const [simResult, setSimResult] = useState<AnalysisRun | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const marketList = currentMarkets.length > 0
      ? currentMarkets.join(", ")
      : "no markets yet";
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `This run analysed **${run.input_snapshot_json?.brand_name ?? "your brand"}** across ${marketList}.\n\nWhat would you like to test? You can add or remove markets, shift the positioning, change the target audience, or describe any other scenario.`,
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [run.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    (textOverride?: string) => {
      const text = (textOverride ?? inputValue).trim();
      if (!text || running) return;
      if (!textOverride) setInputValue("");

      const changes = parseIntent(text, currentMarkets);

      const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: text };
      const botMsg: ChatMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: changes.length > 0
          ? "Here's what I'll change for this simulation:"
          : "Let me run that scenario for you:",
        changes,
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setPendingChanges(changes);
    },
    [inputValue, running, currentMarkets]
  );

  const handleConfirm = useCallback(async () => {
    if (!pendingChanges || running) return;
    setRunning(true);
    try {
      const payload = changesToApiPayload(pendingChanges);
      const sim = await api.createSimulation(run.id, payload);
      setSimResult(sim);
      setMessages((prev) => [
        ...prev,
        {
          id: `result-${Date.now()}`,
          role: "assistant",
          content: "Simulation complete.",
        },
      ]);
      setPendingChanges(null);
      onSimulationComplete?.(sim);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Simulation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setRunning(false);
    }
  }, [pendingChanges, running, run.id, onSimulationComplete]);

  const handleCancel = useCallback(() => {
    setPendingChanges(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        role: "assistant",
        content: "No problem — describe a different scenario or adjust what you had in mind.",
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleReset = useCallback(() => {
    setSimResult(null);
    setPendingChanges(null);
    const marketList = currentMarkets.join(", ");
    setMessages([
      {
        id: "reset",
        role: "assistant",
        content: `What else would you like to test? Current markets: ${marketList}.`,
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentMarkets]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0A0F1C]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/30">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[84%] rounded-2xl px-3.5 py-3 text-[12px] shadow-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md"
                  : "bg-[#151C2C] border border-[#1E2A42] text-slate-200 rounded-bl-md"
              }`}
            >
              {msg.role === "user" ? (
                <p>{msg.content}</p>
              ) : (
                <div className="space-y-2">
                  <MarkdownText text={msg.content} />
                  {msg.changes && msg.changes.length > 0 && !simResult && (
                    <DiffCard
                      changes={msg.changes}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      running={running}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Result card always at the bottom */}
        {simResult && (
          <div className="pl-9">
            <ResultCard baseline={run} simRun={simResult} />
            <button
              onClick={handleReset}
              className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Test another scenario
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!simResult && (
        <div className="px-3 pb-3 pt-2 flex-shrink-0">
          <div
            className={`flex items-center gap-2 bg-[#0E1628] border rounded-xl px-3 py-2.5 transition-all duration-200 ${
              inputFocused
                ? "border-violet-500/50 shadow-[0_0_16px_rgba(139,92,246,0.12)]"
                : "border-[#1A2338] hover:border-[#1E2A42]"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              disabled={running}
              placeholder="Describe any change — markets, audience, positioning…"
              className="flex-1 bg-transparent text-[12px] text-white placeholder-slate-600 focus:outline-none disabled:text-slate-600"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || running}
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
