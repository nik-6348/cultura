"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, TrendingUp, Zap, CheckCircle2, Globe, ChevronRight } from "lucide-react";
import { CulturaLogo } from "@/components/ui/CulturaLogo";

const CHAT_STEPS = [
  { role: "ai",   text: "What brand are you expanding, and where are you thinking of taking it?" },
  { role: "user", text: "We're BIRA 91 — craft beer from India. Thinking Southeast Asia." },
  { role: "ai",   text: "Love it. Any cities already on your shortlist, or you want me to surface the best ones?" },
  { role: "user", text: "Give me your top 3." },
  { role: "ai",   text: "On it. Pulling taste signals across 40+ cultural dimensions for Bangkok, Ho Chi Minh City, and Singapore…" },
];

const MARKETS = [
  {
    city: "Bangkok",
    country: "Thailand",
    score: 91,
    verdict: "LAUNCH",
    verdictColor: "text-emerald-400",
    verdictBg: "bg-emerald-500/10 border-emerald-500/30",
    signals: ["Craft beer growing 38% YoY", "Strong affinity with BIRA-adjacent music scenes", "Premium casual dining culture"],
    dim: [94, 89, 91, 88, 82],
  },
  {
    city: "Ho Chi Minh City",
    country: "Vietnam",
    score: 78,
    verdict: "ADAPT",
    verdictColor: "text-amber-400",
    verdictBg: "bg-amber-500/10 border-amber-500/30",
    signals: ["Beer culture dominant but price-sensitive", "Younger urban cohort open to premium", "Local brand loyalty strong"],
    dim: [81, 76, 80, 73, 71],
  },
  {
    city: "Singapore",
    country: "Singapore",
    score: 85,
    verdict: "LAUNCH",
    verdictColor: "text-emerald-400",
    verdictBg: "bg-emerald-500/10 border-emerald-500/30",
    signals: ["India diaspora creates cultural bridge", "Premium F&B market is saturated but receptive", "High social media amplification"],
    dim: [88, 85, 84, 86, 80],
  },
];

const DIMS = ["Category Affinity", "Audience Overlap", "Tone Resonance", "Trend Momentum", "Market Readiness"];

export default function LandingPage() {
  const [activeMarket, setActiveMarket] = useState(0);
  const [visibleChat, setVisibleChat] = useState(0);
  const [typed, setTyped] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (visibleChat >= CHAT_STEPS.length) return;
    const step = CHAT_STEPS[visibleChat];
    if (step.role === "ai") {
      setIsTyping(true);
      const delay = setTimeout(() => {
        setIsTyping(false);
        setTyped("");
        let i = 0;
        const interval = setInterval(() => {
          setTyped(step.text.slice(0, i + 1));
          i++;
          if (i >= step.text.length) {
            clearInterval(interval);
            setTimeout(() => setVisibleChat((v) => v + 1), 800);
          }
        }, 22);
      }, 600);
      return () => clearTimeout(delay);
    } else {
      const delay = setTimeout(() => {
        setVisibleChat((v) => v + 1);
      }, 400);
      return () => clearTimeout(delay);
    }
  }, [visibleChat]);

  const market = MARKETS[activeMarket];

  return (
    <div className="min-h-screen bg-[#070B14] text-white selection:bg-indigo-500/30 antialiased overflow-x-hidden font-sans">

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-[#070B14]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <CulturaLogo size={28} showText={true} />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#results" className="hover:text-white transition-colors">See results</a>
            <a href="#why" className="hover:text-white transition-colors">Why Cultura</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white px-3 py-1.5 transition-colors">
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Try free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 md:pt-24 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-violet-600/8 blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 space-y-4 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Powered by Qloo taste graph · Real cultural signals
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Which city actually{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                wants your brand?
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Tell our AI analyst about your brand. Get a ranked market list with real cultural fit scores,
              taste signal evidence, and a clear Launch / Adapt / Avoid verdict — in minutes.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20"
              >
                Start your first analysis <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#results" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                See a real result <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Hero Cards: Chat + Score side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">

            {/* Chat intake card */}
            <div className="rounded-2xl bg-[#0D1220] border border-[#1A2338] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A2338] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500/70" />
                <div className="w-2 h-2 rounded-full bg-amber-500/70" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
                <span className="text-[10px] font-mono text-slate-500 ml-2">AI Analyst · New Project</span>
              </div>
              <div className="p-4 space-y-3 min-h-[280px]">
                {CHAT_STEPS.slice(0, visibleChat).map((step, i) => (
                  <div key={i} className={`flex ${step.role === "user" ? "justify-end" : "justify-start"}`}>
                    {step.role === "ai" && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                        step.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-[#151C2C] border border-[#1E2A42] text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {step.text}
                    </div>
                  </div>
                ))}

                {/* Typing bubble */}
                {isTyping && (
                  <div className="flex justify-start items-end gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-3 h-3 text-white animate-pulse" />
                    </div>
                    <div className="rounded-xl rounded-bl-sm px-3 py-2 bg-[#151C2C] border border-[#1E2A42]">
                      <span className="inline-flex gap-1">
                        {[0, 1, 2].map((n) => (
                          <span key={n} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                            style={{ animationDelay: `${n * 0.18}s`, animationDuration: "0.9s" }} />
                        ))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Live partial text */}
                {!isTyping && visibleChat < CHAT_STEPS.length && CHAT_STEPS[visibleChat].role === "ai" && typed && (
                  <div className="flex justify-start items-end gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                    <div className="max-w-[80%] rounded-xl rounded-bl-sm px-3 py-2 bg-[#151C2C] border border-[#1E2A42] text-slate-200 text-[12px] leading-relaxed">
                      {typed}<span className="animate-pulse">▍</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Score result card */}
            <div id="results" className="rounded-2xl bg-[#0D1220] border border-[#1A2338] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A2338] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-semibold text-slate-300">Market Rankings · BIRA 91</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                  Complete
                </span>
              </div>

              {/* Market tabs */}
              <div className="flex border-b border-[#1A2338]">
                {MARKETS.map((m, i) => (
                  <button
                    key={m.city}
                    onClick={() => setActiveMarket(i)}
                    className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors relative ${
                      activeMarket === i
                        ? "text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {activeMarket === i && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t" />
                    )}
                    #{i + 1} {m.city}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-3">
                {/* Score + verdict */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm font-bold text-white">{market.city}</span>
                      <span className="text-xs text-slate-500">{market.country}</span>
                    </div>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${market.verdictBg} ${market.verdictColor}`}>
                      {market.verdict}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold text-white">{market.score}</div>
                    <div className="text-[10px] text-slate-500">/ 100</div>
                  </div>
                </div>

                {/* Dimension bars */}
                <div className="space-y-1.5">
                  {DIMS.map((d, i) => (
                    <div key={d} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-32 truncate">{d}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#1A2338] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                          style={{ width: `${market.dim[i]}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 w-6 text-right">{market.dim[i]}</span>
                    </div>
                  ))}
                </div>

                {/* Signals */}
                <div className="space-y-1 pt-1 border-t border-[#1A2338]">
                  {market.signals.map((s) => (
                    <div key={s} className="flex items-start gap-2 text-[11px] text-slate-400">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section id="how" className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 space-y-2">
            <p className="text-xs uppercase tracking-widest font-bold text-indigo-400 font-mono">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Three steps to a decision</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            {[
              {
                n: "01",
                icon: <Zap className="w-5 h-5" />,
                title: "Talk to the analyst",
                body: "Describe your brand in plain language. No forms. The AI asks what it needs — one question at a time.",
                color: "from-indigo-500 to-violet-600",
              },
              {
                n: "02",
                icon: <TrendingUp className="w-5 h-5" />,
                title: "Real signals, not stats",
                body: "We query Qloo's taste graph — 750M+ real consumer behaviors across music, food, fashion, and culture — for each candidate market.",
                color: "from-violet-500 to-purple-600",
              },
              {
                n: "03",
                icon: <MapPin className="w-5 h-5" />,
                title: "Get a clear verdict",
                body: "Launch. Adapt. Avoid. Each market gets a score, ranked list of cultural signals, and a strategic playbook — not a 40-page report.",
                color: "from-emerald-500 to-teal-600",
              },
            ].map((step) => (
              <div key={step.n} className="relative rounded-2xl bg-[#0D1220] border border-[#1A2338] p-6 space-y-3 hover:border-indigo-500/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                  {step.icon}
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-500">{step.n}</div>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Cultura ────────────────────────────────────────────────── */}
      <section id="why" className="py-20 border-t border-white/5 bg-[#0A0F1C]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-widest font-bold text-indigo-400 font-mono">Why Cultura</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Demographics tell you who&apos;s there.{" "}
                <span className="text-slate-400">We tell you if they&apos;ll care.</span>
              </h2>
              <p className="text-slate-400 leading-relaxed">
                A city with 10 million people tells you nothing about whether they&apos;ll connect with your brand.
                Cultural taste signals do. We surface what people in a market actually love — and score how well
                your brand fits into that.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Real taste data — not synthetic demographics or LLM guesses",
                  "Scores are deterministic — same inputs, same result, every time",
                  "Instant — run an analysis in minutes, not consultant months",
                  "Simulation — tweak markets, audience, positioning and re-run",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all hover:scale-[1.02]"
                >
                  Run your first analysis free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: "750M+", label: "Consumer taste signals in the Qloo graph", color: "indigo" },
                { val: "5D", label: "Cultural compatibility dimensions scored per market", color: "violet" },
                { val: "<3 min", label: "From brand description to full market ranking", color: "emerald" },
                { val: "40+", label: "Global markets analysed and growing", color: "amber" },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl bg-[#0D1220] border border-[#1A2338] p-5 space-y-1 hover:border-${s.color}-500/30 transition-colors`}>
                  <div className={`text-3xl font-extrabold text-${s.color}-400`}>{s.val}</div>
                  <div className="text-xs text-slate-500 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6 relative">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Your next market is out there.{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Find it in minutes.
            </span>
          </h2>
          <p className="text-slate-400 text-lg">
            No signup friction. Describe your brand, pick your markets, get a verdict.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            Start free — no credit card <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CulturaLogo size={20} showText={false} />
            <span>© 2026 Cultura AI. Powered by Qloo.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-slate-400 transition-colors">Sign in</Link>
            <Link href="/dashboard" className="hover:text-slate-400 transition-colors">Dashboard</Link>
            <Link href="/projects/new" className="hover:text-slate-400 transition-colors">Try it</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
