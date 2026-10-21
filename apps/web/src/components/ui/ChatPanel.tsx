"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Sparkles, ExternalLink, BarChart2, ChevronRight,
  RotateCcw, ChevronDown, Square, Globe, TrendingUp, Zap, Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { DimensionChartPoint } from "@/lib/types";

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

// ─── Starter prompts shown in empty state ────────────────────────────────────

const STARTER_PROMPTS = [
  {
    icon: Globe,
    label: "Market fit",
    text: "Which market has the strongest cultural fit for this brand?",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 hover:border-indigo-500/40",
  },
  {
    icon: TrendingUp,
    label: "Top signals",
    text: "What are the top cultural signals driving the recommendation?",
    color: "text-violet-400",
    bg: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 hover:border-violet-500/40",
  },
  {
    icon: Users,
    label: "Audience",
    text: "How does the target audience differ across candidate markets?",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 hover:border-cyan-500/40",
  },
  {
    icon: Zap,
    label: "Risks",
    text: "What are the biggest risks for this expansion?",
    color: "text-amber-400",
    bg: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 hover:border-amber-500/40",
  },
];

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i} className="text-slate-300">{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="px-1.5 py-px bg-slate-800 rounded text-[11px] font-mono text-indigo-300">
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
      nodes.push(
        <p key={i} className="font-semibold text-slate-100 mt-2 mb-0.5">
          {renderInline(line.replace(/^#+\s/, ""))}
        </p>
      );
    } else if (/^[*-] /.test(line)) {
      nodes.push(
        <div key={i} className="flex items-start gap-2">
          <span className="text-indigo-400 mt-[3px] flex-shrink-0 text-[10px]">▸</span>
          <span className="leading-relaxed">{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1.5" />);
    } else {
      nodes.push(<p key={i} className="leading-relaxed">{renderInline(line)}</p>);
    }
  });
  return <div className="space-y-0.5 text-[12px]">{nodes}</div>;
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

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

// ─── Dimension chart ──────────────────────────────────────────────────────────

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
              <div className="text-[10px] text-slate-500 mb-1 capitalize">{d.dimension.replace(/_/g, " ")}</div>
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
    <div className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/30">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[84%] rounded-2xl p-3.5 text-[12px] shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md"
            : "bg-[#151C2C] border border-[#1E2A42] text-slate-200 rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="leading-relaxed">{msg.text}</p>
        ) : (
          <div className="space-y-2">
            <MarkdownText text={msg.text} />
            {msg.citations && msg.citations.length > 0 && (
              <div className="pt-2.5 mt-1 border-t border-[#1E2A42]">
                <div className="text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Sources
                </div>
                <div className="flex flex-wrap gap-1">
                  {msg.citations.slice(0, 5).map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0E1424] border border-[#1A2338] text-[10px] text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-900/80 text-indigo-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {c.id}
                      </span>
                      <span className="truncate max-w-[90px]">{c.label}</span>
                      <ExternalLink className="w-2 h-2 text-slate-600 flex-shrink-0" />
                    </span>
                  ))}
                </div>
              </div>
            )}
            {msg.chartData && msg.chartData.length > 0 && <DimensionChart data={msg.chartData} />}
          </div>
        )}
        <div
          suppressHydrationWarning
          className={`text-[10px] mt-2 ${isUser ? "text-indigo-300 text-right" : "text-slate-600"}`}
        >
          {msg.timestamp}
        </div>
      </div>
    </div>
  );
}

// ─── Streaming bubble ─────────────────────────────────────────────────────────

function StreamingBubble({
  text,
  chartData,
}: {
  text: string;
  chartData?: DimensionChartPoint[] | null;
}) {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/30">
        <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
      </div>
      <div className="max-w-[84%] rounded-2xl rounded-bl-md p-3.5 bg-[#151C2C] border border-[#1E2A42] text-[12px] text-slate-200 shadow-sm">
        {text ? (
          <>
            <MarkdownText text={text} />
            <span className="inline-block w-0.5 h-3 bg-indigo-400 ml-0.5 animate-pulse align-bottom rounded-full" />
            {chartData && chartData.length > 0 && <DimensionChart data={chartData} />}
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 py-0.5">
            <TypingDots />
            <span className="text-[11px]">Consulting Qloo signals…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  projectId: string;
  startFresh?: boolean;
  scrollAreaClass?: string;
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
  const [inputFocused, setInputFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

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
        const history = await api.getConversationHistory(projectId);
        if (cancelled) return;
        if (history.conversation_id) setActiveConversationId(history.conversation_id);
        const msgs: ChatMessage[] = history.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "analyst",
            text: m.content,
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

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    const now = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
            suggestedQuestions:
              (event.suggested_questions as string[]) ?? suggestedQuestions,
          };
          setStreamingMeta(finalMeta);
          if (finalMeta.suggestedQuestions?.length)
            setSuggestedQuestions(finalMeta.suggestedQuestions);
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

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const isEmpty = historyLoaded && messages.length === 0 && !isStreaming;
  const charCount = inputValue.length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0A0F1C]">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1A2338] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-300">
              {headerLabel ?? "Cultural Analyst"}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">· Qloo</span>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#1A2338] text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      )}

      {/* Message area */}
      <div className={`${scrollAreaClass} overflow-y-auto px-4 py-4 space-y-5`}>
        {/* Empty state with starter prompts */}
        {isEmpty && (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center mb-4 shadow-xl shadow-indigo-900/40">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                Cultural Intelligence Analyst
              </p>
              <p className="text-[11px] text-slate-500 mb-6 max-w-[220px] leading-relaxed">
                Ask anything about market fit, cultural signals, or expansion strategy
              </p>

              {/* Starter prompt cards */}
              <div className="w-full grid grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleSend(p.text)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 ${p.bg}`}
                  >
                    <p.icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${p.color}`} />
                    <div>
                      <div className={`text-[10px] font-bold mb-0.5 ${p.color}`}>{p.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{p.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Streaming */}
        {isStreaming && (
          <StreamingBubble
            text={streamingText}
            chartData={streamingMeta?.chartData}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested follow-ups */}
      {suggestedQuestions.length > 0 && !isStreaming && messages.length > 0 && (
        <div className="px-3 pb-1.5 flex gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
          {suggestedQuestions.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1A2338] bg-[#0E1424] hover:bg-[#131C30] hover:border-indigo-500/30 text-[10px] text-slate-400 hover:text-slate-200 transition-all duration-150 whitespace-nowrap"
            >
              <ChevronRight className="w-2.5 h-2.5 text-indigo-500 flex-shrink-0" />
              {q.length > 52 ? q.slice(0, 52) + "…" : q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 pb-3 pt-2 flex-shrink-0">
        <div
          className={`flex items-center gap-2 bg-[#0E1628] border rounded-xl px-3 py-2.5 transition-all duration-200 ${
            isStreaming
              ? "border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.12)]"
              : inputFocused
              ? "border-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.15)]"
              : "border-[#1A2338] hover:border-[#1E2A42]"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isStreaming) {
                e.preventDefault();
                handleSend();
              }
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={
              isStreaming ? "Generating…" : "Ask about markets, culture, strategy…"
            }
            disabled={isStreaming}
            className="flex-1 bg-transparent text-[12px] text-white placeholder-slate-600 focus:outline-none disabled:text-slate-600"
          />

          {/* Char count hint */}
          {mounted && charCount > 20 && !isStreaming && (
            <span className="text-[10px] text-slate-700 flex-shrink-0 tabular-nums">
              {charCount}
            </span>
          )}

          {/* Stop button during streaming */}
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
              title="Stop generating"
            >
              <Square className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0 shadow-sm"
            >
              <Send className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
