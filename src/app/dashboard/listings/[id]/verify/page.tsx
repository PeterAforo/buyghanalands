"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationRequestForm } from "@/components/verification/verification-request-form";
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface VerificationRequest {
  id: string;
  status: string;
  notes: string | null;
  reviewerNotes: string | null;
  reviewerName: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface Listing {
  id: string;
  title: string;
  verificationLevel: string;
}

export default function VerifyListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [listingId, setListingId] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setListingId(p.id));
  }, [params]);

  useEffect(() => {
    if (!listingId || !session?.user) return;

    async function fetchData() {
      try {
        // Fetch listing
        const listingRes = await fetch(`/api/listings/${listingId}`);
        if (listingRes.ok) {
          const listingData = await listingRes.json();
          setListing(listingData);
        }

        // Fetch verification requests
        const requestsRes = await fetch(`/api/verification/request?listingId=${listingId}`);
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setRequests(requestsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [listingId, session]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Pending Review", variant: "warning" as const, icon: Clock };
      case "COMPLETED":
        return { label: "Approved", variant: "success" as const, icon: CheckCircle };
      case "REJECTED":
        return { label: "Rejected", variant: "destructive" as const, icon: XCircle };
      default:
        return { label: status, variant: "secondary" as const, icon: AlertCircle };
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Listing not found</p>
              <Link href="/dashboard/listings">
                <Button className="mt-4">Back to Listings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasPendingRequest = requests.some((r) => r.status === "PENDING");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href={`/dashboard/listings/${listingId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Listing
        </Link>

        {/* Previous Requests */}
        {requests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Verification History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.map((request) => {
                  const statusInfo = getStatusBadge(request.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div
                      key={request.id}
                      className="p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${
                            request.status === "COMPLETED" ? "text-green-500" :
                            request.status === "REJECTED" ? "text-red-500" :
                            "text-yellow-500"
                          }`} />
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {request.reviewerNotes && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-700">Reviewer Notes:</p>
                          <p className="text-sm text-gray-600">{request.reviewerNotes}</p>
                          {request.reviewerName && (
                            <p className="text-xs text-gray-400 mt-1">
                              Reviewed by {request.reviewerName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Form or Pending Message */}
        {hasPendingRequest ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verification In Progress
              </h3>
              <p className="text-gray-600 mb-4">
                Your verification request is currently being reviewed.
                You'll receive a notification once it's complete.
              </p>
              <p className="text-sm text-gray-500">
                Typical review time: 2-3 business days
              </p>
            </CardContent>
          </Card>
        ) : (
          <VerificationRequestForm
            listingId={listing.id}
            listingTitle={listing.title}
            currentLevel={listing.verificationLevel}
            onSuccess={() => {
              // Refresh requests
              fetch(`/api/verification/request?listingId=${listingId}`)
                .then((res) => res.json())
                .then((data) => setRequests(data));
            }}
          />
        )}
      </div>
    </div>
  );
}
