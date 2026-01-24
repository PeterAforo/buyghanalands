"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  MoreHorizontal,
  Filter,
  Download,
  Plus,
  ChevronRight,
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3a2f]" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Link href="/admin" className="hover:text-[#1a3a2f]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#1a3a2f]">Customers</span>
          </div>
          <h1 className="text-lg font-semibold text-[#1a3a2f]">Customer Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage all platform users and their accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const csvContent = users.map(u => `${u.fullName},${u.phone},${u.email || ''},${u.roles.join(';')},${u.accountStatus}`).join('\n');
              const blob = new Blob([`Name,Phone,Email,Roles,Status\n${csvContent}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'users-export.csv';
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === "all" 
                  ? "bg-[#1a3a2f] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === "active" 
                  ? "bg-[#1a3a2f] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("suspended")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === "suspended" 
                  ? "bg-[#1a3a2f] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Suspended
            </button>
            <button
              onClick={() => setFilter("sellers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === "sellers" 
                  ? "bg-[#1a3a2f] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sellers
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[180px] pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No users found</p>
            <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const statusBadge = getStatusBadge(user.accountStatus);
                  const kycBadge = getKycBadge(user.kycTier);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-[#c5e063] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#1a3a2f] font-semibold text-xs">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#1a3a2f] text-sm truncate">{user.fullName}</p>
                            <p className="text-[10px] text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-xs text-[#1a3a2f]">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {user.phone}
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                            <Mail className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[120px]">{user.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span key={role} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                          kycBadge.variant === "success" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : kycBadge.variant === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {kycBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                          statusBadge.variant === "success" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : statusBadge.variant === "destructive"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-[#1a3a2f]">{user._count.listings} listings</p>
                        <p className="text-[10px] text-gray-400">
                          {user._count.transactionsAsBuyer + user._count.transactionsAsSeller} transactions
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {user.accountStatus === "ACTIVE" ? (
                            <button
                              onClick={() => handleUserAction(user.id, "suspend")}
                              disabled={actionLoading === user.id}
                              className="px-2 py-1 text-[10px] font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition-colors disabled:opacity-50"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Suspend"
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user.id, "activate")}
                              disabled={actionLoading === user.id}
                              className="px-2 py-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors disabled:opacity-50"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Activate"
                              )}
                            </button>
                          )}
                          <Link 
                            href={`/admin/users/${user.id}`}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
