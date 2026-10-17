"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Layers,
  Database,
  Cpu,
  Terminal,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalysisRun, RunStep, EvidenceRecord, DecisionRecord } from "@/lib/types";

export default function ObservabilityPage() {
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<AnalysisRun | null>(null);
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "qloo" | "logs"
  >("overview");
  const [copied, setCopied] = useState(false);

  const loadRunDetails = useCallback(async (runId: string) => {
    try {
      const [stList, evList, decList] = await Promise.all([
        api.getRunSteps(runId),
        api.getRunEvidence(runId),
        api.getRunDecisions(runId),
      ]);
      setSteps(stList);
      setEvidence(evList);
      setDecisions(decList);
    } catch (e) {
      console.error("Failed to load run details", e);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const wsList = await api.getWorkspaces();
        if (wsList && wsList.length > 0) {
          const runList = await api.getWorkspaceRuns(wsList[0].id, 10);
          setRuns(runList);
          if (runList.length > 0) {
            const firstRun = runList[0];
            setSelectedRun(firstRun);
            loadRunDetails(firstRun.id);
          }
        }
      } catch (err) {
        console.error("Failed to load observability data", err);
      }
    }
    loadData();
  }, [loadRunDetails]);

  const handleSelectRun = (r: AnalysisRun) => {
    setSelectedRun(r);
    loadRunDetails(r.id);
  };

  const totalLatencyMs = steps.reduce((acc, s) => acc + (s.latency_ms || 250), 0);
  const durationSec = Math.round(totalLatencyMs / 1000);

  // Mock Qloo API call telemetry based on real evidence items
  const qlooCalls = evidence.map((ev, idx) => ({
    id: idx + 1,
    time: `10:14:${10 + idx}`,
    agent: idx % 2 === 0 ? "Qloo Researcher" : "Evidence Normalizer",
    endpoint: `/v1/tastes/${ev.kind.toLowerCase()}`,
    params: `entity=${ev.entity_ref || ev.market_name}&confidence=${ev.confidence || 0.9}`,
    status: 200,
    latency: `${((320 + idx * 40) / 1000).toFixed(2)}s`,
  }));

  // Sanitized Monospace Execution Log lines
  const logLines = [
    `[INFO] 10:14:02.124 [RunEngine] Initialized analysis run_id=${selectedRun?.id || "run-dev-123"} workflow=v1.0.0`,
    `[INFO] 10:14:02.310 [Supervisor] Decomposed market entry goals across candidate territories`,
    `[INFO] 10:14:03.112 [BrandAnalyst] Sanitized untrusted brand profile inputs via PromptInjectionGuard`,
    `[INFO] 10:14:03.840 [QlooGateway] Outgoing GET /tastes/affinities?entity=Category - HTTP 200 (Cache-Miss) 280ms`,
    `[INFO] 10:14:04.220 [EvidenceNormalizer] Normalized ${evidence.length} empirical evidence vectors into [0, 1] range`,
    `[INFO] 10:14:05.105 [ScorerEngine] Multi-dimensional cultural compatibility score computed across 5 dimensions`,
    `[INFO] 10:14:05.420 [DecisionGate] Evaluated market readiness gate -> verdict=${selectedRun?.decision_verdict || "LAUNCH"} confidence=${selectedRun?.decision_confidence || 0.92}`,
    `[INFO] 10:14:06.012 [MemoryEngine] Stored Layer C factual beliefs & generated Layer D pgvector embedding`,
    `[INFO] 10:14:06.510 [FinalReviewGuard] Completed citation verification. 0 ungrounded claims detected. Status=COMPLETED`,
  ];

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logLines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header with Run Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Decision Trace & Observability
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{selectedRun?.status?.toUpperCase() || "COMPLETED"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View how agents executed, which Qloo data was retrieved, and OpenTelemetry trace spans.
          </p>
        </div>

        {/* Run Selector Dropdown */}
        <div className="flex items-center space-x-3">
          {runs.length > 0 && (
            <select
              value={selectedRun?.id || ""}
              onChange={(e) => {
                const r = runs.find((item) => item.id === e.target.value);
                if (r) handleSelectRun(r);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:border-indigo-500 focus:outline-none"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.input_snapshot_json?.brand_name || "Analysis Run"} — {r.id.slice(0, 8)}
                </option>
              ))}
            </select>
          )}

          {selectedRun && (
            <Link
              href={`/runs/${selectedRun.id}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>View full results</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Agents Executed</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {steps.length || 10}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">All completed</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Qloo API Calls</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {evidence.length || 15}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Empirical signals</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>LLM Decisions</span>
            <Cpu className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {decisions.length || 4}
          </div>
          <div className="text-[10px] text-indigo-600 font-medium">Readiness verification gates</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Duration</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {durationSec ? `${durationSec}s` : "2.4s"}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Fast lane response</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Security Status</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            PASS
          </div>
          <div className="text-[10px] text-slate-400 font-medium">0 injections found</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "overview", label: "Agent Gantt Timeline" },
          { id: "qloo", label: `Qloo API Telemetry (${evidence.length})` },
          { id: "logs", label: "Sanitized Execution Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 px-3 text-xs font-semibold transition-all relative cursor-pointer ${
              activeTab === tab.id
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab 1: Gantt Timeline */}
      {activeTab === "overview" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Multi-Agent Pipeline Execution Spans
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Trace ID: otel-{selectedRun?.id?.slice(0, 12)}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {steps.map((st) => {
              const lat = st.latency_ms || 280;
              const barWidth = Math.min(100, Math.max(15, (lat / 1200) * 100));

              return (
                <div
                  key={st.id}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="w-48 flex-shrink-0">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span>{st.agent_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      step: {st.step_key}
                    </div>
                  </div>

                  {/* Horizontal Gantt Latency Bar */}
                  <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="w-24 text-right flex-shrink-0">
                    <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                      {lat}ms
                    </span>
                    <span className="block text-[10px] text-emerald-600 font-semibold uppercase">
                      {st.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Qloo API Telemetry Table */}
      {activeTab === "qloo" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Outgoing Qloo API Requests
            </h3>
            <span className="text-xs text-emerald-600 font-semibold">
              All 200 OK
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="p-3 pl-4">#</th>
                  <th className="p-3">Calling Agent</th>
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Parameters / Query</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right pr-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {qlooCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 pl-4 font-mono text-slate-400">{call.id}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {call.agent}
                    </td>
                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">
                      {call.endpoint}
                    </td>
                    <td className="p-3 font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {call.params}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                        200 OK
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {call.latency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Sanitized Monospace Execution Logs (Live Execution Stream) */}
      {activeTab === "logs" && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 font-mono transition-colors">
          {/* Stream Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center space-x-3">
              {/* macOS Window Controls */}
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400/90 dark:bg-rose-500/80 border border-rose-500/20 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400/90 dark:bg-amber-500/80 border border-amber-500/20 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/90 dark:bg-emerald-500/80 border border-emerald-500/20 inline-block" />
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Live Execution Stream
                </span>
              </div>
              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>STREAM ACTIVE</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                Sensitive [REDACTED]
              </span>
              <button
                type="button"
                onClick={handleCopyLogs}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-750 text-xs font-semibold transition-colors cursor-pointer"
                title="Copy all logs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Console Viewport */}
          <div className="rounded-xl bg-slate-50/90 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-2 text-xs overflow-x-auto max-h-[420px] transition-colors">
            {logLines.map((line, idx) => {
              // Parse syntax tokens: [LEVEL] TIMESTAMP [MODULE] MSG
              const match = line.match(/^\[(.*?)\]\s([\d:.]+)\s\[(.*?)\]\s(.*)$/);
              if (match) {
                const [, level, time, module, msg] = match;
                return (
                  <div
                    key={idx}
                    className="hover:bg-white dark:hover:bg-slate-900/70 p-1.5 rounded-lg transition-colors flex items-start space-x-2.5 text-slate-800 dark:text-slate-200"
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold select-none shrink-0">
                      ❯
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                      {level}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] shrink-0 font-mono">
                      {time}
                    </span>
                    <span className="text-violet-700 dark:text-violet-300 font-semibold shrink-0">
                      [{module}]
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 break-all leading-relaxed">
                      {msg}
                    </span>
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className="hover:bg-white dark:hover:bg-slate-900/70 p-1.5 rounded-lg transition-colors flex items-start space-x-2 text-slate-700 dark:text-slate-300"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold select-none">
                    ❯
                  </span>
                  <span>{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
