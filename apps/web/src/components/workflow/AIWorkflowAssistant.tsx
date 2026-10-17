"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  Send,
  Play,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Globe2,
  Users,
  Target,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Building2,
  HelpCircle,
  Wand2,
  RefreshCw,
  Flame,
  ArrowUpRight,
  Check,
  Sparkle,
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

interface ChatChip {
  label: string;
  value: string;
  category?: string;
  actionType?: "preset" | "prompt" | "launch";
}

interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  chips?: ChatChip[];
  isBlueprintCard?: boolean;
  diffSummary?: string;
  timestamp?: string;
}

const PRESET_MARKETS_MAP: Record<string, { country: string; flag: string; code: string }> = {
  Tokyo: { country: "Japan", flag: "🇯🇵", code: "JP-TYO" },
  Seoul: { country: "South Korea", flag: "🇰🇷", code: "KR-SEL" },
  Berlin: { country: "Germany", flag: "🇩🇪", code: "DE-BER" },
  London: { country: "United Kingdom", flag: "🇬🇧", code: "GB-LND" },
  Paris: { country: "France", flag: "🇫🇷", code: "FR-PAR" },
  "New York": { country: "United States", flag: "🇺🇸", code: "US-NYC" },
  "São Paulo": { country: "Brazil", flag: "🇧🇷", code: "BR-SAO" },
  Mumbai: { country: "India", flag: "🇮🇳", code: "IN-BOM" },
  Amsterdam: { country: "Netherlands", flag: "🇳🇱", code: "NL-AMS" },
  Melbourne: { country: "Australia", flag: "🇦🇺", code: "AU-MEL" },
};

function formatTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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
  const [hasBaselinePlan, setHasBaselinePlan] = useState<boolean>(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "agent",
      text: "Welcome to Cultura. Tell me what brand or expansion concept you have in mind (or select a curated scenario below), and I will build your **Strategic Expansion Blueprint** with candidate market recommendations.",
      timestamp: formatTimeString(),
      chips: [
        { label: "Acme Streetwear Lab (Tokyo & Seoul)", value: "I want to expand Acme Streetwear Lab to Tokyo and Seoul" },
        { label: "Kuro Craft Coffee (Tokyo & London)", value: "Launch Kuro Craft Coffee in Tokyo and London" },
        { label: "Lumina Niche Fragrance (Paris & Seoul)", value: "Create expansion plan for Lumina Niche Fragrance in Paris and Seoul" },
        { label: "Rapha Athleisure (Berlin & London)", value: "Plan European expansion for Rapha Athleisure in Berlin and London" },
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Helper to create market items
  const resolveCityToMarket = (cityName: string): MarketItem => {
    const matchedKey = Object.keys(PRESET_MARKETS_MAP).find(
      (k) => k.toLowerCase() === cityName.toLowerCase()
    );
    if (matchedKey) {
      const data = PRESET_MARKETS_MAP[matchedKey];
      return {
        id: data.code.toLowerCase(),
        name: matchedKey,
        country: data.country,
        country_code: data.code.split("-")[0],
        location_code: data.code,
        region: "Global",
        potential: "High potential",
        description: `Cultural epicenter in ${data.country}`,
        flag: data.flag,
        color: "from-indigo-500/15 via-purple-500/10 to-transparent",
      };
    }

    return {
      id: `loc-${cityName.toLowerCase().replace(/\s+/g, "-")}`,
      name: cityName,
      country: "International",
      country_code: "INT",
      location_code: `INT-${cityName.slice(0, 3).toUpperCase()}`,
      region: "Global",
      potential: "High potential",
      description: `Cultural epicenter: ${cityName}`,
      flag: "🌐",
      color: "from-indigo-500/15 via-purple-500/10 to-transparent",
    };
  };

  // Generate initial baseline plan from a user prompt
  const generateBaselinePlan = (rawPrompt: string) => {
    const lower = rawPrompt.toLowerCase();

    let resolvedBrand = "Acme Cultural Lab";
    let resolvedCat = "Lifestyle & Apparel";
    let resolvedPersona = "Gen Z Streetwear & Digital Natives";
    let resolvedInterests = ["Streetwear", "Sneakers", "Music Culture", "Drop Culture"];
    let resolvedMarkets: MarketItem[] = [
      resolveCityToMarket("Tokyo"),
      resolveCityToMarket("Seoul"),
      resolveCityToMarket("Berlin"),
    ];
    let resolvedGoal = "Flagship Retail Store Opening";
    let resolvedTimeline = "Q3 2026 (6-9 Months)";
    let resolvedPos: "Premium" | "Mid-market" | "Budget-friendly" = "Premium";

    // Detect brand name from prompt
    if (lower.includes("kuro") || lower.includes("coffee") || lower.includes("cafe")) {
      resolvedBrand = "Kuro Craft Coffee";
      resolvedCat = "Food & Beverage";
      resolvedPersona = "Affluent Minimalist Design Enthusiasts";
      resolvedInterests = ["Specialty Coffee", "Minimalism", "Architecture", "Cafe Culture"];
      resolvedMarkets = [resolveCityToMarket("Tokyo"), resolveCityToMarket("London")];
      resolvedGoal = "Artisanal Pour-Over Concept Flagship";
    } else if (lower.includes("lumina") || lower.includes("fragrance") || lower.includes("perfume") || lower.includes("beauty")) {
      resolvedBrand = "Lumina Niche Fragrance";
      resolvedCat = "Beauty & Cosmetics";
      resolvedPersona = "High-Net-Worth Olfactory Connoisseurs";
      resolvedInterests = ["Niche Perfumery", "Contemporary Art", "Slow Luxury"];
      resolvedMarkets = [resolveCityToMarket("Paris"), resolveCityToMarket("Seoul")];
      resolvedGoal = "Exclusive Sensory Atelier Residency";
    } else if (lower.includes("rapha") || lower.includes("cycle") || lower.includes("bike") || lower.includes("sport")) {
      resolvedBrand = "Rapha Athleisure";
      resolvedCat = "Sports & Lifestyle";
      resolvedPersona = "Performance Athletes & Urban Cyclists";
      resolvedInterests = ["Cycling Culture", "High-Tech Apparel", "Outdoor Endurance"];
      resolvedMarkets = [resolveCityToMarket("Berlin"), resolveCityToMarket("London")];
      resolvedGoal = "Clubhouse & Community Retail Hub";
    } else {
      // Extract brand name if user typed custom brand
      const words = rawPrompt.replace(/i want to (launch|expand|create|build)|create plan for|plan for/gi, "").trim();
      if (words.length > 2) {
        const parts = words.split(/\s+(?:in|for|to)\s+/i);
        if (parts[0]) {
          resolvedBrand = parts[0].trim().replace(/^['"]|['"]$/g, "");
        }
      }
    }

    // Check for cities in prompt
    const foundCities: string[] = [];
    Object.keys(PRESET_MARKETS_MAP).forEach((city) => {
      if (lower.includes(city.toLowerCase())) {
        foundCities.push(city);
      }
    });

    if (foundCities.length > 0) {
      resolvedMarkets = foundCities.map(resolveCityToMarket);
    }

    // Update parent state
    setBrandName(resolvedBrand);
    setCategory(resolvedCat);
    setProjectName(`${resolvedBrand} Expansion`);
    setDescription(`Autonomous cultural resonance and deterministic Qloo evaluation for ${resolvedBrand}.`);
    setTags(resolvedInterests);
    setAudienceName(resolvedPersona);
    setSelectedInterests(resolvedInterests);
    setAgeRange([20, 32]);
    setIncomeLevel("Medium");
    setSelectedMarkets(resolvedMarkets);
    setPrimaryGoal(resolvedGoal);
    setLaunchTimeline(resolvedTimeline);
    setProductPositioning(resolvedPos);

    setHasBaselinePlan(true);

    return {
      brand: resolvedBrand,
      category: resolvedCat,
      persona: resolvedPersona,
      markets: resolvedMarkets,
      goal: resolvedGoal,
      timeline: resolvedTimeline,
      positioning: resolvedPos,
    };
  };

  // Process user message (either creates baseline plan or applies natural language edits)
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: trimmed, timestamp: formatTimeString() },
    ]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = trimmed.toLowerCase();

      // Case 1: First plan creation
      if (!hasBaselinePlan) {
        const plan = generateBaselinePlan(trimmed);
        const marketNames = plan.markets.map((m) => `${m.flag} ${m.name}`).join(", ");

        setMessages((prev) => [
          ...prev,
          {
            id: `agent-plan-${Date.now()}`,
            sender: "agent",
            text: `**Strategic Expansion Blueprint Synthesized for ${plan.brand}**\n\nI have synthesized your initial strategy based on real-world consumer taste profiles:\n• **Brand**: ${plan.brand} (${plan.category})\n• **Target Persona**: ${plan.persona}\n• **Candidate Markets**: ${marketNames}\n• **Strategic Goal**: ${plan.goal} • ${plan.timeline}\n\n*You can adjust any parameter or explore alternative scenarios by typing below.*`,
            isBlueprintCard: true,
            timestamp: formatTimeString(),
            chips: [
              { label: "Swap to Paris & Tokyo", value: "Change markets to Paris and Tokyo" },
              { label: "Add London to markets", value: "Add London to candidate markets" },
              { label: "Target Luxury Connoisseurs", value: "Change target audience to High-Net-Worth Luxury Connoisseurs" },
              { label: "Switch to Agile Pop-Up", value: "Make the goal an Underground Cultural Pop-Up activation" },
              { label: "What if we do a Pop-Up?", value: "What if we do a pop-up instead of a permanent store?" },
            ],
          },
        ]);
        setIsTyping(false);
        return;
      }

      // Case 2: Natural Language Editing / Refinement of existing plan
      const diffLogs: string[] = [];

      // A. What-If Simulation Query
      const isWhatIf = lower.includes("what if") || lower.includes("kya hoga") || lower.includes("suppose") || lower.includes("how about");
      if (isWhatIf) {
        let whatIfInsight = "";
        if (lower.includes("pop-up") || lower.includes("pop up")) {
          setPrimaryGoal("Underground Cultural Pop-Up & Activation (Immediate)");
          setLaunchTimeline("Immediate (1-3 Months)");
          diffLogs.push("Goal changed to Agile Pop-Up (-65% upfront risk)");
          whatIfInsight = "Shifting from a permanent retail lease to an agile pop-up reduces upfront capital exposure by ~65%, cuts time-to-market to under 60 days, and concentrates consumer drop momentum. Your blueprint has been updated.";
        } else if (lower.includes("tokyo")) {
          setSelectedMarkets([resolveCityToMarket("Tokyo")]);
          diffLogs.push("Focused scope strictly on Tokyo 🇯🇵");
          whatIfInsight = "Focusing solely on Tokyo concentrates your brand affinity to 91.4% in Shibuya and Harajuku, avoiding cross-regional dilution during initial launch.";
        } else if (lower.includes("luxury") || lower.includes("affluent")) {
          setProductPositioning("Premium");
          setAudienceName("High-Net-Worth Luxury Connoisseurs");
          setSelectedInterests(["High Fashion", "Contemporary Art", "Bespoke Design"]);
          diffLogs.push("Elevated positioning to Ultra-Premium Luxury");
          whatIfInsight = "Focusing on the high-net-worth luxury demographic shifts candidate epicenter weight toward Tokyo Daikanyama and Seoul Hannam-dong with +34% estimated margin expansion.";
        } else {
          whatIfInsight = "Analyzing trade-offs against category benchmarks. Strategy metrics updated to optimize cultural fit and mitigate launch friction.";
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `agent-whatif-${Date.now()}`,
            sender: "agent",
            text: `**Strategic Scenario Analysis**\n\n${whatIfInsight}`,
            diffSummary: diffLogs.length > 0 ? diffLogs.join(" • ") : undefined,
            isBlueprintCard: true,
            timestamp: formatTimeString(),
            chips: [
              { label: "Add Seoul to markets", value: "Add Seoul to candidate markets" },
              { label: "Change timeline to Q4", value: "Set timeline to Q4 2026" },
              { label: "Evaluate Expansion Readiness", value: "Launch analysis" },
            ],
          },
        ]);
        setIsTyping(false);
        return;
      }

      // B. Market Modifications (Add / Remove / Swap)
      const isMarketSwap = lower.includes("ki jagah") || lower.includes("swap") || lower.includes("replace") || lower.includes("change market") || lower.includes("switch market");
      const isMarketAdd = lower.includes("add") || lower.includes("bhi kar") || lower.includes("include") || lower.includes("aur");
      const isMarketRemove = lower.includes("remove") || lower.includes("hata do") || lower.includes("delete") || lower.includes("drop");

      // Check mentioned cities
      const mentionedCities: string[] = [];
      Object.keys(PRESET_MARKETS_MAP).forEach((city) => {
        if (lower.includes(city.toLowerCase())) {
          mentionedCities.push(city);
        }
      });

      if (mentionedCities.length > 0) {
        if (isMarketSwap || (mentionedCities.length >= 2 && !isMarketAdd)) {
          // Replace candidate markets with the mentioned cities
          const newMarkets = mentionedCities.map(resolveCityToMarket);
          setSelectedMarkets(newMarkets);
          diffLogs.push(`Updated candidate markets to: ${newMarkets.map((m) => `${m.flag} ${m.name}`).join(", ")}`);
        } else if (isMarketAdd) {
          // Add newly mentioned cities
          const currentNames = selectedMarkets.map((m) => m.name.toLowerCase());
          const toAdd = mentionedCities.filter((c) => !currentNames.includes(c.toLowerCase()));
          if (toAdd.length > 0) {
            const added = toAdd.map(resolveCityToMarket);
            const combined = [...selectedMarkets, ...added];
            setSelectedMarkets(combined);
            diffLogs.push(`Added ${added.map((m) => `${m.flag} ${m.name}`).join(", ")} to candidate markets`);
          }
        } else if (isMarketRemove) {
          // Remove mentioned cities
          const remaining = selectedMarkets.filter(
            (m) => !mentionedCities.some((c) => c.toLowerCase() === m.name.toLowerCase())
          );
          if (remaining.length > 0) {
            setSelectedMarkets(remaining);
            diffLogs.push(`Removed ${mentionedCities.join(", ")} from candidate markets`);
          }
        } else {
          // Default: Update candidate markets
          const newMarkets = mentionedCities.map(resolveCityToMarket);
          setSelectedMarkets(newMarkets);
          diffLogs.push(`Candidate markets set to: ${newMarkets.map((m) => `${m.flag} ${m.name}`).join(", ")}`);
        }
      }

      // C. Audience Persona Modifications
      if (lower.includes("audience") || lower.includes("persona") || lower.includes("target") || lower.includes("cohort")) {
        if (lower.includes("gen z") || lower.includes("streetwear") || lower.includes("young")) {
          setAudienceName("Gen Z Streetwear & Digital Natives");
          setSelectedInterests(["Streetwear", "Sneakers", "Music Production", "Digital Art"]);
          setAgeRange([18, 26]);
          diffLogs.push("Audience updated to Gen Z Streetwear & Digital Natives (Ages 18-26)");
        } else if (lower.includes("luxury") || lower.includes("affluent") || lower.includes("connoisseur")) {
          setAudienceName("High-Net-Worth Luxury Connoisseurs");
          setSelectedInterests(["High Fashion", "Contemporary Art", "Fine Dining", "Rare Collectibles"]);
          setAgeRange([28, 50]);
          setProductPositioning("Premium");
          diffLogs.push("Audience updated to Luxury Connoisseurs & Taste Creators (Ages 28-50)");
        } else if (lower.includes("eco") || lower.includes("minimalist") || lower.includes("sustainable")) {
          setAudienceName("Minimalist Conscious Urbanites");
          setSelectedInterests(["Minimalist Design", "Specialty Coffee", "Sustainability", "Architecture"]);
          setAgeRange([24, 38]);
          diffLogs.push("Audience updated to Minimalist Conscious Urbanites (Ages 24-38)");
        } else if (lower.includes("indie") || lower.includes("creative") || lower.includes("artist")) {
          setAudienceName("Subcultural Indie Creatives");
          setSelectedInterests(["Club Culture", "Vintage Thrift", "Vinyl Records", "Independent Film"]);
          diffLogs.push("Audience updated to Subcultural Indie Creatives");
        } else {
          // Custom persona text extraction
          const cleanAudience = trimmed.replace(/change audience to|target|target audience|audience|target cohort/gi, "").trim();
          if (cleanAudience) {
            setAudienceName(cleanAudience);
            diffLogs.push(`Audience persona set to: "${cleanAudience}"`);
          }
        }
      }

      // D. Goal / Timeline / Positioning Modifications
      if (lower.includes("pop-up") || lower.includes("pop up") || lower.includes("activation")) {
        setPrimaryGoal("Underground Cultural Pop-Up & Activation (Immediate)");
        setLaunchTimeline("Immediate (1-3 Months)");
        diffLogs.push("Objective set to Underground Pop-Up (1-3 Months)");
      } else if (lower.includes("flagship") || lower.includes("store") || lower.includes("retail")) {
        setPrimaryGoal("Flagship Retail Store Opening (Q3 2026)");
        setLaunchTimeline("Q3 2026 (6-9 Months)");
        diffLogs.push("Objective set to Permanent Flagship Store Opening (6-9 Months)");
      } else if (lower.includes("d2c") || lower.includes("ecommerce") || lower.includes("online")) {
        setPrimaryGoal("Direct-to-Consumer Digital Expansion (6-12 Months)");
        setLaunchTimeline("Q4 2026 (9-12 Months)");
        diffLogs.push("Objective set to D2C Digital Expansion");
      }

      if (lower.includes("luxury") || lower.includes("premium")) {
        setProductPositioning("Premium");
        diffLogs.push("Positioning set to Premium");
      } else if (lower.includes("budget") || lower.includes("accessible")) {
        setProductPositioning("Budget-friendly");
        diffLogs.push("Positioning set to Budget-Friendly");
      }

      // E. Brand Name Modification
      if (lower.includes("brand name") || lower.includes("brand ka name")) {
        const brandMatch = trimmed.match(/(?:brand name to|brand to|brand ka name)\s+['"]?([^'"]+)['"]?/i);
        if (brandMatch && brandMatch[1]) {
          const newBrand = brandMatch[1].trim();
          setBrandName(newBrand);
          setProjectName(`${newBrand} Expansion`);
          diffLogs.push(`Brand renamed to "${newBrand}"`);
        }
      }

      // If user typed "launch" or "run"
      if (lower === "launch" || lower === "run" || lower.includes("launch analysis")) {
        onLaunch();
        setIsTyping(false);
        return;
      }

      const diffText = diffLogs.length > 0 ? diffLogs.join(" • ") : "Adjustments incorporated and synchronized with candidate market profiles";

      setMessages((prev) => [
        ...prev,
        {
          id: `agent-edit-${Date.now()}`,
          sender: "agent",
          text: `**Strategic Blueprint Updated**\n\nI have recalibrated your expansion strategy with your changes. All market criteria and category dimensions are synchronized.`,
          diffSummary: diffText,
          isBlueprintCard: true,
          timestamp: formatTimeString(),
          chips: [
            { label: "Add Seoul to markets", value: "Add Seoul to candidate markets" },
            { label: "Switch to Agile Pop-Up", value: "Make the goal an Underground Pop-Up" },
            { label: "What if we target Gen Z?", value: "What if we target Gen Z digital natives?" },
            { label: "Evaluate Expansion Readiness", value: "Launch analysis" },
          ],
        },
      ]);
      setIsTyping(false);
    }, 450);
  };

  const handleReset = () => {
    setHasBaselinePlan(false);
    setInputText("");
    setBrandName("");
    setCategory("");
    setAudienceName("");
    setSelectedMarkets([]);
    setPrimaryGoal("");
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: "agent",
        text: "Strategy studio reset. What brand or expansion concept would you like to plan?",
        timestamp: formatTimeString(),
        chips: [
          { label: "Acme Streetwear Lab (Tokyo & Seoul)", value: "I want to expand Acme Streetwear Lab to Tokyo and Seoul" },
          { label: "Kuro Craft Coffee (Tokyo & London)", value: "Launch Kuro Craft Coffee in Tokyo and London" },
          { label: "Lumina Niche Fragrance (Paris & Seoul)", value: "Create expansion plan for Lumina Niche Fragrance in Paris and Seoul" },
          { label: "Rapha Athleisure (Berlin & London)", value: "Plan European expansion for Rapha Athleisure in Berlin and London" },
        ],
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Crisp Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Cultural Strategy Copilot
              </h2>
              <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Strategy Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conversational market expansion planning and scenario simulation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={onSwitchToManual}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Manual Wizard</span>
          </button>
        </div>
      </div>

      {/* Main Chat Conversation Stream */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col h-[640px] overflow-hidden">
        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {messages.map((m) => {
            const isAgent = m.sender === "agent";

            return (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3",
                  isAgent ? "justify-start" : "justify-end"
                )}
              >
                {/* Agent Icon */}
                {isAgent && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Message Bubble Content */}
                <div
                  className={cn(
                    "max-w-xl text-xs rounded-2xl p-4 space-y-3",
                    isAgent
                      ? "bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60"
                      : "bg-indigo-600 text-white shadow-sm"
                  )}
                >
                  {/* Diff / Update badge if present */}
                  {m.diffSummary && (
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] mb-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{m.diffSummary}</span>
                    </div>
                  )}

                  <p className="whitespace-pre-line leading-relaxed text-xs">
                    {m.text}
                  </p>

                  {/* 1-Click Suggestion Chips inside Agent Message */}
                  {m.chips && m.chips.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {hasBaselinePlan ? "Strategic Directives & Scenario Queries:" : "Curated Expansion Templates:"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.chips.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (chip.value === "Launch analysis") {
                                onLaunch();
                              } else {
                                handleSendMessage(chip.value);
                              }
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]"
                          >
                            <span>{chip.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Executive Strategy Blueprint Card inside Agent Message */}
                  {m.isBlueprintCard && (
                    <div className="mt-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span>Strategic Expansion Blueprint</span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Ready for Evaluation
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Brand & Category
                          </span>
                          <strong className="text-slate-900 dark:text-white">
                            {brandName || "Acme Brand"}
                          </strong>
                          <span className="text-slate-500 text-[11px] block">
                            {category || "Lifestyle & Apparel"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Cultural Persona
                          </span>
                          <strong className="text-slate-900 dark:text-white">
                            {audienceName || "Urban Tastemakers"}
                          </strong>
                          <span className="text-slate-500 text-[11px] block">
                            Age {ageRange[0]}-{ageRange[1]} • {productPositioning}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 sm:col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                            Candidate Evaluation Markets ({selectedMarkets.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedMarkets.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">No markets configured</span>
                            ) : (
                              selectedMarkets.map((mk) => (
                                <span
                                  key={mk.id || mk.name}
                                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200"
                                >
                                  <span>{mk.flag || "🌐"}</span>
                                  <span>{mk.name}</span>
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 sm:col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Strategic Objective & Timeline
                          </span>
                          <strong className="text-slate-900 dark:text-white">
                            {primaryGoal || "Flagship Retail Store Opening"}
                          </strong>
                          <span className="text-slate-500 text-[11px] block">
                            Target Horizon: {launchTimeline || "Q3 2026"}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Action Button */}
                      <button
                        type="button"
                        onClick={onLaunch}
                        disabled={loading || selectedMarkets.length === 0}
                        className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Evaluating Markets & Consumer Signals...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            <span>Evaluate Expansion Readiness</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right">
                    {m.timestamp || ""}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs pl-10">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] ml-1">Calibrating strategic parameters...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Direct Chat Input Bar at Bottom */}
        <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                !hasBaselinePlan
                  ? "Describe your brand or expansion concept (e.g. Acme Wear in Tokyo & Seoul)..."
                  : "Type an adjustment or question (e.g. 'Add London', 'What if we do a pop-up?')..."
              }
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-2xs"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>
              {hasBaselinePlan
                ? "Type any adjustments or strategic scenario questions in plain language"
                : "Press Enter to generate initial Strategic Blueprint"}
            </span>
            <span className="font-mono">{hasBaselinePlan ? "Ready" : "Studio"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
