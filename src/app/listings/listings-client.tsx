"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
function formatPrice(price: string | number) {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `GH₵${num.toLocaleString()}`;
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Ruler,
  CheckCircle,
  Filter,
  Grid,
  List,
  ChevronRight,
  X,
  Loader2,
  Search,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
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
  seller: {
    id: string;
    fullName: string;
    kycTier: string;
  };
}

interface ListingsClientProps {
  initialListings: Listing[];
  regions: string[];
  landTypes: string[];
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

export function ListingsClient({ initialListings, regions, landTypes }: ListingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialListings.length >= 20);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get("region") || "");
  const [selectedLandType, setSelectedLandType] = useState(searchParams.get("landType") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");

  const fetchListings = async (reset = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedRegion) params.set("region", selectedRegion);
      if (selectedLandType) params.set("landType", selectedLandType);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (verifiedOnly) params.set("verified", "true");
      params.set("page", reset ? "1" : String(page + 1));
      params.set("limit", "20");

      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();

      if (reset) {
        setListings(data.listings || []);
        setPage(1);
      } else {
        setListings((prev) => [...prev, ...(data.listings || [])]);
        setPage((p) => p + 1);
      }
      setHasMore((data.listings || []).length >= 20);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // Update URL with filters
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedRegion) params.set("region", selectedRegion);
    if (selectedLandType) params.set("landType", selectedLandType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (verifiedOnly) params.set("verified", "true");
    
    router.push(`/listings?${params.toString()}`);
    fetchListings(true);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("");
    setSelectedLandType("");
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    router.push("/listings");
    fetchListings(true);
    setShowFilters(false);
  };

  const activeFilterCount = [
    searchQuery,
    selectedRegion,
    selectedLandType,
    minPrice,
    maxPrice,
    verifiedOnly,
  ].filter(Boolean).length;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Land Listings</h1>
              <p className="mt-1 text-gray-600">
                Browse verified land for sale across Ghana
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className={activeFilterCount > 0 ? "border-emerald-500 text-emerald-600" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full px-2">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <div className="flex border rounded-md">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filter Listings</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search listings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Regions</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {/* Land Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Land Type</label>
                  <select
                    value={selectedLandType}
                    onChange={(e) => setSelectedLandType(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Types</option>
                    {landTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.toLowerCase().replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium mb-1">Min Price (GH₵)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium mb-1">Max Price (GH₵)</label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>

                {/* Verified Only */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Verified listings only</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={applyFilters} className="flex-1">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {listings.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No listings found
            </h3>
            <p className="mt-2 text-gray-600">
              {activeFilterCount > 0
                ? "Try adjusting your filters"
                : "Be the first to list your land on Buy Ghana Lands"}
            </p>
            {activeFilterCount > 0 ? (
              <Button className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link href="/listings/create">
                <Button className="mt-4">List Your Land</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {listings.map((listing) => (
                  <ListingListItem key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchListings(false)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Listings
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const badge = getVerificationBadge(listing.verificationLevel);
  const imageUrl = listing.media[0]?.url || "/placeholder-land.svg";

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative h-48 bg-gray-200">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute top-3 left-3">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          {listing.negotiable && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary">Negotiable</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {listing.title}
              </h3>
              <div className="flex items-center mt-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {listing.town}, {listing.district}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-emerald-600">
                {formatPrice(listing.priceGhs)}
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Ruler className="h-4 w-4 mr-1" />
              {Number(listing.sizeAcres).toFixed(2)} acres
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t">
            <div className="flex items-center text-sm">
              <span className="text-gray-600">
                {listing.landType.toLowerCase().replace("_", " ")}
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-600">
                {listing.tenureType.toLowerCase()}
              </span>
            </div>
            {listing.verificationLevel === "LEVEL_3_OFFICIAL_VERIFIED" && (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ListingListItem({ listing }: { listing: Listing }) {
  const badge = getVerificationBadge(listing.verificationLevel);
  const imageUrl = listing.media[0]?.url || "/placeholder-land.svg";

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex">
          <div
            className="w-48 h-36 bg-gray-200 bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <CardContent className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  {listing.negotiable && (
                    <Badge variant="secondary">Negotiable</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {listing.town}, {listing.district}, {listing.region}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-600">
                  {formatPrice(listing.priceGhs)}
                </p>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Ruler className="h-4 w-4 mr-1" />
                  {Number(listing.sizeAcres).toFixed(2)} acres
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <span>{listing.landType.toLowerCase().replace("_", " ")}</span>
              <span className="mx-2">•</span>
              <span>{listing.tenureType.toLowerCase()}</span>
              {listing.verificationLevel === "LEVEL_3_OFFICIAL_VERIFIED" && (
                <>
                  <span className="mx-2">•</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-600">Verified</span>
                </>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
