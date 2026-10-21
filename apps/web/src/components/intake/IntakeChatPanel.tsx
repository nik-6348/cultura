"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { ProjectSpecCard, ProjectSpec } from "./ProjectSpecCard";
import { MarkdownText } from "@/components/ui/ChatPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  spec?: ProjectSpec | null;
  isReady?: boolean;
}

interface IntakeChatPanelProps {
  workspaceId: string;
  onProjectCreated: (projectId: string, runId: string) => void;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-4">
      {[0, 1, 2].map((n) => (
        <span
          key={n}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${n * 0.18}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

export function IntakeChatPanel({ workspaceId, onProjectCreated }: IntakeChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [thinking, setThinking] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [latestSpec, setLatestSpec] = useState<ProjectSpec | null>(null);
  const [isReady, setIsReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with AI greeting
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "What brand are you expanding, and where are you thinking of taking it? Tell me as much or as little as you like.",
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSend = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? inputValue).trim();
      if (!text || thinking || launching) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      if (!textOverride) setInputValue("");
      setThinking(true);

      try {
        // Build history for the API (exclude the welcome message from history)
        const history = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const result = await api.intakeMessage({ message: text, messages: history });

        const botMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.reply,
          spec: result.spec,
          isReady: result.ready,
        };
        setMessages((prev) => [...prev, botMsg]);
        if (result.spec) setLatestSpec(result.spec);
        if (result.ready) setIsReady(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "Something went wrong. Please try again.",
          },
        ]);
      } finally {
        setThinking(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [inputValue, thinking, launching, messages]
  );

  const handleLaunch = useCallback(async () => {
    if (!latestSpec?.brand_name || latestSpec.markets.length === 0 || launching) return;
    setLaunching(true);
    try {
      const project = await api.createProject({
        workspace_id: workspaceId,
        name: latestSpec.project_name || `${latestSpec.brand_name} Expansion`,
        objective: latestSpec.objective || undefined,
        brand_profile_json: {
          name: latestSpec.brand_name,
          category: latestSpec.brand_category || undefined,
        },
        audience_profile_json: latestSpec.audience_description
          ? { description: latestSpec.audience_description }
          : undefined,
        candidate_markets: latestSpec.markets.map((m) => ({
          name: m.name,
          country_code: m.country_code ?? undefined,
        })),
      });
      const run = await api.createRun(project.id);
      onProjectCreated(project.id, run.id);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Failed to create project: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
        },
      ]);
      setLaunching(false);
    }
  }, [latestSpec, workspaceId, onProjectCreated, launching]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0A0F1C]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/30">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[84%] rounded-2xl px-4 py-3 text-[12px] shadow-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md"
                  : "bg-[#151C2C] border border-[#1E2A42] text-slate-200 rounded-bl-md"
              }`}
            >
              {msg.role === "user" ? (
                <p className="leading-relaxed">{msg.content}</p>
              ) : (
                <div className="space-y-2">
                  <MarkdownText text={msg.content} />
                  {msg.spec && (
                    <ProjectSpecCard
                      spec={msg.spec}
                      onLaunch={handleLaunch}
                      launching={launching}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex items-end gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-[#151C2C] border border-[#1E2A42]">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Show launch button at bottom when ready but user hasn't launched yet */}
        {isReady && latestSpec && !launching && (
          <div className="flex justify-center pt-1">
            <button
              onClick={handleLaunch}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold transition-colors shadow-lg shadow-indigo-900/30"
            >
              Launch Analysis →
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 flex-shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className={`flex items-center gap-2 bg-[#0E1628] border rounded-xl px-3 py-2.5 transition-all duration-200 ${
            inputFocused
              ? "border-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.15)]"
              : "border-[#1A2338] hover:border-[#1E2A42]"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={thinking ? "Thinking…" : "Describe your brand, markets, audience…"}
            disabled={thinking || launching}
            className="flex-1 bg-transparent text-[12px] text-white placeholder-slate-600 focus:outline-none disabled:text-slate-600"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || thinking || launching}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
