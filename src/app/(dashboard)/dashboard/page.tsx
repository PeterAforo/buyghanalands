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
import { PageHeader, SectionCard, DashboardStatCard, EmptyState, DataRow } from "@/components/dashboard";

async function getDashboardData(userId: string) {
  const [listings, offers, transactions, messages] = await withDbRetry(() => Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { media: { take: 1 } },
    }),
    prisma.offer.findMany({
      where: { OR: [{ buyerId: userId }, { listing: { sellerId: userId } }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { listing: { select: { title: true } } },
    }),
    prisma.transaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { listing: { select: { title: true } } },
    }),
    prisma.message.count({ where: { receiverId: userId, readAt: null } }),
  ]));

  const stats = {
    totalListings: await withDbRetry(() => prisma.listing.count({ where: { sellerId: userId } })),
    activeListings: await withDbRetry(() => prisma.listing.count({
      where: { sellerId: userId, status: "PUBLISHED" },
    })),
    pendingOffers: await withDbRetry(() => prisma.offer.count({
      where: { listing: { sellerId: userId }, status: "SENT" },
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
  { key: "totalListings", label: "Total Listings", icon: MapPin, accent: "emerald" as const },
  { key: "activeListings", label: "Active Listings", icon: Eye, accent: "blue" as const },
  { key: "pendingOffers", label: "Pending Offers", icon: DollarSign, accent: "gold" as const },
  { key: "activeTransactions", label: "Active Transactions", icon: TrendingUp, accent: "purple" as const },
  { key: "unreadMessages", label: "Unread Messages", icon: MessageSquare, accent: "pink" as const },
];

const quickActions = [
  { href: "/listings/create", icon: Plus, label: "List New Land", accent: "bg-emerald-50 text-emerald-700" },
  { href: "/listings", icon: Eye, label: "Browse Listings", accent: "bg-blue-50 text-blue-700" },
  { href: "/professionals", icon: CheckCircle, label: "Find Professionals", accent: "bg-purple-50 text-purple-700" },
  { href: "/dashboard/messages", icon: MessageSquare, label: "Messages", accent: "bg-pink-50 text-pink-700" },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { listings, offers, transactions, stats } = await getDashboardData(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name}`}
        actions={
          <Link
            href="/listings/create"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            List New Land
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-testid="dashboard-stats">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <DashboardStatCard
              key={card.key}
              label={card.label}
              value={(stats as any)[card.key]}
              icon={<Icon className="h-5 w-5" />}
              accent={card.accent}
            />
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* My Listings */}
        <SectionCard
          title="My Listings"
          action={
            <Link
              href="/dashboard/listings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          bodyClassName="p-3"
        >
          {listings.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-7 w-7" />}
              title="No listings yet"
              description="Start selling your land by creating your first listing."
              action={{ label: "Create Your First Listing", href: "/listings/create" }}
            />
          ) : (
            <div className="space-y-1">
              {listings.map((listing) => {
                const badge = getStatusBadge(listing.status);
                const imageUrl = listing.media[0]?.url;
                return (
                  <DataRow
                    key={listing.id}
                    href={`/dashboard/listings/${listing.id}`}
                    thumbnail={
                      imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <MapPin className="h-5 w-5 text-gray-300" />
                        </div>
                      )
                    }
                    title={listing.title}
                    subtitle={`${listing.town}, ${listing.district}`}
                    right={
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <span className="text-sm font-semibold text-emerald-700">
                          {formatPrice(listing.priceGhs)}
                        </span>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard
          title="Recent Activity"
          action={
            <Link
              href="/dashboard/activity"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          bodyClassName="p-3"
        >
          <div data-testid="dashboard-recent-activity">
            {offers.length === 0 && transactions.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-7 w-7" />}
                title="No recent activity"
                description="Your offers and transactions will appear here."
              />
            ) : (
              <div className="space-y-1">
                {offers.slice(0, 3).map((offer) => (
                  <DataRow
                    key={offer.id}
                    thumbnail={
                      <div className="flex h-full w-full items-center justify-center bg-amber-100">
                        <DollarSign className="h-5 w-5 text-amber-700" />
                      </div>
                    }
                    title={`New offer on ${offer.listing.title}`}
                    subtitle={`${formatPrice(offer.amountGhs)} • ${formatDate(offer.createdAt)}`}
                    right={
                      <Badge
                        variant={
                          offer.status === "ACCEPTED" ? "success" : offer.status === "SENT" ? "warning" : "secondary"
                        }
                      >
                        {offer.status}
                      </Badge>
                    }
                  />
                ))}
                {transactions.slice(0, 2).map((tx) => (
                  <DataRow
                    key={tx.id}
                    href={`/dashboard/transactions/${tx.id}`}
                    thumbnail={
                      <div className="flex h-full w-full items-center justify-center bg-emerald-100">
                        <FileText className="h-5 w-5 text-emerald-700" />
                      </div>
                    }
                    title={`Transaction: ${tx.listing.title}`}
                    subtitle={`${formatPrice(tx.agreedPriceGhs)} • ${formatDate(tx.createdAt)}`}
                    right={
                      <Badge
                        variant={
                          tx.status === "RELEASED" ? "success" : tx.status === "DISPUTED" ? "destructive" : "default"
                        }
                      >
                        {tx.status.replace("_", " ")}
                      </Badge>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-emerald-950">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-emerald-950/[0.06] bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-16px_rgba(11,31,23,0.2)]"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${action.accent} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-sm font-semibold text-emerald-950">{action.label}</span>
                {action.href === "/dashboard/messages" && stats.unreadMessages > 0 && (
                  <Badge variant="destructive" className="text-[0.625rem]">
                    {stats.unreadMessages} new
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
