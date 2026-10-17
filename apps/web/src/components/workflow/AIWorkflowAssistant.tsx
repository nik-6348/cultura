"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Play,
  CheckCircle2,
  Globe2,
  Users,
  Target,
  BarChart3,
  Loader2,
  SlidersHorizontal,
  Compass,
  Building2,
  ShoppingBag,
  Coffee,
  Sparkle,
  Search,
  Send,
  RotateCcw,
  Layers,
  Edit2,
  ChevronRight,
  ShieldCheck,
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

// 1-Click Brand Presets
interface BrandSuggestion {
  name: string;
  category: string;
  positioning: "Premium" | "Mid-market" | "Budget-friendly";
  description: string;
  tags: string[];
  suggestedPersona: string;
  suggestedInterests: string[];
  suggestedMarkets: string[];
}

const BRAND_SUGGESTIONS: BrandSuggestion[] = [
  {
    name: "Acme Streetwear Lab",
    category: "Fashion & Apparel",
    positioning: "Premium",
    description: "Avant-garde technical outerwear and sneaker drops inspired by architectural brutalism.",
    tags: ["Streetwear", "Youth Culture", "Drop Culture", "Sneakers"],
    suggestedPersona: "Gen Z Streetwear Collectors & Creators",
    suggestedInterests: ["Streetwear", "Sneakers", "Electronic Music", "Contemporary Art"],
    suggestedMarkets: ["Tokyo", "Seoul", "Berlin"],
  },
  {
    name: "Kuro Craft Coffee",
    category: "Food & Beverage",
    positioning: "Premium",
    description: "Minimalist third-wave Japanese pour-over bars with micro-lot origins and bespoke ceramics.",
    tags: ["Specialty Coffee", "Minimalism", "Cafe Culture", "Craft"],
    suggestedPersona: "Affluent Minimalist Design Enthusiasts",
    suggestedInterests: ["Artisanal Coffee", "Minimalist Design", "Architecture", "Slow Living"],
    suggestedMarkets: ["Tokyo", "London", "New York"],
  },
  {
    name: "Lumina Niche Fragrance",
    category: "Beauty & Cosmetics",
    positioning: "Premium",
    description: "Artisanal unisex extrait de parfum formulated with rare botanicals and olfactory storytelling.",
    tags: ["Niche Fragrance", "Luxury Olfactory", "Slow Beauty"],
    suggestedPersona: "High-Net-Worth Aesthetic Connoisseurs",
    suggestedInterests: ["Fine Art", "Niche Perfumery", "Contemporary Literature", "Wine Culture"],
    suggestedMarkets: ["Paris", "Seoul", "London"],
  },
  {
    name: "Terra Circular Living",
    category: "Home & Lifestyle",
    positioning: "Mid-market",
    description: "Zero-waste modular home goods and regenerative lifestyle essentials for urban apartments.",
    tags: ["Sustainability", "Circular Design", "Eco-Living"],
    suggestedPersona: "Eco-Conscious Urban Professionals",
    suggestedInterests: ["Sustainability", "Urban Gardening", "Design", "Organic Gastronomy"],
    suggestedMarkets: ["Berlin", "London", "Tokyo"],
  },
];

// 1-Click Persona Suggestions
interface PersonaSuggestion {
  title: string;
  desc: string;
  age: [number, number];
  income: "All" | "Low" | "Medium" | "High";
  interests: string[];
}

const PERSONA_SUGGESTIONS: PersonaSuggestion[] = [
  {
    title: "Gen Z Streetwear & Digital Natives",
    desc: "Ages 18-26, high trend sensitivity, sneakerheads, underground rap, drop culture",
    age: [18, 26],
    income: "Medium",
    interests: ["Streetwear", "Sneakers", "Music Production", "Digital Art"],
  },
  {
    title: "Minimalist Conscious Urbanites",
    desc: "Ages 24-38, design lovers, specialty coffee, architectural lifestyle, slow living",
    age: [24, 38],
    income: "High",
    interests: ["Minimalist Design", "Specialty Coffee", "Architecture", "Independent Books"],
  },
  {
    title: "Luxury Connoisseurs & Taste Creators",
    desc: "Ages 28-50, high net-worth, bespoke tailoring, fine art, exclusive pop-up supper clubs",
    age: [28, 50],
    income: "High",
    interests: ["High Fashion", "Contemporary Art", "Fine Dining", "Rare Collectibles"],
  },
  {
    title: "Subcultural Indie Creatives",
    desc: "Ages 20-35, vinyl record collectors, DIY fashion, electronic underground, zine publishers",
    age: [20, 35],
    income: "Medium",
    interests: ["Club Culture", "Vintage Thrift", "Vinyl Records", "Independent Film"],
  },
];

// 1-Click Market Hubs with Unicode flags
interface MarketHub {
  name: string;
  country: string;
  country_code: string;
  location_code: string;
  flag: string;
  region: string;
  subcultures: string;
}

const MARKET_HUBS: MarketHub[] = [
  {
    name: "Tokyo",
    country: "Japan",
    country_code: "JP",
    location_code: "JP-TYO",
    flag: "🇯🇵",
    region: "Asia",
    subcultures: "Harajuku Streetwear, Shibuya Youth, Daikanyama Craft",
  },
  {
    name: "Seoul",
    country: "South Korea",
    country_code: "KR",
    location_code: "KR-SEL",
    flag: "🇰🇷",
    region: "Asia",
    subcultures: "Seongsu Pop-Up Labs, Hannam Luxury, Hongdae Indie",
  },
  {
    name: "Berlin",
    country: "Germany",
    country_code: "DE",
    location_code: "DE-BER",
    flag: "🇩🇪",
    region: "Europe",
    subcultures: "Kreuzberg Electronic, Mitte Avant-Garde, Neukölln DIY",
  },
  {
    name: "London",
    country: "United Kingdom",
    country_code: "GB",
    location_code: "GB-LND",
    flag: "🇬🇧",
    region: "Europe",
    subcultures: "Hackney Creative, Soho Heritage, Shoreditch Tech",
  },
  {
    name: "Paris",
    country: "France",
    country_code: "FR",
    location_code: "FR-PAR",
    flag: "🇫🇷",
    region: "Europe",
    subcultures: "Le Marais Couture, Canal Saint-Martin Natural Wine",
  },
  {
    name: "New York",
    country: "United States",
    country_code: "US",
    location_code: "US-NYC",
    flag: "🇺🇸",
    region: "North America",
    subcultures: "SoHo Flagships, Lower East Side Underground, Brooklyn Indie",
  },
  {
    name: "São Paulo",
    country: "Brazil",
    country_code: "BR",
    location_code: "BR-SAO",
    flag: "🇧🇷",
    region: "Latin America",
    subcultures: "Vila Madalena Arts, Pinheiros Gastronomy, Jardins Luxury",
  },
  {
    name: "Mumbai",
    country: "India",
    country_code: "IN",
    location_code: "IN-BOM",
    flag: "🇮🇳",
    region: "Asia",
    subcultures: "Bandra Creative Hub, Kala Ghoda Arts, Lower Parel Luxury",
  },
];

// 1-Click Goal Suggestions
interface GoalSuggestion {
  goal: string;
  timeline: string;
  positioning: "Premium" | "Mid-market" | "Budget-friendly";
  desc: string;
}

const GOAL_SUGGESTIONS: GoalSuggestion[] = [
  {
    goal: "Flagship Retail Store Opening",
    timeline: "Q3 2026 (6-9 Months)",
    positioning: "Premium",
    desc: "Permanent brick-and-mortar presence in prime cultural retail district with localized activations.",
  },
  {
    goal: "Underground Cultural Pop-Up & Residency",
    timeline: "Immediate (1-3 Months)",
    positioning: "Premium",
    desc: "High-buzz short-term experiential activation testing initial brand affinity and organic peer buzz.",
  },
  {
    goal: "Direct-to-Consumer Digital Expansion",
    timeline: "Q4 2026 (9-12 Months)",
    positioning: "Mid-market",
    desc: "Localized e-commerce operations, localized content marketing and regional social creators.",
  },
  {
    goal: "Brand Collaboration & Co-Created Drops",
    timeline: "Flexible (3-6 Months)",
    positioning: "Premium",
    desc: "Joint limited-edition drop with verified local cultural tastemakers and concept retailers.",
  },
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
  // Current active question index (0: Brand, 1: Audience, 2: Markets, 3: Goals, 4: Blueprint Review)
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Free text inputs for each step
  const [customBrandText, setCustomBrandText] = useState(brandName || "");
  const [customCategoryText, setCustomCategoryText] = useState(category || "");
  const [customPersonaText, setCustomPersonaText] = useState(audienceName || "");
  const [customMarketText, setCustomMarketText] = useState("");
  const [customGoalText, setCustomGoalText] = useState(primaryGoal || "");
  const [searchingMarket, setSearchingMarket] = useState(false);

  // Transcript of answered questions
  const [history, setHistory] = useState<Array<{ step: number; question: string; answer: string }>>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on step change
    inputRef.current?.focus();
  }, [currentStep]);

  // Handle step 0 confirm (Brand & Concept)
  const handleConfirmBrand = (customName?: string, customCat?: string, customDesc?: string) => {
    const finalName = customName || customBrandText.trim() || brandName || "Autonomous Brand";
    const finalCat = customCat || customCategoryText.trim() || category || "Lifestyle & Apparel";
    const finalDesc = customDesc || description || `Expansion strategy and cultural resonance analysis for ${finalName}.`;

    setBrandName(finalName);
    setCategory(finalCat);
    setDescription(finalDesc);
    if (!projectName || projectName.startsWith("Analysis:")) {
      setProjectName(`${finalName} Global Expansion`);
    }

    setHistory((prev) => [
      ...prev.filter((h) => h.step !== 0),
      {
        step: 0,
        question: "What brand or concept are you planning to expand?",
        answer: `${finalName} (${finalCat})`,
      },
    ]);

    setCurrentStep(1);
  };

  // Handle step 1 confirm (Cultural Demographic & Persona)
  const handleConfirmAudience = (customPersona?: string, customInts?: string[]) => {
    const finalPersona = customPersona || customPersonaText.trim() || audienceName || "Gen Z & Urban Creatives";
    const finalInts = customInts || (selectedInterests.length > 0 ? selectedInterests : ["Streetwear", "Specialty Coffee", "Contemporary Design"]);

    setAudienceName(finalPersona);
    setSelectedInterests(finalInts);

    setHistory((prev) => [
      ...prev.filter((h) => h.step !== 1),
      {
        step: 1,
        question: "Which cultural demographic and lifestyle cohort should we target?",
        answer: `${finalPersona}`,
      },
    ]);

    setCurrentStep(2);
  };

  // Handle step 2 market selection toggle
  const handleToggleMarket = (hub: MarketHub) => {
    const exists = selectedMarkets.some((m) => m.name.toLowerCase() === hub.name.toLowerCase());
    if (exists) {
      setSelectedMarkets(selectedMarkets.filter((m) => m.name.toLowerCase() !== hub.name.toLowerCase()));
    } else {
      const newItem: MarketItem = {
        id: hub.location_code.toLowerCase(),
        name: hub.name,
        country: hub.country,
        country_code: hub.country_code,
        location_code: hub.location_code,
        region: hub.region,
        potential: "High potential",
        description: hub.subcultures,
        flag: hub.flag,
        color: "from-indigo-500/15 via-purple-500/10 to-transparent",
      };
      setSelectedMarkets([...selectedMarkets, newItem]);
    }
  };

  // Add custom free-text market
  const handleAddCustomMarket = async () => {
    const query = customMarketText.trim();
    if (!query) return;

    try {
      setSearchingMarket(true);
      const res = await api.searchLocations(query);
      const loc = res?.[0];

      const newItem: MarketItem = {
        id: (loc?.location_code || query).toLowerCase().replace(/\s+/g, "-"),
        name: loc?.name || query,
        country: loc?.country || "International",
        country_code: loc?.country_code || "INT",
        location_code: loc?.location_code || `INT-${query.slice(0, 3).toUpperCase()}`,
        region: loc?.region || "Global",
        potential: "High potential",
        description: loc?.description || `Cultural epicenter in ${loc?.country || query}`,
        flag: loc?.flag || "🌐",
        color: "from-indigo-500/15 via-purple-500/10 to-transparent",
      };

      if (!selectedMarkets.some((m) => m.name.toLowerCase() === newItem.name.toLowerCase())) {
        setSelectedMarkets([...selectedMarkets, newItem]);
      }
      setCustomMarketText("");
    } catch {
      // Fallback
      const newItem: MarketItem = {
        id: `custom-${query.toLowerCase().replace(/\s+/g, "-")}`,
        name: query,
        country: "International",
        country_code: "INT",
        location_code: `INT-${query.slice(0, 3).toUpperCase()}`,
        region: "Global",
        potential: "High potential",
        description: `Custom cultural epicenter: ${query}`,
        flag: "🌐",
        color: "from-indigo-500/15 via-purple-500/10 to-transparent",
      };
      setSelectedMarkets([...selectedMarkets, newItem]);
      setCustomMarketText("");
    } finally {
      setSearchingMarket(false);
    }
  };

  // Handle step 2 confirm
  const handleConfirmMarkets = () => {
    if (selectedMarkets.length === 0) {
      // Default to Tokyo & Berlin if user just clicks continue
      const defaultTokyo = MARKET_HUBS[0];
      const defaultBerlin = MARKET_HUBS[2];
      setSelectedMarkets([
        {
          id: defaultTokyo.location_code.toLowerCase(),
          name: defaultTokyo.name,
          country: defaultTokyo.country,
          country_code: defaultTokyo.country_code,
          location_code: defaultTokyo.location_code,
          region: defaultTokyo.region,
          potential: "High potential",
          description: defaultTokyo.subcultures,
          flag: defaultTokyo.flag,
          color: "from-indigo-500/15 via-purple-500/10 to-transparent",
        },
        {
          id: defaultBerlin.location_code.toLowerCase(),
          name: defaultBerlin.name,
          country: defaultBerlin.country,
          country_code: defaultBerlin.country_code,
          location_code: defaultBerlin.location_code,
          region: defaultBerlin.region,
          potential: "High potential",
          description: defaultBerlin.subcultures,
          flag: defaultBerlin.flag,
          color: "from-indigo-500/15 via-purple-500/10 to-transparent",
        },
      ]);
    }

    setHistory((prev) => [
      ...prev.filter((h) => h.step !== 2),
      {
        step: 2,
        question: "Which global cultural epicenters or cities do you want to evaluate?",
        answer: selectedMarkets.map((m) => `${m.flag} ${m.name}`).join(", ") || "Tokyo, Berlin",
      },
    ]);

    setCurrentStep(3);
  };

  // Handle step 3 confirm (Goals & Strategy)
  const handleConfirmGoals = (customG?: string, customTimeline?: string, customPos?: "Premium" | "Mid-market" | "Budget-friendly") => {
    const finalGoal = customG || customGoalText.trim() || primaryGoal || "Flagship Retail Store Opening";
    const finalTimeline = customTimeline || launchTimeline || "Q3 2026 (6-9 Months)";
    const finalPos = customPos || productPositioning || "Premium";

    setPrimaryGoal(finalGoal);
    setLaunchTimeline(finalTimeline);
    setProductPositioning(finalPos);

    setHistory((prev) => [
      ...prev.filter((h) => h.step !== 3),
      {
        step: 3,
        question: "What is your primary commercial strategy and launch horizon?",
        answer: `${finalGoal} • ${finalTimeline} (${finalPos})`,
      },
    ]);

    setCurrentStep(4);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 shadow-lg text-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold tracking-tight">
                AI Cultural Strategy Auto-Pilot
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                Autonomous
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Conversational strategist with 1-click option chips, free-text inputs, and live Qloo taste graph synthesis.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <button
            onClick={onSwitchToManual}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Switch to Manual Wizard</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Conversation Feed (Left) & Live Strategy Blueprint (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Conversational Interviewer (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Previous Answered History Pills */}
          {history.length > 0 && (
            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.step}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 font-medium">{h.question}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{h.answer}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(h.step)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    title="Edit answer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Active Question Panel */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
            {/* Step 0: Brand & Concept */}
            {currentStep === 0 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Question 1 of 4 • Brand & Concept</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    What brand or concept are you planning to expand?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click a 1-tap recommendation chip below, or type ANY brand name and category freely into the input.
                  </p>
                </div>

                {/* 1-Click Option Chips on Top */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Popular Strategic Presets (1-Click Fill):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {BRAND_SUGGESTIONS.map((b) => (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => {
                          setCustomBrandText(b.name);
                          setCustomCategoryText(b.category);
                          setProductPositioning(b.positioning);
                          setDescription(b.description);
                          setTags(b.tags);
                          setAudienceName(b.suggestedPersona);
                          setSelectedInterests(b.suggestedInterests);
                          handleConfirmBrand(b.name, b.category, b.description);
                        }}
                        className="p-3 text-left rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all text-xs space-y-1 group"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          <span>{b.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {b.positioning}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{b.category}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {b.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Free Text Input Form */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Or Type Any Custom Brand / Concept:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                        Brand Name
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={customBrandText}
                        onChange={(e) => setCustomBrandText(e.target.value)}
                        placeholder="e.g., Jacquemus, Rapha, Local Specialty..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirmBrand();
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                        Category / Industry
                      </label>
                      <input
                        type="text"
                        value={customCategoryText}
                        onChange={(e) => setCustomCategoryText(e.target.value)}
                        placeholder="e.g., Luxury Fashion, Third-Wave Coffee..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirmBrand();
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmBrand()}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <span>Confirm & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Cultural Demographic & Persona */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <Users className="w-4 h-4" />
                    <span>Question 2 of 4 • Audience & Persona</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Which cultural demographic and lifestyle cohort should we target?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a curated cultural cohort chip, or type your exact audience persona in free-text.
                  </p>
                </div>

                {/* 1-Click Persona Chips on Top */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Curated Cultural Cohort Chips (1-Click Fill):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PERSONA_SUGGESTIONS.map((p) => (
                      <button
                        key={p.title}
                        type="button"
                        onClick={() => {
                          setCustomPersonaText(p.title);
                          setAgeRange(p.age);
                          setIncomeLevel(p.income);
                          setSelectedInterests(p.interests);
                          handleConfirmAudience(p.title, p.interests);
                        }}
                        className="p-3 text-left rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all text-xs space-y-1.5 group"
                      >
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {p.title}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {p.desc}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.interests.map((int, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {int}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Free Text Input Form */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Or Type Any Custom Audience Persona:
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      Target Audience Persona / Cohort Description
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={customPersonaText}
                      onChange={(e) => setCustomPersonaText(e.target.value)}
                      placeholder="e.g., Underground techno producers, Eco-conscious architects, Gen Z gamers..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirmAudience();
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmAudience()}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <span>Confirm & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Candidate Cultural Epicenters & Markets */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <Globe2 className="w-4 h-4" />
                    <span>Question 3 of 4 • Cultural Epicenters & Markets</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Which global cultural epicenters or cities do you want to evaluate?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click 1-tap city chips to select multiple candidate markets, or type ANY world city into the dynamic resolver.
                  </p>
                </div>

                {/* 1-Click Market Hub Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Recommended Global Epicenters (Click to Toggle):</span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      {selectedMarkets.length} Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {MARKET_HUBS.map((hub) => {
                      const isSelected = selectedMarkets.some(
                        (m) => m.name.toLowerCase() === hub.name.toLowerCase()
                      );

                      return (
                        <button
                          key={hub.name}
                          type="button"
                          onClick={() => handleToggleMarket(hub)}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between space-y-1 relative group",
                            isSelected
                              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-xs"
                              : "border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-400"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xl" role="img" aria-label={hub.country}>
                              {hub.flag}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {hub.name}
                            </div>
                            <div className="text-[10px] text-slate-400">{hub.country}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Free Text World City Resolver */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Or Type Any World City / Country:
                  </div>

                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={customMarketText}
                        onChange={(e) => setCustomMarketText(e.target.value)}
                        placeholder="Type city or country: e.g., Amsterdam, Melbourne, Stockholm, Dubai..."
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddCustomMarket();
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomMarket}
                      disabled={searchingMarket || !customMarketText.trim()}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-900 disabled:opacity-50 flex items-center space-x-1"
                    >
                      {searchingMarket ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Selected Markets Tag Bar */}
                  {selectedMarkets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {selectedMarkets.map((m) => (
                        <span
                          key={m.id || m.name}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          <span>{m.flag || "🌐"}</span>
                          <span>{m.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMarkets(
                                selectedMarkets.filter((x) => x.name !== m.name)
                              )
                            }
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmMarkets}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <span>Confirm & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Strategic Goals & Timeline */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <Target className="w-4 h-4" />
                    <span>Question 4 of 4 • Strategy & Launch Horizon</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    What is your primary commercial strategy and launch horizon?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a strategic deployment objective chip, or specify custom milestones in free-text.
                  </p>
                </div>

                {/* 1-Click Goal Chips on Top */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Strategic Objective Chips (1-Click Fill):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {GOAL_SUGGESTIONS.map((g) => (
                      <button
                        key={g.goal}
                        type="button"
                        onClick={() => {
                          setCustomGoalText(g.goal);
                          setLaunchTimeline(g.timeline);
                          setProductPositioning(g.positioning);
                          handleConfirmGoals(g.goal, g.timeline, g.positioning);
                        }}
                        className="p-3 text-left rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all text-xs space-y-1.5 group"
                      >
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {g.goal}
                        </div>
                        <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                          {g.timeline}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {g.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Free Text Input Form */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Or Type Any Custom Strategic Goal:
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                      Custom Objective / Campaign Directive
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={customGoalText}
                      onChange={(e) => setCustomGoalText(e.target.value)}
                      placeholder="e.g., Capsule collection pop-up with local electronic music label..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirmGoals();
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmGoals()}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <span>Review Executive Blueprint</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Final Blueprint Overview & Ready to Launch */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Configuration Complete • Ready for Multi-Agent Execution</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Autonomous Cultural Intelligence Blueprint
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review your synthesized strategy parameters. Click the launch button below to execute the 10-node agent DAG.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Brand & Industry</span>
                      <strong className="text-slate-800 dark:text-slate-200">{brandName}</strong> ({category})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Positioning</span>
                      <strong className="text-slate-800 dark:text-slate-200">{productPositioning}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Cohort</span>
                      <strong className="text-slate-800 dark:text-slate-200">{audienceName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Horizon & Goal</span>
                      <strong className="text-slate-800 dark:text-slate-200">{primaryGoal}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                      Candidate Evaluation Markets ({selectedMarkets.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMarkets.map((m) => (
                        <span
                          key={m.id || m.name}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        >
                          <span>{m.flag || "🌐"}</span>
                          <span>{m.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Goals</span>
                  </button>

                  <button
                    type="button"
                    onClick={onLaunch}
                    disabled={loading}
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Launching Agent Execution...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>🚀 Auto-Create & Launch Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Strategy Blueprint Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 sticky top-6">
          <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-time Strategy Blueprint
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                Live Synthesis
              </span>
            </div>

            {/* Brand & Sector */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Brand Identity & Sector
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {brandName || "Brand Name Pending"}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {category || "Lifestyle"}
                </span>
              </div>
              {description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {/* Persona & Vibe */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Target Cultural Demographic
              </div>
              <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                {audienceName || "Urban Cultural Tastemakers"}
              </div>
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedInterests.map((int, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800"
                    >
                      {int}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Candidate Evaluation Hubs */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <span>Candidate Markets ({selectedMarkets.length})</span>
                <span>Jev Posture</span>
              </div>

              {selectedMarkets.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400 italic">
                  No candidate markets selected yet
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedMarkets.map((m) => (
                    <div
                      key={m.id || m.name}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-base" role="img" aria-label={m.country}>
                          {m.flag || "🌐"}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{m.country}</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Gate Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Qloo Query Vectors Preview */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Qloo Taste Graph Vectors
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 truncate">
                  • brand_affinity
                </div>
                <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 truncate">
                  • audience_overlap
                </div>
                <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 truncate">
                  • category_density
                </div>
                <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 truncate">
                  • subculture_momentum
                </div>
              </div>
            </div>

            {/* Direct Launch Action Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onLaunch}
                disabled={loading || selectedMarkets.length === 0}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-400/20 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Launching Analysis DAG...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>🚀 Auto-Create & Launch Analysis</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Creates project record and immediately triggers 10-node agent DAG
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
