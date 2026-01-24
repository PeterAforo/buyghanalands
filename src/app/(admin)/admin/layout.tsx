import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  LayoutDashboard,
  Users,
  MapPin,
  FolderTree,
  FileCheck,
  AlertTriangle,
  Settings,
  Shield,
  CreditCard,
  BarChart3,
  MessageSquare,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Home,
  Package,
  Lock,
} from "lucide-react";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true, fullName: true, email: true },
  });
  return {
    isAdmin: user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role)) || false,
    name: user?.fullName || "Admin",
    email: user?.email || "admin@buyghanalands.com",
  };
}

const menuItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Statistics", icon: BarChart3 },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Package, badge: null },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare, badge: "13" },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
];

const generalItems = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/verifications", label: "Verifications", icon: FileCheck },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/fraud", label: "Fraud Cases", icon: Shield },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { isAdmin, name, email } = await checkAdminAccess(session.user.id);
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#1a3a2f] min-h-screen fixed left-0 top-0 flex flex-col rounded-r-3xl">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#c5e063] rounded-lg flex items-center justify-center">
            <span className="text-[#1a3a2f] font-bold text-sm">✦</span>
          </div>
          <span className="text-white font-semibold text-lg">BuyGhanaLands</span>
        </div>

        {/* Menu Section */}
        <div className="px-4 mt-4">
          <p className="text-[#6b8f7a] text-xs font-medium uppercase tracking-wider mb-3 px-3">Menu</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white rounded-xl transition-all group"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-[#c5e063] text-[#1a3a2f] text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* General Section */}
        <div className="px-4 mt-8">
          <p className="text-[#6b8f7a] text-xs font-medium uppercase tracking-wider mb-3 px-3">General</p>
          <nav className="space-y-1">
            {generalItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-[#a3c4b5] hover:bg-[#2a4a3f] hover:text-white rounded-xl transition-all"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile at Bottom */}
        <div className="mt-auto p-4 border-t border-[#2a4a3f]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 bg-[#c5e063] rounded-full flex items-center justify-center">
              <span className="text-[#1a3a2f] font-bold text-sm">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{name}</p>
              <p className="text-[#6b8f7a] text-xs truncate">{email}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/auth/login" });
              }}
            >
              <button
                type="submit"
                className="p-2 text-[#6b8f7a] hover:text-white hover:bg-[#2a4a3f] rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-[240px]">
        {/* Top Header */}
        <header className="h-16 bg-[#f8f7f4] flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1a3a2f]">Admin Panel</h1>
            <ChevronDown className="h-4 w-4 text-[#1a3a2f]" />
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search anything in Admin..."
                className="w-[280px] pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {/* Notifications */}
            <button className="relative p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Bell className="h-5 w-5 text-[#1a3a2f]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* View Site */}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a2f] text-white rounded-xl text-sm font-medium hover:bg-[#2a4a3f] transition-colors"
            >
              <Home className="h-4 w-4" />
              View Site
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
