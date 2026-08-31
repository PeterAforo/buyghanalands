"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  MessageSquare,
  CreditCard,
  Settings,
  FileCheck,
  AlertTriangle,
  Shield,
  Lock,
  BarChart3,
  Tags,
  LucideIcon,
} from "lucide-react";

const menuItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Statistics", icon: BarChart3 },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Package },
  { href: "/admin/land-categories", label: "Land Categories", icon: Tags },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
];

const generalItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/verifications", label: "Verifications", icon: FileCheck },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/fraud", label: "Fraud Cases", icon: Shield },
  { href: "/admin/system", label: "System Health", icon: Lock },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Menu Section */}
      <div className="px-4 mt-4">
        <p className="text-[#a3c4b5] text-[10px] font-semibold uppercase tracking-wider mb-3 px-3">Menu</p>
        <nav className="space-y-1" aria-label="Main menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5e063] ${
                  active
                    ? "bg-[#c5e063] text-[#1a3a2f] font-semibold"
                    : "text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* General Section */}
      <div className="px-4 mt-8">
        <p className="text-[#a3c4b5] text-[10px] font-semibold uppercase tracking-wider mb-3 px-3">General</p>
        <nav className="space-y-1" aria-label="General menu">
          {generalItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5e063] ${
                  active
                    ? "bg-[#c5e063] text-[#1a3a2f] font-semibold"
                    : "text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
