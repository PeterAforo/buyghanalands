"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Heart,
  Share2,
  Eye,
  TrendingUp,
  Shield,
  Clock,
  Filter,
  X,
  ChevronDown,
  Sparkles,
  Map,
  LayoutGrid,
  ArrowUpDown,
  Bookmark,
  Phone,
  MessageCircle,
} from "lucide-react";

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (num >= 1000000) {
    return `GH₵${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `GH₵${(num / 1000).toFixed(0)}K`;
  }
  return `GH₵${num.toLocaleString()}`;
}

function formatPriceFull(price: string | number) {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return `GH₵${num.toLocaleString()}`;
}

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
      return { label: "Verified", variant: "success" as const, icon: Shield };
    case "LEVEL_2_PLATFORM_REVIEWED":
      return { label: "Reviewed", variant: "default" as const, icon: CheckCircle };
    case "LEVEL_1_DOCS_UPLOADED":
      return { label: "Docs Uploaded", variant: "secondary" as const, icon: Clock };
    default:
      return { label: "Unverified", variant: "outline" as const, icon: Clock };
  }
}

const landTypeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  RESIDENTIAL: { icon: Home, color: "text-blue-600", bgColor: "bg-blue-50" },
  COMMERCIAL: { icon: Building2, color: "text-purple-600", bgColor: "bg-purple-50" },
  INDUSTRIAL: { icon: Factory, color: "text-orange-600", bgColor: "bg-orange-50" },
  AGRICULTURAL: { icon: Tractor, color: "text-green-600", bgColor: "bg-green-50" },
  MIXED: { icon: Layers, color: "text-amber-600", bgColor: "bg-amber-50" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function ListingsClientInner({
  initialListings,
  regions,
  constituencies,
  districts,
  landTypes,
}: ListingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialListings.length >= 20);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);

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
    ? constituencies.filter((c) => c.startsWith(selectedRegion))
    : constituencies;
  const filteredDistricts = selectedRegion
    ? districts.filter((d) => d.startsWith(selectedRegion))
    : districts;

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
      params.set("radius", "50");
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

  const toggleSaveListing = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedListings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

  // Stats for the header
  const totalListings = listings.length;
  const verifiedCount = listings.filter(
    (l) => l.verificationLevel === "LEVEL_3_OFFICIAL_VERIFIED"
  ).length;

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-emerald-200 text-sm font-medium">
                {totalListings}+ Properties Available
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">
                Land in Ghana
              </span>
            </h1>
            <p className="text-lg text-emerald-100 max-w-2xl mb-8">
              Discover verified land listings across all 16 regions. From residential plots to
              commercial properties, find exactly what you&apos;re looking for.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by location, title, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                />
              </div>
              <Button
                onClick={getUserLocation}
                disabled={isLocating}
                className="px-6 py-4 h-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl backdrop-blur-sm flex items-center gap-2 transition-all"
              >
                {isLocating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5" />
                )}
                {isLocating ? "Locating..." : "Near Me"}
              </Button>
              <Button
                onClick={applyFilters}
                className="px-8 py-4 h-auto bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-2xl shadow-lg transition-all"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>

            {userLocation && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-emerald-300 text-sm flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Showing lands near your location
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white border-b shadow-sm -mt-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <LayoutGrid className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalListings}</p>
                  <p className="text-xs text-gray-500">Total Listings</p>
                </div>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{verifiedCount}</p>
                  <p className="text-xs text-gray-500">Verified</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`${showFilters ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <div className="flex border rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border-b overflow-hidden"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {/* Land Type Quick Filters */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Property Type</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedLandType("");
                      applyFilters();
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      !selectedLandType
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    All Types
                  </button>
                  {landTypes.map((type) => {
                    const config = landTypeConfig[type] || {
                      icon: Layers,
                      color: "text-gray-600",
                      bgColor: "bg-gray-50",
                    };
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedLandType(type);
                          applyFilters();
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          selectedLandType === type
                            ? "bg-emerald-600 text-white shadow-md"
                            : `${config.bgColor} ${config.color} hover:shadow-md`
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setSelectedConstituency("");
                      setSelectedDistrict("");
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="">All Regions</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="">All Districts</option>
                    {filteredDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenure Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tenure Type
                  </label>
                  <select
                    value={tenureType}
                    onChange={(e) => setTenureType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="">All Types</option>
                    <option value="FREEHOLD">Freehold</option>
                    <option value="LEASEHOLD">Leasehold</option>
                    <option value="CUSTOMARY">Customary</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
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

              {/* Price & Size Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price Range (GH₵)
                  </label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="flex-1 rounded-xl"
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="flex-1 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Size (Acres)
                  </label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minSize}
                      onChange={(e) => setMinSize(e.target.value)}
                      className="flex-1 rounded-xl"
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxSize}
                      onChange={(e) => setMaxSize(e.target.value)}
                      className="flex-1 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                    Verified listings only
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" onClick={clearFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <X className="h-4 w-4 mr-2" />
                      Clear all ({activeFilterCount})
                    </Button>
                  )}
                  <Button onClick={applyFilters} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listings */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {listings.length === 0 && !isLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {activeFilterCount > 0
                ? "Try adjusting your filters to see more results"
                : "Be the first to list your land on Buy Ghana Lands"}
            </p>
            {activeFilterCount > 0 ? (
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                Clear Filters
              </Button>
            ) : (
              <Link href="/listings/create">
                <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                  List Your Land
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {listings.map((listing) => (
                  <motion.div key={listing.id} variants={itemVariants}>
                    <ListingCard
                      listing={listing}
                      isSaved={savedListings.has(listing.id)}
                      onToggleSave={toggleSaveListing}
                      isHovered={hoveredListing === listing.id}
                      onHover={setHoveredListing}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* List View */
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {listings.map((listing) => (
                  <motion.div key={listing.id} variants={itemVariants}>
                    <ListingListItem
                      listing={listing}
                      isSaved={savedListings.has(listing.id)}
                      onToggleSave={toggleSaveListing}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fetchListings(false)}
                  disabled={isLoading}
                  className="rounded-xl px-8"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Listings
                      <ChevronDown className="ml-2 h-5 w-5" />
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

function ListingCard({
  listing,
  isSaved,
  onToggleSave,
  isHovered,
  onHover,
}: {
  listing: Listing;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const badge = getVerificationBadge(listing.verificationLevel);
  const BadgeIcon = badge.icon;
  const imageUrl = listing.media[0]?.url || "/placeholder-land.svg";
  const landConfig = landTypeConfig[listing.landType] || {
    icon: Layers,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  };
  const LandIcon = landConfig.icon;

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card
        className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-0 shadow-md rounded-2xl"
        onMouseEnter={() => onHover(listing.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="relative h-52 bg-gray-200 overflow-hidden">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <Badge
              variant={badge.variant}
              className="flex items-center gap-1 backdrop-blur-sm bg-white/90"
            >
              <BadgeIcon className="h-3 w-3" />
              {badge.label}
            </Badge>
            <button
              onClick={(e) => onToggleSave(listing.id, e)}
              className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                isSaved
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500"
              }`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Land Type Badge */}
          <div className="absolute bottom-3 left-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${landConfig.bgColor} ${landConfig.color}`}
            >
              <LandIcon className="h-3.5 w-3.5" />
              {listing.landType.charAt(0) + listing.landType.slice(1).toLowerCase()}
            </div>
          </div>

          {listing.negotiable && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="backdrop-blur-sm bg-white/90">
                Negotiable
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
              {listing.title}
            </h3>
            <div className="flex items-center mt-1.5 text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1 text-emerald-500" />
              {listing.town ? `${listing.town}, ` : ""}
              {listing.district}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{formatPrice(listing.priceGhs)}</p>
              <p className="text-xs text-gray-500">{formatPriceFull(listing.priceGhs)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <Ruler className="h-4 w-4 mr-1 text-gray-400" />
                {Number(listing.sizeAcres).toFixed(2)} acres
              </div>
              <p className="text-xs text-gray-500 capitalize">{listing.tenureType.toLowerCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ListingListItem({
  listing,
  isSaved,
  onToggleSave,
}: {
  listing: Listing;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}) {
  const badge = getVerificationBadge(listing.verificationLevel);
  const BadgeIcon = badge.icon;
  const imageUrl = listing.media[0]?.url || "/placeholder-land.svg";
  const landConfig = landTypeConfig[listing.landType] || {
    icon: Layers,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  };
  const LandIcon = landConfig.icon;

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md rounded-2xl">
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-72 h-48 sm:h-auto bg-gray-200 overflow-hidden flex-shrink-0">
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 sm:bg-gradient-to-t sm:from-black/40 sm:via-transparent sm:to-transparent" />

            {/* Save Button */}
            <button
              onClick={(e) => onToggleSave(listing.id, e)}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
                isSaved
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500"
              }`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </button>

            {/* Land Type Badge */}
            <div className="absolute bottom-3 left-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${landConfig.bgColor} ${landConfig.color}`}
              >
                <LandIcon className="h-3.5 w-3.5" />
                {listing.landType.charAt(0) + listing.landType.slice(1).toLowerCase()}
              </div>
            </div>
          </div>

          <CardContent className="flex-1 p-5">
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={badge.variant}
                      className="flex items-center gap-1"
                    >
                      <BadgeIcon className="h-3 w-3" />
                      {badge.label}
                    </Badge>
                    {listing.negotiable && <Badge variant="secondary">Negotiable</Badge>}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {listing.title}
                  </h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1 text-emerald-500" />
                    {listing.town ? `${listing.town}, ` : ""}
                    {listing.district}, {listing.region}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">{formatPrice(listing.priceGhs)}</p>
                  <p className="text-xs text-gray-500">{formatPriceFull(listing.priceGhs)}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                {listing.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Ruler className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{Number(listing.sizeAcres).toFixed(2)} acres</span>
                  </div>
                  <div className="flex items-center gap-1 capitalize">
                    <span>{listing.tenureType.toLowerCase()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

export function ListingsClient({
  initialListings,
  regions,
  constituencies,
  districts,
  landTypes,
}: ListingsClientProps) {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 min-h-screen">
          <div className="bg-emerald-900 h-64" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
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

