"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRegions } from "@/lib/ghana-locations";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";

interface ListingFiltersProps {
  onFilter?: (filters: FilterValues) => void;
}

export interface FilterValues {
  search?: string;
  region?: string;
  landType?: string;
  tenureType?: string;
  minPrice?: string;
  maxPrice?: string;
  minSize?: string;
  maxSize?: string;
  verificationLevel?: string;
  sortBy?: string;
}

export function ListingFilters({ onFilter }: ListingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  
  const [filters, setFilters] = useState<FilterValues>({
    search: searchParams.get("search") || "",
    region: searchParams.get("region") || "",
    landType: searchParams.get("landType") || "",
    tenureType: searchParams.get("tenureType") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minSize: searchParams.get("minSize") || "",
    maxSize: searchParams.get("maxSize") || "",
    verificationLevel: searchParams.get("verificationLevel") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const regions = getRegions();

  const handleChange = (key: keyof FilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/listings?${params.toString()}`);
    onFilter?.(filters);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      region: "",
      landType: "",
      tenureType: "",
      minPrice: "",
      maxPrice: "",
      minSize: "",
      maxSize: "",
      verificationLevel: "",
      sortBy: "newest",
    });
    router.push("/listings");
    onFilter?.({});
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value && key !== "sortBy"
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                More
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title, location..."
              value={filters.search}
              onChange={(e) => handleChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={applyFilters}>Search</Button>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select
            value={filters.region}
            onChange={(e) => handleChange("region", e.target.value)}
          >
            <option value="">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>

          <Select
            value={filters.landType}
            onChange={(e) => handleChange("landType", e.target.value)}
          >
            <option value="">All Land Types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="AGRICULTURAL">Agricultural</option>
            <option value="MIXED">Mixed Use</option>
          </Select>

          <Select
            value={filters.tenureType}
            onChange={(e) => handleChange("tenureType", e.target.value)}
          >
            <option value="">All Tenure Types</option>
            <option value="FREEHOLD">Freehold</option>
            <option value="LEASEHOLD">Leasehold</option>
            <option value="CUSTOMARY">Customary</option>
          </Select>

          <Select
            value={filters.sortBy}
            onChange={(e) => handleChange("sortBy", e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="size_low">Size: Small to Large</option>
            <option value="size_high">Size: Large to Small</option>
          </Select>
        </div>

        {/* Expanded Filters */}
        {expanded && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price (GH₵)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => handleChange("minPrice", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price (GH₵)
                </label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={(e) => handleChange("maxPrice", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Size (acres)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={filters.minSize}
                  onChange={(e) => handleChange("minSize", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Size (acres)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Any"
                  value={filters.maxSize}
                  onChange={(e) => handleChange("maxSize", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select
                value={filters.verificationLevel}
                onChange={(e) => handleChange("verificationLevel", e.target.value)}
              >
                <option value="">Any Verification</option>
                <option value="LEVEL_1_BASIC">Basic Verified</option>
                <option value="LEVEL_2_DOCS">Document Verified</option>
                <option value="LEVEL_3_SITE">Site Verified</option>
                <option value="LEVEL_4_FULL">Fully Verified</option>
              </Select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {hasActiveFilters && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
