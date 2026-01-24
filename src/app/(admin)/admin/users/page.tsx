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
  User,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";

interface UserData {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  roles: string[];
  kycTier: string;
  accountStatus: string;
  createdAt: string;
  _count: {
    listings: number;
    transactionsAsBuyer: number;
    transactionsAsSeller: number;
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", variant: "success" as const };
    case "SUSPENDED":
      return { label: "Suspended", variant: "destructive" as const };
    case "DEACTIVATED":
      return { label: "Deactivated", variant: "secondary" as const };
    default:
      return { label: status, variant: "secondary" as const };
  }
}

function getKycBadge(tier: string) {
  switch (tier) {
    case "TIER_2_GHANA_CARD":
      return { label: "Verified", variant: "success" as const };
    case "TIER_1_ID_UPLOAD":
      return { label: "ID Uploaded", variant: "warning" as const };
    default:
      return { label: "Unverified", variant: "secondary" as const };
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`/api/admin/users?filter=${filter}&search=${search}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchUsers();
    }
  }, [session, filter, search]);

  const handleUserAction = async (userId: string, action: "suspend" | "activate" | "deactivate") => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const updated = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, accountStatus: updated.accountStatus } : u))
        );
      }
    } catch (error) {
      console.error("User action error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All Users
                </Button>
                <Button
                  variant={filter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("active")}
                >
                  Active
                </Button>
                <Button
                  variant={filter === "suspended" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("suspended")}
                >
                  Suspended
                </Button>
                <Button
                  variant={filter === "sellers" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("sellers")}
                >
                  Sellers
                </Button>
              </div>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Roles</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">KYC</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Activity</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const statusBadge = getStatusBadge(user.accountStatus);
                      const kycBadge = getKycBadge(user.kycTier);

                      return (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.fullName}</p>
                                <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {user.phone}
                            </div>
                            {user.email && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Mail className="h-3 w-3 text-gray-400" />
                                {user.email}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={kycBadge.variant}>{kycBadge.label}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <p>{user._count.listings} listings</p>
                            <p className="text-gray-500">
                              {user._count.transactionsAsBuyer + user._count.transactionsAsSeller} transactions
                            </p>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{formatDate(user.createdAt)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {user.accountStatus === "ACTIVE" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-orange-600"
                                  onClick={() => handleUserAction(user.id, "suspend")}
                                  disabled={actionLoading === user.id}
                                >
                                  {actionLoading === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-1" />
                                      Suspend
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600"
                                  onClick={() => handleUserAction(user.id, "activate")}
                                  disabled={actionLoading === user.id}
                                >
                                  {actionLoading === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Activate
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
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
