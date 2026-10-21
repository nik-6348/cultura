"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Folder,
  FileText,
  Sparkles,
  Activity,
  Settings,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { Workspace } from "@/lib/types";
import { CulturaLogo } from "@/components/ui/CulturaLogo";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Auth routes do not use the internal top navigation
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  useEffect(() => {
    if (isAuthRoute) return;

    async function loadWorkspace() {
      try {
        const wsList = await api.getWorkspaces();
        if (wsList && wsList.length > 0) {
          setActiveWorkspace(wsList[0]);
        } else {
          const newWs = await api.createWorkspace(
            "Acme Brands",
            "acme.cultura.ai"
          );
          setActiveWorkspace(newWs);
        }
      } catch (err: unknown) {
        console.error("Failed to load workspace in AppShell", err);
      }
    }
    loadWorkspace();
  }, [isAuthRoute]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Top navigation items matching mockup exactly
  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutGrid,
      isActive: pathname === "/dashboard" || pathname === "/",
    },
    {
      label: "Projects",
      href: "/projects",
      icon: Folder,
      isActive: pathname.startsWith("/projects"),
    },
    {
      label: "Reports",
      href: "/reports",
      icon: FileText,
      isActive: pathname.startsWith("/reports"),
    },
    {
      label: "AI Assistant",
      href: "/chat",
      icon: Sparkles,
      isActive: pathname.startsWith("/chat"),
    },
    {
      label: "Observability",
      href: "/observability",
      icon: Activity,
      isActive: pathname.startsWith("/observability"),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname.startsWith("/settings"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070A12] text-slate-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 
        Unified Top Navigation Bar:
        - Fixed on top
        - Logo with 'Powered by Qloo'
        - Navigation pills: Overview, Projects, AI Assistant, Observability, Settings
        - Search bar with ⌘K
        - Notification bell with indicator
        - User Profile: Nikhil Rajput
        - NOTE: '+ New Project' omitted per user instruction: "or isme nav me create rpoject ni aaye navbar me top me"
      */}
      <header className="sticky top-0 z-50 h-16 w-full bg-[#0B0F19] border-b border-[#161D2E] px-4 sm:px-6 flex items-center justify-between shadow-sm">
        {/* Left: Brand Logo & Main Navigation Links */}
        <div className="flex items-center space-x-6 lg:space-x-8">
          {/* Brand Logo with exact 'C' glyph */}
          <Link
            href="/dashboard"
            className="group cursor-pointer focus:outline-none"
          >
            <CulturaLogo size={32} />
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    item.isActive
                      ? "bg-[#161D30] text-white border border-[#25324D] shadow-inner"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#121828]"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      item.isActive ? "text-indigo-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Search, Notifications, Profile (no New Project button) */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Search bar */}
          <div className="relative hidden lg:flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, markets, or ask anything..."
              className="w-64 xl:w-72 h-8.5 bg-[#101626] border border-[#1E293B] rounded-lg pl-8.5 pr-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            <kbd className="absolute right-2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-[#161D2E] border border-slate-700/50 rounded pointer-events-none">
              ⌘ K
            </kbd>
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            title="Notifications"
            className="relative p-2 text-slate-400 hover:text-white hover:bg-[#121828] rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0B0F19]" />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2.5 pl-1 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-slate-800 shadow-xs overflow-hidden flex-shrink-0">
              <span className="font-semibold text-xs text-white">NR</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5">
              <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
                Nikhil Rajput
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Viewport (renders child pages with smooth scrolling) */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
