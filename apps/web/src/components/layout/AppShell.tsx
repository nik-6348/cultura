"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  HelpCircle,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { api } from "@/lib/api";
import { Workspace } from "@/lib/types";
import { useTheme } from "@/components/theme/ThemeProvider";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isDark = (mounted ? (resolvedTheme || theme) : "light") === "dark";

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // If this is the landing page or auth routes, do not wrap with the internal SaaS sidebar layout
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  useEffect(() => {
    if (isPublicRoute) return;

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
  }, [isPublicRoute]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Generate readable breadcrumbs from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbLabels: Record<string, string> = {
    dashboard: "Dashboard",
    projects: "Projects",
    new: "New Project",
    runs: "Analysis Runs",
    reports: "Executive Reports",
    chat: "Analyst Chat",
    memory: "Knowledge Hub",
    observability: "Observability",
    settings: "Settings",
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden">
      {/* Enterprise Left Sidebar (Fixed on left, h-screen) */}
      <Sidebar activeWorkspace={activeWorkspace} />

      {/* Main App Body (Full height container, inner content scrolls) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header & Breadcrumb Utility Bar (Strictly fixed at top, never scrolls) */}
        <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-shrink-0 z-20 flex items-center justify-between shadow-2xs">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link
              href="/dashboard"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold"
            >
              {activeWorkspace?.name || "Acme Brands"}
            </Link>
            {pathParts.map((part, index) => {
              const isLast = index === pathParts.length - 1;
              const label =
                breadcrumbLabels[part] ||
                (part.length > 12 ? `${part.slice(0, 8)}...` : part);
              const href = "/" + pathParts.slice(0, index + 1).join("/");

              return (
                <React.Fragment key={href}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  {isLast ? (
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">{label}</span>
                  ) : (
                    <Link
                      href={href}
                      className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                      {label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          {/* Right Action Tools: Single Theme Toggle, Notifications, Help, Profile */}
          <div className="flex items-center space-x-2">
            {/* Single Theme Toggle Icon */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 hover:-rotate-12 transition-transform" />
              )}
            </button>

            <button
              title="Notifications"
              className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            <button
              title="Documentation"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 ml-1" />

            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-800 shadow-2xs">
              NR
            </div>
          </div>
        </header>

        {/* Dynamic Page Content: ONLY INNER SCROLL */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
