"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  User,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  FileText,
  Unlock,
  RotateCcw,
  XOctagon,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface Milestone {
  id: string;
  name: string;
  title?: string;
  description: string | null;
  sortOrder: number;
  status: string;
  amountGhs: string;
  dueAt: string | null;
  dueDate?: string | null;
  completedAt: string | null;
  requiresBuyerApproval: boolean;
  requiresSellerApproval: boolean;
  requiresAdminApproval: boolean;
  buyerApprovedAt: string | null;
  sellerApprovedAt: string | null;
  adminApprovedAt: string | null;
}

interface ReleaseChecklist {
  buyerKycPassed: boolean;
  sellerKycPassed: boolean;
  verificationPeriodElapsed: boolean;
  allMilestonesApproved: boolean;
  pendingAdminMilestones: number;
  canRelease: boolean;
  daysSinceFunded: number;
  verificationDaysMin: number;
  buyerKycTier: string;
  buyerLatestKycStatus: string | null;
  sellerKycTier: string;
  sellerLatestKycStatus: string | null;
}

interface Payment {
  id: string;
  provider: string;
  type: string;
  status: string;
  amount: string;
  providerRef: string | null;
  createdAt: string;
}

interface Dispute {
  id: string;
  status: string;
  summary: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  status: string;
  agreedPriceGhs: string;
  platformFeeBps: number;
  verificationDaysMin: number;
  createdAt: string;
  closedAt: string | null;
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
    priceGhs: string;
    sizeAcres: number;
    verificationLevel?: string;
  };
  buyer: { id: string; fullName: string; phone: string; email: string; kycTier: string };
  seller: { id: string; fullName: string; phone: string; email: string; kycTier: string };
  payments: Payment[];
  disputes: Dispute[];
  milestones: Milestone[];
  releaseChecklist?: ReleaseChecklist;
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
  }).format(num || 0);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusColors: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-700 border-gray-200",
  ESCROW_REQUESTED: "bg-blue-100 text-blue-700 border-blue-200",
  FUNDED: "bg-amber-100 text-amber-700 border-amber-200",
  VERIFICATION_PERIOD: "bg-purple-100 text-purple-700 border-purple-200",
  DISPUTED: "bg-red-100 text-red-700 border-red-200",
  READY_TO_RELEASE: "bg-teal-100 text-teal-700 border-teal-200",
  RELEASED: "bg-green-100 text-green-700 border-green-200",
  REFUNDED: "bg-orange-100 text-orange-700 border-orange-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

const milestoneColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  FUNDED: "bg-amber-100 text-amber-700",
  RELEASED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const paymentColors: Record<string, string> = {
  INITIATED: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function TransactionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [milestoneActing, setMilestoneActing] = useState<string | null>(null);
  const [showForceRelease, setShowForceRelease] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/transactions/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Transaction not found" : "Failed to load");
          return;
        }
        const data = await res.json();
        setTransaction(data);
      } catch {
        setError("Failed to load transaction");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleAction(action: string, force?: boolean) {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, force }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Action failed");
        if (data.failures) {
          setError(`${data.error}: ${data.failures.join(", ")}`);
        }
        return;
      }
      const updated = await res.json();
      setTransaction((prev) => (prev ? { ...prev, status: updated.status, closedAt: updated.closedAt } : prev));
      setShowForceRelease(false);
    } catch {
      setError("Action failed");
    } finally {
      setActing(false);
    }
  }

  async function approveMilestone(milestoneId: string, action: "approve" | "reject") {
    setMilestoneActing(milestoneId);
    try {
      const res = await fetch(`/api/admin/transactions/${id}/milestones/${milestoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Milestone action failed");
        return;
      }
      // Reload transaction to get updated milestone + checklist
      const reloadRes = await fetch(`/api/admin/transactions/${id}`);
      if (reloadRes.ok) {
        setTransaction(await reloadRes.json());
      }
    } catch {
      setError("Milestone action failed");
    } finally {
      setMilestoneActing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="space-y-6">
        <Link href="/admin/transactions">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Transactions
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium">{error || "Transaction not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canRelease = ["FUNDED", "READY_TO_RELEASE", "VERIFICATION_PERIOD"].includes(transaction.status);
  const canRefund = ["FUNDED", "DISPUTED", "VERIFICATION_PERIOD"].includes(transaction.status);
  const canClose = !["CLOSED", "RELEASED", "REFUNDED"].includes(transaction.status);
  const checklist = transaction.releaseChecklist;

  return (
    <div className="space-y-6">
      <Link href="/admin/transactions">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Transactions
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction #{transaction.id.slice(-8).toUpperCase()}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={statusColors[transaction.status] || "bg-gray-100"}>
              {transaction.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-gray-500">Created {formatDate(transaction.createdAt)}</span>
            {transaction.closedAt && (
              <span className="text-sm text-gray-500">Closed {formatDate(transaction.closedAt)}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#1a3a2f]">{formatPrice(transaction.agreedPriceGhs)}</p>
          <p className="text-sm text-gray-500">Platform fee: {transaction.platformFeeBps / 100}%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        {canRelease && (
          <>
            <Button
              onClick={() => handleAction("release")}
              disabled={acting || (checklist ? !checklist.canRelease : false)}
              className="bg-green-600 hover:bg-green-700 gap-2"
              title={checklist && !checklist.canRelease ? "Release checklist not met — see checklist below" : "Release escrow funds to seller"}
            >
              <Unlock className="h-4 w-4" /> Release Funds
            </Button>
            {checklist && !checklist.canRelease && (
              <button
                onClick={() => setShowForceRelease(!showForceRelease)}
                className="text-xs text-gray-500 hover:text-red-600 underline"
              >
                Force release
              </button>
            )}
            {showForceRelease && (
              <Button
                onClick={() => handleAction("release", true)}
                disabled={acting}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <AlertTriangle className="h-3 w-3" /> Confirm Force Release
              </Button>
            )}
          </>
        )}
        {canRefund && (
          <Button
            onClick={() => handleAction("refund")}
            disabled={acting}
            variant="destructive"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Refund
          </Button>
        )}
        {canClose && (
          <Button
            onClick={() => handleAction("close")}
            disabled={acting}
            variant="outline"
            className="gap-2"
          >
            <XOctagon className="h-4 w-4" /> Close Transaction
          </Button>
        )}
        {acting && <Loader2 className="h-5 w-5 animate-spin self-center" />}
      </div>

      {/* Pre-Release Checklist */}
      {checklist && canRelease && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Pre-Release Verification Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Buyer KYC */}
              <div className={`flex items-start gap-3 rounded-lg p-3 ${checklist.buyerKycPassed ? "bg-green-50" : "bg-red-50"}`}>
                {checklist.buyerKycPassed ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-medium">Buyer KYC</p>
                  <p className="text-gray-500 text-xs">
                    Tier: {checklist.buyerKycTier.replace(/_/g, " ")}
                    {checklist.buyerLatestKycStatus && ` • Latest: ${checklist.buyerLatestKycStatus}`}
                  </p>
                </div>
              </div>

              {/* Seller KYC */}
              <div className={`flex items-start gap-3 rounded-lg p-3 ${checklist.sellerKycPassed ? "bg-green-50" : "bg-red-50"}`}>
                {checklist.sellerKycPassed ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-medium">Seller KYC (Ghana Card)</p>
                  <p className="text-gray-500 text-xs">
                    Tier: {checklist.sellerKycTier.replace(/_/g, " ")}
                    {checklist.sellerLatestKycStatus && ` • Latest: ${checklist.sellerLatestKycStatus}`}
                  </p>
                </div>
              </div>

              {/* Verification Period */}
              <div className={`flex items-start gap-3 rounded-lg p-3 ${checklist.verificationPeriodElapsed ? "bg-green-50" : "bg-amber-50"}`}>
                {checklist.verificationPeriodElapsed ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-medium">Verification Period</p>
                  <p className="text-gray-500 text-xs">
                    {checklist.daysSinceFunded} / {checklist.verificationDaysMin} days elapsed
                  </p>
                </div>
              </div>

              {/* Milestones */}
              <div className={`flex items-start gap-3 rounded-lg p-3 ${checklist.allMilestonesApproved ? "bg-green-50" : "bg-red-50"}`}>
                {checklist.allMilestonesApproved ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-medium">All Milestones Approved</p>
                  <p className="text-gray-500 text-xs">
                    {checklist.pendingAdminMilestones > 0
                      ? `${checklist.pendingAdminMilestones} pending admin approval`
                      : transaction.milestones.length + " milestones"}
                  </p>
                </div>
              </div>
            </div>

            {checklist.pendingAdminMilestones > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-100 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{checklist.pendingAdminMilestones} milestone(s) require admin approval before funds can be released. See milestone list below.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Milestones & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Escrow Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Escrow Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transaction.milestones.length === 0 ? (
                <p className="text-sm text-gray-500">No milestones defined for this transaction.</p>
              ) : (
                <div className="space-y-4">
                  {transaction.milestones
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((m, idx) => {
                    const milestoneTitle = m.title || m.name;
                    const milestoneDue = m.dueDate || m.dueAt;
                    const buyerApproved = !!m.buyerApprovedAt;
                    const sellerApproved = !!m.sellerApprovedAt;
                    const adminApproved = !!m.adminApprovedAt;
                    const needsAdmin = m.requiresAdminApproval;
                    const fullyApproved =
                      (buyerApproved || !m.requiresBuyerApproval) &&
                      (sellerApproved || !m.requiresSellerApproval) &&
                      (adminApproved || !needsAdmin);

                    return (
                      <div key={m.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            fullyApproved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {idx + 1}
                          </div>
                          {idx < transaction.milestones.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{milestoneTitle}</p>
                            <Badge variant="outline" className={fullyApproved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                              {fullyApproved ? "Approved" : "Pending"}
                            </Badge>
                          </div>
                          {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{formatPrice(m.amountGhs)}</span>
                            {milestoneDue && <span>Due: {formatDate(milestoneDue)}</span>}
                            {m.completedAt && <span>Completed: {formatDate(m.completedAt)}</span>}
                          </div>
                          {/* Approval status badges */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {m.requiresBuyerApproval && (
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${buyerApproved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {buyerApproved ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                Buyer {buyerApproved ? "Approved" : "Pending"}
                              </span>
                            )}
                            {m.requiresSellerApproval && (
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${sellerApproved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {sellerApproved ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                Seller {sellerApproved ? "Approved" : "Pending"}
                              </span>
                            )}
                            {needsAdmin && (
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${adminApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {adminApproved ? <CheckCircle className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                Admin {adminApproved ? "Approved" : "Required"}
                              </span>
                            )}
                          </div>
                          {/* Admin approval actions */}
                          {needsAdmin && !adminApproved && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => approveMilestone(m.id, "approve")}
                                disabled={milestoneActing === m.id}
                                className="bg-green-600 hover:bg-green-700 gap-1 text-xs"
                              >
                                {milestoneActing === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveMilestone(m.id, "reject")}
                                disabled={milestoneActing === m.id}
                                className="gap-1 text-xs text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transaction.payments.length === 0 ? (
                <p className="text-sm text-gray-500">No payments recorded.</p>
              ) : (
                <div className="space-y-3">
                  {transaction.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-500">
                          {p.provider} • {p.providerRef || "No ref"} • {formatDate(p.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(p.amount)}</p>
                        <Badge variant="outline" className={paymentColors[p.status]}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Disputes */}
          {transaction.disputes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Linked Disputes ({transaction.disputes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transaction.disputes.map((d) => (
                    <Link
                      key={d.id}
                      href={`/admin/disputes/${d.id}`}
                      className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">{d.summary}</p>
                        <p className="text-xs text-gray-500">{formatDate(d.createdAt)}</p>
                      </div>
                      <Badge variant="outline">{d.status}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Parties & Listing */}
        <div className="space-y-6">
          {/* Listing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" /> Listing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/listings/${transaction.listing.id}`} className="font-medium text-[#1a3a2f] hover:underline">
                {transaction.listing.title}
              </Link>
              <p className="text-sm text-gray-500 mt-1">
                {transaction.listing.district}, {transaction.listing.region}
              </p>
              <p className="text-sm text-gray-500">
                {transaction.listing.sizeAcres} acres • List: {formatPrice(transaction.listing.priceGhs)}
              </p>
            </CardContent>
          </Card>

          {/* Buyer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Buyer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/users/${transaction.buyer.id}`} className="font-medium text-[#1a3a2f] hover:underline">
                {transaction.buyer.fullName}
              </Link>
              <p className="text-sm text-gray-500 mt-1">{transaction.buyer.phone}</p>
              <p className="text-sm text-gray-500">{transaction.buyer.email}</p>
              <div className="mt-2">
                <Badge variant="outline">{transaction.buyer.kycTier}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Seller */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Seller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/users/${transaction.seller.id}`} className="font-medium text-[#1a3a2f] hover:underline">
                {transaction.seller.fullName}
              </Link>
              <p className="text-sm text-gray-500 mt-1">{transaction.seller.phone}</p>
              <p className="text-sm text-gray-500">{transaction.seller.email}</p>
              <div className="mt-2">
                <Badge variant="outline">{transaction.seller.kycTier}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Verification Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Escrow Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Verification period</span>
                <span className="font-medium">{transaction.verificationDaysMin} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agreed price</span>
                <span className="font-medium">{formatPrice(transaction.agreedPriceGhs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee</span>
                <span className="font-medium">{formatPrice(Number(transaction.agreedPriceGhs) * transaction.platformFeeBps / 10000)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
