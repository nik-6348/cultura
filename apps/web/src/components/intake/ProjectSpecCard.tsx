"use client";

import React from "react";
import { MapPin, Users, Target, Tag, Rocket } from "lucide-react";

export interface ProjectSpec {
  brand_name: string | null;
  project_name: string | null;
  brand_category: string | null;
  markets: Array<{ name: string; country_code?: string | null }>;
  audience_description: string | null;
  objective: string | null;
}

interface ProjectSpecCardProps {
  spec: ProjectSpec;
  onLaunch: () => void;
  launching: boolean;
}

export function ProjectSpecCard({ spec, onLaunch, launching }: ProjectSpecCardProps) {
  const rows = [
    spec.brand_name && {
      icon: Tag,
      label: "Brand",
      value: spec.brand_name + (spec.brand_category ? ` · ${spec.brand_category}` : ""),
      color: "text-indigo-400",
    },
    spec.markets.length > 0 && {
      icon: MapPin,
      label: "Markets",
      value: spec.markets.map((m) => m.name).join(" · "),
      color: "text-emerald-400",
    },
    spec.audience_description && {
      icon: Users,
      label: "Audience",
      value: spec.audience_description,
      color: "text-violet-400",
    },
    spec.objective && {
      icon: Target,
      label: "Goal",
      value: spec.objective,
      color: "text-amber-400",
    },
  ].filter(Boolean) as Array<{
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
  }>;

  return (
    <div className="mt-2 rounded-xl border border-indigo-500/30 bg-[#0D1525] overflow-hidden shadow-lg shadow-indigo-900/20">
      {/* Header */}
      <div className="px-3 py-2 bg-indigo-500/10 border-b border-indigo-500/20">
        <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
          Project Summary
        </p>
      </div>

      {/* Spec rows */}
      <div className="px-3 py-2.5 space-y-2">
        {rows.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-start gap-2">
            <Icon className={`w-3 h-3 flex-shrink-0 mt-0.5 ${color}`} />
            <div>
              <span className="text-[10px] text-slate-500 mr-1.5">{label}</span>
              <span className="text-[11px] text-slate-200">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Launch button */}
      <div className="px-3 pb-3">
        <button
          onClick={onLaunch}
          disabled={launching || !spec.brand_name || spec.markets.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition-colors"
        >
          {launching ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Launching…
            </>
          ) : (
            <>
              <Rocket className="w-3.5 h-3.5" />
              Launch Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
