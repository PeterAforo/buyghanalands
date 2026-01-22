"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Grid,
  List,
  ChevronRight,
  Loader2,
  Search,
  Navigation,
  Home,
  Building2,
  Factory,
  Tractor,
  Layers,
  SlidersHorizontal,
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
  constituencies: string[];
  districts: string[];
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

function ListingsClientInner({ initialListings, regions, constituencies, districts, landTypes }: ListingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialListings.length >= 20);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get("region") || "");
  const [selectedLandType, setSelectedLandType] = useState(searchParams.get("landType") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minSize, setMinSize] = useState(searchParams.get("minSize") || "");
  const [maxSize, setMaxSize] = useState(searchParams.get("maxSize") || "");
  const [tenureType, setTenureType] = useState(searchParams.get("tenureType") || "");
  const [selectedConstituency, setSelectedConstituency] = useState(searchParams.get("constituency") || "");
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get("district") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");

  // Filter constituencies and districts based on selected region
  const filteredConstituencies = selectedRegion 
    ? constituencies.filter(c => c.startsWith(selectedRegion)) 
    : constituencies;
  const filteredDistricts = selectedRegion 
    ? districts.filter(d => d.startsWith(selectedRegion)) 
    : districts;

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Get user location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
        // Trigger search with location
        fetchListingsNearby(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please enable location services.");
        setIsLocating(false);
      }
    );
  };

  const fetchListingsNearby = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("lat", lat.toString());
      params.set("lng", lng.toString());
      params.set("radius", "50"); // 50km radius
      params.set("limit", "20");

      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      setListings(data.listings || []);
      setPage(1);
      setHasMore((data.listings || []).length >= 20);
    } catch (error) {
      console.error("Error fetching nearby listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    if (minSize) params.set("minSize", minSize);
    if (maxSize) params.set("maxSize", maxSize);
    if (tenureType) params.set("tenureType", tenureType);
    if (selectedConstituency) params.set("constituency", selectedConstituency);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (verifiedOnly) params.set("verified", "true");
    if (sortBy) params.set("sortBy", sortBy);
    
    router.push(`/listings?${params.toString()}`);
    fetchListings(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("");
    setSelectedLandType("");
    setMinPrice("");
    setMaxPrice("");
    setMinSize("");
    setMaxSize("");
    setTenureType("");
    setSelectedConstituency("");
    setSelectedDistrict("");
    setVerifiedOnly(false);
    setSortBy("newest");
    setUserLocation(null);
    router.push("/listings");
    fetchListings(true);
  };

  const activeFilterCount = [
    searchQuery,
    selectedRegion,
    selectedLandType,
    minPrice,
    maxPrice,
    minSize,
    maxSize,
    tenureType,
    selectedConstituency,
    selectedDistrict,
    verifiedOnly,
    userLocation,
  ].filter(Boolean).length;

  const landTypeIcons: Record<string, any> = {
    RESIDENTIAL: Home,
    COMMERCIAL: Building2,
    INDUSTRIAL: Factory,
    AGRICULTURAL: Tractor,
    MIXED: Layers,
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Header with Background Image */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
        
        <div className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 transition-all duration-700 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-lg" style={{ color: '#ffffff' }}>
            Find Your Perfect Land
          </h1>
          <p className="mt-4 text-xl max-w-2xl drop-shadow-md" style={{ color: '#ffffff' }}>
            Browse verified land listings across all 16 regions of Ghana. Use our advanced filters to find exactly what you&apos;re looking for.
          </p>
          
          {/* Quick Search Bar */}
          <div className={`mt-8 flex flex-col sm:flex-row gap-3 transition-all duration-700 delay-200 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location, title, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white shadow-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Button 
              onClick={getUserLocation}
              disabled={isLocating}
              className="px-6 py-4 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg flex items-center gap-2"
            >
              {isLocating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Navigation className="h-5 w-5" />
              )}
              {isLocating ? "Locating..." : "Near Me"}
            </Button>
          </div>
          
          {userLocation && (
            <p className="mt-3 text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Showing lands near your location
            </p>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel - Always Visible */}
      <div className={`bg-white border-b shadow-sm transition-all duration-700 delay-300 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Land Type Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setSelectedLandType(""); applyFilters(); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedLandType 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Types
            </button>
            {landTypes.map((type) => {
              const Icon = landTypeIcons[type] || Layers;
              return (
                <button
                  key={type}
                  onClick={() => { setSelectedLandType(type); applyFilters(); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedLandType === type 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ")}
                </button>
              );
            })}
          </div>

          {/* Filter Controls Row 1 - Location */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-4">
            {/* Region */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedConstituency("");
                  setSelectedDistrict("");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Regions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Constituency */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Constituency</label>
              <select
                value={selectedConstituency}
                onChange={(e) => setSelectedConstituency(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Constituencies</option>
                {filteredConstituencies.map((constituency) => (
                  <option key={constituency} value={constituency}>{constituency}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Districts</option>
                {filteredDistricts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Tenure Type */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Tenure Type</label>
              <select
                value={tenureType}
                onChange={(e) => setTenureType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Types</option>
                <option value="FREEHOLD">Freehold</option>
                <option value="LEASEHOLD">Leasehold</option>
                <option value="CUSTOMARY">Customary</option>
              </select>
            </div>
          </div>

          {/* Filter Controls Row 2 - Price & Size */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Price Range */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Price Range (GH₵)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="flex-1"
                />
                <span className="self-center text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Size Range */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Size (Acres)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minSize}
                  onChange={(e) => setMinSize(e.target.value)}
                  className="flex-1"
                />
                <span className="self-center text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxSize}
                  onChange={(e) => setMaxSize(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="size_low">Size: Small to Large</option>
                <option value="size_high">Size: Large to Small</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Verified listings only</span>
              </label>
              
              {activeFilterCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all filters ({activeFilterCount})
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={applyFilters} className="bg-emerald-600 hover:bg-emerald-700">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-emerald-50 text-emerald-600" : "bg-white text-gray-400 hover:text-gray-600"}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-emerald-50 text-emerald-600" : "bg-white text-gray-400 hover:text-gray-600"}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
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
                {listings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className="transition-all duration-500"
                    style={{
                      opacity: isAnimated ? 1 : 0,
                      transform: isAnimated ? 'translateY(0)' : 'translateY(20px)',
                      transitionDelay: `${Math.min(index * 100, 500)}ms`,
                    }}
                  >
                    <ListingCard listing={listing} />
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {listings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className="transition-all duration-500"
                    style={{
                      opacity: isAnimated ? 1 : 0,
                      transform: isAnimated ? 'translateY(0)' : 'translateY(20px)',
                      transitionDelay: `${Math.min(index * 100, 500)}ms`,
                    }}
                  >
                    <ListingListItem listing={listing} />
                  </div>
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

export function ListingsClient({ initialListings, regions, constituencies, districts, landTypes }: ListingsClientProps) {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-64 bg-gray-100 animate-pulse rounded mt-2" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    }>
      <ListingsClientInner 
        initialListings={initialListings} 
        regions={regions}
        constituencies={constituencies}
        districts={districts}
        landTypes={landTypes} 
      />
    </Suspense>
  );
}
