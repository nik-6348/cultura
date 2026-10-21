"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { IntakeChatPanel } from "@/components/intake/IntakeChatPanel";

export default function NewProjectPage() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    api.getWorkspaces().then((ws) => {
      if (ws?.length) setWorkspaceId(ws[0].id);
    });
  }, []);

  const handleCreated = (projectId: string, runId: string) => {
    router.push(`/runs/${runId}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              New Project
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block">
          Describe your brand — the analyst will guide you
        </p>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0">
        {workspaceId ? (
          <IntakeChatPanel
            workspaceId={workspaceId}
            onProjectCreated={handleCreated}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-slate-500">
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
