"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, List, Grid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Listing {
  id: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  priceGhs: number;
  region: string;
  district: string;
  landType: string;
  sizeAcres: number;
}

interface ListingsMapViewProps {
  listings: Listing[];
  className?: string;
  onListingClick?: (listing: Listing) => void;
}

export function ListingsMapView({ listings, className = "", onListingClick }: ListingsMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Filter listings with valid coordinates
  const mappableListings = listings.filter(
    (l) => l.latitude !== null && l.longitude !== null
  );

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mappableListings.length === 0) return;

    const loadMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Calculate bounds
      const bounds = L.latLngBounds(
        mappableListings.map((l) => [l.latitude!, l.longitude!])
      );

      // Initialize map
      const map = L.map(mapRef.current!, {
        scrollWheelZoom: true,
      }).fitBounds(bounds, { padding: [50, 50] });

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add markers for each listing
      mappableListings.forEach((listing) => {
        const priceFormatted = `GH₵${listing.priceGhs.toLocaleString()}`;
        
        // Custom price marker
        const priceIcon = L.divIcon({
          className: "price-marker",
          html: `
            <div style="
              background: #059669;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">
              ${priceFormatted}
            </div>
          `,
          iconSize: [80, 30],
          iconAnchor: [40, 30],
        });

        const marker = L.marker([listing.latitude!, listing.longitude!], {
          icon: priceIcon,
        }).addTo(map);

        // Popup content
        marker.bindPopup(`
          <div style="min-width: 200px; padding: 8px;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px;">${listing.title}</h3>
            <p style="margin: 0 0 4px; font-size: 12px; color: #666;">
              ${listing.district}, ${listing.region}
            </p>
            <p style="margin: 0 0 4px; font-size: 12px;">
              <strong>${listing.sizeAcres} acres</strong> • ${listing.landType}
            </p>
            <p style="margin: 8px 0 0; font-size: 16px; font-weight: bold; color: #059669;">
              ${priceFormatted}
            </p>
            <a href="/listings/${listing.id}" style="
              display: block;
              margin-top: 8px;
              padding: 6px 12px;
              background: #059669;
              color: white;
              text-align: center;
              border-radius: 4px;
              text-decoration: none;
              font-size: 12px;
            ">View Details</a>
          </div>
        `);

        marker.on("click", () => {
          setSelectedListing(listing);
          if (onListingClick) onListingClick(listing);
        });
      });

      mapInstanceRef.current = map;
      setIsLoaded(true);
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mappableListings, onListingClick]);

  if (mappableListings.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600">No listings with location data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px]"
        style={{ background: "#e5e7eb" }}
      />

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-emerald-600 mx-auto animate-spin" />
            <p className="text-sm text-gray-500 mt-2">Loading map...</p>
          </div>
        </div>
      )}

      {/* Listing count badge */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className="bg-white px-3 py-1.5 rounded-full shadow-md text-sm font-medium">
          {mappableListings.length} listings on map
        </div>
      </div>
    </div>
  );
}
