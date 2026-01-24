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
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  MapPin,
  Filter,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  status: string;
  region: string;
  district: string;
  town: string;
  priceGhs: string;
  sizeAcres: string;
  landType: string;
  verificationLevel: string;
  createdAt: string;
  seller: {
    id: string;
    fullName: string;
    phone: string;
    kycTier: string;
  };
  media: { url: string }[];
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

export default function AdminListingsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch(`/api/admin/listings?filter=${filter}&search=${search}`);
        if (response.ok) {
          const data = await response.json();
          setListings(data);
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchListings();
    }
  }, [session, filter, search]);

  const handleModerate = async (listingId: string, action: "approve" | "reject" | "suspend") => {
    setActionLoading(listingId);
    try {
      const response = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const updated = await response.json();
        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, status: updated.status } : l))
        );
      }
    } catch (error) {
      console.error("Moderation error:", error);
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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Listing Moderation</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("pending")}
                >
                  Pending Review
                </Button>
                <Button
                  variant={filter === "published" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("published")}
                >
                  Published
                </Button>
                <Button
                  variant={filter === "suspended" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("suspended")}
                >
                  Suspended
                </Button>
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
              </div>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search listings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Table */}
        <Card>
          <CardContent className="p-0">
            {listings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No listings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Listing</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Seller</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Price</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => {
                      const badge = getStatusBadge(listing.status);
                      const isPending = ["SUBMITTED", "UNDER_REVIEW"].includes(listing.status);

                      return (
                        <tr key={listing.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded bg-cover bg-center flex-shrink-0"
                                style={{
                                  backgroundImage: `url(${listing.media[0]?.url || "/placeholder-land.svg"})`,
                                }}
                              />
                              <div>
                                <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                                <p className="text-sm text-gray-500">{listing.landType}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium">{listing.seller.fullName}</p>
                            <p className="text-sm text-gray-500">{listing.seller.phone}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p>{listing.district}</p>
                            <p className="text-sm text-gray-500">{listing.region}</p>
                          </td>
                          <td className="py-3 px-4 font-medium">{formatPrice(listing.priceGhs)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{formatDate(listing.createdAt)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link href={`/listings/${listing.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {isPending && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-600"
                                    onClick={() => handleModerate(listing.id, "approve")}
                                    disabled={actionLoading === listing.id}
                                  >
                                    {actionLoading === listing.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => handleModerate(listing.id, "reject")}
                                    disabled={actionLoading === listing.id}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {listing.status === "PUBLISHED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-orange-600"
                                  onClick={() => handleModerate(listing.id, "suspend")}
                                  disabled={actionLoading === listing.id}
                                >
                                  Suspend
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
