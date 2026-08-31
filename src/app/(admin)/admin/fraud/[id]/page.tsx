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
  AlertTriangle,
  CheckCircle,
  Loader2,
  User,
  Shield,
  FileText,
  Ban,
  Eye,
  XCircle,
} from "lucide-react";

interface FraudCase {
  id: string;
  status: string;
  summary: string;
  evidence: any;
  actionTaken: string | null;
  createdAt: string;
  closedAt: string | null;
  openedBy: { id: string; fullName: string } | null;
  listing: {
    id: string;
    title: string;
    status: string;
    priceGhs: string;
    region: string;
    district: string;
    seller: { id: string; fullName: string; phone: string; kycTier: string };
    media: { id: string; url: string }[];
    documents: { id: string; type: string; url: string }[];
  } | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    accountStatus: string;
    kycTier: string;
    createdAt: string;
    _count: {
      listings: number;
      transactionsAsBuyer: number;
      transactionsAsSeller: number;
      reportsFiled: number;
    };
  } | null;
  relatedReports: {
    id: string;
    reason: string;
    status: string;
    targetType: string;
    createdAt: string;
    reporter: { id: string; fullName: string };
  }[];
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
  }).format(num || 0);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700 border-red-200",
  INVESTIGATING: "bg-amber-100 text-amber-700 border-amber-200",
  ACTION_TAKEN: "bg-blue-100 text-blue-700 border-blue-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function FraudCaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [fraudCase, setFraudCase] = useState<FraudCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [suspendListing, setSuspendListing] = useState(false);
  const [suspendUser, setSuspendUser] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadFraudCase() {
      try {
        const res = await fetch(`/api/admin/fraud/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Fraud case not found");
          } else {
            setError("Failed to load fraud case");
          }
          return;
        }
        const data = await res.json();
        setFraudCase(data);
        setNewStatus(data.status);
        setActionTaken(data.actionTaken || "");
      } catch {
        setError("Failed to load fraud case");
      } finally {
        setLoading(false);
      }
    }
    loadFraudCase();
  }, [id]);

  async function handleUpdate() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fraud/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          actionTaken,
          suspendListing,
          suspendUser,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update fraud case");
        return;
      }
      const data = await res.json();
      setFraudCase((prev) => (prev ? { ...prev, status: newStatus, actionTaken } : prev));
      setSuspendListing(false);
      setSuspendUser(false);
    } catch {
      setError("Failed to update fraud case");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" />
      </div>
    );
  }

  if (error || !fraudCase) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fraud">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Fraud Cases
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">{error || "Fraud case not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/fraud">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Fraud Cases
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fraudCase.summary}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={statusColors[fraudCase.status] || "bg-gray-100 text-gray-700"}>
              {fraudCase.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-gray-500">Opened {formatDate(fraudCase.createdAt)}</span>
            {fraudCase.openedBy && (
              <span className="text-sm text-gray-500">by {fraudCase.openedBy.fullName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Evidence & Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fraudCase.evidence ? (
                <pre className="text-sm bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                  {typeof fraudCase.evidence === "string"
                    ? fraudCase.evidence
                    : JSON.stringify(fraudCase.evidence, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">No evidence provided</p>
              )}
            </CardContent>
          </Card>

          {/* Action Taken */}
          {fraudCase.actionTaken && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" /> Action Taken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{fraudCase.actionTaken}</p>
              </CardContent>
            </Card>
          )}

          {/* Related Reports */}
          {fraudCase.relatedReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Related Reports ({fraudCase.relatedReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fraudCase.relatedReports.map((report) => (
                    <div key={report.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{report.reason}</p>
                        <p className="text-xs text-gray-500">
                          By {report.reporter.fullName} • {report.targetType} • {formatDate(report.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">{report.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Listing */}
          {fraudCase.listing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Linked Listing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/listings/${fraudCase.listing.id}`} className="font-medium text-[#1a3a2f] hover:underline">
                        {fraudCase.listing.title}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {fraudCase.listing.district}, {fraudCase.listing.region} • {formatPrice(fraudCase.listing.priceGhs)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Seller: {fraudCase.listing.seller.fullName} ({fraudCase.listing.seller.phone}) • KYC: {fraudCase.listing.seller.kycTier}
                      </p>
                    </div>
                    <Badge variant="outline">{fraudCase.listing.status}</Badge>
                  </div>
                  {fraudCase.listing.documents.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {fraudCase.listing.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border rounded-lg text-xs hover:bg-gray-100"
                          >
                            <FileText className="h-3 w-3" /> {doc.type}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Subject User & Actions */}
        <div className="space-y-6">
          {/* Subject User */}
          {fraudCase.user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Subject User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{fraudCase.user.fullName}</p>
                  <p className="text-sm text-gray-500">{fraudCase.user.phone}</p>
                  <p className="text-sm text-gray-500">{fraudCase.user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Account Status</p>
                    <Badge variant="outline">{fraudCase.user.accountStatus}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">KYC Tier</p>
                    <Badge variant="outline">{fraudCase.user.kycTier}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                  <div>
                    <p className="text-gray-500">Listings</p>
                    <p className="font-medium">{fraudCase.user._count.listings}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">As Buyer</p>
                    <p className="font-medium">{fraudCase.user._count.transactionsAsBuyer}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">As Seller</p>
                    <p className="font-medium">{fraudCase.user._count.transactionsAsSeller}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reports Filed</p>
                    <p className="font-medium">{fraudCase.user._count.reportsFiled}</p>
                  </div>
                </div>
                <Link href={`/admin/users/${fraudCase.user.id}`}>
                  <Button variant="outline" className="w-full" size="sm">View User Profile</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Admin Actions
              </CardTitle>
              <CardDescription>Update case status and take protective action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                >
                  <option value="OPEN">Open</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="ACTION_TAKEN">Action Taken</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Action Taken Notes</label>
                <Textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Describe the action taken..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={suspendListing}
                    onChange={(e) => setSuspendListing(e.target.checked)}
                    className="rounded"
                  />
                  <Ban className="h-4 w-4 text-red-500" /> Suspend linked listing
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={suspendUser}
                    onChange={(e) => setSuspendUser(e.target.checked)}
                    className="rounded"
                  />
                  <Ban className="h-4 w-4 text-red-500" /> Suspend user account
                </label>
              </div>
              <Button
                onClick={handleUpdate}
                disabled={saving || newStatus === fraudCase.status && actionTaken === (fraudCase.actionTaken || "") && !suspendListing && !suspendUser}
                className="w-full bg-[#1a3a2f] hover:bg-[#2a4a3f]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
