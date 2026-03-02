"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
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
  Home,
  LogOut,
} from "lucide-react";

const menuItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Statistics", icon: BarChart3 },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Package },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
];

const generalItems = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/verifications", label: "Verifications", icon: FileCheck },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/fraud", label: "Fraud Cases", icon: Shield },
  { href: "/admin/system", label: "System Health", icon: Lock },
];

interface AdminMobileNavProps {
  userName: string;
  userEmail: string;
  onSignOut: () => void;
}

export function AdminMobileNav({ userName, userEmail, onSignOut }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#1a3a2f] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#c5e063] rounded-lg flex items-center justify-center">
            <span className="text-[#1a3a2f] font-bold text-sm">✦</span>
          </div>
          <span className="text-white font-semibold">Admin</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-2 text-white/70 hover:text-white"
          >
            <Home className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute right-0 top-14 bottom-0 w-[280px] bg-[#1a3a2f] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Items */}
            <div className="p-4">
              <p className="text-[#a3c4b5] text-xs font-semibold uppercase tracking-wider mb-3 px-3">
                Menu
              </p>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all min-h-[44px] ${
                        active
                          ? "bg-[#c5e063] text-[#1a3a2f]"
                          : "text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* General Items */}
            <div className="p-4 border-t border-[#2a4a3f]">
              <p className="text-[#a3c4b5] text-xs font-semibold uppercase tracking-wider mb-3 px-3">
                General
              </p>
              <nav className="space-y-1">
                {generalItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all min-h-[44px] ${
                        active
                          ? "bg-[#c5e063] text-[#1a3a2f]"
                          : "text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-[#2a4a3f]">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-10 h-10 bg-[#c5e063] rounded-full flex items-center justify-center">
                  <span className="text-[#1a3a2f] font-bold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{userName}</p>
                  <p className="text-[#6b8f7a] text-xs truncate">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-3 text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white rounded-xl transition-colors min-h-[44px]"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-14" />
    </div>
  );
}
