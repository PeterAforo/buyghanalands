import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  MapPin,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
  ChevronRight,
  Shirt,
  Gamepad2,
  Smartphone,
  Coffee,
  Package,
} from "lucide-react";

async function getAdminStats() {
  const [
    totalUsers,
    totalListings,
    publishedListings,
    pendingListings,
    totalTransactions,
    activeTransactions,
    pendingVerifications,
    openDisputes,
    openFraudCases,
    recentPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "PUBLISHED" } }),
    prisma.listing.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.transaction.count(),
    prisma.transaction.count({
      where: { status: { notIn: ["CLOSED", "RELEASED", "REFUNDED"] } },
    }),
    prisma.verificationRequest.count({ where: { status: "PENDING" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.fraudCase.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalUsers,
    totalListings,
    publishedListings,
    pendingListings,
    totalTransactions,
    activeTransactions,
    pendingVerifications,
    openDisputes,
    openFraudCases,
    monthlyRevenue: recentPayments._sum.amount || 0,
  };
}

async function getRecentActivity() {
  const [recentListings, recentTransactions, recentDisputes] = await Promise.all([
    prisma.listing.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      include: { seller: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.transaction.findMany({
      include: {
        listing: { select: { title: true } },
        buyer: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.dispute.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      include: {
        transaction: { include: { listing: { select: { title: true } } } },
        raisedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { recentListings, recentTransactions, recentDisputes };
}

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user?.roles.some((role) => ["ADMIN", "SUPPORT", "MODERATOR"].includes(role))) {
    redirect("/dashboard");
  }

  const stats = await getAdminStats();
  const { recentListings, recentTransactions, recentDisputes } = await getRecentActivity();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a2f]">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">An easy way to manage platform with care and precision.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">January 2026 - May 2026</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Top Row - Alert Card + Stats */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Update Alert Card */}
        <div className="col-span-3 bg-[#1a3a2f] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#c5e063] text-[#1a3a2f] text-xs font-semibold px-2 py-1 rounded-full">● Update</span>
          </div>
          <p className="text-xs text-[#6b8f7a] mb-1">{formatDate(new Date())}</p>
          <p className="text-lg font-semibold mb-1">Platform activity increased</p>
          <p className="text-2xl font-bold text-[#c5e063]">{stats.totalUsers > 0 ? '+' + Math.round((stats.totalUsers / 10) * 100) / 10 : 0}%</p>
          <p className="text-sm text-[#a3c4b5]">in 1 week</p>
          <Link href="/admin/analytics" className="text-sm text-[#c5e063] mt-3 inline-flex items-center gap-1 hover:underline">
            See Statistics <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Net Income Card */}
        <div className="col-span-3 bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Total Revenue</span>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <p className="text-3xl font-bold text-[#1a3a2f]">
            <span className="text-lg">GH₵</span>{Number(stats.monthlyRevenue).toLocaleString()}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-500 font-medium">+35%</span>
            <span className="text-sm text-gray-400">from last month</span>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="col-span-3 bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Total Users</span>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <p className="text-3xl font-bold text-[#1a3a2f]">{stats.totalUsers.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-500 font-medium">+12%</span>
            <span className="text-sm text-gray-400">from last month</span>
          </div>
        </div>

        {/* Active Listings Card */}
        <div className="col-span-3 bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Active Listings</span>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <p className="text-3xl font-bold text-[#1a3a2f]">{stats.publishedListings.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowDownRight className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500 font-medium">-5%</span>
            <span className="text-sm text-gray-400">from last month</span>
          </div>
        </div>
      </div>

      {/* Middle Row - Transactions + Revenue Chart + Performance */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Recent Transactions */}
        <div className="col-span-4 bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a3a2f]">Recent Activity</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3">
            {recentListings.length === 0 && recentTransactions.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No recent activity</p>
            ) : (
              <>
                {recentListings.slice(0, 3).map((listing) => (
                  <div key={listing.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 bg-[#e8f5e9] rounded-xl flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-[#1a3a2f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a3a2f] truncate">{listing.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(listing.createdAt)}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Pending</Badge>
                  </div>
                ))}
                {recentTransactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 bg-[#e3f2fd] rounded-xl flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a3a2f] truncate">{tx.listing.title}</p>
                      <p className="text-xs text-gray-400">{tx.buyer.fullName}</p>
                    </div>
                    <Badge className={tx.status === "RELEASED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}>
                      {tx.status === "RELEASED" ? "Completed" : "Active"}
                    </Badge>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="col-span-4 bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a3a2f]">Revenue</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1a3a2f] rounded-full"></span> Income</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full"></span> Expenses</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f] mb-1">
            GH₵{Number(stats.monthlyRevenue).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mb-4">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-500 font-medium">+35%</span>
            <span className="text-sm text-gray-400">from last month</span>
          </div>
          {/* Simple bar chart representation */}
          <div className="flex items-end gap-2 h-32 mt-4">
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1">
                <div className="bg-[#c5e063] rounded-t-sm" style={{ height: `${height}%` }}></div>
                <div className="bg-gray-200 rounded-b-sm" style={{ height: `${100 - height}%` }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Donut */}
        <div className="col-span-4 bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-semibold text-[#1a3a2f] mb-4">Platform Performance</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                <circle cx="64" cy="64" r="56" fill="none" stroke="#1a3a2f" strokeWidth="12" strokeDasharray="352" strokeDashoffset="88" />
                <circle cx="64" cy="64" r="56" fill="none" stroke="#c5e063" strokeWidth="12" strokeDasharray="352" strokeDashoffset="264" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#1a3a2f]">{stats.totalUsers + stats.publishedListings}</span>
                <span className="text-xs text-gray-400">Total Count</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mb-4">Here are some tips on how to improve your score.</p>
          <button className="w-full py-2 border border-gray-200 rounded-xl text-sm font-medium text-[#1a3a2f] hover:bg-gray-50 transition-colors">
            Guide Views
          </button>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1a3a2f] rounded-full"></span> Users</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#c5e063] rounded-full"></span> Listings</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full"></span> Sales</span>
          </div>
        </div>
      </div>

      {/* Bottom Row - Stats Report + CTA */}
      <div className="grid grid-cols-12 gap-6">
        {/* Stats Report */}
        <div className="col-span-8 bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a3a2f]">Platform Report</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#1a3a2f] rounded-full"></div>
                <span className="text-sm text-gray-600">Published Listings</span>
                <span className="text-sm font-semibold text-[#1a3a2f]">({stats.publishedListings})</span>
              </div>
              <div className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1a3a2f] rounded-full" style={{ width: `${Math.min((stats.publishedListings / (stats.totalListings || 1)) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#c5e063] rounded-full"></div>
                <span className="text-sm text-gray-600">Pending Listings</span>
                <span className="text-sm font-semibold text-[#1a3a2f]">({stats.pendingListings})</span>
              </div>
              <div className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#c5e063] rounded-full" style={{ width: `${Math.min((stats.pendingListings / (stats.totalListings || 1)) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active Transactions</span>
                <span className="text-sm font-semibold text-[#1a3a2f]">({stats.activeTransactions})</span>
              </div>
              <div className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((stats.activeTransactions / (stats.totalTransactions || 1)) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="col-span-4 bg-[#c5e063] rounded-2xl p-5 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-[#1a3a2f] mb-2">Level up your platform managing to the next level.</h3>
            <p className="text-sm text-[#1a3a2f]/70 mb-4">An easy way to manage platform with care and precision.</p>
            <Link 
              href="/admin/analytics"
              className="inline-block px-4 py-2 bg-[#1a3a2f] text-white rounded-xl text-sm font-medium hover:bg-[#2a4a3f] transition-colors"
            >
              View Analytics
            </Link>
          </div>
          {/* Decorative elements */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#b5d053] rounded-full opacity-50"></div>
          <div className="absolute right-8 bottom-8 w-16 h-16 bg-[#1a3a2f]/10 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
