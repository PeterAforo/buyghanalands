import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Ruler,
  Calendar,
  User,
  CheckCircle,
  Shield,
  FileText,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { ListingActions } from "./listing-actions";

async function getListing(id: string) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        region: true,
        district: true,
        town: true,
        landType: true,
        tenureType: true,
        leaseDurationYears: true,
        sizeAcres: true,
        totalPlots: true,
        priceGhs: true,
        negotiable: true,
        verificationLevel: true,
        publishedAt: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            kycTier: true,
            createdAt: true,
          },
        },
        media: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            url: true,
          },
        },
        documents: {
          where: {
            accessPolicy: { in: ["PUBLIC", "LOGGED_IN_REDACTED"] },
          },
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    if (!listing) return null;

    // Serialize BigInt, Decimal, and Date fields
    return {
      ...listing,
      sizeAcres: listing.sizeAcres.toString(),
      priceGhs: listing.priceGhs.toString(),
      publishedAt: listing.publishedAt?.toISOString() ?? null,
      seller: {
        ...listing.seller,
        createdAt: listing.seller.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching listing:", error);
    return null;
  }
}

function getVerificationInfo(level: string) {
  switch (level) {
    case "LEVEL_3_OFFICIAL_VERIFIED":
      return {
        label: "Lands Commission Verified",
        description: "This listing has been officially verified by the Lands Commission",
        variant: "success" as const,
        icon: Shield,
      };
    case "LEVEL_2_PLATFORM_REVIEWED":
      return {
        label: "Platform Reviewed",
        description: "Our team has reviewed the documents for this listing",
        variant: "default" as const,
        icon: CheckCircle,
      };
    case "LEVEL_1_DOCS_UPLOADED":
      return {
        label: "Documents Uploaded",
        description: "The seller has uploaded supporting documents",
        variant: "secondary" as const,
        icon: FileText,
      };
    default:
      return {
        label: "Unverified",
        description: "This listing has not been verified yet",
        variant: "outline" as const,
        icon: AlertTriangle,
      };
  }
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, session] = await Promise.all([
    getListing(id),
    auth(),
  ]);

  if (!listing) {
    notFound();
  }

  const verification = getVerificationInfo(listing.verificationLevel);
  const VerificationIcon = verification.icon;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/listings"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Listings
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="relative h-96 bg-gray-200">
                {listing.media.length > 0 ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${listing.media[0].url})` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <MapPin className="h-16 w-16" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant={verification.variant}>
                    {verification.label}
                  </Badge>
                  {listing.negotiable && (
                    <Badge variant="secondary">Negotiable</Badge>
                  )}
                </div>
                <ListingActions 
                  listingId={listing.id}
                  listingTitle={listing.title}
                  sellerId={listing.seller.id}
                  sellerName={listing.seller.fullName}
                  sellerPhone={listing.seller.phone}
                  priceGhs={listing.priceGhs.toString()}
                  isLoggedIn={!!session?.user}
                  isOwnListing={session?.user?.id === listing.seller.id}
                  variant="icons"
                />
              </div>
              {listing.media.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {listing.media.slice(1, 5).map((media) => (
                    <div
                      key={media.id}
                      className="flex-shrink-0 w-24 h-24 rounded-lg bg-gray-200 bg-cover bg-center cursor-pointer hover:opacity-80"
                      style={{ backgroundImage: `url(${media.url})` }}
                    />
                  ))}
                  {listing.media.length > 5 && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gray-800 flex items-center justify-center text-white text-sm font-medium cursor-pointer">
                      +{listing.media.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{listing.title}</CardTitle>
                    <div className="flex items-center mt-2 text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {listing.town}, {listing.district}, {listing.region}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">
                      {formatPrice(listing.priceGhs)}
                    </p>
                    {listing.totalPlots > 1 && (
                      <p className="text-sm text-gray-500">
                        {formatPrice(
                          Number(listing.priceGhs) / listing.totalPlots
                        )}{" "}
                        per plot
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Ruler className="h-5 w-5 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Size</p>
                    <p className="font-semibold">
                      {Number(listing.sizeAcres).toFixed(2)} acres
                    </p>
                    {listing.totalPlots > 1 && (
                      <p className="text-sm text-gray-500">
                        ({listing.totalPlots} plots)
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Land Type</p>
                    <p className="font-semibold capitalize">
                      {listing.landType.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Shield className="h-5 w-5 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Tenure</p>
                    <p className="font-semibold capitalize">
                      {listing.tenureType.toLowerCase()}
                    </p>
                    {listing.leaseDurationYears && (
                      <p className="text-sm text-gray-500">
                        {listing.leaseDurationYears} years
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Listed</p>
                    <p className="font-semibold">
                      {listing.publishedAt
                        ? formatDate(listing.publishedAt)
                        : "Recently"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>

                {/* Verification Status */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        listing.verificationLevel === "LEVEL_3_OFFICIAL_VERIFIED"
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <VerificationIcon
                        className={`h-5 w-5 ${
                          listing.verificationLevel === "LEVEL_3_OFFICIAL_VERIFIED"
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {verification.label}
                      </p>
                      <p className="text-sm text-gray-600">
                        {verification.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                {listing.documents.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Available Documents
                    </h3>
                    <div className="space-y-2">
                      {listing.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm capitalize">
                              {doc.type.toLowerCase().replace(/_/g, " ")}
                            </span>
                          </div>
                          <Badge variant="secondary">Available</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{listing.seller.fullName}</p>
                    <p className="text-sm text-gray-500">
                      Member since{" "}
                      {formatDate(listing.seller.createdAt)}
                    </p>
                  </div>
                </div>

                {listing.seller.kycTier !== "TIER_0_OTP" && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Verified Seller</span>
                  </div>
                )}

                <ListingActions 
                  listingId={listing.id}
                  listingTitle={listing.title}
                  sellerId={listing.seller.id}
                  sellerName={listing.seller.fullName}
                  sellerPhone={listing.seller.phone}
                  priceGhs={listing.priceGhs.toString()}
                  isLoggedIn={!!session?.user}
                  isOwnListing={session?.user?.id === listing.seller.id}
                  variant="contact"
                />
              </CardContent>
            </Card>

            {/* Make Offer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interested?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Make an offer on this property. Your payment will be protected
                  in escrow until the transaction is complete.
                </p>
                <ListingActions 
                  listingId={listing.id}
                  listingTitle={listing.title}
                  sellerId={listing.seller.id}
                  sellerName={listing.seller.fullName}
                  sellerPhone={listing.seller.phone}
                  priceGhs={listing.priceGhs.toString()}
                  isLoggedIn={!!session?.user}
                  isOwnListing={session?.user?.id === listing.seller.id}
                  variant="offer"
                />
                <p className="text-xs text-center text-gray-500">
                  Protected by Buy Ghana Lands Escrow
                </p>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Safety Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Always verify documents before payment
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Use our escrow protection for all payments
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Visit the land in person before buying
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Hire a professional surveyor for verification
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
