"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  X, 
  ChevronDown, 
  SlidersHorizontal,
  Home,
  Building2,
  Factory,
  Wheat,
  Layers,
  MapPin,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceRangeSlider } from "@/components/ui/price-range-slider";
import { ghanaRegions } from "@/lib/ghana-locations";

interface ListingFiltersProps {
  filters: {
    region: string;
    district: string;
    landTypes: string[];
    priceRange: [number, number];
    sizeRange: [number, number];
    tenureType: string;
    verificationLevel: string;
    verifiedOnly: boolean;
  };
  onFiltersChange: (filters: ListingFiltersProps["filters"]) => void;
  onApply: () => void;
  onClear: () => void;
  className?: string;
}

const LAND_TYPES = [
  { value: "RESIDENTIAL", label: "Residential", icon: Home },
  { value: "COMMERCIAL", label: "Commercial", icon: Building2 },
  { value: "INDUSTRIAL", label: "Industrial", icon: Factory },
  { value: "AGRICULTURAL", label: "Agricultural", icon: Wheat },
  { value: "MIXED", label: "Mixed Use", icon: Layers },
];

const TENURE_TYPES = [
  { value: "", label: "All Types" },
  { value: "FREEHOLD", label: "Freehold" },
  { value: "LEASEHOLD", label: "Leasehold" },
  { value: "CUSTOMARY", label: "Customary" },
];

const VERIFICATION_LEVELS = [
  { value: "", label: "All Levels" },
  { value: "LEVEL_1_DOCS_UPLOADED", label: "Docs Uploaded" },
  { value: "LEVEL_2_PLATFORM_REVIEWED", label: "Platform Verified" },
  { value: "LEVEL_3_OFFICIAL_VERIFIED", label: "Official Verified" },
];

function ListingFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  className,
}: ListingFiltersProps) {
  const [expandedSections, setExpandedSections] = React.useState<string[]>([
    "location",
    "landType",
    "price",
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const updateFilter = <K extends keyof ListingFiltersProps["filters"]>(
    key: K,
    value: ListingFiltersProps["filters"][K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleLandType = (type: string) => {
    const newTypes = filters.landTypes.includes(type)
      ? filters.landTypes.filter((t) => t !== type)
      : [...filters.landTypes, type];
    updateFilter("landTypes", newTypes);
  };

  const activeFilterCount = [
    filters.region,
    filters.district,
    filters.landTypes.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000,
    filters.sizeRange[0] > 0 || filters.sizeRange[1] < 100,
    filters.tenureType,
    filters.verificationLevel,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  const selectedRegion = ghanaRegions.find((r: { name: string }) => r.name === filters.region);

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {/* Location Section */}
        <FilterSection
          title="Location"
          isExpanded={expandedSections.includes("location")}
          onToggle={() => toggleSection("location")}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                Region
              </label>
              <select
                value={filters.region}
                onChange={(e) => {
                  updateFilter("region", e.target.value);
                  updateFilter("district", "");
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Regions</option>
                {ghanaRegions.map((region: { name: string }) => (
                  <option key={region.name} value={region.name}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {filters.region && selectedRegion && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  District
                </label>
                <select
                  value={filters.district}
                  onChange={(e) => updateFilter("district", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Districts</option>
                  {(selectedRegion as { name: string; districts?: string[] }).districts?.map((district: string) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </FilterSection>

        {/* Land Type Section */}
        <FilterSection
          title="Land Type"
          isExpanded={expandedSections.includes("landType")}
          onToggle={() => toggleSection("landType")}
        >
          <div className="space-y-2">
            {LAND_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => toggleLandType(value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  filters.landTypes.includes(value)
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{label}</span>
                {filters.landTypes.includes(value) && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Range Section */}
        <FilterSection
          title="Price Range"
          isExpanded={expandedSections.includes("price")}
          onToggle={() => toggleSection("price")}
        >
          <PriceRangeSlider
            min={0}
            max={10000000}
            step={50000}
            value={filters.priceRange}
            onChange={(value) => updateFilter("priceRange", value)}
          />
        </FilterSection>

        {/* Size Range Section */}
        <FilterSection
          title="Size (Acres)"
          isExpanded={expandedSections.includes("size")}
          onToggle={() => toggleSection("size")}
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Min</label>
              <input
                type="number"
                value={filters.sizeRange[0] || ""}
                onChange={(e) =>
                  updateFilter("sizeRange", [
                    Number(e.target.value) || 0,
                    filters.sizeRange[1],
                  ])
                }
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Max</label>
              <input
                type="number"
                value={filters.sizeRange[1] === 100 ? "" : filters.sizeRange[1]}
                onChange={(e) =>
                  updateFilter("sizeRange", [
                    filters.sizeRange[0],
                    Number(e.target.value) || 100,
                  ])
                }
                placeholder="Any"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </FilterSection>

        {/* Tenure Type Section */}
        <FilterSection
          title="Tenure Type"
          isExpanded={expandedSections.includes("tenure")}
          onToggle={() => toggleSection("tenure")}
        >
          <div className="space-y-2">
            {TENURE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateFilter("tenureType", value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  filters.tenureType === value
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <span className="flex-1 text-left">{label}</span>
                {filters.tenureType === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Verification Level Section */}
        <FilterSection
          title="Verification"
          isExpanded={expandedSections.includes("verification")}
          onToggle={() => toggleSection("verification")}
        >
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => updateFilter("verifiedOnly", e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Verified only</span>
            </label>

            <div className="space-y-2">
              {VERIFICATION_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateFilter("verificationLevel", value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    filters.verificationLevel === value
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <span className="flex-1 text-left">{label}</span>
                  {filters.verificationLevel === value && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>
      </div>

      {/* Apply Button */}
      <div className="p-4 border-t border-gray-100">
        <Button onClick={onApply} className="w-full">
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>
      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export { ListingFilters };
