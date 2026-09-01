"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DASHBOARD_NAV, PRIMARY_CTA, type DashboardNavGroup } from "./nav-config";

interface DashboardSidebarProps {
  isProfessional: boolean;
  unreadMessages?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DashboardSidebar({
  isProfessional,
  unreadMessages = 0,
  collapsed,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const groups = React.useMemo<DashboardNavGroup[]>(() => {
    if (isProfessional) return DASHBOARD_NAV;
    return DASHBOARD_NAV.filter((g) => g.label !== "Professional");
  }, [isProfessional]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-0 z-30 h-screen flex-col border-r border-emerald-950/[0.06] bg-[#fbfaf6] transition-[width] duration-300",
        collapsed ? "w-[72px]" : "w-[248px]"
      )}
      aria-label="Dashboard navigation"
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2.5 border-b border-emerald-950/[0.05] px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
          <span className="font-display text-sm font-bold">B</span>
        </div>
        {!collapsed && (
          <span className="font-display text-[1.05rem] font-bold tracking-tight text-emerald-950">
            BuyGhanaLands
          </span>
        )}
      </div>

      {/* Primary CTA */}
      <div className={cn("px-3 pt-4", collapsed && "px-2")}>
        <Link
          href={PRIMARY_CTA.href}
          className={cn(
            "flex items-center gap-2 rounded-xl bg-emerald-700 font-semibold text-white transition-all hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
            collapsed ? "h-10 w-10 justify-center" : "px-3.5 py-2.5 text-sm"
          )}
          title={PRIMARY_CTA.label}
        >
            <PRIMARY_CTA.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{PRIMARY_CTA.label}</span>}
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-gray-400">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const showBadge = item.badgeKey === "unreadMessages" && unreadMessages > 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                        collapsed ? "h-10 w-10 justify-center" : "px-3 py-2.5",
                        active
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-gray-600 hover:bg-emerald-50/40 hover:text-emerald-800"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-amber-500" aria-hidden="true" />
                      )}
                      <Icon className={cn("h-[1.125rem] w-[1.125rem] shrink-0", active ? "text-emerald-700" : "text-gray-400 group-hover:text-emerald-600")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && showBadge && (
                        <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[0.625rem] font-bold text-white">
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      )}
                      {collapsed && showBadge && (
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-emerald-950/[0.05] p-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "flex items-center gap-2 rounded-lg text-xs font-medium text-gray-500 transition-colors hover:bg-emerald-50/60 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            collapsed ? "h-8 w-8 justify-center" : "w-full px-3 py-2"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
