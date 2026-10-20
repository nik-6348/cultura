"use client";

import React, { useState } from "react";
import { TrendingUp, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrajectoryDataPoint {
  month: string; // e.g. "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov (Proj)", "Dec (Proj)"
  score: number; // 0 to 100
  isProjected?: boolean;
  annotation?: string;
}

interface MomentumTrajectoryChartProps {
  data?: TrajectoryDataPoint[];
  marketName?: string;
  category?: string;
  className?: string;
}

export function MomentumTrajectoryChart({
  data,
  marketName = "Target Market",
  category = "Taste Resonance",
  className,
}: MomentumTrajectoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-center min-h-[160px]", className)}>
        <p className="text-xs text-slate-500">No trajectory data available yet.</p>
      </div>
    );
  }
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 560;
  const height = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minScore = 30;
  const maxScore = 100;

  // Coordinate mapper
  const getX = (index: number) => {
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (score: number) => {
    const norm = (score - minScore) / (maxScore - minScore);
    return padding.top + chartHeight - norm * chartHeight;
  };

  // Generate smooth cubic bezier SVG path
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.score) }));

  // Build path string using Catmull-Rom or smooth control points
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // Area under curve
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // First projected index
  const firstProjectedIdx = data.findIndex((d) => d.isProjected);
  const nowPoint = firstProjectedIdx > 0 ? points[firstProjectedIdx - 1] : points[points.length - 1];

  const latestScore = data[data.length - 1]?.score || 88;
  const startingScore = data[0]?.score || 48;
  const delta = latestScore - startingScore;

  return (
    <div className={cn("rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Cultural Momentum Trajectory — {marketName}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            6-month historical taste velocity and 2-month predictive growth curve ({category})
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{delta}% Velocity</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">High Confidence</span>
        </div>
      </div>

      <div className="relative mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
        >
          <defs>
            <linearGradient id="momentum-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="stroke-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="60%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[40, 60, 80, 100].map((score) => {
            const y = getY(score);
            return (
              <g key={score}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  className="fill-slate-400 font-mono"
                >
                  {score}%
                </text>
              </g>
            );
          })}

          {/* Projection divider line */}
          {firstProjectedIdx > 0 && (
            <g>
              <line
                x1={nowPoint.x}
                y1={padding.top}
                x2={nowPoint.x}
                y2={padding.top + chartHeight}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={nowPoint.x}
                y={padding.top - 6}
                textAnchor="middle"
                fontSize="9"
                className="fill-indigo-500 font-semibold uppercase tracking-wider"
              >
                Today
              </text>
            </g>
          )}

          {/* Filled Area */}
          <path d={areaD} fill="url(#momentum-gradient)" />

          {/* Line Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#stroke-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {points.map((pt, idx) => {
            const item = data[idx];
            const isHovered = hoveredIdx === idx;
            const isNow = idx === firstProjectedIdx - 1;

            return (
              <g key={idx} className="cursor-pointer">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : isNow ? 5 : item.annotation ? 4.5 : 3.5}
                  fill={item.isProjected ? "#10b981" : "#6366f1"}
                  stroke="#ffffff"
                  strokeWidth={isNow ? 2.5 : 1.5}
                  className="transition-all duration-200"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* X Axis Label */}
                <text
                  x={pt.x}
                  y={padding.top + chartHeight + 18}
                  textAnchor="middle"
                  fontSize="10"
                  className={cn(
                    "font-medium",
                    item.isProjected
                      ? "fill-emerald-600 dark:fill-emerald-400 font-semibold"
                      : isNow
                      ? "fill-indigo-600 dark:fill-indigo-400 font-bold"
                      : "fill-slate-500 dark:fill-slate-400"
                  )}
                >
                  {item.month}
                </text>

                {/* Highlight annotation dot */}
                {item.annotation && (
                  <g>
                    <line
                      x1={pt.x}
                      y1={pt.y - 8}
                      x2={pt.x}
                      y2={pt.y - 18}
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />
                    <circle cx={pt.x} cy={pt.y - 20} r="2" fill="#6366f1" />
                    <text
                      x={pt.x}
                      y={pt.y - 24}
                      textAnchor="middle"
                      fontSize="9"
                      className="fill-slate-600 dark:fill-slate-300 font-semibold"
                    >
                      {item.annotation}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700 -translate-x-1/2 -translate-y-full -mt-2"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100}%`,
            }}
          >
            <div className="font-semibold">{data[hoveredIdx].month}</div>
            <div className="text-[11px] text-slate-300">
              Resonance Score:{" "}
              <span className="font-mono font-bold text-emerald-400">
                {data[hoveredIdx].score}%
              </span>
            </div>
            {data[hoveredIdx].annotation && (
              <div className="text-[10px] text-indigo-300 mt-0.5">
                {data[hoveredIdx].annotation}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span>Historical Grounded Taste Data</span>
          <span className="mx-2">•</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Predictive Trend Acceleration</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Qloo Velocity Feed</span>
        </div>
      </div>
    </div>
  );
}
