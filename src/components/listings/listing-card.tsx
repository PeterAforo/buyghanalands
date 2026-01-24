"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Heart, MapPin, Maximize, Shield, ShieldCheck, ShieldAlert, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: {
    town?: string;
    district: string;
    region: string;
  };
  size: number;
  landType: string;
  tenureType: string;
  verificationLevel: string;
  images: string[];
  isFeatured?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  className?: string;
}

const verificationConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  LEVEL_0_UNVERIFIED: { label: "Unverified", icon: ShieldAlert, color: "bg-gray-100 text-gray-600" },
  LEVEL_1_DOCS_UPLOADED: { label: "Docs Uploaded", icon: Shield, color: "bg-blue-100 text-blue-700" },
  LEVEL_2_PLATFORM_REVIEWED: { label: "Verified", icon: ShieldCheck, color: "bg-green-100 text-green-700" },
  LEVEL_3_OFFICIAL_VERIFIED: { label: "Official", icon: ShieldCheck, color: "bg-amber-100 text-amber-700" },
};

const landTypeLabels: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  INDUSTRIAL: "Industrial",
  AGRICULTURAL: "Agricultural",
  MIXED: "Mixed Use",
};

function ListingCard({
  id,
  title,
  price,
  location,
  size,
  landType,
  tenureType,
  verificationLevel,
  images,
  isFeatured = false,
  isFavorite = false,
  onFavoriteToggle,
  className,
}: ListingCardProps) {
  const [currentImage, setCurrentImage] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const verification = verificationConfig[verificationLevel] || verificationConfig.LEVEL_0_UNVERIFIED;
  const VerificationIcon = verification.icon;

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
    <div
      className={cn(
        "group relative bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:border-gray-200 hover:-translate-y-1",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Link href={`/listings/${id}`}>
          {images.length > 0 ? (
            <img
              src={images[currentImage]}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <MapPin className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </Link>

        {/* Image Navigation Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImage(idx);
                }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  currentImage === idx ? "bg-white w-4" : "bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-amber-500 text-white border-0 gap-1">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          </div>
        )}

        {/* Verification Badge */}
        <div className="absolute top-3 right-3">
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", verification.color)}>
            <VerificationIcon className="h-3 w-3" />
            {verification.label}
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onFavoriteToggle?.(id);
          }}
          className={cn(
            "absolute bottom-3 right-3 p-2 rounded-full transition-all",
            "bg-white/90 backdrop-blur-sm hover:bg-white",
            isFavorite ? "text-red-500" : "text-gray-600 hover:text-red-500"
          )}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Land Type & Tenure */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {landTypeLabels[landType] || landType}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {tenureType.charAt(0) + tenureType.slice(1).toLowerCase()}
          </Badge>
        </div>

        {/* Title */}
        <Link href={`/listings/${id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-green-600 transition-colors">
            {title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {location.town ? `${location.town}, ` : ""}{location.district}, {location.region}
          </span>
        </div>

        {/* Size */}
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <Maximize className="h-3.5 w-3.5" />
          <span>{size.toFixed(2)} acres</span>
        </div>

        {/* Price */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-green-600">{formatPrice(price)}</p>
          </div>
          <Link
            href={`/listings/${id}`}
            className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export { ListingCard };
