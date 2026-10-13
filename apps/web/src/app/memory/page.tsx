"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Sparkles,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { MemoryRecord, Workspace } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default function MemoryHubPage() {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ memory: MemoryRecord; similarity: number }> | null
  >(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Memory Modal / Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"fact" | "assumption" | "correction">("fact");
  const [savingMemory, setSavingMemory] = useState(false);

  useEffect(() => {
    async function loadWorkspaceMemories() {
      try {
        setLoading(true);
        setError(null);
        const wsList = await api.getWorkspaces();
        let ws = wsList[0];
        if (!ws) {
          ws = await api.createWorkspace("European Strategy Lab", "strategy.cultura.ai");
        }
        setWorkspace(ws);
        const memList = await api.getMemories(ws.id);
        setMemories(memList);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load memories";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaceMemories();
  }, []);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setSearching(true);
      const results = await api.searchMemories(workspace.id, searchQuery.trim(), 5);
      setSearchResults(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      alert(msg);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !newContent.trim()) return;
    try {
      setSavingMemory(true);
      const created = await api.createMemory(workspace.id, {
        content: newContent.trim(),
        memory_type: newType,
      });
      setMemories([created, ...memories]);
      setNewContent("");
      setShowAddForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to store memory";
      alert(msg);
    } finally {
      setSavingMemory(false);
    }
  };

  const handleDeactivate = async (memoryId: string) => {
    if (!confirm("Are you sure you want to deactivate this institutional memory?")) return;
    try {
      await api.deactivateMemory(memoryId);
      setMemories(memories.filter((m) => m.id !== memoryId));
      if (searchResults) {
        setSearchResults(searchResults.filter((r) => r.memory.id !== memoryId));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to deactivate";
      alert(msg);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Knowledge & Memory Hub
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Persistent 4-layer institutional memory with pgvector semantic recall and conflict supersession.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? "Close Form" : "Record Fact / Memory"}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-300">
          <p className="font-semibold">Memory Hub Error</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      )}

      {/* Add Memory Form Accordion */}
      {showAddForm && (
        <form
          onSubmit={handleCreateMemory}
          className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Add Verified Institutional Fact / Strategic Rule
            </span>
            <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/60">
              Layer C Project Fact
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Memory Content / Rule
              </label>
              <textarea
                rows={3}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. In German retail, plant-based dairy packaging must highlight organic Bio-Siegel certification to achieve third-wave cafe adoption."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Memory Classification
                </label>
                <select
                  value={newType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setNewType(e.target.value as "fact" | "assumption" | "correction")
                  }
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="fact">Verified Fact</option>
                  <option value="assumption">Strategic Assumption</option>
                  <option value="correction">Executive Correction</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingMemory}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingMemory ? "Storing in pgvector..." : "Save Memory"}
            </button>
          </div>
        </form>
      )}

      {/* Semantic Search Box (Layer D pgvector) */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Layer D: Semantic Vector Recall (pgvector Cosine Distance &lt;=&gt;)</span>
        </div>

        <form onSubmit={handleSemanticSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search institutional knowledge (e.g. 'German retail bio certification' or 'coffee shop adoption')..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-50"
          >
            {searching ? "Searching..." : "Vector Search"}
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={() => {
                setSearchResults(null);
                setSearchQuery("");
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Search Results Display */}
      {searchResults && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <span>Semantic Recall Matches ({searchResults.length})</span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Query: &quot;{searchQuery}&quot;
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching memories found above similarity threshold.
            </div>
          ) : (
            <div className="divide-y divide-indigo-100 dark:divide-indigo-900/40">
              {searchResults.map((res) => (
                <div key={res.memory.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {res.memory.content}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>Type: {res.memory.memory_type}</span>
                      <span>•</span>
                      <span>Layer: {res.memory.layer}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded">
                      {(res.similarity * 100).toFixed(1)}% match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Workspace Memories List */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Workspace Institutional Knowledge Records
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active facts and strategic priors used to ground multi-agent orchestration runs
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
            {memories.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading memories...</div>
        ) : memories.length === 0 ? (
          <EmptyState
            title="No memories recorded yet"
            description="Add institutional facts or strategic constraints to guide agent reasoning across all runs."
            actionText="Record First Fact"
            onAction={() => setShowAddForm(true)}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {memories.map((m) => (
              <div
                key={m.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {m.memory_type}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Layer {m.layer}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium pt-1">
                    {m.content}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center pt-0.5">
                    <Clock className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" />
                    Recorded {formatDate(m.created_at)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDeactivate(m.id)}
                    title="Deactivate memory"
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
