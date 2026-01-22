"use client";

import dynamic from "next/dynamic";

const ListingMap = dynamic(
  () => import("@/components/maps/listing-map").then((mod) => mod.ListingMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface ListingMapWrapperProps {
  latitude: number;
  longitude: number;
  title: string;
}

export function ListingMapWrapper({ latitude, longitude, title }: ListingMapWrapperProps) {
  return (
    <ListingMap
      latitude={latitude}
      longitude={longitude}
      title={title}
      className="h-[300px] rounded-lg border"
    />
  );
}
