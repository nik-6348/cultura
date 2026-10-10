"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESET_MARKETS = [
  { name: "London", country_code: "GB", location_code: "GB-LND" },
  { name: "Berlin", country_code: "DE", location_code: "DE-BER" },
  { name: "Paris", country_code: "FR", location_code: "FR-PAR" },
  { name: "Tokyo", country_code: "JP", location_code: "JP-TYO" },
  { name: "Stockholm", country_code: "SE", location_code: "SE-STO" },
  { name: "Amsterdam", country_code: "NL", location_code: "NL-AMS" },
];

export default function NewProjectWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [projectName, setProjectName] = useState("Nordic Oat Milk European Expansion");
  const [brandName, setBrandName] = useState("PureOat Nordic");
  const [category, setCategory] = useState("Plant-based Specialty Food & Beverage");
  const [positioning, setPositioning] = useState("Clean-label sustainable premium oat dairy alternative");
  const [objective, setObjective] = useState("Evaluate market entry affinity, cafe adoption potential, and cultural risks");

  // Audience State
  const [audiencePersona, setAudiencePersona] = useState("Urban eco-conscious professionals & third-wave coffee drinkers");
  const [audienceInterests, setAudienceInterests] = useState("Specialty coffee, organic gastronomy, sustainable design, cycling");

  // Markets State
  const [selectedMarkets, setSelectedMarkets] = useState<
    Array<{ name: string; country_code?: string; location_code?: string }>
  >([
    { name: "London", country_code: "GB", location_code: "GB-LND" },
    { name: "Berlin", country_code: "DE", location_code: "DE-BER" },
  ]);

  const [launchAnalysis, setLaunchAnalysis] = useState(true);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const wsList = await api.getWorkspaces();
        let ws = wsList[0];
        if (!ws) {
          ws = await api.createWorkspace("European Strategy Lab", "strategy.cultura.ai");
        }
        setWorkspace(ws);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to initialize workspace";
        setError(msg);
      }
    }
    loadWorkspace();
  }, []);

  const togglePresetMarket = (preset: typeof PRESET_MARKETS[0]) => {
    const exists = selectedMarkets.some((m) => m.name === preset.name);
    if (exists) {
      if (selectedMarkets.length <= 1) return; // Keep at least one
      setSelectedMarkets(selectedMarkets.filter((m) => m.name !== preset.name));
    } else {
      setSelectedMarkets([...selectedMarkets, preset]);
    }
  };

  const handleCreateProject = async () => {
    if (!workspace) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Create Project
      const project = await api.createProject({
        workspace_id: workspace.id,
        name: projectName,
        objective: objective,
        brand_profile_json: {
          brand_name: brandName,
          category: category,
          positioning: positioning,
        },
        audience_profile_json: {
          persona: audiencePersona,
          interests: audienceInterests.split(",").map((s) => s.trim()),
        },
        candidate_markets: selectedMarkets,
      });

      // 2. Launch Analysis Run if requested
      if (launchAnalysis) {
        const run = await api.createRun(
          project.id,
          selectedMarkets.map((m) => ({ name: m.name, code: m.location_code || "GLOBAL" }))
        );
        router.push(`/runs/${run.id}`);
      } else {
        router.push(`/projects/${project.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create project";
      setError(msg);
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Brand & Objective" },
    { num: 2, title: "Target Audience" },
    { num: 3, title: "Candidate Markets" },
    { num: 4, title: "Review & Launch" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <Link href="/projects" className="hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Projects</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">New Analysis Project</span>
      </div>

      {/* Stepper Progress */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center space-x-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span
                  className={cn(
                    "hidden sm:inline text-xs font-semibold",
                    isCurrent ? "text-indigo-900" : isDone ? "text-slate-700" : "text-slate-400"
                  )}
                >
                  {s.title}
                </span>
                {idx < steps.length - 1 && (
                  <div className="hidden sm:block w-8 lg:w-16 h-0.5 bg-slate-200 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">Creation Error</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* Step 1: Brand & Objective */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Brand & Core Objective</h2>
              <p className="text-xs text-slate-500 mt-1">
                Define the initiative parameters to evaluate against Qloo cultural signals.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Nordic Oat Milk European Expansion"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Brand / Entity Name
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. PureOat"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Industry / Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Food & Beverage"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brand Positioning
                </label>
                <input
                  type="text"
                  value={positioning}
                  onChange={(e) => setPositioning(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Clean-label sustainable premium oat dairy alternative"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Strategic Objective
                </label>
                <textarea
                  rows={3}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Describe market launch goals, target distribution channels, and critical hypotheses..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Target Audience */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Target Audience Profile</h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure consumer taste characteristics to match with Qloo demographic taste curves.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Core Audience Persona
                </label>
                <input
                  type="text"
                  value={audiencePersona}
                  onChange={(e) => setAudiencePersona(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Urban eco-conscious professionals"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Cultural Taste Affinities & Keywords (comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={audienceInterests}
                  onChange={(e) => setAudienceInterests(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                  placeholder="Specialty coffee, organic gastronomy, sustainable design, cycling"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  These keywords are matched against Qloo entities to calculate empirical audience overlap.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Candidate Markets */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Candidate Target Markets</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select candidate markets to compare head-to-head using deterministic scoring.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select from Supported Qloo Metros
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_MARKETS.map((preset) => {
                  const isSelected = selectedMarkets.some((m) => m.name === preset.name);
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => togglePresetMarket(preset)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all",
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <Globe2
                          className={cn(
                            "w-4 h-4",
                            isSelected ? "text-indigo-600" : "text-slate-400"
                          )}
                        />
                        <span>{preset.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">
                        {preset.location_code}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3">
                <span className="text-xs text-slate-500">
                  Selected Markets:{" "}
                  <strong className="text-slate-800">
                    {selectedMarkets.map((m) => m.name).join(", ")}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Review & Orchestrate</h2>
              <p className="text-xs text-slate-500 mt-1">
                Verify project configuration before starting the multi-agent analysis pipeline.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Project Name:</span>
                <span className="font-semibold text-slate-900">{projectName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Brand / Category:</span>
                <span className="font-semibold text-slate-900">{brandName} ({category})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Target Markets:</span>
                <span className="font-semibold text-indigo-700">
                  {selectedMarkets.map((m) => m.name).join(", ")}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Target Persona:</span>
                <span className="font-semibold text-slate-900">{audiencePersona}</span>
              </div>
            </div>

            {/* Launch Switch */}
            <div className="flex items-center space-x-3 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50">
              <input
                type="checkbox"
                id="launch_now"
                checked={launchAnalysis}
                onChange={(e) => setLaunchAnalysis(e.target.checked)}
                className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="launch_now" className="text-xs text-slate-800">
                <span className="font-semibold">Execute Multi-Agent Analysis Run immediately</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Runs the 10-node agent DAG, gathers Qloo taste signals, computes deterministic scores, and calls TypeSafe Jev System One gate.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateProject}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Orchestrating..." : "Create Project & Run Analysis"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
