"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getRegions, getConstituencies, getDistricts } from "@/lib/ghana-locations";
import { MapPin, Navigation, Loader2 } from "lucide-react";

export interface LocationData {
  region: string;
  constituency: string;
  district: string;
  town?: string;
  latitude?: string;
  longitude?: string;
}

interface LocationSelectorProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
  showTown?: boolean;
  showCoordinates?: boolean;
  errors?: {
    region?: string;
    constituency?: string;
    district?: string;
    town?: string;
    latitude?: string;
    longitude?: string;
  };
}

export function LocationSelector({
  value,
  onChange,
  showTown = true,
  showCoordinates = true,
  errors = {},
}: LocationSelectorProps) {
  const [regions] = useState<string[]>(getRegions());
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Update constituencies when region changes
  useEffect(() => {
    if (value.region) {
      const newConstituencies = getConstituencies(value.region);
      setConstituencies(newConstituencies);
      // Reset constituency and district if region changed
      if (!newConstituencies.includes(value.constituency)) {
        onChange({ ...value, constituency: "", district: "" });
      }
    } else {
      setConstituencies([]);
      setDistricts([]);
    }
  }, [value.region]);

  // Update districts when constituency changes
  useEffect(() => {
    if (value.region && value.constituency) {
      const newDistricts = getDistricts(value.region, value.constituency);
      setDistricts(newDistricts);
      // Reset district if constituency changed
      if (!newDistricts.includes(value.district)) {
        onChange({ ...value, district: "" });
      }
    } else {
      setDistricts([]);
    }
  }, [value.constituency]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value;
    onChange({
      ...value,
      region: newRegion,
      constituency: "",
      district: "",
    });
  };

  const handleConstituencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newConstituency = e.target.value;
    onChange({
      ...value,
      constituency: newConstituency,
      district: "",
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      district: e.target.value,
    });
  };

  const handleTownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      town: e.target.value,
    });
  };

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      latitude: e.target.value,
    });
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      longitude: e.target.value,
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          ...value,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Region */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Region <span className="text-red-500">*</span>
        </label>
        <Select
          value={value.region}
          onChange={handleRegionChange}
          error={errors.region}
        >
          <option value="">Select Region</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </Select>
      </div>

      {/* Constituency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Constituency <span className="text-red-500">*</span>
        </label>
        <Select
          value={value.constituency}
          onChange={handleConstituencyChange}
          disabled={!value.region}
          error={errors.constituency}
        >
          <option value="">
            {value.region ? "Select Constituency" : "Select Region first"}
          </option>
          {constituencies.map((constituency) => (
            <option key={constituency} value={constituency}>
              {constituency}
            </option>
          ))}
        </Select>
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          District <span className="text-red-500">*</span>
        </label>
        <Select
          value={value.district}
          onChange={handleDistrictChange}
          disabled={!value.constituency}
          error={errors.district}
        >
          <option value="">
            {value.constituency ? "Select District" : "Select Constituency first"}
          </option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </Select>
      </div>

      {/* Town/Area */}
      {showTown && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Town/Area
          </label>
          <Input
            type="text"
            placeholder="Enter town or area name"
            value={value.town || ""}
            onChange={handleTownChange}
            error={errors.town}
          />
        </div>
      )}

      {/* Coordinates */}
      {showCoordinates && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <Input
                type="text"
                placeholder="e.g. 5.6037"
                value={value.latitude || ""}
                onChange={handleLatitudeChange}
                error={errors.latitude}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <Input
                type="text"
                placeholder="e.g. -0.1870"
                value={value.longitude || ""}
                onChange={handleLongitudeChange}
                error={errors.longitude}
              />
            </div>
          </div>

          {/* Get Current Location Button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Get Current Location
                </>
              )}
            </Button>
          </div>

          {locationError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {locationError}
            </p>
          )}

          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            You can get coordinates from Google Maps by right-clicking on the location
          </p>
        </>
      )}
    </div>
  );
}
