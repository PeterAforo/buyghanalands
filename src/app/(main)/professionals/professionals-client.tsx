"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Star,
  CheckCircle,
  Briefcase,
  Search,
  Loader2,
} from "lucide-react";

interface Professional {
  id: string;
  professionalType: string;
  companyName: string | null;
  baseLocation: string | null;
  licenseStatus: string;
  yearsExperience: number | null;
  avgRating: number;
  reviewCount: number;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  services: { id: string; title: string }[];
}

interface ProfessionalsClientProps {
  initialProfessionals: Professional[];
  professionalTypes: { value: string; label: string }[];
}

export function ProfessionalsClient({
  initialProfessionals,
  professionalTypes,
}: ProfessionalsClientProps) {
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfessionals = async (type: string, query: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set("category", type);
      if (query) params.set("search", query);

      const res = await fetch(`/api/professionals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProfessionals(data.professionals || data);
      }
    } catch (error) {
      console.error("Error fetching professionals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeFilter = (type: string) => {
    const newType = type === selectedType ? "" : type;
    setSelectedType(newType);
    fetchProfessionals(newType, searchQuery);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfessionals(selectedType, searchQuery);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-emerald-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold">Professional Services</h1>
          <p className="mt-2 text-emerald-100">
            Connect with verified surveyors, lawyers, architects, and more
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search professionals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTypeFilter("")}
                className={!selectedType ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}
              >
                All
              </Button>
              {professionalTypes.map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTypeFilter(type.value)}
                  className={selectedType === type.value ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Professionals Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No professionals found
            </h3>
            <p className="mt-2 text-gray-600">
              {selectedType || searchQuery
                ? "Try adjusting your filters"
                : "Professional profiles will appear here once registered"}
            </p>
            {(selectedType || searchQuery) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSelectedType("");
                  setSearchQuery("");
                  fetchProfessionals("", "");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {professionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  return (
    <Link href={`/professionals/${professional.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              {professional.user.avatarUrl ? (
                <img
                  src={professional.user.avatarUrl}
                  alt={professional.user.fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <Briefcase className="h-8 w-8 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">
                {professional.user.fullName}
              </h3>
              <p className="text-sm text-emerald-600 capitalize">
                {professional.professionalType.toLowerCase()}
              </p>
              {professional.companyName && (
                <p className="text-sm text-gray-500">{professional.companyName}</p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="mt-4 flex items-center gap-2">
            {professional.avgRating > 0 ? (
              <>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(professional.avgRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {professional.avgRating.toFixed(1)} ({professional.reviewCount} reviews)
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500">No reviews yet</span>
            )}
          </div>

          {/* Location */}
          {professional.baseLocation && (
            <div className="mt-3 flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              {professional.baseLocation}
            </div>
          )}

          {/* Verification */}
          <div className="mt-3 flex items-center gap-2">
            {professional.licenseStatus === "VERIFIED" ? (
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Unverified</Badge>
            )}
            {professional.yearsExperience && (
              <Badge variant="outline">{professional.yearsExperience}+ years</Badge>
            )}
          </div>

          {/* Services */}
          {professional.services.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-2">Services:</p>
              <div className="flex flex-wrap gap-1">
                {professional.services.map((service) => (
                  <Badge key={service.id} variant="secondary" className="text-xs">
                    {service.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
