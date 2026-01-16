import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Plus,
  Eye,
  MessageSquare,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

async function getDashboardData(userId: string) {
  const [listings, offers, transactions, messages] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        media: { take: 1 },
      },
    }),
    prisma.offer.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { listing: { sellerId: userId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        listing: { select: { title: true } },
      },
    }),
    prisma.transaction.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        listing: { select: { title: true } },
      },
    }),
    prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
      },
    }),
  ]);

  const stats = {
    totalListings: await prisma.listing.count({ where: { sellerId: userId } }),
    activeListings: await prisma.listing.count({
      where: { sellerId: userId, status: "PUBLISHED" },
    }),
    pendingOffers: await prisma.offer.count({
      where: {
        listing: { sellerId: userId },
        status: "SENT",
      },
    }),
    activeTransactions: await prisma.transaction.count({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { notIn: ["CLOSED", "RELEASED", "REFUNDED"] },
      },
    }),
    unreadMessages: messages,
  };

  return { listings, offers, transactions, stats };
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    SUBMITTED: { label: "Submitted", variant: "warning" },
    UNDER_REVIEW: { label: "Under Review", variant: "warning" },
    PUBLISHED: { label: "Published", variant: "success" },
    SUSPENDED: { label: "Suspended", variant: "destructive" },
    REJECTED: { label: "Rejected", variant: "destructive" },
    SOLD: { label: "Sold", variant: "default" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { listings, offers, transactions, stats } = await getDashboardData(
    session.user.id
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Welcome back, {session.user.name}
            </p>
          </div>
          <Link href="/listings/create">
            <Button className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              List New Land
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Listings</p>
                  <p className="text-2xl font-bold">{stats.totalListings}</p>
                </div>
                <MapPin className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Listings</p>
                  <p className="text-2xl font-bold">{stats.activeListings}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Offers</p>
                  <p className="text-2xl font-bold">{stats.pendingOffers}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
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
                  <p className="text-sm text-gray-500">Unread Messages</p>
                  <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* My Listings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Listings</CardTitle>
              <Link href="/dashboard/listings">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {listings.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No listings yet</p>
                  <Link href="/listings/create">
                    <Button variant="outline" size="sm" className="mt-4">
                      Create Your First Listing
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {listings.map((listing) => {
                    const badge = getStatusBadge(listing.status);
                    return (
                      <Link
                        key={listing.id}
                        href={`/dashboard/listings/${listing.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="h-16 w-16 rounded-lg bg-gray-200 bg-cover bg-center flex-shrink-0"
                          style={{
                            backgroundImage: listing.media[0]
                              ? `url(${listing.media[0].url})`
                              : undefined,
                          }}
                        >
                          {!listing.media[0] && (
                            <div className="h-full w-full flex items-center justify-center">
                              <MapPin className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {listing.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {listing.town}, {listing.district}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <p className="text-sm font-medium text-emerald-600 mt-1">
                            {formatPrice(listing.priceGhs)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/dashboard/activity">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {offers.length === 0 && transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.slice(0, 3).map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
                    >
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          New offer on {offer.listing.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(offer.amountGhs)} •{" "}
                          {formatDate(offer.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          offer.status === "ACCEPTED"
                            ? "success"
                            : offer.status === "SENT"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {offer.status}
                      </Badge>
                    </div>
                  ))}
                  {transactions.slice(0, 2).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
                    >
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Transaction: {tx.listing.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(tx.agreedPriceGhs)} •{" "}
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          tx.status === "RELEASED"
                            ? "success"
                            : tx.status === "DISPUTED"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {tx.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/listings/create">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Plus className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="font-medium">List New Land</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/listings">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Eye className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <p className="font-medium">Browse Listings</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/professionals">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                  <p className="font-medium">Find Professionals</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/messages">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-pink-600 mb-2" />
                  <p className="font-medium">Messages</p>
                  {stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="mt-1">
                      {stats.unreadMessages} new
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
