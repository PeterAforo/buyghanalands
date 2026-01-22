import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  User,
  MapPin,
} from "lucide-react";

export const dynamic = 'force-dynamic';

async function getVerificationRequests() {
  const requests = await prisma.verificationRequest.findMany({
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          region: true,
          district: true,
          verificationLevel: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
  });

  return requests;
}

async function getStats() {
  const [pending, completed, rejected] = await Promise.all([
    prisma.verificationRequest.count({ where: { status: "PENDING" } }),
    prisma.verificationRequest.count({ where: { status: "COMPLETED" } }),
    prisma.verificationRequest.count({ where: { status: "REJECTED" } }),
  ]);

  return { pending, completed, rejected, total: pending + completed + rejected };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return { label: "Pending", variant: "warning" as const };
    case "COMPLETED":
      return { label: "Approved", variant: "success" as const };
    case "REJECTED":
      return { label: "Rejected", variant: "destructive" as const };
    case "CANCELLED":
      return { label: "Cancelled", variant: "secondary" as const };
    default:
      return { label: status, variant: "secondary" as const };
  }
}

export default async function AdminVerificationsPage() {
  const [requests, stats] = await Promise.all([
    getVerificationRequests(),
    getStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Requests</h1>
          <p className="text-gray-600">Review and approve listing verifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Verification Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No verification requests yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Listing</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Requested By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Level</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    const statusBadge = getStatusBadge(request.status);
                    return (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {request.listing ? (
                            <div>
                              <p className="font-medium text-gray-900">{request.listing.title}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {request.listing.district}, {request.listing.region}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Listing deleted</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {request.user ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm">{request.user.fullName}</p>
                                <p className="text-xs text-gray-500">{request.user.phone}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {request.levelRequested.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/admin/verifications/${request.id}`}>
                            <Button size="sm" variant={request.status === "PENDING" ? "default" : "outline"}>
                              <Eye className="h-4 w-4 mr-1" />
                              {request.status === "PENDING" ? "Review" : "View"}
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
  );
}
