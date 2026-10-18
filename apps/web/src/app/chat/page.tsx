"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";
import { ChatPanel } from "@/components/ui/ChatPanel";

export default function AnalystChatPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [panelKey, setPanelKey] = useState(0); // remount panel on project change

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

  const handleProjectChange = (projectId: string) => {
    const p = projects.find((item) => item.id === projectId);
    if (p) {
      setSelectedProject(p);
      setPanelKey((k) => k + 1); // remount to reload history
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-[#0E1424] rounded-2xl border border-[#1A2338] overflow-hidden">
      {/* Header */}
      <div className="h-14 px-5 border-b border-[#1A2338] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">Cultural Intelligence Analyst</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedProject ? selectedProject.name : "Select a project"}
            </p>
          </div>
        </div>

        {projects.length > 0 && (
          <select
            value={selectedProject?.id ?? ""}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#1A2338] bg-[#111827] text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Chat panel */}
      {selectedProject ? (
        <ChatPanel
          key={panelKey}
          projectId={selectedProject.id}
          scrollAreaClass="flex-1"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          Loading projects…
        </div>
      )}
    </div>
  );
}
