"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MapPin,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { PageHeader, SectionCard, EmptyState } from "@/components/dashboard";

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
  _count: { offers: number };
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
    if (session?.user) fetchListings();
  }, [session]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
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
    <div className="space-y-6">
      <PageHeader
        title="My Listings"
        description="Manage and track all your land listings"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Listings" }]}
        actions={
          <Link
            href="/listings/create"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            New Listing
          </Link>
        }
      />

      {listings.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<MapPin className="h-7 w-7" />}
            title="No Listings Yet"
            description="Start selling your land by creating your first listing."
            action={{ label: "Create Listing", href: "/listings/create" }}
          />
        </SectionCard>
      ) : (
        <div className="space-y-5">
          {activeListings.length > 0 && (
            <SectionCard title={`Active Listings (${activeListings.length})`} bodyClassName="p-3">
              <div className="space-y-1">
                {activeListings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            </SectionCard>
          )}
          {pendingListings.length > 0 && (
            <SectionCard title={`Pending (${pendingListings.length})`} bodyClassName="p-3">
              <div className="space-y-1">
                {pendingListings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            </SectionCard>
          )}
          {otherListings.length > 0 && (
            <SectionCard title={`Other (${otherListings.length})`} bodyClassName="p-3">
              <div className="space-y-1">
                {otherListings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const badge = getStatusBadge(listing.status);
  const imageUrl = listing.media[0]?.url || "/placeholder-land.svg";

  return (
    <Link
      href={`/dashboard/listings/${listing.id}`}
      className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-emerald-50/60"
    >
      <div
        className="h-14 w-14 shrink-0 rounded-xl bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-emerald-950">{listing.title}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{listing.district}, {listing.region}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
          <span className="font-semibold text-emerald-700">{formatPrice(listing.priceGhs)}</span>
          <span>{listing.sizeAcres} acres</span>
          {listing._count?.offers > 0 && (
            <Badge variant="outline" className="text-[0.625rem]">
              {listing._count.offers} offer{listing._count.offers > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>
    </Link>
  );
}
