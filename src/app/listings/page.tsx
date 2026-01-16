import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Ruler,
  CheckCircle,
  Filter,
  Grid,
  List,
  ChevronRight,
} from "lucide-react";

async function getListings() {
  const listings = await prisma.listing.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          kycTier: true,
        },
      },
      media: {
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 20,
  });

  return listings;
}

function getVerificationBadge(level: string) {
  switch (level) {
    case "LEVEL_3_OFFICIAL_VERIFIED":
      return { label: "Verified", variant: "success" as const };
    case "LEVEL_2_PLATFORM_REVIEWED":
      return { label: "Reviewed", variant: "default" as const };
    case "LEVEL_1_DOCS_UPLOADED":
      return { label: "Docs Uploaded", variant: "secondary" as const };
    default:
      return { label: "Unverified", variant: "outline" as const };
  }
}

export default async function ListingsPage() {
  const listings = await getListings();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Land Listings
              </h1>
              <p className="mt-1 text-gray-600">
                Browse verified land for sale across Ghana
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <div className="flex border rounded-md">
                <button className="p-2 bg-emerald-50 text-emerald-600">
                  <Grid className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {listings.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No listings yet
            </h3>
            <p className="mt-2 text-gray-600">
              Be the first to list your land on Buy Ghana Lands
            </p>
            <Link href="/listings/create">
              <Button className="mt-4">List Your Land</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const badge = getVerificationBadge(listing.verificationLevel);
              const imageUrl =
                listing.media[0]?.url || "/placeholder-land.svg";

              return (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="relative h-48 bg-gray-200">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      {listing.negotiable && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary">Negotiable</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {listing.title}
                          </h3>
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            {listing.town}, {listing.district}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xl font-bold text-emerald-600">
                            {formatPrice(listing.priceGhs)}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Ruler className="h-4 w-4 mr-1" />
                          {Number(listing.sizeAcres).toFixed(2)} acres
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600">
                            {listing.landType.toLowerCase().replace("_", " ")}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-gray-600">
                            {listing.tenureType.toLowerCase()}
                          </span>
                        </div>
                        {listing.verificationLevel ===
                          "LEVEL_3_OFFICIAL_VERIFIED" && (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {listings.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline">
              Load More Listings
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
