"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  MapPin,
  ExternalLink,
  Shield,
} from "lucide-react";

interface VerificationRequest {
  id: string;
  status: string;
  levelRequested: string;
  notes: string | null;
  outcomeNotes: string | null;
  documentIds: string[];
  createdAt: string;
  completedAt: string | null;
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
    verificationLevel: string;
    priceGhs: string;
    sizeAcres: string;
    documents: { id: string; type: string; url: string }[];
    media: { id: string; url: string }[];
    seller: { id: string; fullName: string; kycTier: string };
  } | null;
  user: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    kycTier: string;
  } | null;
}

export default function AdminVerificationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setRequestId(p.id));
  }, [params]);

  useEffect(() => {
    if (!requestId) return;

    async function fetchRequest() {
      try {
        const res = await fetch(`/api/admin/verification/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          setRequest(data);
          setOutcomeNotes(data.outcomeNotes || "");
        } else {
          setError("Failed to load verification request");
        }
      } catch (err) {
        setError("Failed to load verification request");
      } finally {
        setLoading(false);
      }
    }

    fetchRequest();
  }, [requestId]);

  const handleAction = async (action: "approve" | "reject" | "request_changes") => {
    if (!requestId) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/verification/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          outcomeNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      router.push("/admin/verifications?success=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">{error || "Request not found"}</p>
            <Link href="/admin/verifications">
              <Button className="mt-4">Back to Verifications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = request.status === "PENDING";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/verifications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Verification</h1>
          <p className="text-gray-600">Request ID: {request.id.slice(0, 8)}...</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Listing Info */}
          {request.listing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Listing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{request.listing.title}</h3>
                  <p className="text-gray-500">
                    {request.listing.district}, {request.listing.region}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="font-medium">GH₵{parseInt(request.listing.priceGhs).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Size</p>
                    <p className="font-medium">{parseFloat(request.listing.sizeAcres).toFixed(2)} acres</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Level</p>
                    <Badge variant="outline">{request.listing.verificationLevel.replace(/_/g, " ")}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Requested Level</p>
                    <Badge variant="secondary">{request.levelRequested.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
                <Link href={`/listings/${request.listing.id}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submitted Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.listing?.documents && request.listing.documents.length > 0 ? (
                <div className="space-y-3">
                  {request.listing.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="capitalize">{doc.type.toLowerCase().replace(/_/g, " ")}</span>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 text-sm"
                      >
                        View Document
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No documents uploaded</p>
              )}
            </CardContent>
          </Card>

          {/* Listing Images */}
          {request.listing?.media && request.listing.media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Listing Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {request.listing.media.slice(0, 6).map((media) => (
                    <a
                      key={media.id}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={media.url}
                        alt="Listing"
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester Info */}
          {request.user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Requester
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{request.user.fullName}</p>
                  <p className="text-sm text-gray-500">{request.user.phone}</p>
                  {request.user.email && (
                    <p className="text-sm text-gray-500">{request.user.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">KYC Status</p>
                  <Badge variant="outline">{request.user.kycTier.replace(/_/g, " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Request Notes */}
          {request.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Requester Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{request.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Review Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Review Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPending ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Review Notes
                    </label>
                    <Textarea
                      value={outcomeNotes}
                      onChange={(e) => setOutcomeNotes(e.target.value)}
                      placeholder="Add notes for the seller..."
                      rows={4}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleAction("approve")}
                      disabled={submitting}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Verification
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAction("request_changes")}
                      disabled={submitting}
                      variant="outline"
                      className="w-full"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                    <Button
                      onClick={() => handleAction("reject")}
                      disabled={submitting}
                      variant="destructive"
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Badge
                    variant={
                      request.status === "COMPLETED" ? "success" :
                      request.status === "REJECTED" ? "destructive" : "secondary"
                    }
                    className="text-lg px-4 py-2"
                  >
                    {request.status === "COMPLETED" ? "Approved" :
                     request.status === "REJECTED" ? "Rejected" : request.status}
                  </Badge>
                  {request.outcomeNotes && (
                    <div className="mt-4 text-left">
                      <p className="text-sm font-medium text-gray-700">Review Notes:</p>
                      <p className="text-sm text-gray-600 mt-1">{request.outcomeNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
