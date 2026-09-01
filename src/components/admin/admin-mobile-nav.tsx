"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LayoutDashboard, Users, Package, CreditCard, Settings, FileCheck,
  AlertTriangle, Shield, Lock, BarChart3, Home, LogOut, Tag, FileText,
  ShieldCheck, Flag, ScrollText, Briefcase, Calendar, Workflow, Bell,
  Newspaper, MessageSquare, LifeBuoy, FileSearch, ChevronDown, LucideIcon,
  ImageIcon, PanelBottom, Star, ListOrdered, Compass, Map, HelpCircle,
  FolderTree, Mail,
} from "lucide-react";

interface NavItem { href: string; label: string; icon: LucideIcon; children?: NavItem[]; }
interface NavSection { title: string; items: NavItem[]; }

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
      { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/documents", label: "Documents", icon: FileSearch },
    ],
  },
  {
    title: "Content",
    items: [
      {
        href: "/admin/cms",
        label: "Website CMS",
        icon: Newspaper,
        children: [
          { href: "/admin/cms?tab=news", label: "News Articles", icon: Newspaper },
          { href: "/admin/cms?tab=heroContent", label: "Hero Content", icon: ImageIcon },
          { href: "/admin/cms?tab=pageContent", label: "Page Content", icon: FileText },
          { href: "/admin/cms?tab=footerContent", label: "Footer Content", icon: PanelBottom },
          { href: "/admin/cms?tab=testimonials", label: "Testimonials", icon: Star },
          { href: "/admin/cms?tab=homepageStats", label: "Homepage Stats", icon: BarChart3 },
          { href: "/admin/cms?tab=homepageSteps", label: "How It Works Steps", icon: ListOrdered },
          { href: "/admin/cms?tab=landTypes", label: "Land Types", icon: Home },
          { href: "/admin/cms?tab=professionalTypes", label: "Professionals", icon: Compass },
          { href: "/admin/cms?tab=regions", label: "Regions", icon: Map },
          { href: "/admin/cms?tab=trustBar", label: "Trust Bar", icon: Shield },
          { href: "/admin/cms?tab=faqs", label: "FAQs", icon: HelpCircle },
          { href: "/admin/cms?tab=supportCategories", label: "Support Categories", icon: FolderTree },
          { href: "/admin/cms?tab=contactMessages", label: "Contact Messages", icon: Mail },
          { href: "/admin/cms?tab=siteSettings", label: "Site Settings", icon: Settings },
        ],
      },
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

interface AdminMobileNavProps {
  userName: string;
  userEmail: string;
  onSignOut: () => void;
}

export function AdminMobileNav({ userName, userEmail, onSignOut }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Accordion: only one section open at a time. Start all collapsed.
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const toggleSection = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  const sectionHasActive = (section: NavSection) =>
    section.items.some((item) => isActive(item.href));

  return (
    <div className="md:hidden">
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#1a3a2f] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#c5e063] rounded-lg flex items-center justify-center">
            <span className="text-[#1a3a2f] font-bold text-sm">✦</span>
          </div>
          <span className="text-white font-semibold">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 text-white/70 hover:text-white"><Home className="h-5 w-5" /></Link>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="absolute right-0 top-14 bottom-0 w-[280px] bg-[#1a3a2f] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {sections.map((section, sIdx) => {
              const isSectionOpen = openSection === section.title;
              const hasActive = sectionHasActive(section);
              return (
                <div key={section.title} className={`p-4 ${sIdx > 0 ? "border-t border-[#2a4a3f]" : ""}`}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={isSectionOpen}
                    className="w-full flex items-center justify-between px-3 py-2 min-h-[44px]"
                  >
                    <span className="text-[#a3c4b5] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                      {section.title}
                      {hasActive && <span className="h-1.5 w-1.5 rounded-full bg-[#c5e063]" aria-hidden="true" />}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#a3c4b5] transition-transform duration-200 ${
                        isSectionOpen ? "rotate-0" : "-rotate-90"
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isSectionOpen && (
                    <nav className="space-y-1 mt-2">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <div key={item.href}>
                            <Link href={item.href} onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all min-h-[44px] ${
                                active ? "bg-[#c5e063] text-[#1a3a2f]" : "text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white"
                              }`}>
                              <Icon className="h-5 w-5" />
                              <span className="text-sm font-medium flex-1">{item.label}</span>
                            </Link>
                            {item.children && (
                              <div className="ml-4 mt-1 space-y-0.5 border-l border-[#2a4a3f] pl-2">
                                {item.children.map((child) => {
                                  const ChildIcon = child.icon;
                                  return (
                                    <Link key={child.href} href={child.href} onClick={() => setIsOpen(false)}
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white transition-colors">
                                      <ChildIcon className="h-4 w-4" />
                                      <span className="text-xs">{child.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}

            <div className="p-4 border-t border-[#2a4a3f]">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-10 h-10 bg-[#c5e063] rounded-full flex items-center justify-center">
                  <span className="text-[#1a3a2f] font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{userName}</p>
                  <p className="text-[#6b8f7a] text-xs truncate">{userEmail}</p>
                </div>
              </div>
              <button onClick={() => { setIsOpen(false); onSignOut(); }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-3 text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white rounded-xl transition-colors min-h-[44px]">
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-14" />
    </div>
  );
}
