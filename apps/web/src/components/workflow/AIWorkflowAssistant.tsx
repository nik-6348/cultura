"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Plus,
  X,
  Play,
  CheckCircle2,
  Globe2,
  Users,
  Target,
  BarChart3,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Coffee,
  Sparkle,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { MarketPreset as MarketItem } from "@/app/projects/new/page";

export type { MarketItem };

interface AIWorkflowAssistantProps {
  // Brand props
  projectName: string;
  setProjectName: (val: string) => void;
  brandName: string;
  setBrandName: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  tags: string[];
  setTags: (val: string[]) => void;

  // Audience props
  audienceName: string;
  setAudienceName: (val: string) => void;
  ageRange: [number, number];
  setAgeRange: (val: [number, number]) => void;
  gender: "All" | "Male" | "Female" | "Non-binary";
  setGender: (val: "All" | "Male" | "Female" | "Non-binary") => void;
  incomeLevel: "All" | "Low" | "Medium" | "High";
  setIncomeLevel: (val: "All" | "Low" | "Medium" | "High") => void;
  selectedInterests: string[];
  setSelectedInterests: (val: string[]) => void;

  // Markets props
  selectedMarkets: MarketItem[];
  setSelectedMarkets: (val: MarketItem[]) => void;

  // Goals props
  primaryGoal: string;
  setPrimaryGoal: (val: string) => void;
  launchTimeline: string;
  setLaunchTimeline: (val: string) => void;
  productPositioning: "Premium" | "Mid-market" | "Budget-friendly";
  setProductPositioning: (val: "Premium" | "Mid-market" | "Budget-friendly") => void;
  additionalContext: string;
  setAdditionalContext: (val: string) => void;

  // Actions
  onLaunch: () => void;
  onSwitchToManual: () => void;
  loading: boolean;
}

const TEMPLATE_PRESETS = [
  {
    title: "Streetwear & Apparel",
    icon: ShoppingBag,
    brandName: "Acme Streetwear",
    projectName: "Tokyo Streetwear Expansion",
    category: "Fashion & Apparel",
    desc: "Premium streetwear collection for urban youth, including apparel, sneakers and accessories.",
    tags: ["Streetwear", "Youth Culture", "Urban Fashion"],
    audience: "Gen Z Streetwear Enthusiasts",
    interests: ["Streetwear", "Sneakers", "Music", "Urban Culture"],
  },
  {
    title: "Specialty Coffee Roastery",
    icon: Coffee,
    brandName: "Origin Craft Coffee",
    projectName: "East Asia Specialty Coffee Entry",
    category: "Food & Beverage",
    desc: "Single-origin micro-lot coffee roaster with third-wave minimalist cafe concepts.",
    tags: ["Artisanal Coffee", "Cafe Culture", "Specialty Food"],
    audience: "Affluent Urban Coffee Enthusiasts",
    interests: ["Third-Wave Coffee", "Art & Design", "Sustainable Living", "Gastronomy"],
  },
  {
    title: "Clean Minimalist Skincare",
    icon: Sparkle,
    brandName: "Lumina Organics",
    projectName: "APAC Clean Skincare Launch",
    category: "Beauty & Cosmetics",
    desc: "Dermatologist-formulated vegan skincare with zero synthetic fragrances or micro-plastics.",
    tags: ["Clean Beauty", "Vegan Cosmetics", "Wellness"],
    audience: "Eco-Conscious Millennials",
    interests: ["Skincare", "Wellness", "Organic Living", "Self-Care"],
  },
  {
    title: "Spatial Audio Wearables",
    icon: Headphones,
    brandName: "Aether Acoustics",
    projectName: "Global Audio Gear Expansion",
    category: "Consumer Electronics",
    desc: "Studio-grade wireless open-ear monitors designed for mobile creators and audiophiles.",
    tags: ["Audio Hardware", "Creator Economy", "Tech Lifestyle"],
    audience: "Digital Creators & Audiophiles",
    interests: ["Electronic Music", "Tech & Gaming", "Podcasting", "Design"],
  },
];

const CURATED_INTERESTS = [
  "Streetwear",
  "Sneakers",
  "Electronic Music",
  "Hip-Hop",
  "Third-Wave Coffee",
  "Contemporary Art",
  "Tech & Gaming",
  "Skate Culture",
  "Vintage Thrifting",
  "Sustainable Living",
  "Nightlife & Clubs",
  "Wellness & Fitness",
];

export function AIWorkflowAssistant({
  projectName,
  setProjectName,
  brandName,
  setBrandName,
  category,
  setCategory,
  description,
  setDescription,
  tags,
  setTags,
  audienceName,
  setAudienceName,
  ageRange,
  setAgeRange,
  gender,
  setGender,
  incomeLevel,
  setIncomeLevel,
  selectedInterests,
  setSelectedInterests,
  selectedMarkets,
  setSelectedMarkets,
  primaryGoal,
  setPrimaryGoal,
  launchTimeline,
  setLaunchTimeline,
  productPositioning,
  setProductPositioning,
  additionalContext,
  setAdditionalContext,
  onLaunch,
  onSwitchToManual,
  loading,
}: AIWorkflowAssistantProps) {
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [marketSearch, setMarketSearch] = useState("");
  const [searchResults, setSearchResults] = useState<MarketItem[]>([]);
  const [isSearchingMarkets, setIsSearchingMarkets] = useState(false);
  const [customInterest, setCustomInterest] = useState("");
  const [newTag, setNewTag] = useState("");

  // Live Location Search
  useEffect(() => {
    let active = true;
    const fetchLocs = async () => {
      try {
        setIsSearchingMarkets(true);
        const results = await api.searchLocations(marketSearch);
        if (active && Array.isArray(results)) {
          setSearchResults(results as unknown as MarketItem[]);
        }
      } catch (err) {
        console.error("AI Location search error", err);
      } finally {
        if (active) setIsSearchingMarkets(false);
      }
    };

    const timer = setTimeout(fetchLocs, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [marketSearch]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests([...selectedInterests, customInterest.trim()]);
      setCustomInterest("");
    }
  };

  const toggleMarket = (market: MarketItem) => {
    if (selectedMarkets.some((m) => m.id === market.id)) {
      setSelectedMarkets(selectedMarkets.filter((m) => m.id !== market.id));
    } else {
      if (selectedMarkets.length >= 10) return;
      setSelectedMarkets([...selectedMarkets, market]);
    }
  };

  const applyTemplate = (tpl: typeof TEMPLATE_PRESETS[0]) => {
    setBrandName(tpl.brandName);
    setProjectName(tpl.projectName);
    setCategory(tpl.category);
    setDescription(tpl.desc);
    setTags(tpl.tags);
    setAudienceName(tpl.audience);
    setSelectedInterests(tpl.interests);
  };

  const stages = [
    { num: 1, label: "Brand Profile" },
    { num: 2, label: "Audience Demographics" },
    { num: 3, label: "Target Markets" },
    { num: 4, label: "Strategic Goals" },
    { num: 5, label: "Review & Launch" },
  ];

  return (
    <div className="space-y-6">
      {/* AI Assistant Banner */}
      <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Interactive AI Strategic Workflow
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono">
                  Qloo Taste Graph Guided
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Step-by-step guided configuration. You can select pre-analyzed suggestions or type custom values. Every parameter directly feeds the multi-agent decision gate.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToManual}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Switch to Manual Form</span>
          </button>
        </div>

        {/* Horizontal Mini-Stepper */}
        <div className="mt-5 pt-4 border-t border-indigo-100 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          {stages.map((st) => {
            const isDone = currentStage > st.num;
            const isCurrent = currentStage === st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setCurrentStage(st.num as 1 | 2 | 3 | 4 | 5)}
                className={cn(
                  "flex items-center space-x-2 text-xs font-semibold transition-all cursor-pointer py-1 px-2 rounded-lg shrink-0",
                  isCurrent
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/40"
                    : isDone
                    ? "text-emerald-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                    isDone
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : isCurrent
                      ? "bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-400/30"
                      : "border-slate-300 dark:border-slate-700 text-slate-500"
                  )}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[2.5]" /> : st.num}
                </span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STAGE 1: BRAND PROFILE */}
      {/* ========================================================================= */}
      {currentStage === 1 && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 1 of 5: Brand & Core Attributes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tell the AI strategist what brand you are expanding. Click a template chip below to auto-fill or enter your custom details.
              </p>
            </div>
          </div>

          {/* Quick-Start Templates */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Suggestions (Click to Apply)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {TEMPLATE_PRESETS.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = brandName === tpl.brandName;
                return (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group",
                      isSelected
                        ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                        <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tpl.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {tpl.brandName} • {tpl.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Brand Name *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Acme Streetwear"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Analysis Project Title *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Tokyo Streetwear Expansion"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Industry Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white cursor-pointer focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                <option value="Consumer Electronics">Consumer Electronics</option>
                <option value="Media & Entertainment">Media & Entertainment</option>
                <option value="Home & Design">Home & Design</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Product Positioning Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Premium", "Mid-market", "Budget-friendly"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setProductPositioning(tier)}
                    className={cn(
                      "py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer",
                      productPositioning === tier
                        ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white"
                    )}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Core Brand & Product Description *
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what products you make, materials, aesthetic and unique selling proposition..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStage(2)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Next: Target Audience</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: TARGET AUDIENCE */}
      {/* ========================================================================= */}
      {currentStage === 2 && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 2 of 5: Target Audience & Subculture Affinity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define the cultural cohort you want to resonate with. Qloo will query audience affinities, music tastes and lifestyle clusters matching these signals.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Audience Segment Persona Name
              </label>
              <input
                type="text"
                value={audienceName}
                onChange={(e) => setAudienceName(e.target.value)}
                placeholder="e.g. Gen Z Streetwear Enthusiasts"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Age Cohort
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "15 – 25 (Gen Z)", range: [15, 25] as [number, number] },
                    { label: "25 – 35 (Millennials)", range: [25, 35] as [number, number] },
                    { label: "35 – 50 (Gen X)", range: [35, 50] as [number, number] },
                    { label: "All Ages (15–55)", range: [15, 55] as [number, number] },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setAgeRange(item.range)}
                      className={cn(
                        "py-2 px-2 text-[11px] font-semibold rounded-xl border text-center transition-all cursor-pointer",
                        ageRange[0] === item.range[0] && ageRange[1] === item.range[1]
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Income Bracket
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["All", "Low", "Medium", "High"] as const).map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setIncomeLevel(inc)}
                      className={cn(
                        "py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer",
                        incomeLevel === inc
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white"
                      )}
                    >
                      {inc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gender Distribution
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["All", "Male", "Female", "Non-binary"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={cn(
                        "py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer",
                        gender === g
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cultural Taste Interests */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Subculture & Lifestyle Interests (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {CURATED_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5",
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white"
                      )}
                    >
                      <span>{interest}</span>
                      {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Subculture Interest */}
              <div className="mt-3 flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomInterest())}
                  placeholder="Add custom taste signal (e.g. Acid Jazz, Pottery)..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomInterest}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStage(1)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStage(3)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Next: Select Markets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: TARGET MARKETS (LIVE API DRIVEN) */}
      {/* ========================================================================= */}
      {currentStage === 3 && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 3 of 5: Candidate Markets (Live Global Database)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select up to 10 markets to benchmark. Search any world country, metro, or territory without restrictions.
              </p>
            </div>
          </div>

          {/* Live Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={marketSearch}
              onChange={(e) => setMarketSearch(e.target.value)}
              placeholder="Live search any city or country worldwide (e.g. Tokyo, Paris, Mumbai, Iceland, Kenya)..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:outline-none"
            />
            {isSearchingMarkets && (
              <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-indigo-600 animate-spin" />
            )}
          </div>

          {/* Selected Markets Pill Summary */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Selected Markets ({selectedMarkets.length}/10)
              </span>
              {selectedMarkets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMarkets([])}
                  className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedMarkets.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No markets selected yet. Click any market card below or search above.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedMarkets.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <span>{m.flag}</span>
                    <span>{m.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleMarket(m)}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Available Markets Grid */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Available Cultural Hubs (Click to Toggle)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {searchResults.slice(0, 15).map((m) => {
                const isSelected = selectedMarkets.some((sm) => sm.id === m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMarket(m)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 group",
                      isSelected
                        ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <span className="text-2xl shrink-0 mt-0.5">{m.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {m.country_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {m.country} • {m.region}
                        </p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 mt-0.5",
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-transparent"
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStage(2)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={selectedMarkets.length === 0}
              onClick={() => setCurrentStage(4)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5",
                selectedMarkets.length > 0
                  ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                  : "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-60"
              )}
            >
              <span>Next: Strategic Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 4: STRATEGIC GOALS & TIMELINE */}
      {/* ========================================================================= */}
      {currentStage === 4 && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 4 of 5: Business Objectives & Launch Constraints
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clarify your expansion goals. The Market Strategy Agent will formulate entry sequencing and local adaptation playbooks tailored to your timeline.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Primary Business Objective *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  { id: "Market expansion", desc: "Find best new markets for organic growth" },
                  { id: "Product launch", desc: "Evaluate markets for immediate launch" },
                  { id: "Competitive analysis", desc: "Benchmark against established players" },
                  { id: "Consumer research", desc: "Deep dive into local taste trends" },
                ].map((obj) => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => setPrimaryGoal(obj.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                      primaryGoal === obj.id
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-950 dark:text-white ring-1 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:bg-white"
                    )}
                  >
                    <span className="text-xs font-bold">{obj.id}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {obj.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Launch Timeline
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["1–3 months", "3–6 months", "6–12 months"].map((tl) => (
                    <button
                      key={tl}
                      type="button"
                      onClick={() => setLaunchTimeline(tl)}
                      className={cn(
                        "py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer",
                        launchTimeline === tl
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white"
                      )}
                    >
                      {tl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Pricing Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Premium", "Mid-market", "Budget-friendly"] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setProductPositioning(tier)}
                      className={cn(
                        "py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer",
                        productPositioning === tier
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white"
                      )}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Additional Strategic Context or Hypothesis
              </label>
              <textarea
                rows={2}
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Any specific hypothesis, competitor to challenge, or channel focus you want the AI to consider..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStage(3)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStage(5)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Review Analysis Spec</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 5: FINAL REVIEW & LIVE MULTI-AGENT LAUNCH */}
      {/* ========================================================================= */}
      {currentStage === 5 && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 5 of 5: AI Specification Review & Launch
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your parameters have been synthesized into a valid multi-agent execution payload. Review details before kicking off the live run.
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 font-mono">
              Ready to Launch
            </span>
          </div>

          {/* Synthesis Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Brand & Category */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Brand & Category</span>
                <button
                  type="button"
                  onClick={() => setCurrentStage(1)}
                  className="text-indigo-600 hover:underline text-[11px] font-semibold"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{brandName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {category} • {productPositioning}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 pt-1">
                  {description}
                </p>
              </div>
            </div>

            {/* Card 2: Target Audience */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Target Cohort</span>
                <button
                  type="button"
                  onClick={() => setCurrentStage(2)}
                  className="text-indigo-600 hover:underline text-[11px] font-semibold"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{audienceName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Age {ageRange[0]}–{ageRange[1]} • {gender} • {incomeLevel} Income
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedInterests.slice(0, 4).map((i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {i}
                    </span>
                  ))}
                  {selectedInterests.length > 4 && (
                    <span className="text-[10px] text-slate-400">
                      +{selectedInterests.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Selected Candidate Markets */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Candidate Markets ({selectedMarkets.length})</span>
                <button
                  type="button"
                  onClick={() => setCurrentStage(3)}
                  className="text-indigo-600 hover:underline text-[11px] font-semibold"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedMarkets.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <span>{m.flag}</span>
                    <span>{m.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Card 4: Execution Pipeline Specs */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Execution Plan</span>
                <button
                  type="button"
                  onClick={() => setCurrentStage(4)}
                  className="text-indigo-600 hover:underline text-[11px] font-semibold"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  <span className="font-semibold text-slate-900 dark:text-white">Goal:</span> {primaryGoal}
                </p>
                <p>
                  <span className="font-semibold text-slate-900 dark:text-white">Timeline:</span> {launchTimeline}
                </p>
                <p className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 pt-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>10-Agent Pipeline + Qloo Hash Auditing</span>
                </p>
              </div>
            </div>
          </div>

          {/* Big Launch Button */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                Ready to execute live multi-agent analysis?
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Saves project in PostgreSQL and initiates the 10-step agent DAG in LangGraph.
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCurrentStage(4)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onLaunch}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold tracking-wide transition-all shadow-md hover:shadow-indigo-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Launching Analysis...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Multi-Agent Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
