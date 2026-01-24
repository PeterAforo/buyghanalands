"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  ShieldCheck,
  Settings,
  BarChart3,
  MessageSquare,
  AlertTriangle,
  Building2,
  Briefcase,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: { title: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    children: [
      { title: "All Users", href: "/admin/users" },
      { title: "KYC Requests", href: "/admin/users/kyc" },
      { title: "Roles & Permissions", href: "/admin/users/roles" },
    ],
  },
  {
    title: "Listings",
    href: "/admin/listings",
    icon: FileText,
    children: [
      { title: "All Listings", href: "/admin/listings" },
      { title: "Pending Review", href: "/admin/listings/pending" },
      { title: "Verification Queue", href: "/admin/listings/verification" },
      { title: "Featured", href: "/admin/listings/featured" },
    ],
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
    children: [
      { title: "All Transactions", href: "/admin/transactions" },
      { title: "Escrow", href: "/admin/transactions/escrow" },
      { title: "Disputes", href: "/admin/transactions/disputes" },
    ],
  },
  {
    title: "Professionals",
    href: "/admin/professionals",
    icon: Briefcase,
    children: [
      { title: "All Professionals", href: "/admin/professionals" },
      { title: "License Verification", href: "/admin/professionals/verification" },
      { title: "Service Requests", href: "/admin/professionals/requests" },
    ],
  },
  {
    title: "Verification",
    href: "/admin/verification",
    icon: ShieldCheck,
    children: [
      { title: "Document Queue", href: "/admin/verification/documents" },
      { title: "Land Verification", href: "/admin/verification/land" },
    ],
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: AlertTriangle,
    badge: 3,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    children: [
      { title: "General", href: "/admin/settings" },
      { title: "Payment Gateways", href: "/admin/settings/payments" },
      { title: "Email Templates", href: "/admin/settings/emails" },
      { title: "System Config", href: "/admin/settings/system" },
    ],
  },
];

interface AdminSidebarProps {
  className?: string;
}

function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-gray-900 text-white flex flex-col",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">BG</span>
        </div>
        <div>
          <span className="font-bold text-lg">BuyGhanaLands</span>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.title);

            return (
              <li key={item.title}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.title)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
                        active
                          ? "bg-green-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <ul className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block px-3 py-2 rounded-lg text-sm transition-colors",
                                pathname === child.href
                                  ? "bg-gray-800 text-white"
                                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                              )}
                            >
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
                      active
                        ? "bg-green-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Exit Admin</span>
        </Link>
      </div>
    </aside>
  );
}

export { AdminSidebar };
