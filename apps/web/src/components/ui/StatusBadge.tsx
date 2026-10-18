import React from "react";
import { statusKeyFor, statusLabelFor, STATUS_STYLES } from "@/lib/status";

interface StatusBadgeProps {
  status: string | undefined;
  hasRun?: boolean;
  className?: string;
}

export function StatusBadge({ status, hasRun = true, className = "" }: StatusBadgeProps) {
  const key = hasRun ? statusKeyFor(status) : "draft";
  const style = STATUS_STYLES[key];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.bg} ${style.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {statusLabelFor(key)}
    </span>
  );
}
