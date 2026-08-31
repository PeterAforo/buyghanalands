"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Tag,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  Shield,
  FileText,
  ScrollText,
  Flag,
  Briefcase,
  Calendar,
  Workflow,
  CreditCard as CreditCardIcon,
  Bell,
  Newspaper,
  MessageSquare,
  Settings,
  Lock,
  BarChart3,
  LifeBuoy,
  FileSearch,
  Layers,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Statistics", icon: BarChart3 },
      { href: "/admin/users", label: "Customers", icon: Users },
      { href: "/admin/listings", label: "Listings", icon: Package },
      { href: "/admin/land-categories", label: "Land Categories", icon: Tag },
      { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
      { href: "/admin/offers", label: "Offers", icon: FileText },
    ],
  },
  {
    title: "Verification",
    items: [
      { href: "/admin/kyc", label: "KYC Reviews", icon: ShieldCheck },
      { href: "/admin/verifications", label: "Listing Verifications", icon: FileCheck },
      { href: "/admin/permits", label: "Permits", icon: FileText },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
      { href: "/admin/fraud", label: "Fraud Cases", icon: Shield },
      { href: "/admin/reports", label: "Reports", icon: Flag },
      { href: "/admin/insurance-claims", label: "Insurance Claims", icon: LifeBuoy },
      { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/professionals", label: "Professionals", icon: Briefcase },
      { href: "/admin/bookings", label: "Bookings", icon: Calendar },
      { href: "/admin/workflows", label: "Workflows", icon: Workflow },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCardIcon },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/documents", label: "Documents", icon: FileSearch },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/cms", label: "Website CMS", icon: Newspaper },
      { href: "/admin/messages", label: "Messages", icon: MessageSquare },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/system", label: "System Health", icon: Lock },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {sections.map((section) => (
        <div key={section.title} className="px-4 mt-6 first:mt-4">
          <p className="text-[#a3c4b5] text-[10px] font-semibold uppercase tracking-wider mb-3 px-3">
            {section.title}
          </p>
          <nav className="space-y-1" aria-label={`${section.title} menu`}>
            {section.items.map((item) => {
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
      ))}
    </>
  );
}
