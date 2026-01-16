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
  Plus,
  MapPin,
  Eye,
  Edit,
  ChevronRight,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  status: string;
  priceGhs: string;
  sizeAcres: string;
  region: string;
  district: string;
  town: string;
  landType: string;
  createdAt: string;
  media: { url: string }[];
  _count: {
    offers: number;
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
    DRAFT: { label: "Draft", variant: "secondary" },
    SUBMITTED: { label: "Pending Review", variant: "warning" },
    UNDER_REVIEW: { label: "Under Review", variant: "warning" },
    PUBLISHED: { label: "Published", variant: "success" },
    SUSPENDED: { label: "Suspended", variant: "destructive" },
    REJECTED: { label: "Rejected", variant: "destructive" },
    SOLD: { label: "Sold", variant: "default" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const };
}

export default function MyListingsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch("/api/listings?mine=true");
        if (response.ok) {
          const data = await response.json();
          setListings(data.listings || data);
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
  }, [session]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/listings");
    return null;
  }

  const activeListings = listings.filter((l) => l.status === "PUBLISHED");
  const pendingListings = listings.filter((l) => ["DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(l.status));
  const otherListings = listings.filter((l) => ["SUSPENDED", "REJECTED", "SOLD"].includes(l.status));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          </div>
          <Link href="/listings/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Yet</h3>
              <p className="text-gray-500 mb-4">
                Start selling your land by creating your first listing
              </p>
              <Link href="/listings/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Listings */}
            {activeListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-600">
                    Active Listings ({activeListings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Listings */}
            {pendingListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">
                    Pending ({pendingListings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Listings */}
            {otherListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-600">
                    Other ({otherListings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {otherListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const badge = getStatusBadge(listing.status);
  const imageUrl = listing.media[0]?.url || "/placeholder-land.jpg";

  return (
    <Link href={`/dashboard/listings/${listing.id}`}>
      <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
        <div className="flex gap-4">
          <div
            className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900 truncate">{listing.title}</h3>
                <p className="text-sm text-gray-500">
                  {listing.district}, {listing.region}
                </p>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-emerald-600">
                  {formatPrice(listing.priceGhs)}
                </span>
                <span className="text-sm text-gray-500">
                  {listing.sizeAcres} acres
                </span>
                {listing._count?.offers > 0 && (
                  <Badge variant="outline">
                    {listing._count.offers} offer{listing._count.offers > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
