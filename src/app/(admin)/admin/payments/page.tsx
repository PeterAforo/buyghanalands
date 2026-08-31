"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Download } from "lucide-react";

interface Payment {
  id: string;
  provider: string;
  type: string;
  status: string;
  amount: string;
  providerRef: string | null;
  receiptRef: string | null;
  createdAt: string;
  payerUser: { id: string; fullName: string } | null;
  payeeUser: { id: string; fullName: string } | null;
  transaction: { id: string; listing: { title: string } } | null;
}

const statusColors: Record<string, string> = {
  INITIATED: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(num || 0);
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (type) params.set("type", type);
        const res = await fetch(`/api/admin/payments?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
          setStats(data.stats || []);
        }
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [status, type]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Search and reconcile payment records</p>
      </div>

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
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]">
          <option value="">All Statuses</option>
          <option value="INITIATED">Initiated</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]">
          <option value="">All Types</option>
          <option value="LISTING_FEE">Listing Fee</option>
          <option value="TRANSACTION_FUNDING">Transaction Funding</option>
          <option value="SUBSCRIPTION">Subscription</option>
          <option value="SERVICE_FEE">Service Fee</option>
          <option value="PERMIT_FEE">Permit Fee</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" /></div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CreditCard className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Provider</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Ref</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{p.payerUser?.fullName || p.payeeUser?.fullName || "—"}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{p.type.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3 text-sm">{p.provider}</td>
                      <td className="px-4 py-3 font-medium">{formatPrice(p.amount)}</td>
                      <td className="px-4 py-3"><Badge className={statusColors[p.status] || "bg-gray-100"}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.providerRef || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
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
