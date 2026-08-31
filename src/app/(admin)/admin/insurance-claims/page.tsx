"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, CheckCircle, XCircle, DollarSign, Eye, AlertCircle } from "lucide-react";

interface Claim {
  id: string;
  reason: string;
  description: string | null;
  evidenceUrls: string[];
  claimAmountGhs: number;
  approvedAmountGhs: number | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  paidAt: string | null;
  insurance: {
    id: string; coverageLevel: string; coverageAmountGhs: number; premiumGhs: number;
    transaction: { id: string; listing: { title: string } };
  };
  claimant: { id: string; fullName: string; email: string; phone: string };
}

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PAID: "bg-teal-100 text-teal-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(num || 0);
}

export default function InsuranceClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter) params.set("status", filter);
        const res = await fetch(`/api/admin/insurance/claims?${params}`);
        if (res.ok) setClaims(await res.json());
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [filter]);

  async function loadClaim(id: string) {
    const res = await fetch(`/api/admin/insurance/claims/${id}`);
    if (res.ok) setSelectedClaim(await res.json());
  }

  async function handleAction(status: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID") {
    if (!selectedClaim) return;
    setActing(true);
    try {
      const body: any = { status, reviewNote };
      if (status === "APPROVED" && approvedAmount) body.approvedAmount = parseInt(approvedAmount);
      const res = await fetch(`/api/admin/insurance/claims/${selectedClaim.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        await loadClaim(selectedClaim.id);
        setReviewNote("");
        setApprovedAmount("");
        // Reload list
        const listRes = await fetch(`/api/admin/insurance/claims${filter ? `?status=${filter}` : ""}`);
        if (listRes.ok) setClaims(await listRes.json());
      }
    } catch { } finally { setActing(false); }
  }

  const filters = [
    { key: "", label: "All" },
    { key: "SUBMITTED", label: "Submitted" },
    { key: "UNDER_REVIEW", label: "Under Review" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
    { key: "PAID", label: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Insurance Claims</h1>
        <p className="text-sm text-gray-500 mt-1">Review and process escrow insurance claims</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm"
            onClick={() => setFilter(f.key)} className={filter === f.key ? "bg-[#1a3a2f]" : ""}>{f.label}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" /></div>
          ) : claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Shield className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No insurance claims found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Claimant</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Reason</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Claim Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Coverage</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.claimant.fullName}</p>
                        <p className="text-xs text-gray-500">{c.claimant.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.reason}</td>
                      <td className="px-4 py-3 font-medium">{formatPrice(c.claimAmountGhs)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{c.insurance.coverageLevel}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{formatPrice(c.insurance.coverageAmountGhs)}</p>
                      </td>
                      <td className="px-4 py-3"><Badge className={statusColors[c.status] || "bg-gray-100"}>{c.status.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => loadClaim(c.id)}>
                          <Eye className="h-3 w-3" /> Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedClaim(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Insurance Claim</h2>
                <Badge className={statusColors[selectedClaim.status] || "bg-gray-100"}>{selectedClaim.status.replace(/_/g, " ")}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedClaim(null)}>Close</Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Claimant</p>
                <p className="text-sm text-gray-600">{selectedClaim.claimant.fullName} • {selectedClaim.claimant.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Reason</p>
                <p className="text-sm text-gray-600">{selectedClaim.reason}</p>
              </div>
              {selectedClaim.description && (
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-gray-600">{selectedClaim.description}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-gray-500">Claim Amount</p><p className="font-medium">{formatPrice(selectedClaim.claimAmountGhs)}</p></div>
                <div><p className="text-gray-500">Coverage Level</p><p className="font-medium">{selectedClaim.insurance.coverageLevel}</p></div>
                <div><p className="text-gray-500">Coverage Amount</p><p className="font-medium">{formatPrice(selectedClaim.insurance.coverageAmountGhs)}</p></div>
              </div>
              {selectedClaim.evidenceUrls.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Evidence</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedClaim.evidenceUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1a3a2f] underline">Evidence {i + 1}</a>
                    ))}
                  </div>
                </div>
              )}
              {selectedClaim.reviewNote && (
                <div>
                  <p className="text-sm font-medium">Review Note</p>
                  <p className="text-sm text-gray-600">{selectedClaim.reviewNote}</p>
                </div>
              )}

              {["SUBMITTED", "UNDER_REVIEW"].includes(selectedClaim.status) && (
                <div className="border-t pt-4 space-y-3">
                  <Textarea placeholder="Review note..." value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={2} />
                  {selectedClaim.status === "SUBMITTED" && (
                    <Button onClick={() => handleAction("UNDER_REVIEW")} disabled={acting} variant="outline" className="w-full gap-2">
                      <Eye className="h-4 w-4" /> Start Review
                    </Button>
                  )}
                  {selectedClaim.status === "UNDER_REVIEW" && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Approved Amount</label>
                        <Input type="number" placeholder="Approved amount in GHS" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} className="mt-1" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleAction("APPROVED")} disabled={acting || !approvedAmount} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                          <CheckCircle className="h-4 w-4" /> Approve
                        </Button>
                        <Button onClick={() => handleAction("REJECTED")} disabled={acting} variant="destructive" className="flex-1 gap-2">
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {selectedClaim.status === "APPROVED" && (
                <div className="border-t pt-4">
                  <Button onClick={() => handleAction("PAID")} disabled={acting} className="w-full bg-teal-600 hover:bg-teal-700 gap-2">
                    <DollarSign className="h-4 w-4" /> Mark as Paid
                  </Button>
                </div>
              )}
              {acting && <div className="flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
