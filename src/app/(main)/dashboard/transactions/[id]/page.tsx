"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  MessageSquare,
  Shield,
  Loader2,
  CreditCard,
  XCircle,
} from "lucide-react";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  amountGhs: string;
  sortOrder: number;
  buyerApprovedAt: string | null;
  sellerApprovedAt: string | null;
  completedAt: string | null;
}

interface Transaction {
  id: string;
  status: string;
  agreedPriceGhs: string;
  platformFeeBps: number;
  verificationDaysMin: number;
  createdAt: string;
  closedAt: string | null;
  buyerId: string;
  sellerId: string;
  listing: {
    id: string;
    title: string;
    town: string;
    district: string;
    region: string;
    media: { url: string }[];
  };
  buyer: { id: string; fullName: string; phone: string };
  seller: { id: string; fullName: string; phone: string };
  milestones: Milestone[];
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
  }).format(num);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive"; description: string }> = {
    CREATED: { label: "Created", variant: "secondary", description: "Transaction created, awaiting escrow request" },
    ESCROW_REQUESTED: { label: "Awaiting Payment", variant: "warning", description: "Buyer needs to fund the escrow" },
    FUNDED: { label: "Funded", variant: "success", description: "Escrow funded, verification period started" },
    VERIFICATION_PERIOD: { label: "Verification", variant: "default", description: "Documents being verified" },
    DISPUTED: { label: "Disputed", variant: "destructive", description: "A dispute has been raised" },
    READY_TO_RELEASE: { label: "Ready to Release", variant: "success", description: "All conditions met, funds ready for release" },
    RELEASED: { label: "Released", variant: "success", description: "Funds released to seller" },
    REFUNDED: { label: "Refunded", variant: "secondary", description: "Funds returned to buyer" },
    CLOSED: { label: "Closed", variant: "secondary", description: "Transaction completed" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const, description: "" };
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: authStatus } = useSession();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const transactionId = params.id as string;

  useEffect(() => {
    async function fetchTransaction() {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`);
        if (response.ok) {
          const data = await response.json();
          setTransaction(data);
        }
      } catch (error) {
        console.error("Failed to fetch transaction:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user && transactionId) {
      fetchTransaction();
    }
  }, [session, transactionId]);

  const handleFundEscrow = async () => {
    if (!transaction) return;
    setActionLoading("fund");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          type: "TRANSACTION_FUNDING",
          amount: parseInt(transaction.agreedPriceGhs),
        }),
      });

      const data = await response.json();

      if (response.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert(data.error || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initialize payment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!transaction) return;
    setActionLoading(newStatus);

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTransaction(updated);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update transaction");
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!transaction) return;
    setActionLoading(milestoneId);

    try {
      const response = await fetch(`/api/transactions/${transaction.id}/milestones/${milestoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: true }),
      });

      if (response.ok) {
        const updatedMilestone = await response.json();
        setTransaction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            milestones: prev.milestones.map((m) =>
              m.id === milestoneId ? updatedMilestone : m
            ),
          };
        });
      }
    } catch (error) {
      console.error("Milestone approval error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <p className="text-center text-gray-500">Transaction not found</p>
        </div>
      </div>
    );
  }

  const isBuyer = transaction.buyerId === session.user?.id;
  const isSeller = transaction.sellerId === session.user?.id;
  const statusInfo = getStatusInfo(transaction.status);
  const imageUrl = transaction.listing.media[0]?.url || "/placeholder-land.svg";
  const platformFee = (parseInt(transaction.agreedPriceGhs) * transaction.platformFeeBps) / 10000;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Transactions
            </Button>
          </Link>
        </div>

        {/* Transaction Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-6">
              <div
                className="w-32 h-32 rounded-lg bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {transaction.listing.title}
                    </h1>
                    <p className="text-gray-600">
                      {transaction.listing.town}, {transaction.listing.district}, {transaction.listing.region}
                    </p>
                  </div>
                  <Badge variant={statusInfo.variant} className="text-sm">
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-2">{statusInfo.description}</p>
                <div className="mt-4 flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Agreed Price</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatPrice(transaction.agreedPriceGhs)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Platform Fee (1.5%)</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {formatPrice(platformFee)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Action Card */}
            {transaction.status === "CREATED" && isBuyer && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    Fund Escrow
                  </CardTitle>
                  <CardDescription>
                    Deposit funds to secure this transaction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Your payment will be held securely until all conditions are met.
                    The seller cannot access the funds until verification is complete.
                  </p>
                  <Button
                    onClick={handleFundEscrow}
                    disabled={actionLoading === "fund"}
                    className="w-full"
                  >
                    {actionLoading === "fund" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pay {formatPrice(transaction.agreedPriceGhs)}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {transaction.status === "DISPUTED" && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Dispute Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    This transaction is under dispute. Our team is reviewing the case.
                    You will be notified once a resolution is reached.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Escrow Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transaction.milestones.map((milestone, index) => {
                    const isCompleted = !!milestone.completedAt;
                    const canApprove =
                      transaction.status === "VERIFICATION_PERIOD" &&
                      !isCompleted &&
                      ((isBuyer && !milestone.buyerApprovedAt) ||
                        (isSeller && !milestone.sellerApprovedAt));

                    return (
                      <div
                        key={milestone.id}
                        className={`border rounded-lg p-4 ${
                          isCompleted ? "bg-emerald-50 border-emerald-200" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isCompleted
                                  ? "bg-emerald-600 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {milestone.name}
                              </h4>
                              {milestone.description && (
                                <p className="text-sm text-gray-500">
                                  {milestone.description}
                                </p>
                              )}
                              <div className="mt-2 flex gap-2 text-xs">
                                {milestone.buyerApprovedAt && (
                                  <Badge variant="outline" className="text-emerald-600">
                                    Buyer Approved
                                  </Badge>
                                )}
                                {milestone.sellerApprovedAt && (
                                  <Badge variant="outline" className="text-emerald-600">
                                    Seller Approved
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {canApprove && (
                            <Button
                              size="sm"
                              onClick={() => handleApproveMilestone(milestone.id)}
                              disabled={actionLoading === milestone.id}
                            >
                              {actionLoading === milestone.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {transaction.status === "VERIFICATION_PERIOD" && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isBuyer && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleStatusUpdate("DISPUTED")}
                      disabled={!!actionLoading}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Raise Dispute
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {transaction.status === "READY_TO_RELEASE" && isSeller && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Funds Ready
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    All conditions have been met. You can now request the release of funds.
                  </p>
                  <Button
                    onClick={() => handleStatusUpdate("RELEASED")}
                    disabled={!!actionLoading}
                    className="w-full"
                  >
                    {actionLoading === "RELEASED" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Request Release
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Buyer</p>
                  <p className="font-medium">{transaction.buyer.fullName}</p>
                  {isSeller && (
                    <Link href={`/messages?with=${transaction.buyerId}`}>
                      <Button variant="ghost" size="sm" className="mt-1 p-0 h-auto">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </Link>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seller</p>
                  <p className="font-medium">{transaction.seller.fullName}</p>
                  {isBuyer && (
                    <Link href={`/messages?with=${transaction.sellerId}`}>
                      <Button variant="ghost" size="sm" className="mt-1 p-0 h-auto">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span>{formatDate(transaction.createdAt)}</span>
                  </div>
                  {transaction.closedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Closed</span>
                      <span>{formatDate(transaction.closedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Escrow Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Your funds are protected by our escrow service. They will only be
                  released when all conditions are verified.
                </p>
                <Link href="/escrow-policy">
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Learn more →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
