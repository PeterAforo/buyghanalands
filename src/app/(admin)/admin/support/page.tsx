"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string; phone: string };
  transaction: {
    id: string;
    status: string;
    listing: { title: string };
  } | null;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  WAITING_USER: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ filter });
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/support?${params}`);
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tickets || []);
          setStats(data.stats || {});
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, search]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      }
    } catch { } finally { setUpdating(null); }
  }

  const filters = [
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "waiting", label: "Waiting" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage user support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Open</p><p className="text-2xl font-bold">{stats.OPEN || 0}</p></div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">In Progress</p><p className="text-2xl font-bold">{stats.IN_PROGRESS || 0}</p></div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Waiting User</p><p className="text-2xl font-bold">{stats.WAITING_USER || 0}</p></div>
            <User className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Resolved</p><p className="text-2xl font-bold">{(stats.RESOLVED || 0) + (stats.CLOSED || 0)}</p></div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent></Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm"
              onClick={() => setFilter(f.key)} className={filter === f.key ? "bg-[#1a3a2f]" : ""}>
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No support tickets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Subject</th>
                    <th className="px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Transaction</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Created</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.subject}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{t.body}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{t.user.fullName}</p>
                        <p className="text-xs text-gray-500">{t.user.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {t.transaction ? (
                          <span>{t.transaction.listing.title}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[t.status] || "bg-gray-100"}>
                          {t.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={t.status}
                          disabled={updating === t.id}
                          onChange={(e) => updateStatus(t.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 bg-white"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="WAITING_USER">Waiting User</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
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
