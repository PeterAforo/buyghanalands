"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { PageHeader, SectionCard, EmptyState } from "@/components/dashboard";

interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  amountGhs: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    priceGhs: string;
    sellerId: string;
    seller: { id: string; fullName: string };
  };
  buyer: { id: string; fullName: string };
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
  switch (status) {
    case "SENT":
      return { label: "Pending", variant: "warning" as const };
    case "ACCEPTED":
      return { label: "Accepted", variant: "success" as const };
    case "COUNTERED":
      return { label: "Countered", variant: "secondary" as const };
    case "EXPIRED":
      return { label: "Expired", variant: "outline" as const };
    case "WITHDRAWN":
      return { label: "Withdrawn", variant: "destructive" as const };
    default:
      return { label: status, variant: "outline" as const };
  }
}

export default function OffersPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState<{ [key: string]: string }>({});
  const [showCounter, setShowCounter] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const response = await fetch("/api/offers");
        if (response.ok) {
          const data = await response.json();
          setOffers(data);
        }
      } catch (error) {
        console.error("Failed to fetch offers:", error);
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) fetchOffers();
  }, [session]);

  const handleAccept = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });
      if (response.ok) {
        setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: "ACCEPTED" } : o)));
      }
    } catch (error) {
      console.error("Failed to accept offer:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });
      if (response.ok) {
        setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: "WITHDRAWN" } : o)));
      }
    } catch (error) {
      console.error("Failed to reject offer:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounter = async (offerId: string) => {
    const amount = counterAmount[offerId];
    if (!amount) return;
    setActionLoading(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COUNTERED", counterAmount: parseInt(amount) }),
      });
      if (response.ok) {
        setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: "COUNTERED", amountGhs: amount } : o)));
        setShowCounter(null);
      }
    } catch (error) {
      console.error("Failed to counter offer:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/offers");
    return null;
  }

  const receivedOffers = offers.filter((o) => o.listing.sellerId === session.user?.id);
  const sentOffers = offers.filter((o) => o.buyerId === session.user?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers"
        description="Review, accept, counter, or reject offers on your listings"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Offers" }]}
      />

      {/* Received Offers */}
      <SectionCard title={`Received Offers (${receivedOffers.length})`} bodyClassName="p-4">
        {receivedOffers.length === 0 ? (
          <EmptyState
            icon={<DollarSign className="h-7 w-7" />}
            title="No offers received yet"
            description="When buyers make offers on your listings, they will appear here."
          />
        ) : (
          <div className="space-y-3">
            {receivedOffers.map((offer) => {
              const badge = getStatusBadge(offer.status);
              const isPending = offer.status === "SENT";
              return (
                <div
                  key={offer.id}
                  className="rounded-xl border border-emerald-950/[0.06] p-4 transition-colors hover:bg-emerald-50/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/listings/${offer.listingId}`}
                        className="text-sm font-semibold text-emerald-950 hover:text-emerald-700"
                      >
                        {offer.listing.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">From: {offer.buyer.fullName}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-lg font-bold text-emerald-700">{formatPrice(offer.amountGhs)}</span>
                        <span className="text-xs text-gray-400">(Listed: {formatPrice(offer.listing.priceGhs)})</span>
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>

                  {isPending && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleAccept(offer.id)} disabled={actionLoading === offer.id} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                        {actionLoading === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowCounter(offer.id)} className="gap-1.5">
                        <DollarSign className="h-4 w-4" /> Counter
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(offer.id)} disabled={actionLoading === offer.id}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Link href={`/messages?with=${offer.buyerId}`}>
                        <Button size="sm" variant="ghost" className="gap-1.5">
                          <MessageSquare className="h-4 w-4" /> Message
                        </Button>
                      </Link>
                    </div>
                  )}

                  {showCounter === offer.id && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Input
                        type="number"
                        placeholder="Counter amount (GH₵)"
                        value={counterAmount[offer.id] || ""}
                        onChange={(e) => setCounterAmount((prev) => ({ ...prev, [offer.id]: e.target.value }))}
                        className="max-w-[200px]"
                      />
                      <Button size="sm" onClick={() => handleCounter(offer.id)} disabled={actionLoading === offer.id} className="bg-emerald-700 hover:bg-emerald-800">
                        Send Counter
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowCounter(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Sent Offers */}
      <SectionCard title={`Sent Offers (${sentOffers.length})`} bodyClassName="p-4">
        {sentOffers.length === 0 ? (
          <EmptyState
            icon={<DollarSign className="h-7 w-7" />}
            title="No offers sent yet"
            description="Browse listings and make an offer to see it here."
            action={{ label: "Browse Listings", href: "/listings" }}
          />
        ) : (
          <div className="space-y-3">
            {sentOffers.map((offer) => {
              const badge = getStatusBadge(offer.status);
              return (
                <div
                  key={offer.id}
                  className="rounded-xl border border-emerald-950/[0.06] p-4 transition-colors hover:bg-emerald-50/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/listings/${offer.listingId}`}
                        className="text-sm font-semibold text-emerald-950 hover:text-emerald-700"
                      >
                        {offer.listing.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">To: {offer.listing.seller.fullName}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-lg font-bold text-emerald-700">{formatPrice(offer.amountGhs)}</span>
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>

                  {offer.status === "ACCEPTED" && (
                    <div className="mt-4">
                      <Link href={`/dashboard/transactions?offerId=${offer.id}`}>
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">Proceed to Payment</Button>
                      </Link>
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    <Link href={`/messages?with=${offer.listing.seller.id}`}>
                      <Button size="sm" variant="ghost" className="gap-1.5">
                        <MessageSquare className="h-4 w-4" /> Message Seller
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
