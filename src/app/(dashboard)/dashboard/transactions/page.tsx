"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  ChevronRight,
  Loader2,
  ArrowLeftRight,
} from "lucide-react";
import { PageHeader, SectionCard, EmptyState } from "@/components/dashboard";

interface Transaction {
  id: string;
  status: string;
  agreedPriceGhs: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
  listing: {
    id: string;
    title: string;
    town: string;
    district: string;
    media: { url: string }[];
  };
  buyer: { id: string; fullName: string };
  seller: { id: string; fullName: string };
  milestones: { id: string; name: string; completedAt: string | null }[];
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
  }).format(num);
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    CREATED: { label: "Created", variant: "secondary" },
    ESCROW_REQUESTED: { label: "Awaiting Payment", variant: "warning" },
    FUNDED: { label: "Funded", variant: "success" },
    VERIFICATION_PERIOD: { label: "Verification", variant: "default" },
    DISPUTED: { label: "Disputed", variant: "destructive" },
    READY_TO_RELEASE: { label: "Ready to Release", variant: "success" },
    RELEASED: { label: "Released", variant: "success" },
    REFUNDED: { label: "Refunded", variant: "secondary" },
    CLOSED: { label: "Closed", variant: "secondary" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const };
}

export default function TransactionsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch("/api/transactions");
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) fetchTransactions();
  }, [session]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/transactions");
    return null;
  }

  const activeTransactions = transactions.filter((t) => !["CLOSED", "RELEASED", "REFUNDED"].includes(t.status));
  const completedTransactions = transactions.filter((t) => ["CLOSED", "RELEASED", "REFUNDED"].includes(t.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Track your escrow-protected land transactions"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions" }]}
      />

      {/* Active Transactions */}
      <SectionCard title="Active Transactions" bodyClassName="p-3">
        {activeTransactions.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-7 w-7" />}
            title="No active transactions"
            description="Your in-progress transactions will appear here once an offer is accepted."
          />
        ) : (
          <div className="space-y-1">
            {activeTransactions.map((transaction) => {
              const badge = getStatusBadge(transaction.status);
              const isBuyer = transaction.buyerId === session.user?.id;
              const counterparty = isBuyer ? transaction.seller : transaction.buyer;
              const imageUrl = transaction.listing.media[0]?.url || "/placeholder-land.svg";
              return (
                <Link
                  key={transaction.id}
                  href={`/dashboard/transactions/${transaction.id}`}
                  className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-emerald-50/60"
                >
                  <div
                    className="h-14 w-14 shrink-0 rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-emerald-950">{transaction.listing.title}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {isBuyer ? "Seller" : "Buyer"}: {counterparty.fullName}
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">{formatPrice(transaction.agreedPriceGhs)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Completed Transactions */}
      {completedTransactions.length > 0 && (
        <SectionCard title="Completed Transactions" bodyClassName="p-3">
          <div className="space-y-1">
            {completedTransactions.map((transaction) => {
              const badge = getStatusBadge(transaction.status);
              return (
                <Link
                  key={transaction.id}
                  href={`/dashboard/transactions/${transaction.id}`}
                  className="flex items-center gap-4 rounded-xl px-3 py-3 opacity-75 transition-colors hover:bg-emerald-50/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-emerald-950">{transaction.listing.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{formatPrice(transaction.agreedPriceGhs)}</p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </Link>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
