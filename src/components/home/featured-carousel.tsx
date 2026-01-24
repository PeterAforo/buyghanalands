"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Star, MapPin, Shield } from "lucide-react";

interface FeaturedListing {
  id: string;
  title: string;
  price: number;
  location: string;
  size: number;
  image: string;
  verificationLevel: string;
}

interface FeaturedCarouselProps {
  listings: FeaturedListing[];
  className?: string;
}

function FeaturedCarousel({ listings, className }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const itemsPerView = React.useMemo(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }, []);

  const maxIndex = Math.max(0, listings.length - itemsPerView);

  React.useEffect(() => {
    if (!isAutoPlaying || listings.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, maxIndex, listings.length, itemsPerView]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const formatPrice = (amount: number) => {
    if (amount >= 1000000) return `GHS ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `GHS ${(amount / 1000).toFixed(0)}K`;
    return `GHS ${amount.toLocaleString()}`;
  };

  if (listings.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Navigation Buttons */}
      {listings.length > itemsPerView && (
        <>
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out gap-4"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView + 1.5)}%)` }}
        >
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex-shrink-0 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
            >
              <Link
                href={`/listings/${listing.id}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                    <Star className="h-3 w-3 fill-current" />
                    Featured
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-medium rounded-full">
                    <Shield className="h-3 w-3" />
                    Verified
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{listing.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <p className="text-lg font-bold text-green-600">{formatPrice(listing.price)}</p>
                    <p className="text-sm text-gray-500">{listing.size} acres</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {listings.length > itemsPerView && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(idx);
              }}
              className={cn(
                "h-2 rounded-full transition-all",
                currentIndex === idx ? "w-6 bg-green-600" : "w-2 bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { FeaturedCarousel };
