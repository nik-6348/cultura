export type StatusKey = "complete" | "in_progress" | "queued" | "failed" | "draft";

export const STATUS_STYLES: Record<StatusKey, { dot: string; text: string; bg: string }> = {
  complete: { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-500/30" },
  in_progress: { dot: "bg-blue-400", text: "text-blue-400", bg: "bg-blue-950/40 border-blue-500/30" },
  queued: { dot: "bg-cyan-400", text: "text-cyan-400", bg: "bg-cyan-950/40 border-cyan-500/30" },
  failed: { dot: "bg-rose-400", text: "text-rose-400", bg: "bg-rose-950/40 border-rose-500/30" },
  draft: { dot: "bg-slate-400", text: "text-slate-300", bg: "bg-slate-800/60 border-slate-700" },
};

// Real backend values (apps/api/src/db/models/run.py): "queued" -> "running" -> "completed".
// "failed"/other unrecognized values fall through safely to a neutral key.
export function statusKeyFor(status: string | undefined): StatusKey {
  const s = (status || "").toLowerCase();
  if (["completed", "complete", "success", "done"].includes(s)) return "complete";
  if (["running", "in_progress", "processing", "active"].includes(s)) return "in_progress";
  if (["queued", "pending", "scheduled", "waiting"].includes(s)) return "queued";
  if (["failed", "error", "cancelled", "canceled"].includes(s)) return "failed";
  return "draft";
}

export function statusLabelFor(key: StatusKey): string {
  return {
    complete: "Analysis Complete",
    in_progress: "In Progress",
    queued: "Queued",
    failed: "Failed",
    draft: "Draft",
  }[key];
}
