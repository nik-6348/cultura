"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, RotateCcw, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";
import { ChatPanel } from "@/components/ui/ChatPanel";

export default function AnalystChatPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [startFresh, setStartFresh] = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        const wsList = await api.getWorkspaces();
        if (!wsList?.length) return;
        const projs = await api.getProjects(wsList[0].id);
        setProjects(projs);
        if (projs.length > 0) setSelectedProject(projs[0]);
      } catch {
        // silent
      }
    }
    init();
  }, []);

  const handleProjectChange = useCallback((projectId: string) => {
    const p = projects.find((item) => item.id === projectId);
    if (p && p.id !== selectedProject?.id) {
      setSelectedProject(p);
      setStartFresh(false);
      setPanelKey((k) => k + 1);
    }
  }, [projects, selectedProject]);

  const handleReset = useCallback(() => {
    setStartFresh(true);
    setPanelKey((k) => k + 1);
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 max-w-screen-xl mx-auto">
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-[#0E1424] rounded-2xl border border-[#1A2338] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-[#1A2338] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">AI Analyst</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Evidence-backed cultural intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Project selector */}
          {projects.length > 0 && (
            <div className="relative">
              <select
                value={selectedProject?.id ?? ""}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-[#1A2338] bg-[#111827] text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1A2338] hover:bg-[#1A2338] text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset chat
          </button>
        </div>
      </div>

      {/* Chat */}
      {selectedProject ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatPanel
            key={panelKey}
            projectId={selectedProject.id}
            startFresh={startFresh}
            scrollAreaClass="flex-1 min-h-0"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      )}
    </div>
    </div>
  );
}
