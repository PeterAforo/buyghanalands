"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Ruler,
  CheckCircle,
  Home,
  Building2,
  Factory,
  Tractor,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  region: string;
  district: string;
  town: string | null;
  landType: string;
  tenureType: string;
  sizeAcres: string;
  priceGhs: string;
  negotiable: boolean;
  verificationLevel: string;
  media: { url: string }[];
}

const landTypeTabs = [
  { id: "RESIDENTIAL", label: "Residential", icon: Home },
  { id: "COMMERCIAL", label: "Commercial", icon: Building2 },
  { id: "INDUSTRIAL", label: "Industrial", icon: Factory },
  { id: "AGRICULTURAL", label: "Agricultural", icon: Tractor },
  { id: "MIXED", label: "Mixed Use", icon: Layers },
];

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return `GH₵${num.toLocaleString()}`;
}

function getVerificationBadge(level: string) {
  switch (level) {
    case "LEVEL_3_OFFICIAL_VERIFIED":
      return { label: "Verified", variant: "success" as const };
    case "LEVEL_2_PLATFORM_REVIEWED":
      return { label: "Reviewed", variant: "default" as const };
    case "LEVEL_1_DOCS_UPLOADED":
      return { label: "Docs Uploaded", variant: "secondary" as const };
    default:
      return { label: "Unverified", variant: "outline" as const };
  }
}

function ListingCard({ listing }: { listing: Listing }) {
  const badge = getVerificationBadge(listing.verificationLevel);
  const imageUrl = listing.media[0]?.url || "/placeholder-land.svg";

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full group">
        <div className="relative h-40 bg-gray-200">
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute top-2 left-2">
            <Badge variant={badge.variant} className="text-xs">
              {badge.label}
            </Badge>
          </div>
          {listing.negotiable && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                Negotiable
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
            {listing.title}
          </h3>
          <div className="flex items-center mt-1 text-xs text-gray-600">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {listing.town || listing.district}, {listing.region}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-base font-bold text-emerald-600">
              {formatPrice(listing.priceGhs)}
            </p>
            <div className="flex items-center text-xs text-gray-600">
              <Ruler className="h-3 w-3 mr-1" />
              {Number(listing.sizeAcres).toFixed(1)} ac
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between pt-2 border-t text-xs">
            <span className="text-gray-500 capitalize">
              {listing.tenureType.toLowerCase()}
            </span>
            {listing.verificationLevel === "LEVEL_3_OFFICIAL_VERIFIED" && (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ListingSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <div className="h-40 bg-gray-200 animate-pulse" />
      <CardContent className="p-3">
        <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
        <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2 mt-2" />
        <div className="mt-3 flex justify-between">
          <div className="h-5 bg-gray-200 animate-pulse rounded w-24" />
          <div className="h-4 bg-gray-100 animate-pulse rounded w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FeaturedListings() {
  const [activeTab, setActiveTab] = useState("RESIDENTIAL");
  const [listings, setListings] = useState<Record<string, Listing[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async (landType: string) => {
    if (listings[landType]) return; // Already fetched

    setLoading((prev) => ({ ...prev, [landType]: true }));
    setError(null);
    try {
      const res = await fetch(
        `/api/listings?landType=${landType}&limit=12`
      );
      const data = await res.json();
      if (!res.ok) {
        console.error("API error:", data);
        setListings((prev) => ({ ...prev, [landType]: [] }));
      } else {
        setListings((prev) => ({ ...prev, [landType]: data.listings || [] }));
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
      setListings((prev) => ({ ...prev, [landType]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [landType]: false }));
    }
  };

  useEffect(() => {
    fetchListings(activeTab);
  }, [activeTab]);

  const currentListings = listings[activeTab] || [];
  const isLoading = loading[activeTab];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto" data-reveal>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Browse Land by Type
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Find the perfect land for your needs — residential, commercial,
            agricultural, or mixed use.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {landTypeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Listings Grid */}
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <ListingSkeleton key={i} />
              ))}
            </div>
          ) : currentListings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {currentListings.slice(0, 12).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <MapPin className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-3 text-lg font-medium text-gray-900">
                No {landTypeTabs.find((t) => t.id === activeTab)?.label.toLowerCase()} lands available
              </h3>
              <p className="mt-1 text-gray-600">
                Check back soon or browse other categories
              </p>
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="mt-10 text-center">
          <Link href={`/listings?landType=${activeTab}`}>
            <Button size="lg" variant="outline" className="px-8">
              View All{" "}
              {landTypeTabs.find((t) => t.id === activeTab)?.label} Lands
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
