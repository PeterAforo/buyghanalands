import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Star,
  CheckCircle,
  Briefcase,
  Filter,
  Search,
} from "lucide-react";

async function getProfessionals() {
  const professionals = await prisma.professionalProfile.findMany({
    where: {
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      services: {
        where: { isPublished: true },
        take: 3,
      },
      reviewsReceived: {
        select: { rating: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return professionals.map((p) => ({
    ...p,
    avgRating:
      p.reviewsReceived.length > 0
        ? p.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) /
          p.reviewsReceived.length
        : 0,
    reviewCount: p.reviewsReceived.length,
  }));
}

const professionalTypes = [
  { value: "SURVEYOR", label: "Surveyors" },
  { value: "LAWYER", label: "Lawyers" },
  { value: "ARCHITECT", label: "Architects" },
  { value: "ENGINEER", label: "Engineers" },
  { value: "PLANNER", label: "Planners" },
  { value: "VALUER", label: "Valuers" },
];

export default async function ProfessionalsPage() {
  const professionals = await getProfessionals();

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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="bg-emerald-50 border-emerald-200 text-emerald-700">
              All Professionals
            </Button>
            {professionalTypes.map((type) => (
              <Button key={type.value} variant="outline" size="sm">
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Professionals Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {professionals.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No professionals yet
            </h3>
            <p className="mt-2 text-gray-600">
              Professional profiles will appear here once registered
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {professionals.map((professional) => (
              <Link
                key={professional.id}
                href={`/professionals/${professional.id}`}
              >
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
                          <p className="text-sm text-gray-500">
                            {professional.companyName}
                          </p>
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
                            {professional.avgRating.toFixed(1)} (
                            {professional.reviewCount} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">
                          No reviews yet
                        </span>
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
                        <Badge variant="outline">
                          {professional.yearsExperience}+ years
                        </Badge>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
