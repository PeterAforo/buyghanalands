"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV, PRIMARY_CTA, type DashboardNavGroup } from "./nav-config";

interface DashboardMobileNavProps {
  isProfessional: boolean;
  unreadMessages?: number;
  userName: string;
  userInitial: string;
}

export function DashboardMobileNav({
  isProfessional,
  unreadMessages = 0,
  userName,
  userInitial,
}: DashboardMobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const groups = React.useMemo<DashboardNavGroup[]>(() => {
    if (isProfessional) return DASHBOARD_NAV;
    return DASHBOARD_NAV.filter((g) => g.label !== "Professional");
  }, [isProfessional]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex h-14 items-center justify-between border-b border-emerald-950/[0.06] bg-[#fbfaf6] px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <span className="font-display text-xs font-bold">B</span>
          </div>
          <span className="font-display text-sm font-bold text-emerald-950">BuyGhanaLands</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-950/[0.08] bg-white text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-[280px] overflow-y-auto bg-[#fbfaf6] shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-emerald-950/[0.05] px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white">
                  <span className="font-display text-xs font-bold">B</span>
                </div>
                <span className="font-display text-sm font-bold text-emerald-950">{userName}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-3 pt-4">
              <Link
                href={PRIMARY_CTA.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                <PRIMARY_CTA.icon className="h-4 w-4" />
                {PRIMARY_CTA.label}
              </Link>
            </div>

            <nav className="px-3 py-4">
              {groups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="mb-1.5 px-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      const showBadge = item.badgeKey === "unreadMessages" && unreadMessages > 0;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                              active
                                ? "bg-emerald-50 text-emerald-800"
                                : "text-gray-600 hover:bg-emerald-50/40 hover:text-emerald-800"
                            )}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-amber-500" aria-hidden="true" />
                            )}
                            <Icon className={cn("h-[1.125rem] w-[1.125rem] shrink-0", active ? "text-emerald-700" : "text-gray-400")} />
                            <span className="truncate">{item.label}</span>
                            {showBadge && (
                              <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[0.625rem] font-bold text-white">
                                {unreadMessages > 99 ? "99+" : unreadMessages}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-emerald-950/[0.05] p-4">
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-emerald-50/60"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                  {userInitial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-emerald-950">{userName}</p>
                  <p className="text-xs text-gray-500">View profile</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
