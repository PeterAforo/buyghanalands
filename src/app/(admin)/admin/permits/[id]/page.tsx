"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  FileText,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Clock,
  Download,
  Home,
} from "lucide-react";

interface PermitDocument {
  id: string;
  type: string;
  url: string;
  fileName: string | null;
  createdAt: string;
}

interface PermitQuery {
  id: string;
  title: string;
  details: string | null;
  status: string;
  createdAt: string;
}

interface PermitPayment {
  id: string;
  amountGhs: number;
  status: string;
  createdAt: string;
}

interface StatusHistory {
  id: string;
  fromStatus: string;
  toStatus: string;
  note: string | null;
  createdAt: string;
  changedBy: { fullName: string } | null;
}

interface Permit {
  id: string;
  status: string;
  projectTitle: string | null;
  projectDescription: string | null;
  buildingType: string | null;
  storeys: number | null;
  estimatedCostGhs: string | null;
  createdAt: string;
  decidedAt: string | null;
  applicant: { id: string; fullName: string; phone: string; email: string; kycTier: string; accountStatus: string };
  assembly: { id: string; name: string; region: string; district: string; contactEmail: string | null; contactPhone: string | null };
  listing: { id: string; title: string; region: string; district: string } | null;
  documents: PermitDocument[];
  statusHistory: StatusHistory[];
  queries: PermitQuery[];
  payments: PermitPayment[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  QUERY_RAISED: "bg-purple-100 text-purple-700",
  RESUBMITTED: "bg-teal-100 text-teal-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(num || 0);
}

export default function PermitDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [permit, setPermit] = useState<Permit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [queryTitle, setQueryTitle] = useState("");
  const [queryDetails, setQueryDetails] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/permits/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Permit not found" : "Failed to load");
          return;
        }
        const data = await res.json();
        setPermit(data);
      } catch {
        setError("Failed to load permit");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleReview(action: string) {
    setActing(true);
    try {
      const body: any = { action, note };
      if (action === "raise_query") {
        body.queryTitle = queryTitle;
        body.queryDetails = queryDetails;
      }
      const res = await fetch(`/api/admin/permits/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Action failed");
        return;
      }
      // Reload
      const detailRes = await fetch(`/api/admin/permits/${id}`);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        setPermit(detail);
      }
      setNote("");
      setQueryTitle("");
      setQueryDetails("");
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

  if (error || !permit) {
    return (
      <div className="space-y-6">
        <Link href="/admin/permits">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Permits
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium">{error || "Permit not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canStartReview = ["SUBMITTED", "RESUBMITTED"].includes(permit.status);
  const canApproveReject = permit.status === "UNDER_REVIEW";
  const canRaiseQuery = permit.status === "UNDER_REVIEW";
  const canReject = ["UNDER_REVIEW", "QUERY_RAISED"].includes(permit.status);

  return (
    <div className="space-y-6">
      <Link href="/admin/permits">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Permits
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{permit.projectTitle || "Permit Application"}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={statusColors[permit.status] || "bg-gray-100"}>
              {permit.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-gray-500">Submitted {formatDate(permit.createdAt)}</span>
            {permit.decidedAt && (
              <span className="text-sm text-gray-500">Decided {formatDate(permit.decidedAt)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details, Documents, History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" /> Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {permit.projectDescription && (
                <div>
                  <p className="text-gray-500">Description</p>
                  <p>{permit.projectDescription}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Building Type</p>
                  <p className="font-medium">{permit.buildingType || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Storeys</p>
                  <p className="font-medium">{permit.storeys || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Estimated Cost</p>
                  <p className="font-medium">{permit.estimatedCostGhs ? formatPrice(permit.estimatedCostGhs) : "—"}</p>
                </div>
              </div>
              {permit.listing && (
                <div className="pt-2 border-t">
                  <p className="text-gray-500">Linked Listing</p>
                  <Link href={`/listings/${permit.listing.id}`} className="text-[#1a3a2f] hover:underline">
                    {permit.listing.title} — {permit.listing.district}, {permit.listing.region}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Documents ({permit.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permit.documents.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {permit.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.type.replace(/_/g, " ")}</p>
                          <p className="text-xs text-gray-500">{formatDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queries */}
          {permit.queries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Queries ({permit.queries.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {permit.queries.map((q) => (
                    <div key={q.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{q.title}</p>
                        <Badge variant="outline">{q.status}</Badge>
                      </div>
                      {q.details && <p className="text-sm text-gray-600 mt-1">{q.details}</p>}
                      <p className="text-xs text-gray-500 mt-1">{formatDate(q.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {permit.statusHistory.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[#1a3a2f]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <Badge variant="outline" className="mr-2">{h.fromStatus}</Badge>
                        →
                        <Badge variant="outline" className="ml-2">{h.toStatus}</Badge>
                      </p>
                      {h.note && <p className="text-xs text-gray-600 mt-1">{h.note}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {h.changedBy?.fullName || "System"} • {formatDate(h.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Applicant, Assembly, Actions */}
        <div className="space-y-6">
          {/* Applicant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Applicant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href={`/admin/users/${permit.applicant.id}`} className="font-medium text-[#1a3a2f] hover:underline">
                {permit.applicant.fullName}
              </Link>
              <p className="text-gray-500">{permit.applicant.phone}</p>
              <p className="text-gray-500">{permit.applicant.email}</p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline">{permit.applicant.kycTier}</Badge>
                <Badge variant="outline">{permit.applicant.accountStatus}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assembly */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" /> District Assembly
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{permit.assembly.name}</p>
              <p className="text-gray-500">{permit.assembly.district}, {permit.assembly.region}</p>
              {permit.assembly.contactEmail && <p className="text-gray-500">{permit.assembly.contactEmail}</p>}
              {permit.assembly.contactPhone && <p className="text-gray-500">{permit.assembly.contactPhone}</p>}
            </CardContent>
          </Card>

          {/* Payments */}
          {permit.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fee Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {permit.payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span>{formatPrice(p.amountGhs)}</span>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
              <CardDescription>Process this permit application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Note</label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a review note..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              {canRaiseQuery && (
                <div className="space-y-2 border rounded-lg p-3 bg-purple-50">
                  <p className="text-sm font-medium">Raise Query</p>
                  <Input
                    placeholder="Query title"
                    value={queryTitle}
                    onChange={(e) => setQueryTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Query details"
                    value={queryDetails}
                    onChange={(e) => setQueryDetails(e.target.value)}
                    rows={2}
                  />
                  <Button
                    onClick={() => handleReview("raise_query")}
                    disabled={acting || !queryTitle}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <AlertCircle className="h-4 w-4" /> Raise Query
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {canStartReview && (
                  <Button
                    onClick={() => handleReview("start_review")}
                    disabled={acting}
                    className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
                  >
                    <Clock className="h-4 w-4" /> Start Review
                  </Button>
                )}
                {canApproveReject && (
                  <Button
                    onClick={() => handleReview("approve")}
                    disabled={acting}
                    className="w-full bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </Button>
                )}
                {canReject && (
                  <Button
                    onClick={() => handleReview("reject")}
                    disabled={acting}
                    variant="destructive"
                    className="w-full gap-2"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                )}
              </div>
              {acting && (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
