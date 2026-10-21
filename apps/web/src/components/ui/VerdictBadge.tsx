import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface VerdictBadgeProps {
  verdict: "launch" | "adapt" | "avoid" | string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

export function VerdictBadge({
  verdict,
  size = "md",
  className,
  showIcon = true,
}: VerdictBadgeProps) {
  const normVerdict = verdict?.toLowerCase();

  const config = {
    launch: {
      label: "LAUNCH",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/10",
      icon: CheckCircle2,
      dotColor: "bg-emerald-500",
    },
    adapt: {
      label: "ADAPT",
      bg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-sm shadow-amber-500/10",
      icon: AlertTriangle,
      dotColor: "bg-amber-500",
    },
    avoid: {
      label: "AVOID",
      bg: "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-sm shadow-rose-500/10",
      icon: XCircle,
      dotColor: "bg-rose-500",
    },
  }[normVerdict] || {
    label: verdict ? verdict.toUpperCase() : "PENDING",
    bg: "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
    icon: AlertTriangle,
    dotColor: "bg-slate-400",
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold gap-1",
    md: "px-2.5 py-1 text-xs font-bold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-bold gap-2",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border tracking-wider uppercase shadow-2xs transition-colors",
        config.bg,
        sizeClasses,
        className
      )}
    >
      {showIcon && <Icon className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />}
      <span>{config.label}</span>
    </span>
  );
}
