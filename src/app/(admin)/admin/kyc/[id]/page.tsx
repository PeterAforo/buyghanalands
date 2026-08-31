"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  User,
  FileCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ImageIcon,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";

interface KycRequest {
  id: string;
  ghanaCardNumber: string;
  selfieUrl: string | null;
  reason: string;
  status: string;
  providerRef: string | null;
  providerPayload: any;
  reviewNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    kycTier: string;
    accountStatus: string;
    createdAt: string;
    _count: {
      listings: number;
      transactionsAsBuyer: number;
      transactionsAsSeller: number;
    };
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusColors: Record<string, string> = {
  INITIATED: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-700",
  MANUAL_REVIEW: "bg-purple-100 text-purple-700",
  PASSED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RETRY: "bg-orange-100 text-orange-700",
};

export default function KycDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [kyc, setKyc] = useState<KycRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [newTier, setNewTier] = useState("TIER_2_GHANA_CARD");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/kyc/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "KYC request not found" : "Failed to load");
          return;
        }
        const data = await res.json();
        setKyc(data);
        setNotes(data.reviewNotes || "");
      } catch {
        setError("Failed to load KYC request");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleAction(action: "approve" | "reject" | "request_retry") {
    setActing(true);
    try {
      const body: any = { action, notes };
      if (action === "approve") body.newKycTier = newTier;
      const res = await fetch(`/api/admin/kyc/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Action failed");
        return;
      }
      const data = await res.json();
      setKyc((prev) => (prev ? { ...prev, status: data.request.status, reviewNotes: notes } : prev));
    } catch {
      setError("Action failed");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" />
      </div>
    );
  }

  if (error || !kyc) {
    return (
      <div className="space-y-6">
        <Link href="/admin/kyc">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to KYC Reviews
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium">{error || "KYC request not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = ["PENDING", "MANUAL_REVIEW", "INITIATED"].includes(kyc.status);
  const rekognition = kyc.providerPayload;

  return (
    <div className="space-y-6">
      <Link href="/admin/kyc">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to KYC Reviews
        </Button>
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Review — {kyc.user.fullName}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={statusColors[kyc.status] || "bg-gray-100"}>
              {kyc.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-gray-500">Submitted {formatDate(kyc.createdAt)}</span>
            {kyc.completedAt && (
              <span className="text-sm text-gray-500">Completed {formatDate(kyc.completedAt)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Selfie & Rekognition Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selfie */}
          {kyc.selfieUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanFace className="h-5 w-5" /> Selfie Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full max-w-sm aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={kyc.selfieUrl}
                    alt="Selfie"
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* AWS Rekognition Results */}
          {rekognition && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Automated Verification Results
                </CardTitle>
                <CardDescription>Results from AWS Rekognition checks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Document Quality */}
                  {rekognition.documentQuality && (
                    <div>
                      <p className="text-sm font-medium mb-2">Document Quality</p>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Status</span>
                          <Badge variant="outline">{rekognition.documentQuality.status || "N/A"}</Badge>
                        </div>
                        {rekognition.documentQuality.confidence && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Confidence</span>
                            <span className="font-medium">{rekognition.documentQuality.confidence}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selfie Quality */}
                  {rekognition.selfieQuality && (
                    <div>
                      <p className="text-sm font-medium mb-2">Selfie Quality</p>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Status</span>
                          <Badge variant="outline">{rekognition.selfieQuality.status || "N/A"}</Badge>
                        </div>
                        {rekognition.selfieQuality.confidence && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Confidence</span>
                            <span className="font-medium">{rekognition.selfieQuality.confidence}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Face Match */}
                  {rekognition.faceMatch && (
                    <div>
                      <p className="text-sm font-medium mb-2">Face Match</p>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Status</span>
                          <Badge variant="outline">{rekognition.faceMatch.status || "N/A"}</Badge>
                        </div>
                        {rekognition.faceMatch.similarity && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Similarity</span>
                            <span className="font-medium">{rekognition.faceMatch.similarity}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Raw payload */}
                  <details>
                    <summary className="text-sm font-medium cursor-pointer">Raw provider payload</summary>
                    <pre className="text-xs bg-gray-50 rounded-lg p-3 mt-2 overflow-auto max-h-64">
                      {JSON.stringify(rekognition, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Notes */}
          {kyc.reviewNotes && !isPending && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" /> Review Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{kyc.reviewNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: User Info & Actions */}
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/admin/users/${kyc.user.id}`} className="font-medium text-[#1a3a2f] hover:underline">
                {kyc.user.fullName}
              </Link>
              <p className="text-sm text-gray-500">{kyc.user.phone}</p>
              <p className="text-sm text-gray-500">{kyc.user.email}</p>
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                <div>
                  <p className="text-gray-500">Current KYC</p>
                  <Badge variant="outline">{kyc.user.kycTier}</Badge>
                </div>
                <div>
                  <p className="text-gray-500">Account</p>
                  <Badge variant="outline">{kyc.user.accountStatus}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                <div>
                  <p className="text-gray-500">Listings</p>
                  <p className="font-medium">{kyc.user._count.listings}</p>
                </div>
                <div>
                  <p className="text-gray-500">As Buyer</p>
                  <p className="font-medium">{kyc.user._count.transactionsAsBuyer}</p>
                </div>
                <div>
                  <p className="text-gray-500">As Seller</p>
                  <p className="font-medium">{kyc.user._count.transactionsAsSeller}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ghana Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" /> Ghana Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm">{kyc.ghanaCardNumber}</p>
              <p className="text-xs text-gray-500 mt-1">Reason: {kyc.reason.replace(/_/g, " ")}</p>
            </CardContent>
          </Card>

          {/* Actions */}
          {isPending && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Review Actions
                </CardTitle>
                <CardDescription>Approve, reject, or request retry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Review Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this review..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">KYC Tier (on approve)</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                  >
                    <option value="TIER_1_ID_UPLOAD">Tier 1 — ID Upload</option>
                    <option value="TIER_2_GHANA_CARD">Tier 2 — Ghana Card Verified</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleAction("approve")}
                    disabled={acting}
                    className="w-full bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    onClick={() => handleAction("request_retry")}
                    disabled={acting}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <AlertCircle className="h-4 w-4" /> Request Retry
                  </Button>
                  <Button
                    onClick={() => handleAction("reject")}
                    disabled={acting}
                    variant="destructive"
                    className="w-full gap-2"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
                {acting && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
