"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  Zap,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  const [selectedDemoTab, setSelectedDemoTab] = useState<"bangalore" | "tokyo">(
    "bangalore"
  );

  return (
    <div className="min-h-screen bg-[#FDFDFE] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans antialiased overflow-x-hidden">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-indigo-600 top-0 left-1/2 -translate-x-1/2 shadow-xs" />
              <span className="absolute w-2 h-2 rounded-full bg-violet-500 bottom-0.5 left-0" />
              <span className="absolute w-2.5 h-2.5 rounded-full bg-purple-600 bottom-0.5 right-0" />
              <span className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400 top-2 left-1.5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Cultura
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#product" className="hover:text-slate-900 transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How it works
            </a>
            <a href="#engine" className="hover:text-slate-900 transition-colors">
              Agent DAG
            </a>
            <a href="#comparison" className="hover:text-slate-900 transition-colors">
              Why Cultura
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3.5">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Matching Mockup 22_Landing_Page_Hero_Draft.png) */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Soft atmospheric gradient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-indigo-100/40 via-purple-50/20 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Value Prop */}
            <div className="lg:col-span-6 space-y-6">
              {/* Qloo Attribution Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="font-semibold text-indigo-200">Powered by Qloo</span>
                <span className="text-slate-400">• The world&apos;s cultural taste graph</span>
              </div>

              {/* Main Headline */}
              <div className="relative">
                <div className="text-xs uppercase tracking-widest font-bold text-indigo-600 mb-2 font-mono">
                  From local culture to global growth
                </div>
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
                  Know where your brand{" "}
                  <span className="relative italic font-serif text-indigo-600 underline decoration-indigo-300 decoration-wavy decoration-2">
                    truly
                  </span>{" "}
                  belongs.
                </h1>
              </div>

              {/* Subhead */}
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Use real cultural taste signals to decide where to <strong>launch</strong>,{" "}
                <strong>adapt</strong> or <strong>avoid</strong> — with an agentic AI workflow
                powered by Qloo, deterministic 5D compatibility scoring, and TypeSafe Jev gates.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-sm shadow-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Get started free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-200/80 shadow-2xs transition-all"
                >
                  <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  <span>Watch interactive demo</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Deterministic Decimal Scorer</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Real Qloo Empirical Graph</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Zero Hallucination Guard</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Product Hero Card */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 p-5 md:p-6 transition-all">
                {/* Header Mockup Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-slate-400 ml-2">
                      projects/tokyo-streetwear/results
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Live Analysis
                  </span>
                </div>

                {/* Card Title */}
                <div className="pt-4 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      Tokyo Streetwear Expansion
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluating 4 candidate markets for premium Japanese streetwear brand
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setSelectedDemoTab("bangalore")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        selectedDemoTab === "bangalore"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Bangalore
                    </button>
                    <button
                      onClick={() => setSelectedDemoTab("tokyo")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        selectedDemoTab === "tokyo"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Tokyo
                    </button>
                  </div>
                </div>

                {/* Top Recommendation Highlight */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-indigo-50/40 to-transparent border border-emerald-100/80 mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Top Recommendation
                    </div>
                    <div className="text-xl font-bold text-slate-900 flex items-center space-x-2 mt-0.5">
                      <span>{selectedDemoTab === "bangalore" ? "Bangalore, India" : "Tokyo, Japan"}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        LAUNCH
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {selectedDemoTab === "bangalore"
                        ? "Strong cultural alignment with streetwear, tech music and youth culture."
                        : "High category resonance, mature independent boutique ecosystem, and receptive Gen Z."}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-3xl font-extrabold text-slate-950">
                      {selectedDemoTab === "bangalore" ? "87" : "92"}
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-700">
                      High confidence
                    </div>
                  </div>
                </div>

                {/* 5-Dimensional Breakdown */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-slate-700">
                    Cultural Dimensions ({selectedDemoTab === "bangalore" ? "Bangalore" : "Tokyo"})
                  </div>
                  {[
                    { label: "Category Taste Affinity", val: selectedDemoTab === "bangalore" ? 92 : 95, color: "bg-indigo-600" },
                    { label: "Audience Overlap", val: selectedDemoTab === "bangalore" ? 88 : 91, color: "bg-violet-600" },
                    { label: "Sentiment & Tone Resonance", val: selectedDemoTab === "bangalore" ? 85 : 89, color: "bg-purple-600" },
                    { label: "Cultural Trend Momentum", val: selectedDemoTab === "bangalore" ? 80 : 94, color: "bg-blue-600" },
                    { label: "Contextual & Regulatory Fit", val: selectedDemoTab === "bangalore" ? 78 : 88, color: "bg-emerald-600" },
                  ].map((dim) => (
                    <div key={dim.label} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 w-44 truncate">{dim.label}</span>
                      <div className="flex-1 mx-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${dim.color} transition-all duration-500`}
                          style={{ width: `${dim.val}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-900 w-8 text-right">
                        {dim.val}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Key Empirical Signals Chips */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">
                    Verified Qloo Taste Signals:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium">
                      ✦ High interest in sneakers & streetwear
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium">
                      ✦ Strong music & creator events
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium">
                      ✦ High affinity for artisanal coffee
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Value Pillars (01 to 04 Matching Mockup 22 Bottom) */}
      <section className="py-12 border-y border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 font-mono">
            Cultural Intelligence for Real Business Decisions
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <span className="text-2xl font-bold font-serif text-indigo-600">01</span>
              <h4 className="font-bold text-slate-900 text-base">Explore New Markets</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Find where your brand organically fits culturally across hundreds of global territories.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-2xl font-bold font-serif text-indigo-600">02</span>
              <h4 className="font-bold text-slate-900 text-base">Reduce Entry Risk</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Avoid costly misfires in markets with low cultural resonance or brand tone rejection.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-2xl font-bold font-serif text-indigo-600">03</span>
              <h4 className="font-bold text-slate-900 text-base">Make Faster Decisions</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Evidence-backed recommendations and TypeSafe Jev gates in minutes, not consultant months.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-2xl font-bold font-serif text-indigo-600">04</span>
              <h4 className="font-bold text-slate-900 text-base">Turn Insight into Action</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Receive concrete strategic playbooks: channels, influencer alignment, and localized messaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Problem & Solution Section (Matching Mockup 23) */}
      <section id="comparison" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-600 font-mono">
              The Cross-Border Dilemma
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Why 73% of International Expansions Falter
            </h2>
            <p className="text-base text-slate-600">
              Demographics tell you how many people live in a market. Cultural intelligence tells you if they will care about your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="p-8 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-5">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                Traditional Market Entry
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Subjective Guesswork & Demographic Proxies
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Superficial Census Data</strong>: Relying purely on GDP and age stats with zero cultural taste context.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Slow, Expensive Agency Reports</strong>: 6-month timelines costing $100K+ with outdated static surveys.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Cultural Tone-Deafness</strong>: Missing localized taboos, declining trends, or misaligned influencer pairings.</span>
                </li>
              </ul>
            </div>

            {/* The Cultura Way */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-950 text-white shadow-lg space-y-5">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                The Cultura Standard
              </div>
              <h3 className="text-xl font-bold text-white">
                Deterministic Qloo Signals & Multi-Agent Intelligence
              </h3>
              <ul className="space-y-3 text-sm text-indigo-100/90">
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Real Taste Graph Entities</strong>: Millions of citable connections across music, fashion, food, and culture.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Deterministic Decimal Math</strong>: 0 hallucination. Identical mathematical compatibility scores every run.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>TypeSafe Jev System One Decisions</strong>: Strict Launch / Adapt / Avoid verdicts backed by probability sums.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 10-Node Agent DAG Engine Overview */}
      <section id="engine" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-600 font-mono">
              Agentic Orchestration
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              10 Specialized Autonomous Agents in LangGraph DAG
            </h2>
            <p className="text-base text-slate-600">
              Each analysis executes through a strict, reproducible multi-agent pipeline with pgvector semantic memory.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { num: "01", name: "Supervisor", desc: "Decomposes goals & plans execution" },
              { num: "02", name: "Brand Analyst", desc: "Extracts identity & positioning constraints" },
              { num: "03", name: "Market Analyst", desc: "Evaluates target territory infrastructure" },
              { num: "04", name: "Audience Analyst", desc: "Maps demographic & psychographic cohorts" },
              { num: "05", name: "Qloo Researcher", desc: "Queries empirical taste graph entities" },
              { num: "06", name: "Evidence Normalizer", desc: "Standardizes scores into [0, 1] range" },
              { num: "07", name: "Deterministic Scorer", desc: "Computes 5D fixed-point Decimal scores" },
              { num: "08", name: "Jev Decision Gate", desc: "TypeSafe System One Launch/Adapt/Avoid" },
              { num: "09", name: "Strategy Synthesizer", desc: "Builds actionable go-to-market playbook" },
              { num: "10", name: "Final Review Guard", desc: "Verifies grounding & blocks hallucinations" },
            ].map((agent) => (
              <div
                key={agent.num}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
              >
                <div className="text-xs font-mono font-bold text-indigo-600">
                  {agent.num}
                </div>
                <div className="font-semibold text-slate-900 text-sm mt-1">
                  {agent.name}
                </div>
                <div className="text-xs text-slate-500 mt-1 leading-snug">
                  {agent.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer CTA */}
      <footer className="py-16 bg-slate-950 text-white border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-3xl font-extrabold tracking-tight">
              Ready to find where your brand belongs?
            </h3>
            <p className="text-slate-400 text-base">
              Start your first deterministic cultural compatibility analysis today.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Launch Cultura Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <div>
              © 2026 Cultura AI Inc. All rights reserved. Powered by Qloo Taste Signals.
            </div>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <Link href="/login" className="hover:text-slate-300">
                Sign In
              </Link>
              <Link href="/dashboard" className="hover:text-slate-300">
                Dashboard
              </Link>
              <a href="#how-it-works" className="hover:text-slate-300">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
