"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  Sparkles,
  Search,
  Plus,
  X,
  Play,
  BarChart3,
  Rocket,
  Megaphone,
  Users,
  Compass,
  Edit3,
  Clock,
  Info,
  Building2,
  Shirt,
  Music,
  Gamepad2,
  Palette,
  Tv,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api";
import { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

// --- Supported Qloo Metros (Pure CSS / Vectors, Zero External Images) ---
interface MarketPreset {
  id: string;
  name: string;
  country: string;
  country_code: string;
  location_code: string;
  region: "Asia" | "North America" | "Europe" | "Middle East";
  potential: "High potential" | "Medium" | "High";
  description: string;
  flag: string;
  color: string;
  coords: { x: number; y: number }; // For visual world map pin
}

const PRESET_MARKETS: MarketPreset[] = [
  {
    id: "jp-tyo",
    name: "Tokyo",
    country: "Japan",
    country_code: "GB",
    location_code: "JP-TYO",
    region: "Asia",
    potential: "High potential",
    description: "Strong streetwear, music and youth culture",
    flag: "🇯🇵",
    color: "from-rose-500/15 via-red-500/10 to-transparent",
    coords: { x: 78, y: 38 },
  },
  {
    id: "kr-sel",
    name: "Seoul",
    country: "South Korea",
    country_code: "KR",
    location_code: "KR-SEL",
    region: "Asia",
    potential: "High potential",
    description: "K-pop, fashion and digital culture",
    flag: "🇰🇷",
    color: "from-blue-500/15 via-indigo-500/10 to-transparent",
    coords: { x: 74, y: 36 },
  },
  {
    id: "us-nyc",
    name: "New York",
    country: "USA",
    country_code: "US",
    location_code: "US-NYC",
    region: "North America",
    potential: "High potential",
    description: "Diverse and trend-driven market",
    flag: "🇺🇸",
    color: "from-amber-500/15 via-orange-500/10 to-transparent",
    coords: { x: 28, y: 34 },
  },
  {
    id: "gb-lnd",
    name: "London",
    country: "UK",
    country_code: "GB",
    location_code: "GB-LND",
    region: "Europe",
    potential: "Medium",
    description: "Strong fashion and lifestyle culture",
    flag: "🇬🇧",
    color: "from-indigo-500/15 via-violet-500/10 to-transparent",
    coords: { x: 48, y: 26 },
  },
  {
    id: "sg-sin",
    name: "Singapore",
    country: "Singapore",
    country_code: "SG",
    location_code: "SG-SIN",
    region: "Asia",
    potential: "High potential",
    description: "High purchasing power and global trends",
    flag: "🇸🇬",
    color: "from-emerald-500/15 via-teal-500/10 to-transparent",
    coords: { x: 72, y: 56 },
  },
  {
    id: "th-bkk",
    name: "Bangkok",
    country: "Thailand",
    country_code: "TH",
    location_code: "TH-BKK",
    region: "Asia",
    potential: "Medium",
    description: "Vibrant street culture and fashion",
    flag: "🇹🇭",
    color: "from-purple-500/15 via-pink-500/10 to-transparent",
    coords: { x: 69, y: 48 },
  },
  {
    id: "de-ber",
    name: "Berlin",
    country: "Germany",
    country_code: "DE",
    location_code: "DE-BER",
    region: "Europe",
    potential: "Medium",
    description: "Strong indie and alternative culture",
    flag: "🇩🇪",
    color: "from-yellow-500/15 via-amber-500/10 to-transparent",
    coords: { x: 52, y: 28 },
  },
  {
    id: "us-lax",
    name: "Los Angeles",
    country: "USA",
    country_code: "US",
    location_code: "US-LAX",
    region: "North America",
    potential: "Medium",
    description: "Streetwear and entertainment hub",
    flag: "🇺🇸",
    color: "from-cyan-500/15 via-sky-500/10 to-transparent",
    coords: { x: 20, y: 40 },
  },
];

// --- Key Interest Presets with Native Icons (Zero Images) ---
const INTEREST_PRESETS = [
  { id: "streetwear", label: "Streetwear", icon: Shirt, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70" },
  { id: "sneakers", label: "Sneakers", icon: ShoppingBag, color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/70" },
  { id: "fashion", label: "Fashion", icon: Sparkles, color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/70" },
  { id: "music", label: "Music", icon: Music, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70" },
  { id: "art-design", label: "Art & Design", icon: Palette, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70" },
  { id: "gaming", label: "Gaming", icon: Gamepad2, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70" },
  { id: "anime", label: "Anime & Manga", icon: Tv, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70" },
  { id: "urban-culture", label: "Urban Culture", icon: Building2, color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70" },
];

const LIFESTYLE_TRAITS = [
  "Urban lifestyle",
  "Trend early adopters",
  "Social media active",
  "Environmentally conscious",
  "Premium & quality focused",
  "Limited edition collectors",
  "Value for money",
  "Local and independent brands",
];

const STRATEGIC_GOALS = [
  { id: "expansion", title: "Market expansion", desc: "Find the best new markets for our product", icon: BarChart3 },
  { id: "launch", title: "Product launch", desc: "Evaluate markets for an upcoming launch", icon: Rocket },
  { id: "campaign", title: "Campaign planning", desc: "Optimize marketing campaign strategy", icon: Megaphone },
  { id: "competitive", title: "Competitive analysis", desc: "Understand competitive landscape", icon: Users },
  { id: "consumer", title: "Consumer research", desc: "Deep dive into cultural insights and trends", icon: Compass },
];

export default function NewProjectWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Step 1: Brand & Product State ---
  const [projectName, setProjectName] = useState("Tokyo Streetwear Expansion");
  const [brandName, setBrandName] = useState("Acme Streetwear");
  const [category, setCategory] = useState("Fashion & Apparel");
  const [description, setDescription] = useState(
    "Premium streetwear collection for urban youth, including apparel, sneakers and accessories."
  );
  const [tags, setTags] = useState<string[]>(["Streetwear", "Youth Culture", "Urban Fashion"]);
  const [newTagInput, setNewTagInput] = useState("");

  // --- Step 2: Target Audience State ---
  const [audienceName, setAudienceName] = useState("Gen Z Streetwear Enthusiasts");
  const [ageRange, setAgeRange] = useState<[number, number]>([15, 35]);
  const [gender, setGender] = useState<"All" | "Male" | "Female" | "Non-binary">("All");
  const [incomeLevel, setIncomeLevel] = useState<"All" | "Low" | "Medium" | "High">("Medium");
  const [targetLocations, setTargetLocations] = useState<string[]>(["Japan", "South Korea", "Singapore"]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Streetwear",
    "Sneakers",
    "Music",
    "Urban Culture",
  ]);
  const [customInterestInput, setCustomInterestInput] = useState("");
  const [showAddInterestModal, setShowAddInterestModal] = useState(false);
  const [selectedLifestyles, setSelectedLifestyles] = useState<string[]>([
    "Urban lifestyle",
    "Trend early adopters",
    "Social media active",
    "Premium & quality focused",
    "Limited edition collectors",
    "Local and independent brands",
  ]);

  // --- Step 3: Candidate Markets State ---
  const [marketSearchQuery, setMarketSearchQuery] = useState("");
  const [selectedRegionTab, setSelectedRegionTab] = useState<string>("All markets");
  const [selectedMarkets, setSelectedMarkets] = useState<MarketPreset[]>([
    PRESET_MARKETS[0], // Tokyo
    PRESET_MARKETS[1], // Seoul
    PRESET_MARKETS[4], // Singapore
    PRESET_MARKETS[5], // Bangkok
  ]);

  // --- Step 4: Goals & Strategy State ---
  const [primaryGoal, setPrimaryGoal] = useState("Market expansion");
  const [launchTimeline, setLaunchTimeline] = useState("1–3 months");
  const [budgetRange, setBudgetRange] = useState("Medium ($100K – $500K)");
  const [productPositioning, setProductPositioning] = useState<"Premium" | "Mid-market" | "Budget-friendly">("Premium");
  const [keySuccessMetrics, setKeySuccessMetrics] = useState<string[]>([
    "Market fit score",
    "Audience overlap",
    "Revenue potential",
    "Brand affinity",
    "Cultural relevance",
    "Media and channel fit",
  ]);
  const [additionalContext, setAdditionalContext] = useState(
    "We are planning to launch a premium streetwear collection targeting Gen Z. We want to understand which markets have the highest cultural alignment and what local trends we should consider."
  );

  // Initialize Workspace
  useEffect(() => {
    async function loadWorkspace() {
      try {
        const wsList = await api.getWorkspaces();
        let ws = wsList[0];
        if (!ws) {
          ws = await api.createWorkspace("Acme Brands", "acme.cultura.ai");
        }
        setWorkspace(ws);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to initialize workspace";
        setError(msg);
      }
    }
    loadWorkspace();
  }, []);

  // Tag Helpers
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    if (!tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  // Interest Helpers
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length <= 1) return;
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleAddCustomInterest = () => {
    if (!customInterestInput.trim()) return;
    if (!selectedInterests.includes(customInterestInput.trim())) {
      setSelectedInterests([...selectedInterests, customInterestInput.trim()]);
    }
    setCustomInterestInput("");
    setShowAddInterestModal(false);
  };

  // Lifestyle Helper
  const toggleLifestyle = (trait: string) => {
    if (selectedLifestyles.includes(trait)) {
      setSelectedLifestyles(selectedLifestyles.filter((t) => t !== trait));
    } else {
      setSelectedLifestyles([...selectedLifestyles, trait]);
    }
  };

  // Market Selection Helper
  const toggleMarket = (market: MarketPreset) => {
    const exists = selectedMarkets.some((m) => m.id === market.id);
    if (exists) {
      if (selectedMarkets.length <= 1) return; // Keep at least one
      setSelectedMarkets(selectedMarkets.filter((m) => m.id !== market.id));
    } else {
      if (selectedMarkets.length >= 10) return; // Max 10
      setSelectedMarkets([...selectedMarkets, market]);
    }
  };

  // Metric Helper
  const toggleMetric = (metric: string) => {
    if (keySuccessMetrics.includes(metric)) {
      if (keySuccessMetrics.length <= 1) return;
      setKeySuccessMetrics(keySuccessMetrics.filter((m) => m !== metric));
    } else {
      setKeySuccessMetrics([...keySuccessMetrics, metric]);
    }
  };

  // Final Action: Create & Execute Analysis Run
  const handleLaunchAnalysis = async () => {
    if (!workspace) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Create Project in PostgreSQL
      const project = await api.createProject({
        workspace_id: workspace.id,
        name: projectName,
        objective: `${primaryGoal}: ${description}`,
        brand_profile_json: {
          brand_name: brandName,
          category: category,
          positioning: productPositioning,
          description: description,
          tags: tags,
          launch_timeline: launchTimeline,
          budget_range: budgetRange,
        },
        audience_profile_json: {
          persona: audienceName,
          age_range: ageRange,
          gender: gender,
          income_level: incomeLevel,
          interests: selectedInterests,
          lifestyle_traits: selectedLifestyles,
          target_locations: targetLocations,
        },
        candidate_markets: selectedMarkets.map((m) => ({
          name: m.name,
          country: m.country,
          country_code: m.country_code,
          location_code: m.location_code,
        })),
      });

      // 2. Launch Analysis Run immediately
      const run = await api.createRun(
        project.id,
        selectedMarkets.map((m) => ({ name: m.name, code: m.location_code }))
      );

      // 3. Navigate to Live Run page
      router.push(`/runs/${run.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to launch analysis run";
      setError(msg);
      setLoading(false);
    }
  };

  // Step Definitions (Matching Mockup Wizard 1–5)
  const steps = [
    { num: 1, title: "Brand & Product" },
    { num: 2, title: "Audience" },
    { num: 3, title: "Markets" },
    { num: 4, title: "Goals & Strategy" },
    { num: 5, title: "Review" },
  ];

  // Filter Markets for Tab & Search
  const filteredMarkets = PRESET_MARKETS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(marketSearchQuery.toLowerCase()) ||
      m.country.toLowerCase().includes(marketSearchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(marketSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedRegionTab === "Selected (4)" || selectedRegionTab === `Selected (${selectedMarkets.length})`) {
      return selectedMarkets.some((s) => s.id === m.id);
    }
    if (selectedRegionTab === "Asia") return m.region === "Asia";
    if (selectedRegionTab === "North America") return m.region === "North America";
    if (selectedRegionTab === "Europe") return m.region === "Europe";
    if (selectedRegionTab === "Middle East") return m.region === "Middle East";

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link
              href="/projects"
              className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center space-x-1 transition-colors"
            >
              <span>Projects</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">Create new analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create New Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {step === 1 && "Define your brand parameters and product attributes to cross-reference with Qloo cultural taste graphs."}
            {step === 2 && "Define your target audience. This helps us find the right cultural signals and compare markets more accurately."}
            {step === 3 && "Select the markets you want to analyze. We'll compare cultural signals, audience fit and opportunities across these markets using Qloo."}
            {step === 4 && "Define your business goals and strategy. This helps us tailor the analysis and recommendations to your specific needs."}
            {step === 5 && "Review your analysis settings below. Once everything looks good, run the analysis to get cultural insights and market recommendations from Qloo."}
          </p>
        </div>

        {/* 5-Step Horizontal Stepper (Matching Mockups) */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          {steps.map((s, idx) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center">
                <button
                  type="button"
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  className={cn(
                    "flex flex-col items-center space-y-1 group transition-all",
                    s.num <= step ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                      isDone
                        ? "bg-indigo-600 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold hidden md:inline transition-colors",
                      isCurrent
                        ? "text-indigo-600 dark:text-indigo-400 font-bold"
                        : isDone
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {s.title}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-6 lg:w-10 h-0.5 mx-1.5 rounded-full transition-colors",
                      isDone ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-300">
          <p className="font-bold uppercase tracking-wider">Analysis Configuration Error</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Main Two-Column Layout (Matching Mockups 03, 04, 05, 07) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ========================================================================= */}
          {/* STEP 1: BRAND & PRODUCT */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  1. Brand & Product Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tell us about your brand and product so we can analyze relevant cultural signals.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                    placeholder="e.g. Tokyo Streetwear Expansion"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Give your analysis a clear, recognizable name.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Brand / Entity Name *
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                      placeholder="e.g. Acme Streetwear"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Brand Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Food & Beverage">Food & Beverage</option>
                      <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                      <option value="Consumer Electronics">Consumer Electronics</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Travel & Hospitality">Travel & Hospitality</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Description & Scope *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                    placeholder="Describe your core product offerings, brand narrative, and key value propositions..."
                  />
                </div>

                {/* Brand Tags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Brand Tags & Attributes
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-indigo-950 dark:hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      placeholder="Add tag (e.g. Gen Z, Sustainable, Luxury)..."
                      className="flex-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: AUDIENCE (Matching Mockup 03, Zero External Images) */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  2. Target Audience
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tell us about your target audience so we can analyze relevant cultural signals.
                </p>
              </div>

              <div className="space-y-5">
                {/* Audience Name */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Audience Name (optional)
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {audienceName.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={audienceName}
                    maxLength={100}
                    onChange={(e) => setAudienceName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                    placeholder="e.g. Gen Z Streetwear Enthusiasts"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Give your audience segment a name to easily identify it.
                  </p>
                </div>

                {/* Age Range & Gender Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Age range *
                      </label>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {ageRange[0]} – {ageRange[1]} years
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 pt-2">
                      <span className="text-xs text-slate-400 font-mono">15</span>
                      <input
                        type="range"
                        min="15"
                        max="65"
                        value={ageRange[1]}
                        onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-slate-400 font-mono">65</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Gender (optional)
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
                              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-2xs ring-1 ring-indigo-500/30"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Locations & Income Level Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Locations (optional)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {targetLocations.map((loc) => (
                        <span
                          key={loc}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <span>{loc}</span>
                          <button
                            type="button"
                            onClick={() => setTargetLocations(targetLocations.filter((l) => l !== loc))}
                            className="hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Income level (optional)
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
                              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-2xs ring-1 ring-indigo-500/30"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                          )}
                        >
                          {inc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Interests Cards (Pure CSS & Lucide Icons, Zero External Images) */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Key interests *
                      </label>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Select interests that best describe your audience. You can add custom interests too.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {INTEREST_PRESETS.map((item) => {
                      const isSelected = selectedInterests.includes(item.label);
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleInterest(item.label)}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-all cursor-pointer flex items-center justify-between group",
                            isSelected
                              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/70 text-indigo-950 dark:text-white shadow-2xs ring-1 ring-indigo-500/20"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                          )}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.color)}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold truncate block">{item.label}</span>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0 ml-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Interest Button */}
                  <div className="mt-3">
                    {!showAddInterestModal ? (
                      <button
                        type="button"
                        onClick={() => setShowAddInterestModal(true)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add custom interest</span>
                      </button>
                    ) : (
                      <div className="flex gap-2 max-w-sm">
                        <input
                          type="text"
                          value={customInterestInput}
                          onChange={(e) => setCustomInterestInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomInterest())}
                          placeholder="e.g. Vintage Watches, Specialty Coffee..."
                          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomInterest}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddInterestModal(false)}
                          className="px-2 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lifestyle & Behavior Checkboxes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Lifestyle & behavior (optional)
                  </label>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                    Select lifestyle traits to better understand your audience.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {LIFESTYLE_TRAITS.map((trait) => {
                      const isChecked = selectedLifestyles.includes(trait);
                      return (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => toggleLifestyle(trait)}
                          className={cn(
                            "flex items-center space-x-2.5 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer",
                            isChecked
                              ? "border-indigo-600/80 dark:border-indigo-500/80 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-950 dark:text-white"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            )}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="font-medium">{trait}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: MARKETS (Matching Mockup 05, Pure CSS Badges, Zero External Images) */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  3. Select Markets
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose up to 10 markets to compare. You can select countries, cities or regions based on your launch plans.
                </p>
              </div>

              {/* Search & Region Filters */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={marketSearchQuery}
                      onChange={(e) => setMarketSearchQuery(e.target.value)}
                      placeholder="Search countries, cities or regions... (e.g. Japan, Tokyo, Europe)"
                      className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <select
                    value={selectedRegionTab}
                    onChange={(e) => setSelectedRegionTab(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="All markets">Browse by region</option>
                    <option value="Asia">Asia</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Middle East">Middle East</option>
                  </select>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                  {[
                    "All markets",
                    `Selected (${selectedMarkets.length})`,
                    "Asia",
                    "North America",
                    "Europe",
                    "Middle East",
                  ].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedRegionTab(tab)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
                        selectedRegionTab === tab
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Clean CSS Market Cards (Zero Images) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMarkets.map((preset) => {
                  const isSelected = selectedMarkets.some((m) => m.id === preset.id);
                  return (
                    <div
                      key={preset.id}
                      onClick={() => toggleMarket(preset)}
                      className={cn(
                        "rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden",
                        isSelected
                          ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      {/* Stylized Gradient Accent Strip */}
                      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", preset.color)} />

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{preset.flag}</span>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                              {preset.name}, {preset.country}
                            </h3>
                            <span className="font-mono text-[10px] text-slate-400 uppercase">
                              {preset.location_code} <span className="mx-1">•</span> {preset.region}
                            </span>
                          </div>
                        </div>

                        {/* Top Checkbox */}
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0",
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                              : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-transparent"
                          )}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>

                      <div className="pt-3 space-y-2">
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              preset.potential === "High potential" || preset.potential === "High"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60"
                            )}
                          >
                            {preset.potential}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Verified Qloo Metro
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Markets Counter Bar */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Selected markets ({selectedMarkets.length}/10)
                  </span>
                  {selectedMarkets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMarkets([])}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedMarkets.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs"
                    >
                      <span>{m.flag}</span>
                      <span>{m.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMarket(m);
                        }}
                        className="hover:text-rose-500 text-slate-400 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: GOALS & STRATEGY (Matching Mockup 04) */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  4. Goals & Strategy
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tell us about your business objectives and launch strategy for this analysis.
                </p>
              </div>

              <div className="space-y-6">
                {/* Primary Goal Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                    Primary goal *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {STRATEGIC_GOALS.map((g) => {
                      const isSelected = primaryGoal === g.title;
                      const IconComp = g.icon;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setPrimaryGoal(g.title)}
                          className={cn(
                            "p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative",
                            isSelected
                              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-2xs"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <IconComp
                              className={cn(
                                "w-4 h-4",
                                isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                              )}
                            />
                            {isSelected && (
                              <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px]">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                              {g.title}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 block leading-relaxed">
                              {g.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Timeline & Budget Range Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Launch timeline *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["1–3 months", "3–6 months", "6–12 months", "12+ months"].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setLaunchTimeline(time)}
                          className={cn(
                            "py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer",
                            launchTimeline === time
                              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <div
                            className={cn(
                              "w-3.5 h-3.5 rounded-full border flex items-center justify-center",
                              launchTimeline === time ? "border-indigo-600 bg-indigo-600" : "border-slate-300 dark:border-slate-600"
                            )}
                          >
                            {launchTimeline === time && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{time}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Budget range (optional)
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="Small (<$100K)">Small (&lt;$100K)</option>
                      <option value="Medium ($100K – $500K)">Medium ($100K – $500K)</option>
                      <option value="Large ($500K – $2M)">Large ($500K – $2M)</option>
                      <option value="Enterprise ($2M+)">Enterprise ($2M+)</option>
                    </select>
                  </div>
                </div>

                {/* Product Positioning */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Product positioning *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "Premium", title: "Premium", desc: "High-end, quality focused" },
                      { id: "Mid-market", title: "Mid-market", desc: "Balanced value and quality" },
                      { id: "Budget-friendly", title: "Budget-friendly", desc: "Price competitive" },
                    ].map((pos) => {
                      const isSelected = productPositioning === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setProductPositioning(pos.id as typeof productPositioning)}
                          className={cn(
                            "p-3.5 rounded-xl border text-left transition-all cursor-pointer relative",
                            isSelected
                              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-2xs"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700"
                          )}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{pos.title}</span>
                            {isSelected && (
                              <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px]">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{pos.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Key Success Metrics */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Key success metrics *
                  </label>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2.5">
                    Select the metrics that matter most for this analysis.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      "Market fit score",
                      "Audience overlap",
                      "Revenue potential",
                      "Brand affinity",
                      "Cultural relevance",
                      "Competitive landscape",
                      "Influencer ecosystem",
                      "Media and channel fit",
                    ].map((met) => {
                      const isChecked = keySuccessMetrics.includes(met);
                      return (
                        <button
                          key={met}
                          type="button"
                          onClick={() => toggleMetric(met)}
                          className={cn(
                            "flex items-center space-x-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer",
                            isChecked
                              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-950 dark:text-white"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          <div
                            className={cn(
                              "w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors",
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            )}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="font-medium text-[11px] truncate">{met}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Context */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Additional context (optional)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {additionalContext.length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/70 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:outline-none"
                    placeholder="Any other information about your launch strategy, key considerations or specific questions?"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: REVIEW & RUN ANALYSIS (Matching Mockup 07, Zero External Images) */}
          {/* ========================================================================= */}
          {step === 5 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  5. Review & Run Analysis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Review all the details below. You can go back and make changes if needed.
                </p>
              </div>

              {/* Dossier Cards Grid */}
              <div className="space-y-4">
                {/* 1. Project Overview Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Project overview
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="flex items-start space-x-3.5">
                    {/* Branded Vector Monogram (Zero Image) */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-lg shadow-sm shrink-0">
                      {projectName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{projectName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {brandName} <span className="mx-1">•</span> {category}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                        {description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Target Audience Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Target audience
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{audienceName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Age {ageRange[0]}–{ageRange[1]} <span className="mx-1">•</span> {gender} genders <span className="mx-1">•</span> {incomeLevel} income
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-700 dark:text-slate-200">Interests:</strong>{" "}
                    {selectedInterests.join(", ")}
                  </p>
                </div>

                {/* 3. Selected Markets Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Selected markets ({selectedMarkets.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMarkets.map((m, idx) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                      >
                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <span className="font-mono text-slate-400">{idx + 1}.</span>
                          <span>{m.flag}</span>
                          <span>{m.name}, {m.country}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                          {m.potential}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Goals & Strategy Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Goals & strategy
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Primary goal:</span> {primaryGoal}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Launch timeline:</span> {launchTimeline}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Budget range:</span> {budgetRange}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Positioning:</span> {productPositioning}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <span>
                  {step === 1 && "Next: Audience"}
                  {step === 2 && "Next: Markets"}
                  {step === 3 && "Next: Goals & Strategy"}
                  {step === 4 && "Next: Review"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleLaunchAnalysis}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? "Orchestrating Analysis Pipeline..." : "Run Analysis"}</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: STICKY LIVE PREVIEW SIDEBAR (Pure CSS & SVG, Zero External Images) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-5 sticky top-20">
          {/* STEP 1 & 2: Audience Preview Panel */}
          {(step === 1 || step === 2) && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Audience preview</h3>
                <span className="text-[10px] text-indigo-600 font-semibold">Live Preview</span>
              </div>

              {/* Cultural Taste Spectrum Visualizer (Pure CSS Gradient Bar) */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Cultural Taste Spectrum</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">Qloo Signal 94%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                  <div className="h-full bg-indigo-600 w-[45%]" />
                  <div className="h-full bg-purple-500 w-[30%]" />
                  <div className="h-full bg-pink-500 w-[25%]" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>Specialty Fashion (45%)</span>
                  <span>Youth Culture (30%)</span>
                  <span>Digital (25%)</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{audienceName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Young, urban audience interested in streetwear, sneakers, music and contemporary fashion. Active on social media and interested in limited drops and independent brands.
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {ageRange[0]}–{ageRange[1]} years
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {gender} genders
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {incomeLevel} income
                </span>
                {targetLocations.map((loc) => (
                  <span
                    key={loc}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {loc}
                  </span>
                ))}
              </div>

              {/* Key Interests Icons */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Key interests
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {selectedInterests.slice(0, 4).map((i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <Shirt className="w-4 h-4 mx-auto text-indigo-600 dark:text-indigo-400 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block truncate">
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience Size Estimate */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Audience size estimate</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Japan</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm block">~8.5M</strong>
                    <div className="h-1 rounded-full bg-indigo-600 mt-1" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">South Korea</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm block">~6.2M</strong>
                    <div className="h-1 rounded-full bg-indigo-600 mt-1" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Singapore</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm block">~1.8M</strong>
                    <div className="h-1 rounded-full bg-indigo-600 mt-1" />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 pt-1">
                  These are estimated audience sizes based on available cultural data from Qloo.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Selected Markets & World Map Panel */}
          {step === 3 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Selected markets ({selectedMarkets.length})
                </h3>
                <span className="text-[10px] text-indigo-600 font-semibold">Reorder</span>
              </div>

              {/* Numbered List of Selected Markets */}
              <div className="space-y-2">
                {selectedMarkets.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-400 text-[11px]">{idx + 1}</span>
                      <span>{m.flag}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {m.name}, {m.country}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                      High
                    </span>
                  </div>
                ))}
              </div>

              {/* Interactive Visual World Map Canvas (Pure SVG) */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 p-3 relative h-40 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Market Coverage Map</span>
                  <span className="text-emerald-400">● 4 Pins Active</span>
                </div>

                {/* SVG Visual Nodes for Selected Markets */}
                <svg className="w-full h-24" viewBox="0 0 100 60">
                  <path
                    d="M10,25 Q30,10 50,25 T90,25"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                  {selectedMarkets.map((m) => (
                    <g key={m.id}>
                      <circle
                        cx={m.coords.x}
                        cy={m.coords.y}
                        r="3.5"
                        className="fill-indigo-500 animate-ping opacity-75"
                      />
                      <circle
                        cx={m.coords.x}
                        cy={m.coords.y}
                        r="2.5"
                        className="fill-indigo-600"
                      />
                      <text
                        x={m.coords.x + 3}
                        y={m.coords.y + 1}
                        fontSize="3"
                        fill="#cbd5e1"
                        fontWeight="bold"
                      >
                        {m.name}
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="text-[9px] text-slate-400 font-mono text-right">
                  Qloo Global Entity Mesh
                </div>
              </div>

              {/* Quick Insights */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quick insights</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-start space-x-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>All selected markets show strong interest in streetwear and sneakers.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>High Gen Z population and social media engagement across all four markets.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Each market has unique cultural sub-trends we&apos;ll analyze in detail.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 & 5: Analysis Summary & Launch Card */}
          {(step === 4 || step === 5) && (
            <div className="space-y-4">
              {/* Analysis Summary Card */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Analysis summary</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start space-x-3">
                    <Globe2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white block font-semibold">
                        {selectedMarkets.length} markets to analyze
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        {selectedMarkets.map((m) => m.name).join(", ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white block font-semibold">
                        Target audience
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Gen Z, {ageRange[0]}–{ageRange[1]}, {gender} genders
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <BarChart3 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white block font-semibold">
                        Cultural signals
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Interests, lifestyle, consumer behavior and brand affinity using Qloo data
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white block font-semibold">
                        Estimated time
                      </strong>
                      <span className="text-slate-500 text-[11px]">~3–5 minutes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready to Run Your Analysis? */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/70 to-indigo-50/30 dark:from-indigo-950/40 dark:to-slate-900 p-5 shadow-xs space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Ready to run your analysis?
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  We&apos;ll analyze cultural signals, audience fit and market opportunities using Qloo&apos;s cultural intelligence data.
                </p>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[3]" />
                    <span>Analyze cultural affinity across selected markets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[3]" />
                    <span>Compare audience fit and market potential</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[3]" />
                    <span>Identify key trends, subcultures and local preferences</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[3]" />
                    <span>Generate actionable recommendations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[3]" />
                    <span>Create a detailed report with insights and evidence</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleLaunchAnalysis}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{loading ? "Starting Analysis Engine..." : "Run Analysis"}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  This will start a new analysis run using your current settings.
                </p>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    You&apos;ll get a notification when the analysis is complete. You can also check the progress in the Runs section.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
