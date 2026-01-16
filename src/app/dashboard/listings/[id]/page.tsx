"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Upload,
  CheckCircle,
  Clock,
  MapPin,
  Ruler,
  Calendar,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  status: string;
  region: string;
  constituency: string | null;
  district: string;
  town: string | null;
  priceGhs: string;
  sizeAcres: string;
  landType: string;
  tenureType: string;
  verificationLevel: string;
  negotiable: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return { label: "Published", variant: "success" as const };
    case "DRAFT":
      return { label: "Draft", variant: "secondary" as const };
    case "PENDING_REVIEW":
      return { label: "Pending Review", variant: "warning" as const };
    case "SUSPENDED":
      return { label: "Suspended", variant: "destructive" as const };
    default:
      return { label: status, variant: "outline" as const };
  }
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
  }).format(num);
}

export default function DashboardListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setListingId(p.id));
  }, [params]);

  useEffect(() => {
    if (!listingId) return;

    async function fetchListing() {
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Listing not found");
          } else {
            setError("Failed to load listing");
          }
          return;
        }
        const data = await response.json();
        setListing(data);
      } catch {
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [listingId]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard");
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600">{error}</p>
              <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const statusBadge = getStatusBadge(listing.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              <span className="text-sm text-gray-500">
                Created {new Date(listing.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/listings/${listing.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Public
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Status Card */}
        {listing.status === "DRAFT" && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      This listing is in draft mode
                    </p>
                    <p className="text-sm text-yellow-700">
                      Complete the listing and publish it to make it visible to buyers
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  Publish Listing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-semibold text-emerald-600">
                  {formatPrice(listing.priceGhs)}
                  {listing.negotiable && (
                    <span className="text-sm text-gray-500 ml-1">(Negotiable)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size</span>
                <span className="font-medium">
                  {parseFloat(listing.sizeAcres).toFixed(2)} acres
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Land Type</span>
                <span className="font-medium">
                  {listing.landType.toLowerCase().replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tenure Type</span>
                <span className="font-medium">
                  {listing.tenureType.toLowerCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Region</span>
                <span className="font-medium">{listing.region}</span>
              </div>
              {listing.constituency && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Constituency</span>
                  <span className="font-medium">{listing.constituency}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">District</span>
                <span className="font-medium">{listing.district}</span>
              </div>
              {listing.town && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Town/Area</span>
                  <span className="font-medium">{listing.town}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Card */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {listing.verificationLevel === "LEVEL_0_UNVERIFIED" ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Not Verified</p>
                      <p className="text-sm text-gray-500">
                        Upload documents to start verification
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {listing.verificationLevel.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-gray-500">
                        Verification in progress
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Listing
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Listing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
