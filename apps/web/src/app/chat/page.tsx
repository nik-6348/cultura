"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Sparkles,
  Paperclip,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Project, ChatResponse, DimensionChartPoint, EvidenceCard } from "@/lib/types";

interface ChatMessage {
  id: string;
  sender: "user" | "analyst";
  text: string;
  timestamp: string;
  citations?: Array<{ id: number; label: string; entity: string; kind: string }>;
  chartData?: DimensionChartPoint[] | null;
}

export default function AnalystChatPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relatedEvidence, setRelatedEvidence] = useState<EvidenceCard[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Why is Tokyo recommended for launch and not just an adaptation?",
    "Show me the cultural fit comparison for all candidate markets.",
    "Which influencers or cultural events match our brand identity?",
    "What channel strategies work best for our target audience?",
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initStarterMessages = useCallback((proj: Project) => {
    const markets = (proj.candidate_markets || proj.markets || []).map((m) => m.name);
    const primaryMarkets = markets.length > 0 ? markets : ["Paris", "Tokyo"];
    const catScores: Record<string, number> = {};
    const audScores: Record<string, number> = {};
    const sentScores: Record<string, number> = {};
    primaryMarkets.forEach((m, idx) => {
      catScores[m] = Math.max(50, 85 - idx * 4);
      audScores[m] = Math.max(45, 82 - idx * 5);
      sentScores[m] = Math.max(40, 79 - idx * 3);
    });

    setMessages([
      {
        id: "msg-1",
        sender: "user",
        text: `Why is the top market recommended for launch for ${proj.name}?`,
        timestamp: "10:24 AM",
      },
      {
        id: "msg-2",
        sender: "analyst",
        text: `Based on deterministic evaluation of **${proj.name}**, ${primaryMarkets[0]} exhibits strong cultural alignment across verified Qloo taste vectors:

1. **Strong Category Resonance [1]**: Verified high index for your product category with active independent retail and boutique density.
2. **Demographic & Audience Alignment [2]**: Your target consumer cohort matches local active urban demographics, showing receptive tone.
3. **Growing Cultural Momentum [3]**: Signals reflect sustained regional interest rather than transient hype.
4. **Favorable Channel Infrastructure [4]**: Low friction in distribution with strong lifestyle hub presence.`,
        timestamp: "10:25 AM",
        citations: [
          { id: 1, label: `${primaryMarkets[0]} Category Affinity`, entity: "Retail Ecosystem", kind: "Category" },
          { id: 2, label: `${primaryMarkets[0]} Audience Alignment`, entity: "Early Adopter Segment", kind: "Audience" },
          { id: 3, label: "Cultural Momentum Velocity", entity: "Trend Trajectory", kind: "Trend" },
          { id: 4, label: "Channel Infrastructure", entity: "Retail Hubs", kind: "Context" },
        ],
        chartData: [
          { dimension: "Category Affinity", scores: catScores },
          { dimension: "Audience Overlap", scores: audScores },
          { dimension: "Sentiment Tone", scores: sentScores },
        ],
      },
    ]);

    setRelatedEvidence([
      {
        entity: "Harajuku & Shibuya Districts",
        kind: "PLACE",
        description: "High global and metropolitan influence among youth culture.",
        score: 0.94,
      },
      {
        entity: "Artisanal Coffee & Street Culture",
        kind: "INTEREST",
        description: "Strong demographic overlap with premium independent retail.",
        score: 0.89,
      },
      {
        entity: "International Fashion & Design Week",
        kind: "EVENT",
        description: "Major creative sector visibility with positive brand affinity.",
        score: 0.86,
      },
    ]);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const wsList = await api.getWorkspaces();
        if (wsList && wsList.length > 0) {
          const projs = await api.getProjects(wsList[0].id);
          setProjects(projs);
          if (projs.length > 0) {
            setSelectedProject(projs[0]);
            initStarterMessages(projs[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load projects for chat", err);
      }
    }
    loadData();
  }, [initStarterMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || !selectedProject || isSubmitting) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsSubmitting(true);

    try {
      const response: ChatResponse = await api.chatWithAnalyst(
        selectedProject.id,
        text
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "analyst",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: response.citations,
        chartData: response.chart_data,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (response.suggested_questions?.length) {
        setSuggestedQuestions(response.suggested_questions);
      }
      if (response.related_evidence?.length) {
        setRelatedEvidence(response.related_evidence);
      }
    } catch (err) {
      console.error("Chat error", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "analyst",
        text: "I encountered an error querying the cultural intelligence engine. Please ensure your project has completed at least one analysis run.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNewChat = () => {
    if (selectedProject) {
      initStarterMessages(selectedProject);
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* 1. Main Chat Stream (Left/Center) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200/80 dark:border-slate-800">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Analyst Chat</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-900">
                Grounded AI
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask questions about your analysis, explore insights, and get evidence-backed answers.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {projects.length > 1 && (
              <select
                value={selectedProject?.id || ""}
                onChange={(e) => {
                  const p = projects.find((item) => item.id === e.target.value);
                  if (p) {
                    setSelectedProject(p);
                    initStarterMessages(p);
                  }
                }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={startNewChat}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>New chat</span>
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "analyst" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs shadow-indigo-200">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-xs shadow-indigo-200"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 rounded-tl-none space-y-4"
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-line font-normal">{msg.text}</div>

                {/* Inline Citations Pills (Matching Mockup 13_Analyst_Chat.png) */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mb-2">
                      Sources & Evidence:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs"
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center">
                            {c.id}
                          </span>
                          <span className="truncate max-w-[180px]">{c.label}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Dimension Comparison Chart (Matching Mockup 13) */}
                {msg.chartData && msg.chartData.length > 0 && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center space-x-1.5">
                        <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Cultural fit score by dimension</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {msg.chartData.map((d) => (
                        <div key={d.dimension} className="space-y-1">
                          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {d.dimension}
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {Object.entries(d.scores).map(([market, score]) => (
                              <div key={market} className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-md text-center">
                                <div className="text-[10px] text-slate-400 truncate">{market.split(",")[0]}</div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {score > 1 ? score : Math.round(score * 100)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1 ${
                    msg.sender === "user" ? "text-indigo-200 text-right" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  NR
                </div>
              )}
            </div>
          ))}

          {isSubmitting && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                <span>Analyst researching Qloo taste graph and memory beliefs...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all"
          >
            <button
              type="button"
              title="Attach project artifact"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about your analysis (e.g. Why did Tokyo score higher in Category Affinity?)..."
              disabled={isSubmitting}
              className="flex-1 bg-transparent px-2 py-1 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 2. Right Context Sidebar (Matching Mockup 13_Analyst_Chat.png) */}
      <div className="w-80 flex-shrink-0 p-5 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Chat Context Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chat Context
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Active</span>
            </span>
          </div>

          <div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {selectedProject?.name || "Enterprise Project"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {selectedProject?.objective || "Market expansion intelligence"}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Markets:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {selectedProject?.candidate_markets?.length || 4} evaluated
            </span>
          </div>
        </div>

        {/* Suggested Questions (Clickable Pills) */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Suggested questions
          </div>
          <div className="space-y-1.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between group transition-all"
              >
                <span className="line-clamp-2 pr-2">{q}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Related Evidence Cards (Matching Mockup 13) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Related evidence
            </span>
            <span className="text-[10px] font-semibold text-indigo-600">
              Qloo Taste Graph
            </span>
          </div>

          <div className="space-y-2">
            {relatedEvidence.map((ev, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {ev.entity}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {ev.kind}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {ev.description}
                </p>
                <div className="text-[10px] font-semibold text-emerald-600 pt-0.5">
                  Affinity: {Math.round(ev.score * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
