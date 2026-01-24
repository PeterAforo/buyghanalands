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
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

interface Dispute {
  id: string;
  status: string;
  summary: string;
  createdAt: string;
  resolvedAt: string | null;
  transaction: {
    id: string;
    agreedPriceGhs: string;
    listing: {
      id: string;
      title: string;
      media: { url: string }[];
    };
    buyer: { id: string; fullName: string };
    seller: { id: string; fullName: string };
  };
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

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    OPEN: { label: "Open", variant: "destructive" },
    UNDER_REVIEW: { label: "Under Review", variant: "warning" },
    RESOLVED_BUYER: { label: "Resolved (Buyer)", variant: "success" },
    RESOLVED_SELLER: { label: "Resolved (Seller)", variant: "success" },
    RESOLVED_SPLIT: { label: "Resolved (Split)", variant: "success" },
    CLOSED: { label: "Closed", variant: "secondary" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const };
}

export default function DisputesPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const response = await fetch("/api/disputes");
        if (response.ok) {
          const data = await response.json();
          setDisputes(data);
        }
      } catch (error) {
        console.error("Failed to fetch disputes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchDisputes();
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
    router.push("/auth/login?callbackUrl=/dashboard/disputes");
    return null;
  }

  const activeDisputes = disputes.filter((d) => ["OPEN", "UNDER_REVIEW"].includes(d.status));
  const resolvedDisputes = disputes.filter((d) => !["OPEN", "UNDER_REVIEW"].includes(d.status));

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
          <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
        </div>

        {disputes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Disputes</h3>
              <p className="text-gray-500">
                You don't have any disputes. Disputes are created when there's an issue with a transaction.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Disputes */}
            {activeDisputes.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Active Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeDisputes.map((dispute) => {
                      const badge = getStatusBadge(dispute.status);
                      const imageUrl = dispute.transaction.listing.media[0]?.url || "/placeholder-land.svg";

                      return (
                        <Link key={dispute.id} href={`/dashboard/disputes/${dispute.id}`}>
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
                                      {dispute.transaction.listing.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {dispute.summary}
                                    </p>
                                  </div>
                                  <Badge variant={badge.variant}>{badge.label}</Badge>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>{formatPrice(dispute.transaction.agreedPriceGhs)}</span>
                                    <span>•</span>
                                    <span>{formatDate(dispute.createdAt)}</span>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resolved Disputes */}
            {resolvedDisputes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    Resolved Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resolvedDisputes.map((dispute) => {
                      const badge = getStatusBadge(dispute.status);

                      return (
                        <Link key={dispute.id} href={`/dashboard/disputes/${dispute.id}`}>
                          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer opacity-75">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {dispute.transaction.listing.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {formatPrice(dispute.transaction.agreedPriceGhs)} • Resolved {dispute.resolvedAt ? formatDate(dispute.resolvedAt) : ""}
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
          </>
        )}
      </div>
    </div>
  );
}
