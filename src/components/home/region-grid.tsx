"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MapPin, ArrowRight } from "lucide-react";

interface RegionCardProps {
  name: string;
  listingCount: number;
  image?: string;
}

const REGION_IMAGES: Record<string, string> = {
  "Greater Accra": "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop",
  "Ashanti": "https://images.unsplash.com/photo-1590845947670-c009801ffa74?w=400&h=300&fit=crop",
  "Western": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  "Central": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  "Eastern": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  "Northern": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  "Volta": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  "Upper East": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  "Upper West": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
  "Brong-Ahafo": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
};

function RegionCard({ name, listingCount, image }: RegionCardProps) {
  const regionImage = image || REGION_IMAGES[name] || REGION_IMAGES["Greater Accra"];

  return (
    <Link
      href={`/listings?region=${encodeURIComponent(name)}`}
      className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-gray-100"
    >
      <img
        src={regionImage}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
          <MapPin className="h-4 w-4" />
          <span>{listingCount} listings</span>
        </div>
        <h3 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors">
          {name}
        </h3>
      </div>

      <div className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-white" />
      </div>
    </Link>
  );
}

interface RegionGridProps {
  regions: { name: string; listingCount: number }[];
  className?: string;
}

function RegionGrid({ regions, className }: RegionGridProps) {
  const topRegions = regions.slice(0, 8);

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {topRegions.map((region) => (
        <RegionCard key={region.name} {...region} />
      ))}
    </div>
  );
}

export { RegionGrid, RegionCard };
