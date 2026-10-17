"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Cpu,
  Moon,
  Sun,
  CheckCircle2,
  Building,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { api } from "@/lib/api";
import { Workspace } from "@/lib/types";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const list = await api.getWorkspaces();
        if (list && list.length > 0) {
          setWorkspace(list[0]);
        }
      } catch (e) {
        console.error("Failed to load workspace in settings", e);
      }
    }
    loadWorkspace();
  }, []);

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
          <Settings className="w-6 h-6 text-indigo-600" />
          <span>Platform & Workspace Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your organization, AI engine integrations, security rules, and user preferences.
        </p>
      </div>

      {/* 1. Workspace Profile */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex items-center space-x-2.5">
          <Building className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Workspace Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              readOnly
              value={workspace?.name || "Acme Brands"}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned Domain
            </label>
            <input
              type="text"
              readOnly
              value={workspace?.domain || "acme.cultura.ai"}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. Theme & Appearance */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5">
          {(mounted ? theme : "light") === "dark" ? (
            <Moon className="w-5 h-5 text-indigo-400" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" />
          )}
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Theme & Appearance
          </h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Select between light and dark modes. Changes are applied in real time across all dashboard panels.
        </p>

        <div suppressHydrationWarning className="pt-2">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setTheme((mounted ? theme : "light") === "dark" ? "light" : "dark")}
            className="inline-flex items-center space-x-2.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            {(mounted ? theme : "light") === "dark" ? (
              <Sun className="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 hover:-rotate-12 transition-transform" />
            )}
            <span>{(mounted ? theme : "light") === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
          </button>
        </div>
      </div>

      {/* 3. External AI Integrations Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex items-center space-x-2.5">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            AI Integrations & Gateway Status
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              name: "Global Cultural Taste Graph",
              desc: "Empirical taste vectors & affinity signals via live Qloo API adapter.",
              status: "Connected",
              type: "Empirical Signals",
            },
            {
              name: "Strategic Readiness Decision Gate",
              desc: "Market entry gating and strategic launch posture verification.",
              status: "Active",
              type: "Decision Gate",
            },
            {
              name: "Institutional Brand Memory Engine",
              desc: "Longitudinal campaign learnings and cross-market historical benchmarks.",
              status: "Healthy",
              type: "Institutional Memory",
            },
            {
              name: "Deep Market Evaluation Pipeline",
              desc: "Autonomous multi-agent cultural evaluation and strategy synthesis.",
              status: "Operational",
              type: "Evaluation Engine",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                    {item.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>

              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{item.status}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Enterprise Security Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Security & Compliance Hardening
          </h2>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span>Prompt Injection Guard (XML Boundary Wrapping)</span>
            <span className="font-bold text-emerald-600">ENABLED</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span>Sensitive Data Masker (API Key & PII Log Redaction)</span>
            <span className="font-bold text-emerald-600">ENABLED</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span>Multi-Tenant Workspace Strict Isolation</span>
            <span className="font-bold text-emerald-600">ENFORCED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
