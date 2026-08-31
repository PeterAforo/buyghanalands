"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
} from "lucide-react";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  reporter: { id: string; fullName: string };
  listing: { id: string; title: string; status: string } | null;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  ACTIONED: "bg-green-100 text-green-700",
  DISMISSED: "bg-gray-100 text-gray-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [targetType, setTargetType] = useState("");
  const [actionReportId, setActionReportId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [suspendTarget, setSuspendTarget] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ filter });
        if (targetType) params.set("targetType", targetType);
        const res = await fetch(`/api/admin/reports?${params}`);
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
          setHotspots(data.hotspots || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, targetType]);

  async function handleAction(action: "review" | "action" | "dismiss") {
    if (!actionReportId) return;
    setActing(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: actionReportId, action, notes, suspendTarget }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === actionReportId
              ? { ...r, status: action === "review" ? "IN_REVIEW" : action === "action" ? "ACTIONED" : "DISMISSED" }
              : r
          )
        );
        setActionReportId(null);
        setNotes("");
        setSuspendTarget(false);
      }
    } catch {
      // ignore
    } finally {
      setActing(false);
    }
  }

  const filters = [
    { key: "open", label: "Open" },
    { key: "in_review", label: "In Review" },
    { key: "actioned", label: "Actioned" },
    { key: "dismissed", label: "Dismissed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Review and act on user-submitted reports</p>
      </div>

      {/* Hotspots */}
      {hotspots.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-3">Most Reported Targets</p>
            <div className="flex flex-wrap gap-2">
              {hotspots.map((h, i) => (
                <Badge key={i} variant="outline" className="bg-red-50">
                  {h.targetType}: {h.targetId.slice(-8)} ({h._count} reports)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm"
              onClick={() => setFilter(f.key)} className={filter === f.key ? "bg-[#1a3a2f]" : ""}>
              {f.label}
            </Button>
          ))}
        </div>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
        >
          <option value="">All Types</option>
          <option value="LISTING">Listings</option>
          <option value="USER">Users</option>
          <option value="MESSAGE">Messages</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Flag className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Reason</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Reporter</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Target</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <>
                      <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{r.reason}</p>
                          {r.details && <p className="text-xs text-gray-500 truncate max-w-xs">{r.details}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm">{r.reporter.fullName}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{r.targetType}</Badge>
                          {r.listing && <p className="text-xs text-gray-500 mt-1">{r.listing.title}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[r.status] || "bg-gray-100"}>
                            {r.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {r.status === "OPEN" || r.status === "IN_REVIEW" ? (
                            <Button variant="outline" size="sm" onClick={() => setActionReportId(actionReportId === r.id ? null : r.id)}>
                              Take Action
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">Processed</span>
                          )}
                        </td>
                      </tr>
                      {actionReportId === r.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="space-y-3">
                              <Textarea
                                placeholder="Add action notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                              />
                              <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={suspendTarget} onChange={(e) => setSuspendTarget(e.target.checked)} />
                                <Ban className="h-4 w-4 text-red-500" /> Suspend target ({r.targetType.toLowerCase()})
                              </label>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleAction("review")} disabled={acting}>
                                  <Eye className="h-3 w-3 mr-1" /> Mark In Review
                                </Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("action")} disabled={acting}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Action
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleAction("dismiss")} disabled={acting}>
                                  <XCircle className="h-3 w-3 mr-1" /> Dismiss
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setActionReportId(null)}>Cancel</Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
