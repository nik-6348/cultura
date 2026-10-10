"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  FolderKanban,
  Database,
  Plus,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Workspace } from "@/lib/types";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const wsList = await api.getWorkspaces();
        if (wsList && wsList.length > 0) {
          setActiveWorkspace(wsList[0]);
        } else {
          // Auto-provision demo workspace if empty
          const newWs = await api.createWorkspace("European Strategy Lab", "strategy.cultura.ai");
          setActiveWorkspace(newWs);
        }
      } catch (err: unknown) {
        console.error("Failed to load workspaces", err);
      }
    }
    loadWorkspaces();
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/memory", label: "Knowledge & Memory", icon: Database },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Workspace Switcher */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-semibold text-lg tracking-tight text-slate-900">Cultura</span>
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                  Cultural Intelligence
                </span>
              </div>
            </Link>

            {/* Workspace Indicator */}
            {activeWorkspace && (
              <div className="hidden sm:flex items-center space-x-2 pl-4 border-l border-slate-200 text-sm text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-800">{activeWorkspace.name}</span>
              </div>
            )}
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-100 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Button & Profile */}
          <div className="flex items-center space-x-3">
            <Link
              href="/projects/new"
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Analysis</span>
            </Link>

            <div className="flex items-center space-x-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-medium text-xs text-slate-700 border border-slate-300">
                DS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>Powered by Qloo Cultural Taste Graph</span>
            <span>•</span>
            <span>TypeSafe Jev System One Decisions</span>
            <span>•</span>
            <span>LangGraph Multi-Agent Architecture</span>
          </div>
          <div>Cultura &copy; 2026. Production Grade SaaS.</div>
        </div>
      </footer>
    </div>
  );
}
