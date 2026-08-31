"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, MapPin, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { ghanaRegions } from "@/lib/ghana-locations";

interface HeroSearchProps {
  className?: string;
  variant?: "hero" | "compact";
}

const LAND_TYPES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "AGRICULTURAL", label: "Agricultural" },
  { value: "MIXED", label: "Mixed Use" },
];

const PRICE_RANGES = [
  { value: "0-50000", label: "Under GHS 50K" },
  { value: "50000-100000", label: "GHS 50K - 100K" },
  { value: "100000-500000", label: "GHS 100K - 500K" },
  { value: "500000-1000000", label: "GHS 500K - 1M" },
  { value: "1000000-5000000", label: "GHS 1M - 5M" },
  { value: "5000000-", label: "Above GHS 5M" },
];

const PURPOSE_TABS = [
  { value: "BUY", label: "Buy Land" },
  { value: "LEASE", label: "Lease" },
  { value: "VERIFY", label: "Verify Land" },
];

function HeroSearch({ className, variant = "hero" }: HeroSearchProps) {
  const router = useRouter();
  const [purpose, setPurpose] = React.useState("BUY");
  const [keyword, setKeyword] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [landType, setLandType] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = React.useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = React.useState(false);
  const [priceDropdownOpen, setPriceDropdownOpen] = React.useState(false);

  const handleSearch = () => {
    if (purpose === "VERIFY") {
      router.push("/verification");
      return;
    }
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (region) params.set("region", region);
    if (landType.length > 0) params.set("landType", landType.join(","));
    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }
    router.push(`/listings?${params.toString()}`);
  };

  const toggleLandType = (type: string) => {
    setLandType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setRegion("");
    setLandType([]);
    setPriceRange("");
  };

  const hasFilters = region || landType.length > 0 || priceRange;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} data-testid="hero-search">
      {/* Purpose Tabs */}
      <div className="flex items-center gap-1 mb-[-1px] pl-1">
        {PURPOSE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPurpose(tab.value)}
            className={cn(
              "relative px-5 py-3 text-sm font-semibold rounded-t-xl transition-colors",
              purpose === tab.value
                ? "bg-white text-emerald-800"
                : "bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Search Bar */}
      <div className="bg-white rounded-2xl rounded-tl-none shadow-2xl p-2 md:p-3">
        {/* Keyword field */}
        <div className="relative mb-2 md:mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            data-testid="hero-search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={
              purpose === "VERIFY"
                ? "Enter a plot to request professional verification…"
                : "Search by area, town, or landmark — e.g. East Legon, Tema…"
            }
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:gap-0">
          {/* Location Dropdown */}
          <div className="relative flex-1 md:border-r border-gray-200">
            <button
              onClick={() => {
                setRegionDropdownOpen(!regionDropdownOpen);
                setTypeDropdownOpen(false);
                setPriceDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
            >
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Location</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {region || "All Regions"}
                </p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", regionDropdownOpen && "rotate-180")} />
            </button>

            {regionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setRegion("");
                    setRegionDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                    !region && "bg-green-50 text-green-700"
                  )}
                >
                  All Regions
                </button>
                {ghanaRegions.map((r: { name: string }) => (
                  <button
                    key={r.name}
                    onClick={() => {
                      setRegion(r.name);
                      setRegionDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                      region === r.name && "bg-green-50 text-green-700"
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Land Type Dropdown */}
          <div className="relative flex-1 md:border-r border-gray-200">
            <button
              onClick={() => {
                setTypeDropdownOpen(!typeDropdownOpen);
                setRegionDropdownOpen(false);
                setPriceDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="h-5 w-5 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-green-600">T</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Land Type</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {landType.length > 0 ? `${landType.length} selected` : "All Types"}
                </p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", typeDropdownOpen && "rotate-180")} />
            </button>

            {typeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                {LAND_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => toggleLandType(type.value)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{type.label}</span>
                    {landType.includes(type.value) && (
                      <div className="h-4 w-4 rounded bg-green-600 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => {
                setPriceDropdownOpen(!priceDropdownOpen);
                setRegionDropdownOpen(false);
                setTypeDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="h-5 w-5 rounded bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-600">₵</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Price Range</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {priceRange
                    ? PRICE_RANGES.find((p) => p.value === priceRange)?.label
                    : "Any Price"}
                </p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", priceDropdownOpen && "rotate-180")} />
            </button>

            {priceDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <button
                  onClick={() => {
                    setPriceRange("");
                    setPriceDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                    !priceRange && "bg-green-50 text-green-700"
                  )}
                >
                  Any Price
                </button>
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      setPriceRange(range.value);
                      setPriceDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                      priceRange === range.value && "bg-green-50 text-green-700"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <div className="md:pl-2">
            <button
              onClick={handleSearch}
              data-testid="hero-search-button"
              className="w-full md:w-auto md:h-full flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-700/25 transition-colors"
            >
              <Search className="h-5 w-5" />
              <span>{purpose === "VERIFY" ? "Request Verification" : "Search Land"}</span>
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
            <span className="text-xs text-gray-500">Active filters:</span>
            {region && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                {region}
                <button onClick={() => setRegion("")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {landType.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs"
              >
                {LAND_TYPES.find((t) => t.value === type)?.label}
                <button onClick={() => toggleLandType(type)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {priceRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                {PRICE_RANGES.find((p) => p.value === priceRange)?.label}
                <button onClick={() => setPriceRange("")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { HeroSearch };
