"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";

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

    if (session?.user) {
      fetchOffers();
    }
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
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status: "ACCEPTED" } : o))
        );
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
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status: "WITHDRAWN" } : o))
        );
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
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status: "COUNTERED", amountGhs: amount } : o))
        );
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/offers");
    return null;
  }

  const receivedOffers = offers.filter(
    (o) => o.listing.sellerId === session.user?.id
  );
  const sentOffers = offers.filter((o) => o.buyerId === session.user?.id);

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
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
        </div>

        {/* Received Offers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Received Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {receivedOffers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No offers received yet</p>
            ) : (
              <div className="space-y-4">
                {receivedOffers.map((offer) => {
                  const badge = getStatusBadge(offer.status);
                  const isPending = offer.status === "SENT";
                  return (
                    <div
                      key={offer.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/listings/${offer.listingId}`}
                            className="font-medium text-gray-900 hover:text-emerald-600"
                          >
                            {offer.listing.title}
                          </Link>
                          <p className="text-sm text-gray-500">
                            From: {offer.buyer.fullName}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-semibold text-emerald-600">
                              {formatPrice(offer.amountGhs)}
                            </span>
                            <span className="text-sm text-gray-500">
                              (Listed: {formatPrice(offer.listing.priceGhs)})
                            </span>
                          </div>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>

                      {isPending && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(offer.id)}
                            disabled={actionLoading === offer.id}
                          >
                            {actionLoading === offer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCounter(offer.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Counter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleReject(offer.id)}
                            disabled={actionLoading === offer.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Link href={`/messages?with=${offer.buyerId}`}>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </Link>
                        </div>
                      )}

                      {showCounter === offer.id && (
                        <div className="mt-4 flex gap-2">
                          <Input
                            type="number"
                            placeholder="Counter amount (GH₵)"
                            value={counterAmount[offer.id] || ""}
                            onChange={(e) =>
                              setCounterAmount((prev) => ({
                                ...prev,
                                [offer.id]: e.target.value,
                              }))
                            }
                            className="max-w-[200px]"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCounter(offer.id)}
                            disabled={actionLoading === offer.id}
                          >
                            Send Counter
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowCounter(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Offers */}
        <Card>
          <CardHeader>
            <CardTitle>Sent Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {sentOffers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No offers sent yet</p>
            ) : (
              <div className="space-y-4">
                {sentOffers.map((offer) => {
                  const badge = getStatusBadge(offer.status);
                  return (
                    <div
                      key={offer.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/listings/${offer.listingId}`}
                            className="font-medium text-gray-900 hover:text-emerald-600"
                          >
                            {offer.listing.title}
                          </Link>
                          <p className="text-sm text-gray-500">
                            To: {offer.listing.seller.fullName}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-semibold text-emerald-600">
                              {formatPrice(offer.amountGhs)}
                            </span>
                          </div>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>

                      {offer.status === "ACCEPTED" && (
                        <div className="mt-4">
                          <Link href={`/dashboard/transactions?offerId=${offer.id}`}>
                            <Button size="sm">
                              Proceed to Payment
                            </Button>
                          </Link>
                        </div>
                      )}

                      <div className="mt-2 flex gap-2">
                        <Link href={`/messages?with=${offer.listing.seller.id}`}>
                          <Button size="sm" variant="ghost">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message Seller
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
