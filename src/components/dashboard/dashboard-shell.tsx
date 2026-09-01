"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { DashboardMobileNav } from "./dashboard-mobile-nav";

export interface DashboardUser {
  name: string;
  email: string;
  initial: string;
  isProfessional: boolean;
}

export interface DashboardCounts {
  unreadMessages: number;
  unreadNotifications: number;
}

interface DashboardShellProps {
  user: DashboardUser;
  counts: DashboardCounts;
  children: React.ReactNode;
}

const COLLAPSE_KEY = "bgl-dashboard-sidebar-collapsed";

export function DashboardShell({ user, counts, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f3ec]">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <DashboardSidebar
        isProfessional={user.isProfessional}
        unreadMessages={counts.unreadMessages}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Mobile nav (top bar + drawer) */}
      <DashboardMobileNav
        isProfessional={user.isProfessional}
        unreadMessages={counts.unreadMessages}
        userName={user.name}
        userInitial={user.initial}
      />

      {/* Main content area */}
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-300", collapsed ? "md:pl-[72px]" : "md:pl-[248px]")}>
        {/* Desktop top bar */}
        <div className="hidden md:block">
          <DashboardTopbar
            userName={user.name}
            userEmail={user.email}
            userInitial={user.initial}
            unreadMessages={counts.unreadMessages}
            unreadNotifications={counts.unreadNotifications}
          />
        </div>

        <main id="dashboard-main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
