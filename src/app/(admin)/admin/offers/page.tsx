"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag } from "lucide-react";

interface Offer {
  id: string;
  amountGhs: string;
  status: string;
  message: string | null;
  expiresAt: string | null;
  createdAt: string;
  buyer: { id: string; fullName: string; phone: string };
  listing: { id: string; title: string; priceGhs: string; seller: { fullName: string } };
  transaction: { id: string; status: string } | null;
}

const statusColors: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-700",
  COUNTERED: "bg-purple-100 text-purple-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(num || 0);
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter) params.set("status", filter);
        const res = await fetch(`/api/admin/offers?${params}`);
        if (res.ok) setOffers(await res.json());
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setOffers((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      }
    } catch { } finally { setUpdating(null); }
  }

  const filters = [
    { key: "", label: "All" },
    { key: "SENT", label: "Sent" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "REJECTED", label: "Rejected" },
    { key: "EXPIRED", label: "Expired" },
    { key: "COUNTERED", label: "Countered" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor offers made on listings</p>
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
          ) : offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Tag className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No offers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Listing</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Buyer</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Offer</th>
                    <th className="px-4 py-3 font-medium text-gray-600">List Price</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Transaction</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/listings/${o.listing.id}`} className="font-medium text-[#1a3a2f] hover:underline">{o.listing.title}</Link>
                        <p className="text-xs text-gray-500">Seller: {o.listing.seller.fullName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{o.buyer.fullName}</p>
                        <p className="text-xs text-gray-500">{o.buyer.phone}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatPrice(o.amountGhs)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatPrice(o.listing.priceGhs)}</td>
                      <td className="px-4 py-3"><Badge className={statusColors[o.status] || "bg-gray-100"}>{o.status}</Badge></td>
                      <td className="px-4 py-3">
                        {o.transaction ? (
                          <Link href={`/admin/transactions/${o.transaction.id}`}>
                            <Badge variant="outline" className="hover:bg-gray-100">{o.transaction.status}</Badge>
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          disabled={updating === o.id}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 bg-white"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="EXPIRED">Expired</option>
                          <option value="WITHDRAWN">Withdrawn</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
