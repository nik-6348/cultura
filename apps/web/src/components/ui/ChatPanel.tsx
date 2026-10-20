"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Sparkles, ExternalLink, BarChart2, ChevronRight, RotateCcw, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { DimensionChartPoint, EvidenceCard } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Citation {
  id: number;
  label: string;
  entity: string;
  kind: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "analyst";
  text: string;
  timestamp: string;
  citations?: Citation[];
  chartData?: DimensionChartPoint[] | null;
}

interface StreamMeta {
  citations: Citation[];
  chartData: DimensionChartPoint[] | null;
  suggestedQuestions: string[];
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="px-1 py-px bg-slate-700 rounded text-[11px] font-mono text-indigo-300">
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

export function MarkdownText({ text }: { text: string }) {
  const clean = text
    .replace(/<ElicitationsGroup[^>]*>[\s\S]*?<\/ElicitationsGroup>/g, "")
    .trim();
  const lines = clean.split("\n");
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (/^#{1,3} /.test(line)) {
      nodes.push(<p key={i} className="font-semibold text-slate-100 mt-1.5">{renderInline(line.replace(/^#+\s/, ""))}</p>);
    } else if (/^[*-] /.test(line)) {
      nodes.push(
        <div key={i} className="flex items-start gap-1.5">
          <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1.5" />);
    } else {
      nodes.push(<p key={i}>{renderInline(line)}</p>);
    }
  });
  return <div className="space-y-0.5 leading-relaxed">{nodes}</div>;
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 h-4">
      {[0, 1, 2].map((n) => (
        <span key={n} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${n * 0.15}s` }} />
      ))}
    </span>
  );
}

// ─── Dimension chart (collapsible) ────────────────────────────────────────────

function DimensionChart({ data }: { data: DimensionChartPoint[] }) {
  const [open, setOpen] = React.useState(false);
  const markets = Object.keys(data[0]?.scores ?? {});
  const colors = ["text-indigo-400", "text-violet-400", "text-cyan-400", "text-emerald-400"];
  return (
    <div className="mt-2 rounded-xl border border-[#1A2338] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#0E1424] hover:bg-[#111827] transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
          Cultural fit by dimension
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 bg-[#0E1424] space-y-2.5 border-t border-[#1A2338]">
          {data.map((d) => (
            <div key={d.dimension}>
              <div className="text-[10px] text-slate-500 mb-1">{d.dimension}</div>
              <div className="flex gap-3 flex-wrap">
                {markets.map((m, mi) => {
                  const score = d.scores[m] ?? 0;
                  const pct = score > 1 ? score : Math.round(score * 100);
                  return (
                    <span key={m} className="text-[11px]">
                      <span className={`font-bold ${colors[mi % colors.length]}`}>{pct}%</span>
                      <span className="text-slate-500 ml-1">{m.split(",")[0]}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === "user";
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={`max-w-[82%] rounded-2xl p-3.5 text-xs ${
        isUser
          ? "bg-indigo-600 text-white rounded-tr-none"
          : "bg-[#1A2338] border border-[#252f45] text-slate-200 rounded-tl-none"
      }`}>
        {isUser ? (
          <p className="leading-relaxed">{msg.text}</p>
        ) : (
          <div className="space-y-2">
            <MarkdownText text={msg.text} />
            {msg.citations && msg.citations.length > 0 && (
              <div className="pt-2 border-t border-[#252f45]">
                <div className="text-[10px] font-semibold text-slate-500 mb-1.5">Sources</div>
                <div className="flex flex-wrap gap-1">
                  {msg.citations.slice(0, 5).map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0E1424] border border-[#1A2338] text-[10px] text-slate-400">
                      <span className="w-3 h-3 rounded-full bg-indigo-900 text-indigo-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0">{c.id}</span>
                      <span className="truncate max-w-[100px]">{c.label}</span>
                      <ExternalLink className="w-2 h-2 text-slate-600 flex-shrink-0" />
                    </span>
                  ))}
                </div>
              </div>
            )}
            {msg.chartData && msg.chartData.length > 0 && <DimensionChart data={msg.chartData} />}
          </div>
        )}
        <div suppressHydrationWarning className={`text-[10px] mt-1.5 ${isUser ? "text-indigo-200 text-right" : "text-slate-600"}`}>
          {msg.timestamp}
        </div>
      </div>
    </div>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  projectId: string;
  /** When true, shows empty state instead of loading history (after a reset) */
  startFresh?: boolean;
  scrollAreaClass?: string;
  /** Show the header bar with Reset button */
  showHeader?: boolean;
  headerLabel?: string;
  onReset?: () => void;
}

export function ChatPanel({
  projectId,
  startFresh = false,
  scrollAreaClass = "flex-1",
  showHeader = false,
  headerLabel,
  onReset,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingMeta, setStreamingMeta] = useState<StreamMeta | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Abort any in-flight request on unmount
  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  // Load history (or skip if startFresh)
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setSuggestedQuestions([]);
    setActiveConversationId(undefined);
    setHistoryLoaded(false);

    if (startFresh) {
      setHistoryLoaded(true);
      return;
    }

    async function load() {
      try {
        // No conversationId → backend returns most-recent conversation for this project
        const history = await api.getConversationHistory(projectId);
        if (cancelled) return;
        if (history.conversation_id) setActiveConversationId(history.conversation_id);
        const msgs: ChatMessage[] = history.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "analyst",
            text: m.content,
            // Format timestamp client-side only to avoid hydration mismatch
            timestamp: m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "",
            citations: (m.metadata?.citations as Citation[] | undefined) ?? undefined,
            chartData: (m.metadata?.chart_data as DimensionChartPoint[] | undefined) ?? undefined,
          }));
        setMessages(msgs);
        const lastBot = [...history.messages].reverse().find((m) => m.role === "assistant");
        if (lastBot?.metadata) {
          const sq = lastBot.metadata.suggested_questions as string[] | undefined;
          if (sq?.length) setSuggestedQuestions(sq);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [projectId, startFresh]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || isStreaming) return;

    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Auto-abort after 90 seconds to prevent infinite hang
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsStreaming(true);
    setStreamingText("");
    setStreamingMeta(null);

    let accText = "";
    let finalMeta: StreamMeta = { citations: [], chartData: null, suggestedQuestions };

    try {
      for await (const event of api.chatWithAnalystStream(projectId, text, {
        conversationId: activeConversationId,
        signal: controller.signal,
      })) {
        if (event.type === "meta") {
          const newConvId = event.conversation_id as string | undefined;
          if (newConvId) setActiveConversationId(newConvId);
          finalMeta = {
            citations: (event.citations as Citation[]) ?? [],
            chartData: (event.chart_data as DimensionChartPoint[]) ?? null,
            suggestedQuestions: (event.suggested_questions as string[]) ?? suggestedQuestions,
          };
          setStreamingMeta(finalMeta);
          if (finalMeta.suggestedQuestions?.length) setSuggestedQuestions(finalMeta.suggestedQuestions);
        } else if (event.type === "token") {
          accText += (event.text as string) ?? "";
          setStreamingText(accText);
        } else if (event.type === "done") {
          break;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        accText = accText || "Request timed out. Please try again.";
      } else {
        accText = accText || "I encountered an error querying the cultural intelligence engine.";
      }
    } finally {
      clearTimeout(timeoutId);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: "analyst",
        text: accText,
        timestamp: now(),
        citations: finalMeta.citations,
        chartData: finalMeta.chartData,
      },
    ]);
    setStreamingText("");
    setStreamingMeta(null);
    setIsStreaming(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [inputValue, isStreaming, projectId, activeConversationId, suggestedQuestions]);

  const isEmpty = historyLoaded && messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Optional header with reset button */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A2338] flex-shrink-0">
          <span className="text-[11px] font-semibold text-slate-400">{headerLabel ?? "Analyst Chat"}</span>
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#1A2338] text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset chat
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className={`${scrollAreaClass} overflow-y-auto p-4 space-y-4`}>
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">Ask the Cultural Analyst</p>
            <p className="text-xs text-slate-500">Evidence-backed insights from Qloo taste graph</p>
          </div>
        )}

        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

        {isStreaming && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="max-w-[82%] rounded-2xl rounded-tl-none p-3.5 bg-[#1A2338] border border-[#252f45] text-xs text-slate-200">
              {streamingText ? (
                <>
                  <MarkdownText text={streamingText} />
                  <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse align-bottom" />
                  {streamingMeta?.chartData && streamingMeta.chartData.length > 0 && (
                    <DimensionChart data={streamingMeta.chartData} />
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <TypingDots />
                  <span>Researching Qloo signals…</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {suggestedQuestions.length > 0 && !isStreaming && (
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {suggestedQuestions.slice(0, 3).map((q) => (
            <button key={q} onClick={() => handleSend(q)}
              className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1A2338] bg-[#111827] hover:border-indigo-500/40 text-[10px] text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap">
              <ChevronRight className="w-2.5 h-2.5 text-indigo-500 flex-shrink-0" />
              {q.length > 50 ? q.slice(0, 50) + "…" : q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[#1A2338] flex-shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); if (!isStreaming) handleSend(); }}
          className={`flex items-center gap-2 bg-[#111827] border rounded-xl px-3 py-2 transition-colors ${
            isStreaming ? "border-indigo-500/40" : "border-[#1A2338] focus-within:border-indigo-500/60"
          }`}>
          {isStreaming ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-xs text-slate-500 truncate">Generating response…</span>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask about markets, cultural fit, strategies…"
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          )}
          <button
            type="submit"
            disabled={isStreaming || !inputValue.trim()}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
