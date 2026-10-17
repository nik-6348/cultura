"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface RadarDimension {
  key: string;
  label: string;
  shortLabel?: string;
  score: number; // 0 to 1
  weight?: string;
}

export interface RadarSeries {
  id: string;
  name: string;
  color: string;
  fillColor: string;
  strokeColor: string;
  data: RadarDimension[];
}

interface CulturalRadarChartProps {
  series: RadarSeries[];
  size?: number;
  className?: string;
  showLegend?: boolean;
}

export function CulturalRadarChart({
  series,
  size = 360,
  className,
  showLegend = true,
}: CulturalRadarChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    seriesName: string;
    dimLabel: string;
    score: number;
    x: number;
    y: number;
  } | null>(null);

  if (!series || series.length === 0 || !series[0].data || series[0].data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400">
        No radar dimensions available
      </div>
    );
  }

  const dimensions = series[0].data;
  const numAxes = dimensions.length;
  const center = size / 2;
  const radius = (size / 2) - 45; // Leave padding for axis labels
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper to calculate (x, y) for an axis angle and normalized radius [0..1]
  const getCoordinates = (axisIndex: number, value: number) => {
    // Start angle at top (-pi/2)
    const angle = (Math.PI * 2 * axisIndex) / numAxes - Math.PI / 2;
    const r = radius * Math.max(0, Math.min(1, value));
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Build grid concentric polygons
  const gridPolygons = levels.map((lvl) => {
    const points = Array.from({ length: numAxes }).map((_, i) => {
      const { x, y } = getCoordinates(i, lvl);
      return `${x},${y}`;
    }).join(" ");
    return { lvl, points };
  });

  return (
    <div className={cn("relative flex flex-col items-center select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Grid Polygons */}
        {gridPolygons.map(({ lvl, points }) => (
          <polygon
            key={lvl}
            points={points}
            fill={lvl === 1.0 ? "rgba(99, 102, 241, 0.02)" : "none"}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="1"
            strokeDasharray={lvl === 1.0 ? "none" : "3,3"}
          />
        ))}

        {/* Axis Rays */}
        {dimensions.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="1"
            />
          );
        })}

        {/* Level Percentage Markers along first axis */}
        {levels.map((lvl) => {
          const { x, y } = getCoordinates(0, lvl);
          return (
            <text
              key={lvl}
              x={x + 4}
              y={y - 2}
              fontSize="9"
              className="fill-slate-400 dark:fill-slate-500 font-mono font-medium"
            >
              {Math.round(lvl * 100)}%
            </text>
          );
        })}

        {/* Data Series Polygons */}
        {series.map((s, sIdx) => {
          const points = s.data
            .map((dim, i) => {
              const { x, y } = getCoordinates(i, dim.score);
              return `${x},${y}`;
            })
            .join(" ");

          const isPrimary = sIdx === 0;

          return (
            <g key={s.id || s.name} className="transition-all duration-300">
              {/* Filled Polygon */}
              <polygon
                points={points}
                fill={s.fillColor}
                stroke={s.strokeColor}
                strokeWidth={isPrimary ? 2.5 : 1.75}
                strokeLinejoin="round"
                className="transition-all duration-300"
                filter={isPrimary ? "url(#radar-glow)" : undefined}
              />

              {/* Data Point Circles */}
              {s.data.map((dim, i) => {
                const { x, y } = getCoordinates(i, dim.score);
                return (
                  <circle
                    key={dim.key}
                    cx={x}
                    cy={y}
                    r={isPrimary ? 4.5 : 3.5}
                    fill={s.strokeColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        seriesName: s.name,
                        dimLabel: dim.label,
                        score: dim.score,
                        x,
                        y,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Axis Labels */}
        {dimensions.map((dim, i) => {
          const { x, y } = getCoordinates(i, 1.18);
          const textAnchor =
            Math.abs(x - center) < 15
              ? "middle"
              : x > center
              ? "start"
              : "end";
          const baseline: "middle" | "hanging" | "auto" =
            Math.abs(y - center) < 15
              ? "middle"
              : y > center
              ? "hanging"
              : "auto";

          return (
            <text
              key={dim.key}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dominantBaseline={baseline}
              fontSize="10"
              className="fill-slate-700 dark:fill-slate-300 font-semibold"
            >
              {dim.shortLabel || dim.label}
            </text>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none z-20 bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700 -translate-x-1/2 -translate-y-full -mt-2 transition-opacity duration-150"
          style={{ left: hoveredPoint.x, top: hoveredPoint.y }}
        >
          <div className="font-semibold text-slate-200">{hoveredPoint.seriesName}</div>
          <div className="text-[11px] text-slate-300">
            {hoveredPoint.dimLabel}:{" "}
            <span className="font-mono font-bold text-indigo-400">
              {(hoveredPoint.score * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-3 flex items-center justify-center flex-wrap gap-4 text-xs">
          {series.map((s, idx) => (
            <div key={s.id || s.name} className="flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-full border"
                style={{
                  backgroundColor: s.fillColor,
                  borderColor: s.strokeColor,
                  borderWidth: idx === 0 ? "2px" : "1.5px",
                }}
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
