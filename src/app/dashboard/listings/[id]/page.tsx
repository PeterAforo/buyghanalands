"use client";

import { useState, useEffect, useRef } from "react";
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
  Loader2,
  X,
  Image as ImageIcon,
  FileText,
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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

  const handlePublish = async () => {
    if (!listingId) return;
    setActionLoading("publish");
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED", publishedAt: new Date().toISOString() }),
      });
      if (response.ok) {
        const updated = await response.json();
        setListing(updated);
        setSuccessMessage("Listing published successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError("Failed to publish listing");
      }
    } catch {
      setError("Failed to publish listing");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async () => {
    if (!listingId) return;
    setActionLoading("unpublish");
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });
      if (response.ok) {
        const updated = await response.json();
        setListing(updated);
        setSuccessMessage("Listing unpublished");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError("Failed to unpublish listing");
      }
    } catch {
      setError("Failed to unpublish listing");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!listingId) return;
    setActionLoading("delete");
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/dashboard?deleted=true");
      } else {
        setError("Failed to delete listing");
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("Failed to delete listing");
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePhotoUpload = () => {
    photoInputRef.current?.click();
  };

  const handleDocUpload = () => {
    docInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "document") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setActionLoading(type === "photo" ? "photo" : "document");
    
    // For now, show a message that file upload will be implemented
    // In production, you would upload to S3/R2 and save to database
    setTimeout(() => {
      setSuccessMessage(`${type === "photo" ? "Photos" : "Documents"} upload feature coming soon!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setActionLoading(null);
    }, 1000);
    
    // Reset the input
    e.target.value = "";
  };

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
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={photoInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e, "photo")}
        />
        <input
          type="file"
          ref={docInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          multiple
          onChange={(e) => handleFileChange(e, "document")}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-red-600">Delete Listing</CardTitle>
                <CardDescription>
                  Are you sure you want to delete this listing? This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading === "delete"}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={actionLoading === "delete"}
                >
                  {actionLoading === "delete" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {successMessage}
            <button onClick={() => setSuccessMessage(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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
            <Link href={`/dashboard/listings/${listing.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Card - Draft */}
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
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={handlePublish}
                  disabled={actionLoading === "publish"}
                >
                  {actionLoading === "publish" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Listing"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Card - Published */}
        {listing.status === "PUBLISHED" && (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-800">
                      This listing is live
                    </p>
                    <p className="text-sm text-emerald-700">
                      Your listing is visible to potential buyers
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUnpublish}
                  disabled={actionLoading === "unpublish"}
                >
                  {actionLoading === "unpublish" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unpublishing...
                    </>
                  ) : (
                    "Unpublish"
                  )}
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
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleDocUpload}
                disabled={actionLoading === "document"}
              >
                {actionLoading === "document" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Documents
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handlePhotoUpload}
                disabled={actionLoading === "photo"}
              >
                {actionLoading === "photo" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Photos
                  </>
                )}
              </Button>
              <Link href={`/dashboard/listings/${listing.id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Listing
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
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
