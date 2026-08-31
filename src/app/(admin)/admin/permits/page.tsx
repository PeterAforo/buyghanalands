"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  FileText,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface Permit {
  id: string;
  status: string;
  createdAt: string;
  applicant: { id: string; fullName: string; phone: string; email: string };
  assembly: { id: string; name: string; region: string; district: string };
  listing: { id: string; title: string } | null;
  _count: { documents: number; queries: number };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  QUERY_RAISED: "bg-purple-100 text-purple-700",
  RESUBMITTED: "bg-teal-100 text-teal-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PermitsPage() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter) params.set("status", filter);
        const res = await fetch(`/api/admin/permits?${params}`);
        if (res.ok) {
          const data = await res.json();
          const filtered = search
            ? data.filter((p: Permit) =>
                p.applicant.fullName.toLowerCase().includes(search.toLowerCase()) ||
                p.assembly.name.toLowerCase().includes(search.toLowerCase())
              )
            : data;
          setPermits(filtered);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, search]);

  const filters = [
    { key: "", label: "All" },
    { key: "SUBMITTED", label: "Submitted" },
    { key: "UNDER_REVIEW", label: "Under Review" },
    { key: "QUERY_RAISED", label: "Query Raised" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Building Permits</h1>
        <p className="text-sm text-gray-500 mt-1">Review and process building permit applications</p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={filter === f.key ? "bg-[#1a3a2f]" : ""}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by applicant or assembly..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" />
            </div>
          ) : permits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No permit applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Applicant</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Assembly</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Listing</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Docs</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Queries</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Submitted</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {permits.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.applicant.fullName}</p>
                        <p className="text-xs text-gray-500">{p.applicant.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{p.assembly.name}</p>
                        <p className="text-xs text-gray-500">{p.assembly.district}, {p.assembly.region}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {p.listing ? p.listing.title : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">{p._count.documents}</td>
                      <td className="px-4 py-3 text-center">
                        {p._count.queries > 0 ? (
                          <Badge variant="outline" className="bg-amber-50">{p._count.queries}</Badge>
                        ) : "0"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[p.status] || "bg-gray-100"}>
                          {p.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/permits/${p.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" /> Review
                          </Button>
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
