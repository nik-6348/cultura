"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  PlayCircle,
  FileText,
  MessageSquare,
  Database,
  Activity,
  Settings,
  ChevronRight,
  CheckCircle2,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Workspace } from "@/lib/types";

interface SidebarProps {
  activeWorkspace: Workspace | null;
  onSelectWorkspace?: (ws: Workspace) => void;
}

export function Sidebar({ activeWorkspace }: SidebarProps) {
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      try {
        const list = await api.getWorkspaces();
        if (list) setWorkspaces(list);
      } catch (e) {
        console.error("Error fetching workspaces in sidebar", e);
      }
    }
    fetchAll();
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/runs", label: "Runs", icon: PlayCircle },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/chat", label: "Analyst Chat", icon: MessageSquare },
    { href: "/memory", label: "Knowledge", icon: Database },
    { href: "/observability", label: "Observability", icon: Activity },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const wsName = activeWorkspace?.name || "Acme Brands";
  const wsInitials = wsName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-screen sticky top-0 select-none z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-slate-100 dark:border-slate-800 transition-all relative",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center space-x-2.5 group min-w-0"
          title="Cultura"
        >
          {/* Cultura Logo Mark - 4 purple dots cluster */}
          <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <span className="absolute w-2.5 h-2.5 rounded-full bg-indigo-600 top-0 left-1/2 -translate-x-1/2 shadow-xs" />
            <span className="absolute w-2 h-2 rounded-full bg-violet-500 bottom-0.5 left-0" />
            <span className="absolute w-2.5 h-2.5 rounded-full bg-purple-600 bottom-0.5 right-0" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400 top-2.5 left-2" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              Cultura
            </span>
          )}
        </Link>

        {/* Collapse / Expand Toggle Button */}
        {!isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(true)}
            title="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expand sidebar"
            className="absolute -right-3 top-5 z-40 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 transition-all cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Workspace Selector Card */}
      <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 relative">
        <button
          onClick={() => setShowWsMenu(!showWsMenu)}
          title={wsName}
          className={cn(
            "w-full flex items-center rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-all text-left",
            isCollapsed ? "justify-center p-2" : "justify-between p-2"
          )}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs shadow-indigo-200 dark:shadow-none">
              {wsInitials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {wsName}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Workspace
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
        </button>

        {showWsMenu && workspaces.length > 0 && !isCollapsed && (
          <div className="absolute top-full left-2.5 right-2.5 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
              Select Workspace
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setShowWsMenu(false);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors",
                  ws.id === activeWorkspace?.id
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspace?.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-all group",
                isCollapsed ? "justify-center p-2.5" : "space-x-3 px-3 py-2",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors flex-shrink-0",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )}
              />
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Profile */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800">
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "space-x-2.5"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs ring-2 ring-slate-100 dark:ring-slate-800">
            NR
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                Nikhil Rajput
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                nikhil@acme.com
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
