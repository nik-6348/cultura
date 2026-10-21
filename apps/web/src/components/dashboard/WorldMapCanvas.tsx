"use client";

import React, { useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoEqualEarth } from "d3-geo";
import type { GeoJsonObject } from "geojson";
import worldData from "@/data/world-110m.json";

export interface CityMarket {
  id: string;
  name: string;
  country: string;
  flag: string;
  lng: number;
  lat: number;
  score: number;
  opportunities: number;
  recentRuns: number;
  status: "high" | "medium" | "low" | "under_analysis";
  momentum: string;
  isPositive: boolean;
}

// Must match the ComposableMap's width/height/projectionConfig below so the
// HTML pin/tooltip overlays line up with the rendered geography.
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAP_PROJECTION = geoEqualEarth()
  .scale(169)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

function projectToPercent(lng: number, lat: number) {
  const [x, y] = MAP_PROJECTION([lng, lat]) ?? [0, 0];
  return { x: (x / MAP_WIDTH) * 100, y: (y / MAP_HEIGHT) * 100 };
}

interface WorldMapCanvasProps {
  cities: CityMarket[];
  zoomLevel: number;
  selectedCityId: string | null;
  onSelectCity: (city: CityMarket) => void;
}

const TOOLTIP_WIDTH = 176; // w-44
const TOOLTIP_HEIGHT = 158; // header + stats + badge, approx
const EDGE_MARGIN = 8;

export default function WorldMapCanvas({
  cities,
  zoomLevel,
  selectedCityId,
  onSelectCity,
}: WorldMapCanvasProps) {
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tooltip only ever appears on hover — a table-row click (selectedCityId)
  // just keeps the card up after the pointer leaves, it never pops up on its own.
  const activeCityId = hoveredCityId ?? selectedCityId;
  const activeCity = cities.find((c) => c.id === activeCityId) ?? null;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[2/1] my-auto select-none overflow-hidden"
    >
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 169 }}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={worldData as unknown as GeoJsonObject}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  strokeWidth={0.6}
                  className="fill-[#141C2E] stroke-[#232F49] hover:fill-[#1A2538] hover:stroke-[#2C3A58] outline-none transition-colors duration-150"
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* City Pin Markers — hover to preview, click to pin the card open */}
      {cities.map((city) => {
        const isActive = activeCityId === city.id;
        const { x, y } = projectToPercent(city.lng, city.lat);
        const colorDot =
          city.status === "high"
            ? "bg-emerald-400"
            : city.status === "medium"
            ? "bg-amber-400"
            : "bg-rose-500";

        const colorGlow =
          city.status === "high"
            ? "shadow-[0_0_12px_rgba(16,185,129,0.9)]"
            : city.status === "medium"
            ? "shadow-[0_0_12px_rgba(245,158,11,0.9)]"
            : "shadow-[0_0_12px_rgba(239,68,68,0.9)]";

        return (
          <div
            key={city.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onMouseEnter={() => setHoveredCityId(city.id)}
            onMouseLeave={() => setHoveredCityId(null)}
            onClick={() => onSelectCity(city)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
          >
            {isActive && (
              <>
                <div className="absolute -inset-3.5 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                <div className="absolute -inset-2 rounded-full border border-emerald-400/60 pointer-events-none" />
              </>
            )}

            <div
              className={`w-3 h-3 rounded-full ${colorDot} ${colorGlow} ring-2 ring-[#0B0F19] transition-transform ${
                isActive ? "scale-125" : "group-hover:scale-125"
              }`}
            />
          </div>
        );
      })}

      {/* Floating Info Tooltip — only rendered while a city is active.
          Positioned in measured pixels (not %) and clamped to the container's
          actual bounds, so it can never get clipped by overflow-hidden near an edge. */}
      {activeCity && containerSize.width > 0 && (() => {
        const { x, y } = projectToPercent(activeCity.lng, activeCity.lat);
        const pinX = (x / 100) * containerSize.width;
        const pinY = (y / 100) * containerSize.height;
        const left = Math.min(
          Math.max(pinX - TOOLTIP_WIDTH / 2, EDGE_MARGIN),
          containerSize.width - TOOLTIP_WIDTH - EDGE_MARGIN
        );
        const GAP = 16;
        const PIN_CLEARANCE = 10;
        // Prefer placing the card above the pin; if there isn't room (pin is
        // near the top edge), flip it below instead of clamping — clamping
        // alone would drag the card's body down across the pin row, hiding it.
        const above = pinY - TOOLTIP_HEIGHT - GAP;
        const top =
          above >= EDGE_MARGIN
            ? above
            : Math.min(
                pinY + PIN_CLEARANCE + GAP,
                containerSize.height - TOOLTIP_HEIGHT - EDGE_MARGIN
              );
        return (
        <div
          style={{ left: `${left}px`, top: `${top}px` }}
          className="absolute z-30 pointer-events-none transition-all duration-150"
        >
          <div className="w-44 rounded-xl bg-[#0B101D]/95 backdrop-blur-md border border-[#22304C] p-3 shadow-2xl">
            <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-800">
              <span className="text-sm">{activeCity.flag}</span>
              <span className="text-xs font-bold text-white">
                {activeCity.name}, {activeCity.country}
              </span>
            </div>

            <div className="py-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Avg. Cultural Fit</span>
                <span className="font-semibold text-white">{activeCity.score}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Opportunities</span>
                <span className="font-semibold text-white">{activeCity.opportunities}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Recent Runs</span>
                <span className="font-semibold text-white">{activeCity.recentRuns}</span>
              </div>
            </div>

            <div className="pt-1">
              <span
                className={`block w-full py-1 text-center rounded-md text-[10px] font-semibold border ${
                  activeCity.status === "high"
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                    : activeCity.status === "medium"
                    ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                    : "bg-rose-950/40 text-rose-400 border-rose-500/30"
                }`}
              >
                {activeCity.status === "high"
                  ? "High Opportunity"
                  : activeCity.status === "medium"
                  ? "Moderate Fit"
                  : "Low Opportunity"}
              </span>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
