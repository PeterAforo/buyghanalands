"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  Heart, 
  MapPin, 
  Maximize, 
  Shield, 
  ShieldCheck, 
  Star,
  Grid,
  List,
  Map,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SkeletonListingCard } from "@/components/ui/skeleton";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: {
    town?: string | null;
    district: string;
    region: string;
  };
  size: number;
  landType: string;
  tenureType: string;
  verificationLevel: string;
  images: string[];
  isFeatured?: boolean;
  negotiable?: boolean;
}

interface ListingGridProps {
  listings: Listing[];
  viewMode: "grid" | "list" | "map";
  onViewModeChange: (mode: "grid" | "list" | "map") => void;
  isLoading?: boolean;
  favorites?: string[];
  onFavoriteToggle?: (id: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalCount?: number;
  className?: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "size_low", label: "Size: Small to Large" },
  { value: "size_high", label: "Size: Large to Small" },
];

const verificationConfig: Record<string, { label: string; color: string }> = {
  LEVEL_0_UNVERIFIED: { label: "Unverified", color: "bg-gray-100 text-gray-600" },
  LEVEL_1_DOCS_UPLOADED: { label: "Docs Uploaded", color: "bg-blue-100 text-blue-700" },
  LEVEL_2_PLATFORM_REVIEWED: { label: "Verified", color: "bg-green-100 text-green-700" },
  LEVEL_3_OFFICIAL_VERIFIED: { label: "Official", color: "bg-amber-100 text-amber-700" },
};

const landTypeLabels: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  INDUSTRIAL: "Industrial",
  AGRICULTURAL: "Agricultural",
  MIXED: "Mixed Use",
};

function ListingGrid({
  listings,
  viewMode,
  onViewModeChange,
  isLoading,
  favorites = [],
  onFavoriteToggle,
  sortBy,
  onSortChange,
  totalCount,
  className,
}: ListingGridProps) {
  const formatPrice = (amount: number) => {
    if (amount >= 1000000) {
      return `GHS ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `GHS ${(amount / 1000).toFixed(0)}K`;
    }
    return `GHS ${amount.toLocaleString()}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {totalCount !== undefined ? (
            <span>
              Showing <strong>{listings.length}</strong> of{" "}
              <strong>{totalCount}</strong> listings
            </span>
          ) : (
            <span>
              <strong>{listings.length}</strong> listings found
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-green-50 text-green-600"
                  : "bg-white text-gray-400 hover:text-gray-600"
              )}
              title="Grid View"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "p-2 transition-colors border-l border-gray-200",
                viewMode === "list"
                  ? "bg-green-50 text-green-600"
                  : "bg-white text-gray-400 hover:text-gray-600"
              )}
              title="List View"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => onViewModeChange("map")}
              className={cn(
                "p-2 transition-colors border-l border-gray-200",
                viewMode === "map"
                  ? "bg-green-50 text-green-600"
                  : "bg-white text-gray-400 hover:text-gray-600"
              )}
              title="Map View"
            >
              <Map className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && listings.length === 0 && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonListingCard key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && listings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <MapPin className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No listings found
          </h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">
            Try adjusting your filters or search criteria to find more listings.
          </p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCardGrid
              key={listing.id}
              listing={listing}
              isFavorite={favorites.includes(listing.id)}
              onFavoriteToggle={onFavoriteToggle}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && listings.length > 0 && (
        <div className="space-y-4">
          {listings.map((listing) => (
            <ListingCardList
              key={listing.id}
              listing={listing}
              isFavorite={favorites.includes(listing.id)}
              onFavoriteToggle={onFavoriteToggle}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}

      {/* Loading More Indicator */}
      {isLoading && listings.length > 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      )}
    </div>
  );
}

function ListingCardGrid({
  listing,
  isFavorite,
  onFavoriteToggle,
  formatPrice,
}: {
  listing: Listing;
  isFavorite: boolean;
  onFavoriteToggle?: (id: string) => void;
  formatPrice: (amount: number) => string;
}) {
  const verification =
    verificationConfig[listing.verificationLevel] ||
    verificationConfig.LEVEL_0_UNVERIFIED;

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200 hover:-translate-y-1">
      {/* Image */}
      <Link href={`/listings/${listing.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <MapPin className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Featured Badge */}
          {listing.isFeatured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-amber-500 text-white border-0 gap-1">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </Badge>
            </div>
          )}

          {/* Verification Badge */}
          <div className="absolute top-3 right-3">
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                verification.color
              )}
            >
              <ShieldCheck className="h-3 w-3" />
              {verification.label}
            </div>
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onFavoriteToggle?.(listing.id);
        }}
        className={cn(
          "absolute bottom-[calc(100%-3rem-12px)] right-3 p-2 rounded-full transition-all z-10",
          "bg-white/90 backdrop-blur-sm hover:bg-white",
          isFavorite ? "text-red-500" : "text-gray-600 hover:text-red-500"
        )}
      >
        <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
      </button>

      {/* Content */}
      <div className="p-4">
        {/* Land Type & Tenure */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {landTypeLabels[listing.landType] || listing.landType}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {listing.tenureType.charAt(0) +
              listing.tenureType.slice(1).toLowerCase()}
          </Badge>
          {listing.negotiable && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
              Negotiable
            </Badge>
          )}
        </div>

        {/* Title */}
        <Link href={`/listings/${listing.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-green-600 transition-colors">
            {listing.title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {listing.location.town ? `${listing.location.town}, ` : ""}
            {listing.location.district}, {listing.location.region}
          </span>
        </div>

        {/* Size */}
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <Maximize className="h-3.5 w-3.5" />
          <span>{listing.size.toFixed(2)} acres</span>
        </div>

        {/* Price */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-lg font-bold text-green-600">
            {formatPrice(listing.price)}
          </p>
          <Link
            href={`/listings/${listing.id}`}
            className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ListingCardList({
  listing,
  isFavorite,
  onFavoriteToggle,
  formatPrice,
}: {
  listing: Listing;
  isFavorite: boolean;
  onFavoriteToggle?: (id: string) => void;
  formatPrice: (amount: number) => string;
}) {
  const verification =
    verificationConfig[listing.verificationLevel] ||
    verificationConfig.LEVEL_0_UNVERIFIED;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <Link
          href={`/listings/${listing.id}`}
          className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0"
        >
          <div className="absolute inset-0 bg-gray-100">
            {listing.images.length > 0 ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Featured Badge */}
          {listing.isFeatured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-amber-500 text-white border-0 gap-1">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </Badge>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    verification.color
                  )}
                >
                  <ShieldCheck className="h-3 w-3" />
                  {verification.label}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {landTypeLabels[listing.landType] || listing.landType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {listing.tenureType.charAt(0) +
                    listing.tenureType.slice(1).toLowerCase()}
                </Badge>
                {listing.negotiable && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                    Negotiable
                  </Badge>
                )}
              </div>

              {/* Title */}
              <Link href={`/listings/${listing.id}`}>
                <h3 className="font-semibold text-gray-900 hover:text-green-600 transition-colors">
                  {listing.title}
                </h3>
              </Link>

              {/* Location */}
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {listing.location.town ? `${listing.location.town}, ` : ""}
                  {listing.location.district}, {listing.location.region}
                </span>
              </div>

              {/* Size */}
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <Maximize className="h-3.5 w-3.5" />
                <span>{listing.size.toFixed(2)} acres</span>
              </div>
            </div>

            {/* Price & Actions */}
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-green-600">
                {formatPrice(listing.price)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onFavoriteToggle?.(listing.id);
                  }}
                  className={cn(
                    "p-2 rounded-lg border transition-colors",
                    isFavorite
                      ? "text-red-500 border-red-200 bg-red-50"
                      : "text-gray-400 border-gray-200 hover:text-red-500 hover:border-red-200"
                  )}
                >
                  <Heart
                    className={cn("h-5 w-5", isFavorite && "fill-current")}
                  />
                </button>
                <Link
                  href={`/listings/${listing.id}`}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ListingGrid };
