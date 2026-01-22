import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import {
  Users,
  MapPin,
  TrendingUp,
  DollarSign,
  Eye,
  MessageSquare,
  CreditCard,
  BarChart3,
} from "lucide-react";

export const dynamic = 'force-dynamic';

async function getAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousThirtyDays = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersPrevMonth,
    totalListings,
    newListingsThisMonth,
    publishedListings,
    totalTransactions,
    transactionsThisMonth,
    totalRevenue,
    revenueThisMonth,
    revenuePrevMonth,
    totalMessages,
    messagesThisWeek,
    usersByRole,
    listingsByRegion,
    listingsByType,
    transactionsByStatus,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: previousThirtyDays, lt: thirtyDaysAgo } } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.listing.count({ where: { status: "PUBLISHED" } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", createdAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", createdAt: { gte: previousThirtyDays, lt: thirtyDaysAgo } }, _sum: { amount: true } }),
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.groupBy({ by: ["roles"], _count: true }),
    prisma.listing.groupBy({ by: ["region"], where: { status: "PUBLISHED" }, _count: true, orderBy: { _count: { region: "desc" } }, take: 10 }),
    prisma.listing.groupBy({ by: ["landType"], where: { status: "PUBLISHED" }, _count: true }),
    prisma.transaction.groupBy({ by: ["status"], _count: true }),
  ]);

  // Calculate growth percentages
  const userGrowth = newUsersPrevMonth > 0 ? ((newUsersThisMonth - newUsersPrevMonth) / newUsersPrevMonth) * 100 : 0;
  const revThisMonth = Number(revenueThisMonth._sum.amount || 0);
  const revPrevMonth = Number(revenuePrevMonth._sum.amount || 0);
  const revenueGrowth = revPrevMonth > 0 
    ? ((revThisMonth - revPrevMonth) / revPrevMonth) * 100 
    : 0;

  return {
    totalUsers,
    newUsersThisMonth,
    userGrowth,
    totalListings,
    newListingsThisMonth,
    publishedListings,
    totalTransactions,
    transactionsThisMonth,
    totalRevenue: totalRevenue._sum.amount || 0,
    revenueThisMonth: revenueThisMonth._sum.amount || 0,
    revenueGrowth,
    totalMessages,
    messagesThisWeek,
    listingsByRegion,
    listingsByType,
    transactionsByStatus,
  };
}

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalytics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-gray-600">Platform performance and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-3xl font-bold">{analytics.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-emerald-600">
                  +{analytics.newUsersThisMonth} this month
                  {analytics.userGrowth !== 0 && (
                    <span className={analytics.userGrowth > 0 ? "text-emerald-600" : "text-red-600"}>
                      {" "}({analytics.userGrowth > 0 ? "+" : ""}{analytics.userGrowth.toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Listings</p>
                <p className="text-3xl font-bold">{analytics.publishedListings.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  +{analytics.newListingsThisMonth} new this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-3xl font-bold">{analytics.totalTransactions.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  +{analytics.transactionsThisMonth} this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold">{formatPrice(analytics.totalRevenue)}</p>
                <p className="text-sm text-emerald-600">
                  {formatPrice(analytics.revenueThisMonth)} this month
                  {analytics.revenueGrowth !== 0 && (
                    <span className={analytics.revenueGrowth > 0 ? "text-emerald-600" : "text-red-600"}>
                      {" "}({analytics.revenueGrowth > 0 ? "+" : ""}{analytics.revenueGrowth.toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Messages</p>
                <p className="text-2xl font-bold">{analytics.totalMessages.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  {analytics.messagesThisWeek} this week
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Listings</p>
                <p className="text-2xl font-bold">{analytics.totalListings.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  {analytics.publishedListings} published
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts/Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Listings by Region */}
        <Card>
          <CardHeader>
            <CardTitle>Listings by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.listingsByRegion.map((item) => {
                const maxCount = Math.max(...analytics.listingsByRegion.map(r => r._count));
                const percentage = (item._count / maxCount) * 100;
                return (
                  <div key={item.region} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.region}</span>
                      <span className="font-medium">{item._count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {analytics.listingsByRegion.length === 0 && (
                <p className="text-center text-gray-500 py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Listings by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Listings by Land Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.listingsByType.map((item) => {
                const maxCount = Math.max(...analytics.listingsByType.map(t => t._count));
                const percentage = (item._count / maxCount) * 100;
                const colors: Record<string, string> = {
                  RESIDENTIAL: "bg-blue-500",
                  COMMERCIAL: "bg-purple-500",
                  INDUSTRIAL: "bg-orange-500",
                  AGRICULTURAL: "bg-green-500",
                  MIXED: "bg-gray-500",
                };
                return (
                  <div key={item.landType} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{item.landType.toLowerCase().replace("_", " ")}</span>
                      <span className="font-medium">{item._count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${colors[item.landType] || "bg-gray-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {analytics.listingsByType.length === 0 && (
                <p className="text-center text-gray-500 py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transactions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {analytics.transactionsByStatus.map((item) => {
                const statusColors: Record<string, string> = {
                  CREATED: "bg-gray-100 text-gray-700",
                  ESCROW_REQUESTED: "bg-yellow-100 text-yellow-700",
                  FUNDED: "bg-blue-100 text-blue-700",
                  VERIFICATION_PERIOD: "bg-purple-100 text-purple-700",
                  DISPUTED: "bg-red-100 text-red-700",
                  READY_TO_RELEASE: "bg-emerald-100 text-emerald-700",
                  RELEASED: "bg-green-100 text-green-700",
                  REFUNDED: "bg-orange-100 text-orange-700",
                  CLOSED: "bg-gray-100 text-gray-700",
                };
                return (
                  <div 
                    key={item.status} 
                    className={`p-4 rounded-lg text-center ${statusColors[item.status] || "bg-gray-100"}`}
                  >
                    <p className="text-2xl font-bold">{item._count}</p>
                    <p className="text-xs font-medium">{item.status.replace(/_/g, " ")}</p>
                  </div>
                );
              })}
              {analytics.transactionsByStatus.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-4">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
