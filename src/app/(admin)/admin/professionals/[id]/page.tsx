"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, User, Briefcase, Star, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";

interface Professional {
  id: string;
  professionalType: string;
  companyName: string | null;
  bio: string | null;
  licenseNumber: string | null;
  licenseBody: string | null;
  licenseStatus: string;
  yearsExperience: number | null;
  serviceRegions: string[];
  baseLocation: string | null;
  isActive: boolean;
  createdAt: string;
  user: { id: string; fullName: string; email: string; phone: string; accountStatus: string; kycTier: string };
  services: { id: string; title: string; priceGhs: string | null; isPublished: boolean }[];
  bookings: {
    id: string; status: string; createdAt: string;
    serviceRequest: { id: string; title: string; acceptedPriceGhs: string | null; requester: { fullName: string } };
  }[];
  reviewsReceived: { id: string; rating: number; comment: string | null; reviewer: { fullName: string } }[];
  _count: { services: number; bookings: number; reviewsReceived: number };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(num || 0);
}

export default function ProfessionalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [pro, setPro] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/professionals/${id}`);
        if (!res.ok) { setError("Failed to load"); return; }
        setPro(await res.json());
      } catch { setError("Failed to load"); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  async function update(data: { isActive?: boolean; licenseStatus?: string }) {
    setActing(true);
    try {
      const res = await fetch(`/api/admin/professionals/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (res.ok) {
        setPro((prev) => prev ? { ...prev, ...data } : prev);
      }
    } catch { } finally { setActing(false); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" /></div>;
  if (error || !pro) return (
    <div className="space-y-6">
      <Link href="/admin/professionals"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      <Card><CardContent className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium">{error || "Not found"}</p>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/professionals"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Professionals</Button></Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pro.user.fullName}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline">{pro.professionalType}</Badge>
            <Badge variant="outline" className={pro.isActive ? "bg-green-50" : "bg-gray-50"}>{pro.isActive ? "Active" : "Inactive"}</Badge>
            <Badge variant="outline" className={pro.licenseStatus === "VERIFIED" ? "bg-green-50" : "bg-amber-50"}>License: {pro.licenseStatus}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {pro.bio && (
            <Card><CardHeader><CardTitle>About</CardTitle></CardHeader><CardContent><p className="text-sm text-gray-700">{pro.bio}</p></CardContent></Card>
          )}

          {/* Services */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Services ({pro.services.length})</CardTitle></CardHeader>
            <CardContent>
              {pro.services.length === 0 ? <p className="text-sm text-gray-500">No services published</p> : (
                <div className="space-y-2">
                  {pro.services.map((s) => (
                    <div key={s.id} className="flex justify-between border-b pb-2 last:border-0">
                      <div><p className="text-sm font-medium">{s.title}</p><p className="text-xs text-gray-500">{s.isPublished ? "Published" : "Draft"}</p></div>
                      <span className="text-sm font-medium">{s.priceGhs ? formatPrice(s.priceGhs) : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader><CardTitle>Recent Bookings ({pro._count.bookings} total)</CardTitle></CardHeader>
            <CardContent>
              {pro.bookings.length === 0 ? <p className="text-sm text-gray-500">No bookings yet</p> : (
                <div className="space-y-2">
                  {pro.bookings.map((b) => (
                    <div key={b.id} className="flex justify-between border-b pb-2 last:border-0">
                      <div><p className="text-sm font-medium">{b.serviceRequest.title}</p>
                        <p className="text-xs text-gray-500">{b.serviceRequest.requester.fullName} • {formatDate(b.createdAt)}</p></div>
                      <div className="flex items-center gap-2">
                        {b.serviceRequest.acceptedPriceGhs && <span className="text-sm">{formatPrice(b.serviceRequest.acceptedPriceGhs)}</span>}
                        <Badge variant="outline">{b.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          {pro.reviewsReceived.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Recent Reviews</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pro.reviewsReceived.map((r) => (
                    <div key={r.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.reviewer.fullName}</span>
                        <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                        ))}</div>
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> User Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href={`/admin/users/${pro.user.id}`} className="font-medium text-[#1a3a2f] hover:underline">{pro.user.fullName}</Link>
              <p className="text-gray-500">{pro.user.phone}</p>
              <p className="text-gray-500">{pro.user.email}</p>
              <div className="flex gap-2 pt-2 border-t">
                <Badge variant="outline">{pro.user.kycTier}</Badge>
                <Badge variant="outline">{pro.user.accountStatus}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>License Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><p className="text-gray-500">License #</p><p className="font-medium">{pro.licenseNumber || "—"}</p></div>
              <div><p className="text-gray-500">Issuing Body</p><p className="font-medium">{pro.licenseBody || "—"}</p></div>
              <div><p className="text-gray-500">Experience</p><p className="font-medium">{pro.yearsExperience ? `${pro.yearsExperience} years` : "—"}</p></div>
              <div><p className="text-gray-500">Base Location</p><p className="font-medium">{pro.baseLocation || "—"}</p></div>
              <div><p className="text-gray-500">Service Regions</p><p className="font-medium">{pro.serviceRegions.join(", ") || "—"}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => update({ licenseStatus: "VERIFIED" })} disabled={acting || pro.licenseStatus === "VERIFIED"}
                className="w-full bg-green-600 hover:bg-green-700 gap-2"><CheckCircle className="h-4 w-4" /> Verify License</Button>
              <Button onClick={() => update({ licenseStatus: "REJECTED" })} disabled={acting || pro.licenseStatus === "REJECTED"}
                variant="destructive" className="w-full gap-2"><XCircle className="h-4 w-4" /> Reject License</Button>
              <Button onClick={() => update({ isActive: !pro.isActive })} disabled={acting}
                variant="outline" className="w-full">{pro.isActive ? "Deactivate" : "Activate"}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
