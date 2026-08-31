"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Ruler,
  CheckCircle,
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
  Shield,
  Clock,
  Filter,
  X,
  ChevronDown,
  Grid,
  List,
  LayoutGrid,
} from "lucide-react";

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (num >= 1000000) return `GH₵${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `GH₵${(num / 1000).toFixed(0)}K`;
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

const HERO_IMAGE = "/images/african-nature-scenery-with-road-trees.jpg";

// Demo bare-land imagery used when a listing has no uploaded media
const DEMO_LAND_IMAGES = Array.from(
  { length: 15 },
  (_, i) => `/images/listings/land-${i + 1}.jpg`
);

// Deterministic pick so each listing keeps a stable demo image
function demoLandImage(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return DEMO_LAND_IMAGES[hash % DEMO_LAND_IMAGES.length];
}

function getVerificationBadge(level: string) {
  switch (level) {
    case "LEVEL_3_OFFICIAL_VERIFIED":
      return { label: "Verified", icon: Shield, verified: true };
    case "LEVEL_2_PLATFORM_REVIEWED":
      return { label: "Reviewed", icon: CheckCircle, verified: false };
    case "LEVEL_1_DOCS_UPLOADED":
      return { label: "Docs Uploaded", icon: Clock, verified: false };
    default:
      return { label: "Unverified", icon: Clock, verified: false };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const landTypeIcons: Record<string, any> = {
  RESIDENTIAL: Home,
  COMMERCIAL: Building2,
  INDUSTRIAL: Factory,
  AGRICULTURAL: Tractor,
  MIXED: Layers,
};

function landTypeLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ");
}

// Editorial eyebrow label
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
      <span className="h-px w-6 bg-amber-400" />
      {children}
    </span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
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

  const filteredDistricts = selectedRegion
    ? districts.filter((d) => d.startsWith(selectedRegion))
    : districts;

  // Refs for infinite scroll (avoid stale closures inside the observer)
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);
  const fetchMoreRef = useRef<() => void>(() => {});
  isLoadingRef.current = isLoading;
  hasMoreRef.current = hasMore;

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
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
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
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

  const totalListings = listings.length;
  const verifiedCount = listings.filter(
    (l) => l.verificationLevel === "LEVEL_3_OFFICIAL_VERIFIED"
  ).length;

  // Keep the ref pointing at the latest fetch closure
  fetchMoreRef.current = () => {
    if (!isLoadingRef.current && hasMoreRef.current) fetchListings(false);
  };

  // Auto-load more when the sentinel scrolls into view
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchMoreRef.current();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      {/* ============================================================
          EDITORIAL HERO HEADER
          ============================================================ */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Ghana landscape"
            fill
            priority
            className="object-cover scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f2] via-transparent to-black/30" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-3xl">
            <Eyebrow>{totalListings}+ verified plots available</Eyebrow>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white text-shadow-hero sm:text-5xl lg:text-6xl">
              Find your perfect
              <br />
              land in <span className="italic text-amber-300">Ghana</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 text-shadow-soft">
              Discover verified land listings across all 16 regions — from residential
              plots to commercial and agricultural parcels.
            </p>

            {/* Search console */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by location, title, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="w-full rounded-xl bg-white/95 py-4 pl-12 pr-4 text-gray-900 shadow-xl backdrop-blur-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <button
                onClick={getUserLocation}
                disabled={isLocating}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-4 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                {isLocating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5" />
                )}
                {isLocating ? "Locating..." : "Near Me"}
              </button>
              <button
                onClick={applyFilters}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 py-4 font-semibold text-emerald-950 shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300"
              >
                <Search className="h-5 w-5" />
                Search
              </button>
            </div>

            {userLocation && (
              <p className="mt-4 flex items-center gap-2 text-sm text-amber-200 text-shadow-soft">
                <CheckCircle className="h-4 w-4" />
                Showing lands near your location
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          STICKY TOOLBAR
          ============================================================ */}
      <div className="sticky top-0 z-30 border-b border-emerald-950/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-emerald-700" />
                <span className="text-sm text-gray-600">
                  <span className="font-display text-lg font-semibold text-emerald-950">
                    {totalListings}
                  </span>{" "}
                  results
                </span>
              </div>
              <div className="hidden h-6 w-px bg-gray-200 sm:block" />
              <div className="hidden items-center gap-2 sm:flex">
                <Shield className="h-5 w-5 text-emerald-700" />
                <span className="text-sm text-gray-600">
                  <span className="font-display text-lg font-semibold text-emerald-950">
                    {verifiedCount}
                  </span>{" "}
                  verified
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  applyFilters();
                }}
                className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:block"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="size_low">Size: Small to Large</option>
                <option value="size_high">Size: Large to Small</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  showFilters
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex overflow-hidden rounded-xl border border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-emerald-700 text-white"
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

      {/* ============================================================
          FILTERS PANEL
          ============================================================ */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b border-emerald-950/10 bg-white"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {/* Land Type quick filters */}
              <div className="mb-6">
                <p className="mb-3 text-sm font-medium text-gray-700">Property type</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedLandType("");
                      applyFilters();
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      !selectedLandType
                        ? "bg-emerald-700 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    All Types
                  </button>
                  {landTypes.map((type) => {
                    const Icon = landTypeIcons[type] || Layers;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedLandType(type);
                          applyFilters();
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                          selectedLandType === type
                            ? "bg-emerald-700 text-white shadow-md"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {landTypeLabel(type)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setSelectedConstituency("");
                      setSelectedDistrict("");
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Regions</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Districts</option>
                    {filteredDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Tenure type</label>
                  <select
                    value={tenureType}
                    onChange={(e) => setTenureType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Types</option>
                    <option value="FREEHOLD">Freehold</option>
                    <option value="LEASEHOLD">Leasehold</option>
                    <option value="CUSTOMARY">Customary</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500"
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

              {/* Price & size range */}
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Price range (GH₵)
                  </label>
                  <div className="flex items-center gap-2">
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
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Size (acres)</label>
                  <div className="flex items-center gap-2">
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

              {/* Action row */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
                <label className="group flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-emerald-300"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-emerald-700">
                    Verified listings only
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear all ({activeFilterCount})
                    </Button>
                  )}
                  <Button
                    onClick={applyFilters}
                    className="rounded-xl bg-emerald-700 px-6 hover:bg-emerald-800"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          LISTINGS
          ============================================================ */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {listings.length === 0 && !isLoading ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <MapPin className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-emerald-950">No listings found</h3>
            <p className="mx-auto mt-2 max-w-md text-gray-600">
              {activeFilterCount > 0
                ? "Try adjusting your filters to see more results."
                : "Be the first to list your land on Buy Ghana Lands."}
            </p>
            <div className="mt-6">
              {activeFilterCount > 0 ? (
                <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                  Clear Filters
                </Button>
              ) : (
                <Link href="/listings/create">
                  <Button className="rounded-xl bg-emerald-700 hover:bg-emerald-800">List Your Land</Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
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
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
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

            {/* Infinite-scroll sentinel */}
            {hasMore && (
              <div ref={loadMoreRef} className="mt-12 flex justify-center">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Loading more listings...</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fetchListings(false)}
                    className="rounded-xl border-emerald-200 px-8 text-emerald-700 hover:bg-emerald-50"
                  >
                    Load More Listings
                    <ChevronDown className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
            )}

            {!hasMore && listings.length > 0 && (
              <p className="mt-12 text-center text-sm text-gray-400">
                You&apos;ve reached the end of the results.
              </p>
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
}: {
  listing: Listing;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}) {
  const badge = getVerificationBadge(listing.verificationLevel);
  const BadgeIcon = badge.icon;
  const imageUrl = listing.media[0]?.url || demoLandImage(listing.id);
  const LandIcon = landTypeIcons[listing.landType] || Layers;

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group h-full overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <div className="relative aspect-[16/11] overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Verification badge */}
          <div
            className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
              badge.verified
                ? "bg-amber-400 text-emerald-950"
                : "bg-white/95 text-emerald-700"
            }`}
          >
            <BadgeIcon className="h-3.5 w-3.5" />
            {badge.label}
          </div>

          {/* Save */}
          <button
            onClick={(e) => onToggleSave(listing.id, e)}
            className={`absolute right-4 top-4 rounded-full p-2 backdrop-blur-sm transition-all ${
              isSaved ? "bg-red-500 text-white" : "bg-white/90 text-gray-600 hover:text-red-500"
            }`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          </button>

          {/* Land type pill */}
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur-sm">
            <LandIcon className="h-3.5 w-3.5" />
            {landTypeLabel(listing.landType)}
          </div>

          {listing.negotiable && (
            <div className="absolute bottom-4 right-4 rounded-full bg-emerald-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Negotiable
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            <span className="truncate">
              {listing.town ? `${listing.town}, ` : ""}
              {listing.district}
            </span>
          </div>
          <h3 className="font-display mt-1.5 line-clamp-1 text-lg font-semibold text-emerald-950 transition-colors group-hover:text-emerald-700">
            {listing.title}
          </h3>

          <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">
            <div>
              <p className="font-display text-2xl font-semibold text-emerald-700">
                {formatPrice(listing.priceGhs)}
              </p>
              <p className="text-xs text-gray-400">{formatPriceFull(listing.priceGhs)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-950">
                <Ruler className="h-4 w-4 text-gray-400" />
                {Number(listing.sizeAcres).toFixed(2)} ac
              </div>
              <p className="text-xs capitalize text-gray-400">{listing.tenureType.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>
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
  const imageUrl = listing.media[0]?.url || demoLandImage(listing.id);
  const LandIcon = landTypeIcons[listing.landType] || Layers;

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-52 w-full flex-shrink-0 overflow-hidden bg-gray-100 sm:h-auto sm:w-80">
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <button
              onClick={(e) => onToggleSave(listing.id, e)}
              className={`absolute right-3 top-3 rounded-full p-2 backdrop-blur-sm transition-all ${
                isSaved ? "bg-red-500 text-white" : "bg-white/90 text-gray-600 hover:text-red-500"
              }`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </button>
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-emerald-800 backdrop-blur-sm">
              <LandIcon className="h-3.5 w-3.5" />
              {landTypeLabel(listing.landType)}
            </div>
          </div>

          <div className="flex flex-1 flex-col p-6">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      badge.verified
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <BadgeIcon className="h-3 w-3" />
                    {badge.label}
                  </span>
                  {listing.negotiable && (
                    <Badge variant="secondary">Negotiable</Badge>
                  )}
                </div>
                <h3 className="font-display line-clamp-1 text-xl font-semibold text-emerald-950 transition-colors group-hover:text-emerald-700">
                  {listing.title}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  {listing.town ? `${listing.town}, ` : ""}
                  {listing.district}, {listing.region}
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-semibold text-emerald-700">
                  {formatPrice(listing.priceGhs)}
                </p>
                <p className="text-xs text-gray-400">{formatPriceFull(listing.priceGhs)}</p>
              </div>
            </div>

            <p className="mb-4 line-clamp-2 flex-1 text-sm text-gray-600">{listing.description}</p>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Ruler className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{Number(listing.sizeAcres).toFixed(2)} acres</span>
                </div>
                <span className="capitalize">{listing.tenureType.toLowerCase()}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                View details
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
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
        <div className="min-h-screen bg-[#faf8f2]">
          <div className="h-72 bg-emerald-950" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-3xl bg-gray-200" />
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
