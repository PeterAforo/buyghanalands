import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";

export const metadata: Metadata = {
  title: "Dashboard | Buy Ghana Lands",
  description: "View your dashboard overview including listings, offers, messages, and activity on Buy Ghana Lands.",
};

export const dynamic = 'force-dynamic';
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowRight,
} from "lucide-react";

async function getDashboardData(userId: string) {
  const [listings, offers, transactions, messages] = await withDbRetry(() => Promise.all([
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
  ]));

  const stats = {
    totalListings: await withDbRetry(() => prisma.listing.count({ where: { sellerId: userId } })),
    activeListings: await withDbRetry(() => prisma.listing.count({
      where: { sellerId: userId, status: "PUBLISHED" },
    })),
    pendingOffers: await withDbRetry(() => prisma.offer.count({
      where: {
        listing: { sellerId: userId },
        status: "SENT",
      },
    })),
    activeTransactions: await withDbRetry(() => prisma.transaction.count({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { notIn: ["CLOSED", "RELEASED", "REFUNDED"] },
      },
    })),
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

const statCards = [
  { key: "totalListings", label: "Total Listings", icon: MapPin, color: "text-emerald-700", bg: "bg-emerald-50" },
  { key: "activeListings", label: "Active Listings", icon: Eye, color: "text-blue-700", bg: "bg-blue-50" },
  { key: "pendingOffers", label: "Pending Offers", icon: DollarSign, color: "text-amber-700", bg: "bg-amber-50" },
  { key: "activeTransactions", label: "Active Transactions", icon: TrendingUp, color: "text-purple-700", bg: "bg-purple-50" },
  { key: "unreadMessages", label: "Unread Messages", icon: MessageSquare, color: "text-pink-700", bg: "bg-pink-50" },
] as const;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { listings, offers, transactions, stats } = await getDashboardData(
    session.user.id
  );

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-emerald-950">Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Welcome back, {session.user.name}
            </p>
          </div>
          <Link href="/listings/create">
            <Button className="mt-4 md:mt-0 bg-emerald-700 hover:bg-emerald-800">
              <Plus className="h-4 w-4 mr-2" />
              List New Land
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8" data-testid="dashboard-stats">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="rounded-3xl border border-emerald-950/10 bg-white p-6 transition-all hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="font-display text-2xl font-bold text-emerald-950">
                      {(stats as any)[card.key]}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.bg}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Listings */}
          <div className="rounded-3xl border border-emerald-950/10 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-emerald-950">My Listings</h2>
              <Link href="/dashboard/listings">
                <Button variant="ghost" size="sm" className="text-emerald-700">
                  View All
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                  <MapPin className="h-8 w-8 text-emerald-300" />
                </div>
                <p className="mt-4 text-gray-500">No listings yet</p>
                <Link href="/listings/create">
                  <Button variant="outline" size="sm" className="mt-4 border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                    Create Your First Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => {
                  const badge = getStatusBadge(listing.status);
                  return (
                    <Link
                      key={listing.id}
                      href={`/dashboard/listings/${listing.id}`}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-emerald-50/50 transition-colors"
                    >
                      <div
                        className="h-16 w-16 rounded-xl bg-gray-100 bg-cover bg-center flex-shrink-0 overflow-hidden"
                        style={{
                          backgroundImage: listing.media[0]
                            ? `url(${listing.media[0].url})`
                            : undefined,
                        }}
                      >
                        {!listing.media[0] && (
                          <div className="h-full w-full flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-emerald-950 truncate">
                          {listing.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {listing.town}, {listing.district}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <p className="text-sm font-medium text-emerald-700 mt-1">
                          {formatPrice(listing.priceGhs)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-3xl border border-emerald-950/10 bg-white p-6" data-testid="dashboard-recent-activity">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-emerald-950">Recent Activity</h2>
              <Link href="/dashboard/activity">
                <Button variant="ghost" size="sm" className="text-emerald-700">
                  View All
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            {offers.length === 0 && transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                  <Clock className="h-8 w-8 text-emerald-300" />
                </div>
                <p className="mt-4 text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.slice(0, 3).map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-amber-50/50"
                  >
                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-950">
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
                    className="flex items-center gap-4 p-3 rounded-2xl bg-emerald-50/50"
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-950">
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
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-emerald-950 mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { href: "/listings/create", icon: Plus, label: "List New Land", color: "text-emerald-700", bg: "bg-emerald-50" },
              { href: "/listings", icon: Eye, label: "Browse Listings", color: "text-blue-700", bg: "bg-blue-50" },
              { href: "/professionals", icon: CheckCircle, label: "Find Professionals", color: "text-purple-700", bg: "bg-purple-50" },
              { href: "/dashboard/messages", icon: MessageSquare, label: "Messages", color: "text-pink-700", bg: "bg-pink-50" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-3xl border border-emerald-950/10 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${action.bg} transition-colors group-hover:bg-emerald-700`}>
                    <Icon className={`h-7 w-7 ${action.color} transition-colors group-hover:text-amber-300`} />
                  </div>
                  <p className="mt-3 font-medium text-emerald-950">{action.label}</p>
                  {action.href === "/dashboard/messages" && stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="mt-1">
                      {stats.unreadMessages} new
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
