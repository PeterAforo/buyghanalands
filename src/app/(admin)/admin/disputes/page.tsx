"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Eye,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";

interface Dispute {
  id: string;
  status: string;
  summary: string;
  createdAt: string;
  resolvedAt: string | null;
  raisedBy: { id: string; fullName: string };
  transaction: {
    id: string;
    agreedPriceGhs: string;
    listing: {
      id: string;
      title: string;
    };
    buyer: { id: string; fullName: string };
    seller: { id: string; fullName: string };
  };
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
  }).format(num);
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
    UNDER_REVIEW: { label: "Under Review", variant: "warning" },
    RESOLVED_BUYER: { label: "Resolved (Buyer)", variant: "success" },
    RESOLVED_SELLER: { label: "Resolved (Seller)", variant: "success" },
    RESOLVED_SPLIT: { label: "Resolved (Split)", variant: "success" },
    CLOSED: { label: "Closed", variant: "secondary" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const };
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("open");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const response = await fetch(`/api/admin/disputes?filter=${filter}&search=${search}`);
        if (response.ok) {
          const data = await response.json();
          setDisputes(data);
        }
      } catch (error) {
        console.error("Failed to fetch disputes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchDisputes();
    }
  }, [session, filter, search]);

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
          <h1 className="text-2xl font-bold text-gray-900">Dispute Management</h1>
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
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Open
                </Button>
                <Button
                  variant={filter === "review" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("review")}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Under Review
                </Button>
                <Button
                  variant={filter === "resolved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("resolved")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
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
                    placeholder="Search disputes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disputes Table */}
        <Card>
          <CardContent className="p-0">
            {disputes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No disputes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Listing</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Raised By</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Parties</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => {
                      const badge = getStatusBadge(dispute.status);

                      return (
                        <tr key={dispute.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {dispute.transaction.listing.title}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {dispute.summary}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium">{dispute.raisedBy.fullName}</p>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <p>Buyer: {dispute.transaction.buyer.fullName}</p>
                            <p className="text-gray-500">Seller: {dispute.transaction.seller.fullName}</p>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {formatPrice(dispute.transaction.agreedPriceGhs)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {formatDate(dispute.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/admin/disputes/${dispute.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Review
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
