"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Workflow, Eye } from "lucide-react";

interface Workflow {
  id: string;
  propertyTitle: string | null;
  region: string | null;
  district: string | null;
  currentModule: string;
  overallStatus: string;
  overallProgress: number;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  listing: { id: string; title: string } | null;
  _count: { workflowDocuments: number; workflowNotes: number; workflowAlerts: number };
}

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-purple-100 text-purple-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter) params.set("status", filter);
        const res = await fetch(`/api/admin/workflows?${params}`);
        if (res.ok) setWorkflows(await res.json());
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [filter]);

  const filters = [
    { key: "", label: "All" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "NOT_STARTED", label: "Not Started" },
    { key: "COMPLETED", label: "Completed" },
    { key: "ON_HOLD", label: "On Hold" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Property Workflows</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor user property acquisition and development workflows</p>
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
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Workflow className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No workflows found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Property</th>
                    <th className="px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Module</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Progress</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Docs/Notes/Alerts</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Created</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((w) => (
                    <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{w.propertyTitle || w.listing?.title || "Untitled"}</p>
                        <p className="text-xs text-gray-500">{w.district}, {w.region}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{w.user.fullName}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{w.currentModule.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1a3a2f]" style={{ width: `${w.overallProgress}%` }} />
                          </div>
                          <span className="text-xs">{w.overallProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge className={statusColors[w.overallStatus] || "bg-gray-100"}>{w.overallStatus.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {w._count.workflowDocuments}D / {w._count.workflowNotes}N / {w._count.workflowAlerts}A
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(w.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/workflows/${w.id}`}>
                          <Button variant="outline" size="sm" className="gap-1"><Eye className="h-3 w-3" /> View</Button>
                        </Link>
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
