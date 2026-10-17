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
  meta?: any;
}

interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  chips?: ChatChip[];
  isBlueprintCard?: boolean;
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
  // Step tracker: 0 = Brand, 1 = Audience, 2 = Markets, 3 = Goals, 4 = Complete
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "agent",
      text: "Hello! I am your AI Cultural Strategy Copilot.\n\nLet's design your global market expansion. First question:\n**What brand, product, or concept are you expanding?**",
      chips: [
        { label: "⚡ Acme Streetwear Lab", value: "Acme Streetwear Lab", category: "Fashion & Apparel" },
        { label: "⚡ Kuro Craft Coffee", value: "Kuro Craft Coffee", category: "Food & Beverage" },
        { label: "⚡ Lumina Niche Fragrance", value: "Lumina Niche Fragrance", category: "Beauty & Cosmetics" },
        { label: "⚡ Rapha Athleisure", value: "Rapha Athleisure", category: "Sports & Lifestyle" },
        { label: "⚡ Terra Circular Goods", value: "Terra Circular Goods", category: "Home & Lifestyle" },
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
  }, [currentStep]);

  // Process user input for current step
  const handleProcessAnswer = async (answer: string, chipCategory?: string) => {
    const trimmed = answer.trim();
    if (!trimmed) return;

    // Append user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: trimmed },
    ]);
    setInputText("");
    setIsTyping(true);

    // Simulate natural AI thinking delay (400ms)
    setTimeout(async () => {
      if (currentStep === 0) {
        // Step 0 -> Brand Answered
        const detectedBrand = trimmed;
        const detectedCat = chipCategory || category || "Lifestyle & Apparel";
        setBrandName(detectedBrand);
        setCategory(detectedCat);
        setProjectName(`${detectedBrand} Global Expansion`);
        setDescription(`Cultural resonance and empirical market expansion analysis for ${detectedBrand}.`);
        setTags(["Streetwear", "Culture", "Expansion"]);

        setMessages((prev) => [
          ...prev,
          {
            id: `agent-step-1`,
            sender: "agent",
            text: `Understood! We are designing the cultural expansion for **${detectedBrand}** (${detectedCat}).\n\nNext question:\n**Who is your primary target cultural audience or demographic persona?**`,
            chips: [
              { label: "⚡ Gen Z Streetwear & Digital Natives", value: "Gen Z Streetwear & Digital Natives" },
              { label: "⚡ Minimalist Conscious Urbanites", value: "Minimalist Conscious Urbanites" },
              { label: "⚡ Luxury Connoisseurs & Taste Creators", value: "Luxury Connoisseurs & Taste Creators" },
              { label: "⚡ Subcultural Indie Creatives", value: "Subcultural Indie Creatives" },
            ],
          },
        ]);
        setCurrentStep(1);
        setIsTyping(false);
      } else if (currentStep === 1) {
        // Step 1 -> Audience Answered
        const detectedAudience = trimmed;
        setAudienceName(detectedAudience);
        setSelectedInterests(["Streetwear", "Specialty Coffee", "Music Culture", "Contemporary Art"]);
        setAgeRange([20, 32]);
        setIncomeLevel("Medium");

        setMessages((prev) => [
          ...prev,
          {
            id: `agent-step-2`,
            sender: "agent",
            text: `Target audience set to **${detectedAudience}**.\n\nNow for candidate geography:\n**Which global cultural epicenters or cities do you want to evaluate?**\nClick below to add top hubs, or type any world city/country.`,
            chips: [
              { label: "🇯🇵 Tokyo & 🇩🇪 Berlin", value: "Tokyo, Berlin" },
              { label: "🇯🇵 Tokyo, 🇰🇷 Seoul & 🇬🇧 London", value: "Tokyo, Seoul, London" },
              { label: "🇫🇷 Paris & 🇺🇸 New York", value: "Paris, New York" },
              { label: "🇧🇷 São Paulo & 🇮🇳 Mumbai", value: "São Paulo, Mumbai" },
            ],
          },
        ]);
        setCurrentStep(2);
        setIsTyping(false);
      } else if (currentStep === 2) {
        // Step 2 -> Markets Answered
        const rawCities = trimmed.split(/[,+&]|\band\b/).map((s) => s.trim()).filter(Boolean);
        const resolvedList: MarketItem[] = [];

        for (const city of rawCities) {
          const matched = Object.keys(PRESET_MARKETS_MAP).find(
            (k) => k.toLowerCase() === city.toLowerCase()
          );
          if (matched) {
            const data = PRESET_MARKETS_MAP[matched];
            resolvedList.push({
              id: data.code.toLowerCase(),
              name: matched,
              country: data.country,
              country_code: data.code.split("-")[0],
              location_code: data.code,
              region: "Global",
              potential: "High potential",
              description: `Cultural epicenter in ${data.country}`,
              flag: data.flag,
              color: "from-indigo-500/15 via-purple-500/10 to-transparent",
            });
          } else {
            // Dynamic world city fallback
            try {
              const res = await api.searchLocations(city);
              const loc = res?.[0];
              resolvedList.push({
                id: (loc?.location_code || city).toLowerCase().replace(/\s+/g, "-"),
                name: loc?.name || city,
                country: loc?.country || "International",
                country_code: loc?.country_code || "INT",
                location_code: loc?.location_code || `INT-${city.slice(0, 3).toUpperCase()}`,
                region: loc?.region || "Global",
                potential: "High potential",
                description: loc?.description || `Cultural epicenter: ${city}`,
                flag: loc?.flag || "🌐",
                color: "from-indigo-500/15 via-purple-500/10 to-transparent",
              });
            } catch {
              resolvedList.push({
                id: `loc-${city.toLowerCase()}`,
                name: city,
                country: "International",
                country_code: "INT",
                location_code: `INT-${city.slice(0, 3).toUpperCase()}`,
                region: "Global",
                potential: "High potential",
                description: `Cultural epicenter: ${city}`,
                flag: "🌐",
                color: "from-indigo-500/15 via-purple-500/10 to-transparent",
              });
            }
          }
        }

        const finalList = resolvedList.length > 0 ? resolvedList : [
          {
            id: "jp-tyo",
            name: "Tokyo",
            country: "Japan",
            country_code: "JP",
            location_code: "JP-TYO",
            region: "Asia",
            potential: "High potential",
            description: "Streetwear & youth culture hub",
            flag: "🇯🇵",
            color: "from-rose-500/15 to-transparent",
          },
          {
            id: "de-ber",
            name: "Berlin",
            country: "Germany",
            country_code: "DE",
            location_code: "DE-BER",
            region: "Europe",
            potential: "High potential",
            description: "Electronic music & counter-culture",
            flag: "🇩🇪",
            color: "from-indigo-500/15 to-transparent",
          },
        ];

        setSelectedMarkets(finalList);

        const marketNamesWithFlags = finalList.map((m) => `${m.flag} ${m.name}`).join(", ");

        setMessages((prev) => [
          ...prev,
          {
            id: `agent-step-3`,
            sender: "agent",
            text: `Candidate markets registered: **${marketNamesWithFlags}**.\n\nFinal question:\n**What is your primary commercial strategy and launch horizon?**`,
            chips: [
              { label: "⚡ Flagship Retail Store (6-9 Mo)", value: "Flagship Retail Store Opening (Q3 2026)" },
              { label: "⚡ Underground Pop-Up (1-3 Mo)", value: "Underground Cultural Pop-Up & Activation (Immediate)" },
              { label: "⚡ D2C / E-Commerce Expansion", value: "Direct-to-Consumer Digital Expansion (6-12 Mo)" },
              { label: "⚡ Brand Collab & Limited Drops", value: "Brand Collaboration & Co-Created Drops" },
            ],
          },
        ]);
        setCurrentStep(3);
        setIsTyping(false);
      } else if (currentStep === 3 || currentStep >= 4) {
        // Step 3 -> Strategy Answered
        const detectedGoal = trimmed;
        setPrimaryGoal(detectedGoal);
        setLaunchTimeline("Q3 2026");
        setProductPositioning("Premium");

        setMessages((prev) => [
          ...prev,
          {
            id: `agent-step-blueprint`,
            sender: "agent",
            text: `Everything is synthesized! Here is your **Executive Cultural Strategy Blueprint**. All parameters are validated and ready for the multi-agent pipeline.`,
            isBlueprintCard: true,
          },
        ]);
        setCurrentStep(4);
        setIsTyping(false);
      }
    }, 450);
  };

  const handleResetChat = () => {
    setCurrentStep(0);
    setInputText("");
    setBrandName("");
    setCategory("");
    setAudienceName("");
    setSelectedMarkets([]);
    setPrimaryGoal("");
    setMessages([
      {
        id: "msg-welcome-reset",
        sender: "agent",
        text: "Chat reset! Let's start fresh.\n\n**What brand, product, or concept are you expanding?**",
        chips: [
          { label: "⚡ Acme Streetwear Lab", value: "Acme Streetwear Lab", category: "Fashion & Apparel" },
          { label: "⚡ Kuro Craft Coffee", value: "Kuro Craft Coffee", category: "Food & Beverage" },
          { label: "⚡ Lumina Niche Fragrance", value: "Lumina Niche Fragrance", category: "Beauty & Cosmetics" },
          { label: "⚡ Rapha Athleisure", value: "Rapha Athleisure", category: "Sports & Lifestyle" },
          { label: "⚡ Terra Circular Goods", value: "Terra Circular Goods", category: "Home & Lifestyle" },
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
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Cultural Strategy Copilot
              </h2>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive conversational setup with live Qloo taste graph integration
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetChat}
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
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col h-[620px] overflow-hidden">
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
                  <p className="whitespace-pre-line leading-relaxed text-xs">
                    {m.text}
                  </p>

                  {/* 1-Click Suggestion Chips inside Agent Message */}
                  {m.chips && m.chips.length > 0 && currentStep < 4 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Quick 1-Click Suggestions:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.chips.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleProcessAnswer(chip.value, chip.category)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]"
                          >
                            <span>{chip.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Executive Blueprint Card inside Final Agent Message */}
                  {m.isBlueprintCard && (
                    <div className="mt-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span>Ready for Execution</span>
                        </div>
                        <span className="font-mono text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          10-Node Pipeline
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
                            Age 20-35 • High Affinity
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 sm:col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                            Candidate Evaluation Markets ({selectedMarkets.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedMarkets.map((mk) => (
                              <span
                                key={mk.id || mk.name}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200"
                              >
                                <span>{mk.flag || "🌐"}</span>
                                <span>{mk.name}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 sm:col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Commercial Goal & Timeline
                          </span>
                          <strong className="text-slate-900 dark:text-white">
                            {primaryGoal || "Flagship Retail Store Opening"}
                          </strong>
                        </div>
                      </div>

                      {/* Prominent Launch Action Button */}
                      <button
                        type="button"
                        onClick={onLaunch}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all active:scale-[0.99] disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Launching Multi-Agent Analysis...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            <span>🚀 Launch Multi-Agent Analysis Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
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
              <span className="text-[11px] ml-1">Copilot is synthesizing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Direct Chat Input Bar at Bottom */}
        <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessAnswer(inputText);
            }}
            className="flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                currentStep === 0
                  ? "Type your brand name (e.g. Acme Wear, Kuro Coffee)..."
                  : currentStep === 1
                  ? "Type target persona (e.g. Gen Z Streetwear, Minimalist Architects)..."
                  : currentStep === 2
                  ? "Type candidate cities (e.g. Tokyo, Berlin, Paris, Seoul)..."
                  : currentStep === 3
                  ? "Type your strategic goal and launch timeline..."
                  : "Type any adjustments or click launch above..."
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
            <span>Press Enter to send • 1-click chips above autofill immediately</span>
            <span className="font-mono">Step {Math.min(currentStep + 1, 4)} of 4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
