"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  User,
  Clock,
  Eye,
  Shield,
} from "lucide-react";

interface FraudCase {
  id: string;
  status: string;
  summary: string;
  evidence: any;
  createdAt: string;
  resolvedAt: string | null;
  openedBy: {
    id: string;
    fullName: string;
  } | null;
  user: {
    id: string;
    fullName: string;
    accountStatus: string;
  } | null;
  listing: {
    id: string;
    title: string;
    status: string;
    seller: {
      id: string;
      fullName: string;
    };
  } | null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    OPEN: { label: "Open", variant: "destructive" },
    INVESTIGATING: { label: "Investigating", variant: "warning" },
    RESOLVED: { label: "Resolved", variant: "success" },
    DISMISSED: { label: "Dismissed", variant: "secondary" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const };
}


export default function AdminFraudPage() {
  const { data: session, status: authStatus } = useSession();
  const [fraudCases, setFraudCases] = useState<FraudCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("open");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchFraudCases() {
      try {
        const response = await fetch(`/api/admin/fraud?filter=${filter}`);
        if (response.ok) {
          const data = await response.json();
          setFraudCases(data.cases || []);
        }
      } catch (error) {
        console.error("Failed to fetch fraud cases:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchFraudCases();
    }
  }, [session, filter]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Cases</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  variant={filter === "open" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("open")}
                >
                  Open
                </Button>
                <Button
                  variant={filter === "investigating" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("investigating")}
                >
                  Investigating
                </Button>
                <Button
                  variant={filter === "resolved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("resolved")}
                >
                  Resolved
                </Button>
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
              </div>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search fraud cases..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>Fraud Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {fraudCases.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No fraud cases found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Case</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Subject</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Opened By</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudCases.map((fraudCase) => {
                      const statusBadge = getStatusBadge(fraudCase.status);

                      return (
                        <tr key={fraudCase.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">
                                {fraudCase.summary.substring(0, 50)}...
                              </p>
                              {fraudCase.listing && (
                                <p className="text-sm text-gray-500">
                                  Listing: {fraudCase.listing.title}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {fraudCase.user ? (
                              <div>
                                <p className="font-medium">{fraudCase.user.fullName}</p>
                                <Badge variant={fraudCase.user.accountStatus === "ACTIVE" ? "success" : "destructive"} className="text-xs">
                                  {fraudCase.user.accountStatus}
                                </Badge>
                              </div>
                            ) : fraudCase.listing ? (
                              <div>
                                <p className="font-medium">{fraudCase.listing.seller.fullName}</p>
                                <p className="text-sm text-gray-500">Seller</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {fraudCase.openedBy ? (
                              <p className="text-sm">{fraudCase.openedBy.fullName}</p>
                            ) : (
                              <span className="text-gray-400">System</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{formatDate(fraudCase.createdAt)}</td>
                          <td className="py-3 px-4">
                            <Link href={`/admin/fraud/${fraudCase.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
