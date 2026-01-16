"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  ChevronRight,
} from "lucide-react";

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
  milestones: {
    id: string;
    name: string;
    completedAt: string | null;
  }[];
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

    if (session?.user) {
      fetchTransactions();
    }
  }, [session]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/transactions");
    return null;
  }

  const activeTransactions = transactions.filter(
    (t) => !["CLOSED", "RELEASED", "REFUNDED"].includes(t.status)
  );
  const completedTransactions = transactions.filter((t) =>
    ["CLOSED", "RELEASED", "REFUNDED"].includes(t.status)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        </div>

        {/* Active Transactions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Active Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No active transactions
              </p>
            ) : (
              <div className="space-y-4">
                {activeTransactions.map((transaction) => {
                  const badge = getStatusBadge(transaction.status);
                  const isBuyer = transaction.buyerId === session.user?.id;
                  const counterparty = isBuyer
                    ? transaction.seller
                    : transaction.buyer;
                  const imageUrl =
                    transaction.listing.media[0]?.url ||
                    "/placeholder-land.svg";

                  return (
                    <Link
                      key={transaction.id}
                      href={`/dashboard/transactions/${transaction.id}`}
                    >
                      <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex gap-4">
                          <div
                            className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url(${imageUrl})` }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900 truncate">
                                  {transaction.listing.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {isBuyer ? "Seller" : "Buyer"}:{" "}
                                  {counterparty.fullName}
                                </p>
                              </div>
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-lg font-semibold text-emerald-600">
                                {formatPrice(transaction.agreedPriceGhs)}
                              </span>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Transactions */}
        {completedTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-500" />
                Completed Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedTransactions.map((transaction) => {
                  const badge = getStatusBadge(transaction.status);

                  return (
                    <Link
                      key={transaction.id}
                      href={`/dashboard/transactions/${transaction.id}`}
                    >
                      <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer opacity-75">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {transaction.listing.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {formatPrice(transaction.agreedPriceGhs)}
                            </p>
                          </div>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
