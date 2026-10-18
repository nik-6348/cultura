"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Sparkles, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { timeAgo } from "@/lib/utils";

interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  preview: string;
}

export default function AnalystChatPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [panelKey, setPanelKey] = useState(0);

  // Load projects on mount
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

  // Load conversations when project changes
  useEffect(() => {
    if (!selectedProject) return;
    setActiveConversationId(undefined);
    setPanelKey((k) => k + 1);
    async function loadConvs() {
      try {
        const list = await api.listConversations(selectedProject!.id);
        setConversations(list);
        // Auto-select most recent
        if (list.length > 0) {
          setActiveConversationId(list[0].id);
          setPanelKey((k) => k + 1);
        }
      } catch {
        setConversations([]);
      }
    }
    loadConvs();
  }, [selectedProject]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(undefined);
    setPanelKey((k) => k + 1);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setPanelKey((k) => k + 1);
  }, []);

  const handleConversationCreated = useCallback((id: string, title: string) => {
    setActiveConversationId(id);
    setConversations((prev) => {
      // Avoid duplicates
      if (prev.find((c) => c.id === id)) return prev;
      return [
        { id, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), preview: title },
        ...prev,
      ];
    });
  }, []);

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-[#0E1424] rounded-2xl border border-[#1A2338] overflow-hidden">
      {/* ── Conversation sidebar ──────────────────────────────────────────── */}
      <div className="w-60 flex-shrink-0 flex flex-col border-r border-[#1A2338] bg-[#0a0f1a]">
        {/* Project selector */}
        <div className="p-3 border-b border-[#1A2338]">
          {projects.length > 1 ? (
            <select
              value={selectedProject?.id ?? ""}
              onChange={(e) => {
                const p = projects.find((item) => item.id === e.target.value);
                if (p) setSelectedProject(p);
              }}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#1A2338] bg-[#111827] text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-300 truncate">
                {selectedProject?.name ?? "AI Assistant"}
              </span>
            </div>
          )}
        </div>

        {/* New conversation button */}
        <div className="p-2">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1A2338] hover:bg-[#1A2338] text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New conversation
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {conversations.length === 0 ? (
            <p className="text-[10px] text-slate-600 px-2 py-4 text-center">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors group ${
                  conv.id === activeConversationId
                    ? "bg-indigo-900/30 border border-indigo-500/30"
                    : "hover:bg-[#1A2338] border border-transparent"
                }`}
              >
                <div className="flex items-start gap-1.5">
                  <MessageSquare className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                    conv.id === activeConversationId ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"
                  }`} />
                  <div className="min-w-0">
                    <div className={`text-[11px] font-medium truncate ${
                      conv.id === activeConversationId ? "text-slate-200" : "text-slate-400 group-hover:text-slate-300"
                    }`}>
                      {conv.title.length > 40 ? conv.title.slice(0, 40) + "…" : conv.title}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {timeAgo(conv.updated_at)}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-12 px-5 border-b border-[#1A2338] flex items-center gap-3 flex-shrink-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white leading-none truncate">
              {activeConversationId
                ? (conversations.find((c) => c.id === activeConversationId)?.title ?? "Conversation")
                : "New conversation"}
            </h1>
          </div>
        </div>

        {selectedProject ? (
          <ChatPanel
            key={panelKey}
            projectId={selectedProject.id}
            conversationId={activeConversationId}
            scrollAreaClass="flex-1"
            onConversationCreated={handleConversationCreated}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
