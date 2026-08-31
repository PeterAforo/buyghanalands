"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";

interface KycRequest {
  id: string;
  ghanaCardNumber: string;
  status: string;
  reason: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    kycTier: string;
    accountStatus: string;
  };
}

const statusColors: Record<string, string> = {
  INITIATED: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-700",
  MANUAL_REVIEW: "bg-purple-100 text-purple-700",
  PASSED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RETRY: "bg-orange-100 text-orange-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function KycReviewPage() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ filter });
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/kyc?${params}`);
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
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

  const filters = [
    { key: "pending", label: "Pending", icon: Clock },
    { key: "passed", label: "Passed", icon: CheckCircle },
    { key: "failed", label: "Failed", icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Review Ghana Card submissions and identity verifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold">{stats.PENDING || 0 + (stats.MANUAL_REVIEW || 0)}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Passed</p>
                <p className="text-2xl font-bold">{stats.PASSED || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold">{stats.FAILED || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Needs Retry</p>
                <p className="text-2xl font-bold">{stats.RETRY || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={filter === f.key ? "bg-[#1a3a2f]" : ""}
            >
              <f.icon className="h-4 w-4 mr-1" /> {f.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or card number..."
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
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileCheck className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No KYC requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Ghana Card</th>
                    <th className="px-4 py-3 font-medium text-gray-600">KYC Tier</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Submitted</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{req.user.fullName}</p>
                        <p className="text-xs text-gray-500">{req.user.phone}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{req.ghanaCardNumber}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{req.user.kycTier}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[req.status] || "bg-gray-100"}>
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(req.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/kyc/${req.id}`}>
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
