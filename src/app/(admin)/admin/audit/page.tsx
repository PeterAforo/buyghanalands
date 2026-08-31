"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ScrollText,
  Download,
  Search,
} from "lucide-react";

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  actorType: string;
  actorUserId: string | null;
  action: string;
  diff: any;
  createdAt: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (entityType) params.set("entityType", entityType);
        if (action) params.set("action", action);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const res = await fetch(`/api/admin/audit?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setTotal(data.pagination?.total || 0);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entityType, action, startDate, endDate, page]);

  function handleExport() {
    const params = new URLSearchParams({ format: "csv" });
    if (entityType) params.set("entityType", entityType);
    if (action) params.set("action", action);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.open(`/api/admin/audit/export?${params}`, "_blank");
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Track all administrative and system actions</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
              >
                <option value="">All</option>
                <option value="USER">User</option>
                <option value="LISTING">Listing</option>
                <option value="TRANSACTION">Transaction</option>
                <option value="DISPUTE">Dispute</option>
                <option value="FRAUD_CASE">Fraud Case</option>
                <option value="KYC_REQUEST">KYC Request</option>
                <option value="PERMIT_APPLICATION">Permit</option>
                <option value="REPORT">Report</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Action</label>
              <Input
                placeholder="e.g. UPDATE, APPROVE"
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ScrollText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600">Timestamp</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Entity</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Action</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Actor</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{log.entityType}</Badge>
                          <p className="text-xs text-gray-400 mt-1 font-mono">{log.entityId.slice(-12)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-sm">{log.action}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.actorType}
                          {log.actorUserId && <p className="text-xs text-gray-400 font-mono">{log.actorUserId.slice(-8)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {log.diff && (
                            <details>
                              <summary className="text-xs cursor-pointer text-gray-500">View changes</summary>
                              <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-auto max-h-32">
                                {JSON.stringify(log.diff, null, 2)}
                              </pre>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-500">
                    {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
