import {
  LayoutDashboard,
  MapPin,
  DollarSign,
  ArrowLeftRight,
  MessageSquare,
  Heart,
  Search,
  Activity,
  BarChart3,
  ShieldAlert,
  Briefcase,
  CreditCard,
  Workflow,
  UserCircle,
  BadgeCheck,
  Plus,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "unreadMessages";
}

export interface DashboardNavGroup {
  label: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV: DashboardNavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Selling",
    items: [
      { label: "My Listings", href: "/dashboard/listings", icon: MapPin },
      { label: "Offers", href: "/dashboard/offers", icon: DollarSign },
      { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badgeKey: "unreadMessages" },
      { label: "Favorites", href: "/dashboard/favorites", icon: Heart },
      { label: "Saved Searches", href: "/dashboard/saved-searches", icon: Search },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Activity", href: "/dashboard/activity", icon: Activity },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Disputes", href: "/dashboard/disputes", icon: ShieldAlert },
    ],
  },
  {
    label: "Professional",
    items: [
      { label: "Professional Hub", href: "/dashboard/professional", icon: Briefcase },
      { label: "Subscription", href: "/dashboard/professional/subscription", icon: CreditCard },
      { label: "Workflows", href: "/workflows", icon: Workflow },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
      { label: "KYC Verification", href: "/dashboard/profile/kyc", icon: BadgeCheck },
    ],
  },
];

export const PRIMARY_CTA = { label: "List New Land", href: "/listings/create", icon: Plus };
