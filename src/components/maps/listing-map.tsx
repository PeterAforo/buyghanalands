"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Maximize2, Minimize2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListingMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  zoom?: number;
  className?: string;
  showFullscreenButton?: boolean;
}

export function ListingMap({
  latitude,
  longitude,
  title,
  zoom = 15,
  className = "",
  showFullscreenButton = true,
}: ListingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Dynamically import Leaflet
    const loadMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Initialize map if not already done
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!, {
          center: [latitude, longitude],
          zoom,
          scrollWheelZoom: false,
        });

        // Add tile layer
        const streetLayer = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }
        );

        const satelliteLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
          }
        );

        streetLayer.addTo(map);

        // Custom marker icon
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              background: #059669;
              width: 36px;
              height: 36px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        // Add marker
        const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        
        if (title) {
          marker.bindPopup(`
            <div style="padding: 8px; min-width: 150px;">
              <strong style="font-size: 14px;">${title}</strong>
              <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
                ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
              </p>
            </div>
          `);
        }

        mapInstanceRef.current = { map, streetLayer, satelliteLayer, marker };
        setIsLoaded(true);
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, zoom, title]);

  // Handle map type change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map, streetLayer, satelliteLayer } = mapInstanceRef.current;

    if (mapType === "satellite") {
      map.removeLayer(streetLayer);
      satelliteLayer.addTo(map);
    } else {
      map.removeLayer(satelliteLayer);
      streetLayer.addTo(map);
    }
  }, [mapType]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!mapRef.current) return;

    if (!isFullscreen) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Invalidate map size after fullscreen change
      setTimeout(() => {
        mapInstanceRef.current?.map?.invalidateSize();
      }, 100);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
        className="w-full h-full min-h-[300px]"
        style={{ background: "#e5e7eb" }}
      />
      
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto animate-pulse" />
            <p className="text-sm text-gray-500 mt-2">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {isLoaded && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white shadow-md"
            onClick={() => setMapType(mapType === "street" ? "satellite" : "street")}
          >
            <Layers className="h-4 w-4" />
          </Button>
          {showFullscreenButton && (
            <Button
              size="sm"
              variant="secondary"
              className="bg-white shadow-md"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
