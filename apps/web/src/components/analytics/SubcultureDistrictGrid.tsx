"use client";

import React from "react";
import { MapPin, Building2, Compass, Sparkles, Coffee, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubcultureDistrict {
  id: string;
  name: string;
  city: string;
  archetype: string; // e.g. "Avant-Garde Streetwear & Sneaker Nexus"
  resonanceScore: number; // 0 to 100
  venueAnchors: {
    cafes: number;
    conceptStores: number;
    galleries: number;
    nightlife: number;
  };
  tasteKeywords: string[];
}

interface SubcultureDistrictGridProps {
  cityName: string;
  districts?: SubcultureDistrict[];
  className?: string;
}

const DEFAULT_DISTRICTS_BY_CITY: Record<string, SubcultureDistrict[]> = {
  Tokyo: [
    {
      id: "shibuya-harajuku",
      name: "Shibuya & Harajuku",
      city: "Tokyo",
      archetype: "Youth Streetwear & Digital Culture Epicenter",
      resonanceScore: 94,
      venueAnchors: { cafes: 48, conceptStores: 62, galleries: 19, nightlife: 34 },
      tasteKeywords: ["Streetwear", "Sneakerheads", "Anime Pop", "Drop Culture"],
    },
    {
      id: "daikanyama",
      name: "Daikanyama & Nakameguro",
      city: "Tokyo",
      archetype: "Affluent Minimalist & Third-Wave Craft",
      resonanceScore: 89,
      venueAnchors: { cafes: 56, conceptStores: 38, galleries: 24, nightlife: 12 },
      tasteKeywords: ["Minimalism", "Artisanal Coffee", "Slow Living", "Independent Books"],
    },
    {
      id: "shimokitazawa",
      name: "Shimokitazawa",
      city: "Tokyo",
      archetype: "Vintage Apparel & Indie Music Subculture",
      resonanceScore: 86,
      venueAnchors: { cafes: 42, conceptStores: 51, galleries: 16, nightlife: 29 },
      tasteKeywords: ["Vintage Thrift", "Vinyl Records", "Indie Theaters", "Underground Live"],
    },
  ],
  Berlin: [
    {
      id: "kreuzberg",
      name: "Kreuzberg & Neukölln",
      city: "Berlin",
      archetype: "Raw Electronic Music, DIY Art & Counter-Culture",
      resonanceScore: 92,
      venueAnchors: { cafes: 52, conceptStores: 44, galleries: 31, nightlife: 65 },
      tasteKeywords: ["Club Culture", "Queer Arts", "Natural Wine", "Upcycled Fashion"],
    },
    {
      id: "mitte",
      name: "Berlin-Mitte",
      city: "Berlin",
      archetype: "Contemporary High-Fashion & Tech Founders",
      resonanceScore: 88,
      venueAnchors: { cafes: 49, conceptStores: 58, galleries: 42, nightlife: 22 },
      tasteKeywords: ["Luxury Avant-Garde", "Brutalist Design", "Specialty Roasters", "Design Week"],
    },
  ],
  Seoul: [
    {
      id: "seongsu",
      name: "Seongsu-dong (Brooklyn of Seoul)",
      city: "Seoul",
      archetype: "Industrial Red-Brick Pop-Up Labs & K-Fashion",
      resonanceScore: 95,
      venueAnchors: { cafes: 64, conceptStores: 71, galleries: 28, nightlife: 18 },
      tasteKeywords: ["Pop-up Flagships", "Gen Z Street Fashion", "Beauty Tech", "Architectural Cafes"],
    },
    {
      id: "hannam",
      name: "Hannam-dong",
      city: "Seoul",
      archetype: "High-End Niche Fragrance, Contemporary Art & Lifestyle",
      resonanceScore: 90,
      venueAnchors: { cafes: 38, conceptStores: 46, galleries: 34, nightlife: 15 },
      tasteKeywords: ["Niche Fragrance", "Blue-Chip Art", "Luxury Apparel", "Curated Books"],
    },
  ],
  London: [
    {
      id: "shoreditch",
      name: "Shoreditch & Hackney",
      city: "London",
      archetype: "Creative Tech, Independent Design & Street Gastronomy",
      resonanceScore: 91,
      venueAnchors: { cafes: 58, conceptStores: 49, galleries: 26, nightlife: 48 },
      tasteKeywords: ["Indie Apparel", "Micro-Distilleries", "Street Art", "Record Labels"],
    },
    {
      id: "soho",
      name: "Soho & Covent Garden",
      city: "London",
      archetype: "Historic Cultural Intersection & International Retail",
      resonanceScore: 87,
      venueAnchors: { cafes: 50, conceptStores: 65, galleries: 21, nightlife: 55 },
      tasteKeywords: ["Global Flagships", "Theatrical Culture", "Heritage Tailoring", "Cocktail Salons"],
    },
  ],
};

export function SubcultureDistrictGrid({
  cityName,
  districts,
  className,
}: SubcultureDistrictGridProps) {
  // Find matching city or fallback
  const resolvedDistricts =
    districts ||
    DEFAULT_DISTRICTS_BY_CITY[cityName] ||
    DEFAULT_DISTRICTS_BY_CITY["Tokyo"];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Subculture District & Venue Density — {cityName}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Geo-clustered physical taste anchors and audience gravitational centers
          </p>
        </div>
        <span className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
          Qloo Venue Heatmap
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resolvedDistricts.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                  {d.resonanceScore}% Fit
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {d.archetype}
              </p>

              {/* Venue Anchor Count Pills */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 py-2 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-center text-[10px]">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {d.venueAnchors.conceptStores}
                  </div>
                  <div className="text-slate-400 truncate">Retail</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {d.venueAnchors.cafes}
                  </div>
                  <div className="text-slate-400 truncate">Cafes</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {d.venueAnchors.galleries}
                  </div>
                  <div className="text-slate-400 truncate">Galleries</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {d.venueAnchors.nightlife}
                  </div>
                  <div className="text-slate-400 truncate">Nightlife</div>
                </div>
              </div>
            </div>

            {/* Taste Keywords */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
              {d.tasteKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
