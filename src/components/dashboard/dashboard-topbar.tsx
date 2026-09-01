"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, Search, Home, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardTopbarProps {
  userName: string;
  userEmail: string;
  userInitial: string;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export function DashboardTopbar({
  userName,
  userEmail,
  userInitial,
  unreadMessages = 0,
  unreadNotifications = 0,
}: DashboardTopbarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-emerald-950/[0.06] bg-[#fbfaf6]/85 px-4 backdrop-blur-md sm:px-6">
      {/* Search */}
      <div className="relative hidden sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search listings, offers, transactions..."
          aria-label="Search"
          className="w-[240px] rounded-xl border border-emerald-950/[0.08] bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 lg:w-[320px]"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* View site */}
        <Link
          href="/"
          className="hidden items-center gap-1.5 rounded-lg border border-emerald-950/[0.08] bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:flex"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          View Site
        </Link>

        {/* Notifications */}
        <Link
          href="/dashboard/messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-950/[0.08] bg-white text-gray-600 transition-colors hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {(unreadNotifications > 0 || unreadMessages > 0) && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden="true" />
          )}
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-emerald-950/[0.08] bg-white py-1.5 pl-1.5 pr-2 transition-colors hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
              {userInitial}
            </span>
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-gray-700 lg:block">
              {userName}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", menuOpen && "rotate-180")} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-emerald-950/[0.08] bg-white py-1 shadow-[0_12px_32px_-12px_rgba(11,31,23,0.22)]"
            >
              <div className="border-b border-emerald-950/[0.05] px-4 py-3">
                <p className="truncate text-sm font-semibold text-emerald-950">{userName}</p>
                <p className="truncate text-xs text-gray-500">{userEmail}</p>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-emerald-50/60"
                role="menuitem"
              >
                Profile
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-emerald-50/60"
                role="menuitem"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
