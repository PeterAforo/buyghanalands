"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Star,
  MapPin,
  Briefcase,
  CheckCircle,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProfessionalType =
  | "SURVEYOR"
  | "LAWYER"
  | "ARCHITECT"
  | "ENGINEER"
  | "PLANNER"
  | "VALUER"
  | "OTHER";

interface Professional {
  id: string;
  userId: string;
  user: {
    fullName: string;
    avatar?: string;
  };
  professionalType: ProfessionalType;
  companyName?: string;
  bio?: string;
  yearsExperience?: number;
  serviceRegions: string[];
  baseLocation?: string;
  licenseNumber?: string;
  licenseStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
  startingPrice?: number;
}

interface ProfessionalCardProps {
  professional: Professional;
  variant?: "grid" | "list";
  className?: string;
}

const professionalTypeLabels: Record<ProfessionalType, string> = {
  SURVEYOR: "Surveyor",
  LAWYER: "Lawyer",
  ARCHITECT: "Architect",
  ENGINEER: "Engineer",
  PLANNER: "Town Planner",
  VALUER: "Valuer",
  OTHER: "Professional",
};

const professionalTypeColors: Record<ProfessionalType, string> = {
  SURVEYOR: "bg-blue-100 text-blue-700",
  LAWYER: "bg-purple-100 text-purple-700",
  ARCHITECT: "bg-amber-100 text-amber-700",
  ENGINEER: "bg-orange-100 text-orange-700",
  PLANNER: "bg-green-100 text-green-700",
  VALUER: "bg-teal-100 text-teal-700",
  OTHER: "bg-gray-100 text-gray-700",
};

function ProfessionalCard({
  professional,
  variant = "grid",
  className,
}: ProfessionalCardProps) {
  const isVerified = professional.licenseStatus === "VERIFIED";

  if (variant === "list") {
    return (
      <div
        className={cn(
          "bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300",
          className
        )}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar
                src={professional.user.avatar}
                fallback={professional.user.fullName}
                size="xl"
              />
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/professionals/${professional.id}`}
                  className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
                >
                  {professional.user.fullName}
                </Link>
                <Badge
                  className={cn(
                    "text-xs",
                    professionalTypeColors[professional.professionalType]
                  )}
                >
                  {professionalTypeLabels[professional.professionalType]}
                </Badge>
              </div>

              {professional.companyName && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {professional.companyName}
                </p>
              )}

              {/* Rating & Stats */}
              <div className="flex items-center gap-4 mt-2">
                {professional.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900">
                      {professional.rating.toFixed(1)}
                    </span>
                    {professional.reviewCount && (
                      <span className="text-sm text-gray-500">
                        ({professional.reviewCount} reviews)
                      </span>
                    )}
                  </div>
                )}

                {professional.completedJobs && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Briefcase className="h-4 w-4" />
                    {professional.completedJobs} jobs
                  </div>
                )}

                {professional.yearsExperience && (
                  <div className="text-sm text-gray-500">
                    {professional.yearsExperience}+ years exp.
                  </div>
                )}
              </div>

              {/* Location */}
              {professional.baseLocation && (
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {professional.baseLocation}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:ml-auto">
            {professional.startingPrice && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Starting from</p>
                <p className="text-lg font-bold text-green-600">
                  GHS {professional.startingPrice.toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
              <Link href={`/professionals/${professional.id}`}>
                <Button size="sm">View Profile</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bio */}
        {professional.bio && (
          <p className="text-sm text-gray-600 mt-4 line-clamp-2">
            {professional.bio}
          </p>
        )}

        {/* Service Regions */}
        {professional.serviceRegions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-500">Serves:</span>
            {professional.serviceRegions.slice(0, 3).map((region) => (
              <Badge key={region} variant="outline" className="text-xs">
                {region}
              </Badge>
            ))}
            {professional.serviceRegions.length > 3 && (
              <span className="text-xs text-gray-500">
                +{professional.serviceRegions.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Grid variant
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar
            src={professional.user.avatar}
            fallback={professional.user.fullName}
            size="lg"
          />
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={`/professionals/${professional.id}`}
            className="font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-1"
          >
            {professional.user.fullName}
          </Link>
          <Badge
            className={cn(
              "text-xs mt-1",
              professionalTypeColors[professional.professionalType]
            )}
          >
            {professionalTypeLabels[professional.professionalType]}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mt-4">
        {professional.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400 fill-current" />
            <span className="text-sm font-medium">{professional.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">
              ({professional.reviewCount || 0})
            </span>
          </div>
        )}

        {professional.yearsExperience && (
          <div className="text-sm text-gray-500">
            {professional.yearsExperience}+ yrs
          </div>
        )}
      </div>

      {/* Location */}
      {professional.baseLocation && (
        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{professional.baseLocation}</span>
        </div>
      )}

      {/* Price & Action */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        {professional.startingPrice ? (
          <div>
            <p className="text-xs text-gray-500">From</p>
            <p className="font-bold text-green-600">
              GHS {professional.startingPrice.toLocaleString()}
            </p>
          </div>
        ) : (
          <div />
        )}

        <Link href={`/professionals/${professional.id}`}>
          <Button size="sm">View Profile</Button>
        </Link>
      </div>
    </div>
  );
}

export { ProfessionalCard };
export type { Professional, ProfessionalType };
