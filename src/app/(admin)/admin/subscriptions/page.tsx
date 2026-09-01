"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard } from "lucide-react";

interface Subscription {
  id: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; phone: string };
  _count: { payments: number };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
  EXPIRED: "bg-red-100 text-red-700",
  PAST_DUE: "bg-amber-100 text-amber-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ filter });
        if (category) params.set("category", category);
        const res = await fetch(`/api/admin/subscriptions?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSubscriptions(data.subscriptions || []);
          setStats(data.stats || []);
        }
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [filter, category]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setSubscriptions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
      }
    } catch { } finally { setUpdating(null); }
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "past_due", label: "Past Due" },
    { key: "cancelled", label: "Cancelled" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage user subscriptions</p>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.status}><CardContent className="pt-6">
              <p className="text-sm text-gray-500">{s.status.replace(/_/g, " ")}</p>
              <p className="text-2xl font-bold">{s._count}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm"
              onClick={() => setFilter(f.key)} className={filter === f.key ? "bg-[#1a3a2f]" : ""}>{f.label}</Button>
          ))}
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]">
          <option value="">All Categories</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
          <option value="AGENT">Agent</option>
          <option value="PROFESSIONAL">Professional</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" /></div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CreditCard className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Start</th>
                    <th className="px-4 py-3 font-medium text-gray-600">End</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Payments</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{s.user.fullName}</p>
                        <p className="text-xs text-gray-500">{s.user.email}</p>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline">{s.category}</Badge></td>
                      <td className="px-4 py-3"><Badge className={statusColors[s.status] || "bg-gray-100"}>{s.status.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(s.startDate)}</td>
                      <td className="px-4 py-3 text-gray-500">{s.endDate ? formatDate(s.endDate) : "—"}</td>
                      <td className="px-4 py-3 text-center">{s._count.payments}</td>
                      <td className="px-4 py-3">
                        <select
                          value={s.status}
                          disabled={updating === s.id}
                          onChange={(e) => updateStatus(s.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 bg-white"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="EXPIRED">Expired</option>
                          <option value="PAST_DUE">Past Due</option>
                          <option value="TRIALING">Trialing</option>
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
