"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  serviceRequest: { id: string; title: string; acceptedPriceGhs: string | null; requester: { id: string; fullName: string; phone: string } };
  professional: { id: string; professionalType: string; user: { fullName: string } };
}

const statusColors: Record<string, string> = {
  REQUESTED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  DECLINED: "bg-gray-100 text-gray-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(num || 0);
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/bookings?filter=${filter}`);
        if (res.ok) setBookings(await res.json());
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      }
    } catch { } finally { setUpdating(null); }
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "requested", label: "Requested" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor professional service bookings</p>
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
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Service</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Client</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Professional</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{b.serviceRequest.title}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{b.serviceRequest.requester.fullName}</p>
                        <p className="text-xs text-gray-500">{b.serviceRequest.requester.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{b.professional.user.fullName}</p>
                        <p className="text-xs text-gray-500">{b.professional.professionalType}</p>
                      </td>
                      <td className="px-4 py-3">{b.serviceRequest.acceptedPriceGhs ? formatPrice(b.serviceRequest.acceptedPriceGhs) : "—"}</td>
                      <td className="px-4 py-3"><Badge className={statusColors[b.status] || "bg-gray-100"}>{b.status.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(b.createdAt)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={b.status}
                          disabled={updating === b.id}
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 bg-white"
                        >
                          <option value="REQUESTED">Requested</option>
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="DECLINED">Declined</option>
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
