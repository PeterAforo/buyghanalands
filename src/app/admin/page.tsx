import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="bg-gray-100 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600">Platform overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Published Listings</p>
                  <p className="text-2xl font-bold">{stats.publishedListings}</p>
                </div>
                <MapPin className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Transactions</p>
                  <p className="text-2xl font-bold">{stats.activeTransactions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Open Disputes</p>
                  <p className="text-2xl font-bold">{stats.openDisputes}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.monthlyRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium">User Management</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/listings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="font-medium">Pending Listings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingListings}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/verifications">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium">Pending Verifications</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingVerifications}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/disputes">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <p className="font-medium">Open Disputes</p>
                <p className="text-2xl font-bold text-red-600">{stats.openDisputes}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/fraud">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <Eye className="h-6 w-6 text-orange-600" />
                </div>
                <p className="font-medium">Fraud Cases</p>
                <p className="text-2xl font-bold text-orange-600">{stats.openFraudCases}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Pending Listings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Listings</CardTitle>
              <Link href="/admin/listings">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentListings.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No pending listings</p>
              ) : (
                <div className="space-y-3">
                  {recentListings.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-sm text-gray-500">
                          by {listing.seller.fullName} • {formatDate(listing.createdAt)}
                        </p>
                      </div>
                      <Badge variant="warning">{listing.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Disputes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Open Disputes</CardTitle>
              <Link href="/admin/disputes">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentDisputes.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No open disputes</p>
              ) : (
                <div className="space-y-3">
                  {recentDisputes.map((dispute) => (
                    <div key={dispute.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{dispute.summary}</p>
                        <p className="text-sm text-gray-500">
                          {dispute.transaction.listing.title} • {formatDate(dispute.createdAt)}
                        </p>
                      </div>
                      <Badge variant="destructive">{dispute.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/admin/transactions">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Listing</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Buyer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{tx.listing.title}</td>
                      <td className="py-3 px-4">{tx.buyer.fullName}</td>
                      <td className="py-3 px-4 font-medium">{formatPrice(tx.agreedPriceGhs)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={tx.status === "RELEASED" ? "success" : tx.status === "DISPUTED" ? "destructive" : "default"}>
                          {tx.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
